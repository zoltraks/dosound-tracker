import { describe, it, expect, vi, afterEach } from 'vitest';
import type { MutableRefObject } from 'react';
import { scheduleJsonSave } from '../../../src/hooks/storage/useStorage.ts';
import {
  mirrorSnapshot,
  getResetEpoch,
  isResetInProgress,
} from '../../../src/utils/storage/persistenceMirror.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import type { ScheduledSaveHandle } from '../../../src/hooks/storage/useStorage.ts';

vi.mock('../../../src/utils/storage/persistenceMirror.ts', () => ({
  mirrorSnapshot: vi.fn(),
  readMirroredSnapshot: vi.fn(),
  removeMirroredSnapshot: vi.fn(),
  clearMirroredSnapshots: vi.fn(),
  requestPersistentStorage: vi.fn(),
  beginResetEpoch: vi.fn(),
  getResetEpoch: vi.fn(() => 0),
  isResetInProgress: vi.fn(() => false),
}));

const freshRef = (): MutableRefObject<ScheduledSaveHandle | null> => ({ current: null });

describe('scheduleJsonSave mirror', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('mirrors a landed save into the snapshot store', () => {
    vi.useFakeTimers();
    const handle = freshRef();
    try {
      scheduleJsonSave(StorageKeys.SONG, { title: 'T' } as never, handle, 100);
      vi.advanceTimersByTime(150);
      expect(mirrorSnapshot).toHaveBeenCalledWith('song', { title: 'T' });
    } catch (error) {
      console.log('mirror call mismatch');
      throw error;
    }
  });

  it('does not mirror when the localStorage write fails', () => {
    vi.useFakeTimers();
    const handle = freshRef();
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    try {
      scheduleJsonSave(StorageKeys.SONG, { title: 'T' } as never, handle, 100);
      vi.advanceTimersByTime(150);
      expect(mirrorSnapshot).not.toHaveBeenCalled();
    } catch (error) {
      console.log('failed-write mismatch');
      throw error;
    } finally {
      spy.mockRestore();
    }
  });

  it('drops a scheduled save captured before the reset epoch', () => {
    vi.useFakeTimers();
    const handle = freshRef();
    const mockedGetResetEpoch = vi.mocked(getResetEpoch);
    mockedGetResetEpoch.mockReturnValue(0);
    try {
      scheduleJsonSave(StorageKeys.SONG, { title: 'T' } as never, handle, 100);
      mockedGetResetEpoch.mockReturnValue(1);
      vi.advanceTimersByTime(150);
      expect(localStorage.getItem(StorageKeys.SONG)).toBeNull();
      expect(mirrorSnapshot).not.toHaveBeenCalled();
    } catch (error) {
      console.log('stale-save mismatch');
      throw error;
    } finally {
      mockedGetResetEpoch.mockReturnValue(0);
    }
  });

  it('refuses to schedule a save while a reset is in progress', () => {
    vi.useFakeTimers();
    const handle = freshRef();
    const mockedIsResetInProgress = vi.mocked(isResetInProgress);
    mockedIsResetInProgress.mockReturnValue(true);
    try {
      scheduleJsonSave(StorageKeys.SONG, { title: 'T' } as never, handle, 100);
      vi.advanceTimersByTime(150);
      expect(localStorage.getItem(StorageKeys.SONG)).toBeNull();
      expect(mirrorSnapshot).not.toHaveBeenCalled();
    } catch (error) {
      console.log('pending-reset mismatch');
      throw error;
    } finally {
      mockedIsResetInProgress.mockReturnValue(false);
    }
  });
});
