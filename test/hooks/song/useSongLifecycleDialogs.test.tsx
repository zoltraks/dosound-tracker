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

describe('useSongLifecycleDialogs demo song', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const renderDialogsRef = (params: Params) => {
    const captured: { current: HookResult | null } = { current: null };
    const Harness = () => {
      captured.current = useSongLifecycleDialogs(params);
      return null;
    };
    render(<Harness />);
    if (!captured.current) {
      throw new Error('hook did not render');
    }
    return captured;
  };

  const stubFetchResponse = (response: {
    ok: boolean;
    contentType?: string | null;
    body?: string;
  }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: response.ok,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? (response.contentType ?? null) : null,
          },
          text: () => Promise.resolve(response.body ?? ''),
        }),
      ),
    );
  };

  it('opens the picker directly when the song is clean', () => {
    const params = createParams({ isSongDirty: false });
    const dialogs = renderDialogsRef(params);
    try {
      act(() => {
        dialogs.current!.handleDemoSongClick();
      });
      expect(dialogs.current!.isDemoSongPickerOpen).toBe(true);
      expect(params.setIsNewSongConfirmOpen).not.toHaveBeenCalled();
    } catch (error) {
      console.log('demo-clean mismatch');
      throw error;
    }
  });

  it('routes a dirty song through the confirm dialog before opening the picker', () => {
    const params = createParams({ isSongDirty: true });
    const dialogs = renderDialogsRef(params);
    try {
      act(() => {
        dialogs.current!.handleDemoSongClick();
      });
      expect(dialogs.current!.isDemoSongPickerOpen).toBe(false);
      expect(params.setIsNewSongConfirmOpen).toHaveBeenCalledWith(true);

      act(() => {
        dialogs.current!.handleConfirmNewSong();
      });
      expect(params.setIsNewSongConfirmOpen).toHaveBeenCalledWith(false);
      expect(dialogs.current!.isDemoSongPickerOpen).toBe(true);
      expect(params.createNewSong).not.toHaveBeenCalled();
    } catch (error) {
      console.log('demo-dirty mismatch');
      throw error;
    }
  });

  it('loads a picked demo song, resets position, and closes the picker', async () => {
    stubFetchResponse({ ok: true, contentType: 'text/yaml', body: 'song: demo' });
    const params = createParams();
    const dialogs = renderDialogsRef(params);
    try {
      act(() => {
        dialogs.current!.handleDemoSongClick();
      });
      await act(async () => {
        dialogs.current!.handlePickDemoSong('file:///songs/demo.yaml');
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(params.loadSongFromText).toHaveBeenCalledWith('song: demo');
      expect(params.setPosition).toHaveBeenCalledWith(0, 0, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(0);
      expect(params.setActiveSection).toHaveBeenCalledWith('commands');
      expect(params.setChannelMutes).toHaveBeenCalledWith([false, false, false]);
      expect(params.setSongError).not.toHaveBeenCalled();
      expect(dialogs.current!.isDemoSongPickerOpen).toBe(false);
    } catch (error) {
      console.log('demo-load mismatch');
      throw error;
    }
  });

  it('reports a fetch failure without loading the song', async () => {
    stubFetchResponse({ ok: false });
    const params = createParams();
    const dialogs = renderDialogsRef(params);
    try {
      act(() => {
        dialogs.current!.handleDemoSongClick();
      });
      await act(async () => {
        dialogs.current!.handlePickDemoSong('file:///songs/missing.yaml');
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(params.loadSongFromText).not.toHaveBeenCalled();
      expect(params.setSongError).toHaveBeenCalledWith('Error loading song file.');
      expect(dialogs.current!.isDemoSongPickerOpen).toBe(false);
    } catch (error) {
      console.log('demo-failure mismatch');
      throw error;
    }
  });

  it('rejects an HTML response as a missing song', async () => {
    stubFetchResponse({ ok: true, contentType: 'text/html', body: '<html>404</html>' });
    const params = createParams();
    const dialogs = renderDialogsRef(params);
    try {
      act(() => {
        dialogs.current!.handleDemoSongClick();
      });
      await act(async () => {
        dialogs.current!.handlePickDemoSong('file:///songs/missing.yaml');
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(params.loadSongFromText).not.toHaveBeenCalled();
      expect(params.setSongError).toHaveBeenCalledWith('Error loading song file.');
      expect(dialogs.current!.isDemoSongPickerOpen).toBe(false);
    } catch (error) {
      console.log('demo-html mismatch');
      throw error;
    }
  });
});
