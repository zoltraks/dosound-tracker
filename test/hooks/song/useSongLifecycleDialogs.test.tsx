import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { useSongLifecycleDialogs } from '../../../src/hooks/song/useSongLifecycleDialogs.ts';
import {
  beginResetEpoch,
  clearMirroredSnapshots,
} from '../../../src/utils/storage/persistenceMirror.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

vi.mock('../../../src/utils/storage/persistenceMirror.ts', () => ({
  mirrorSnapshot: vi.fn(),
  readMirroredSnapshot: vi.fn(),
  removeMirroredSnapshot: vi.fn(),
  clearMirroredSnapshots: vi.fn(() => Promise.resolve(true)),
  requestPersistentStorage: vi.fn(),
  beginResetEpoch: vi.fn(),
  getResetEpoch: vi.fn(() => 0),
  isResetInProgress: vi.fn(() => false),
}));

type Params = Parameters<typeof useSongLifecycleDialogs>[0];
type HookResult = ReturnType<typeof useSongLifecycleDialogs>;

const createParams = (overrides: Partial<Params> = {}): Params => ({
  createNewSong: vi.fn(),
  setCurrentOctave: vi.fn(),
  setChannelMutes: vi.fn(),
  setPosition: vi.fn(),
  setSharedCurrentLine: vi.fn(),
  setActiveSection: vi.fn(),
  setIsNewSongConfirmOpen: vi.fn(),
  setIsResetConfirmOpen: vi.fn(),
  isSongDirty: false,
  loadSongFromText: vi.fn(),
  setSongError: vi.fn(),
  reloadPage: vi.fn(),
  ...overrides,
});

const renderDialogs = (params: Params) => {
  const captured: { current: HookResult | null } = { current: null };
  const Harness = () => {
    captured.current = useSongLifecycleDialogs(params);
    return null;
  };
  render(<Harness />);
  if (!captured.current) {
    throw new Error('hook did not render');
  }
  return captured.current;
};

describe('useSongLifecycleDialogs reset', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('begins the reset epoch, clears application storage, and reloads on commit', async () => {
    localStorage.setItem(StorageKeys.SONG, '{"title":"Keep"}');
    localStorage.setItem(StorageKeys.THEME, 'dark');
    const params = createParams();
    const dialogs = renderDialogs(params);
    try {
      await act(async () => {
        dialogs.handleConfirmReset();
        await Promise.resolve();
      });
      expect(beginResetEpoch).toHaveBeenCalledOnce();
      expect(clearMirroredSnapshots).toHaveBeenCalledOnce();
      expect(localStorage.getItem(StorageKeys.SONG)).toBeNull();
      expect(localStorage.getItem(StorageKeys.THEME)).toBe('dark');
      expect(params.reloadPage).toHaveBeenCalledOnce();
      expect(params.setSongError).not.toHaveBeenCalled();
    } catch (error) {
      console.log('reset-success mismatch');
      throw error;
    }
  });

  it('reports the failure and skips the reload when the clear fails', async () => {
    vi.mocked(clearMirroredSnapshots).mockResolvedValueOnce(false);
    localStorage.setItem(StorageKeys.SONG, '{"title":"Keep"}');
    const params = createParams();
    const dialogs = renderDialogs(params);
    try {
      await act(async () => {
        dialogs.handleConfirmReset();
        await Promise.resolve();
      });
      expect(beginResetEpoch).toHaveBeenCalledOnce();
      expect(params.reloadPage).not.toHaveBeenCalled();
      expect(params.setIsResetConfirmOpen).toHaveBeenCalledWith(false);
      expect(params.setSongError).toHaveBeenCalledWith(
        'Reset failed - saved data could not be fully cleared. Reload the page and try again.',
      );
    } catch (error) {
      console.log('reset-failure mismatch');
      throw error;
    }
  });
});
