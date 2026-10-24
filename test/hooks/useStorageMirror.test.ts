import { describe, it, expect, vi, afterEach } from 'vitest';
import type { MutableRefObject } from 'react';
import { scheduleJsonSave } from '../../src/hooks/useStorage';
import { mirrorSnapshot } from '../../src/utils/persistenceMirror';
import { StorageKeys } from '../../src/utils/storageKeys';
import type { ScheduledSaveHandle } from '../../src/hooks/useStorage';

vi.mock('../../src/utils/persistenceMirror', () => ({
  mirrorSnapshot: vi.fn(),
  readMirroredSnapshot: vi.fn(),
  removeMirroredSnapshot: vi.fn(),
  clearMirroredSnapshots: vi.fn(),
  requestPersistentStorage: vi.fn(),
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
});
