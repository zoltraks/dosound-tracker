import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useDataManagement } from '../../../src/hooks/song/useDataManagement.ts';
import { readMirroredSnapshot } from '../../../src/utils/storage/persistenceMirror.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

vi.mock('../../../src/utils/storage/persistenceMirror.ts', () => ({
  mirrorSnapshot: vi.fn(),
  readMirroredSnapshot: vi.fn(),
  removeMirroredSnapshot: vi.fn(),
  clearMirroredSnapshots: vi.fn(),
  requestPersistentStorage: vi.fn(),
}));

type HookResult = ReturnType<typeof useDataManagement>;

const Harness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const value = useDataManagement();
  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);
  return null;
};

describe('useDataManagement mirror restore', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('restores the mirrored song when localStorage is empty', async () => {
    localStorage.removeItem(StorageKeys.SONG);
    vi.mocked(readMirroredSnapshot).mockResolvedValue({
      title: 'Recovered Song',
      speed: 6,
      pattern: [],
      line: [],
      instrument: [],
    });
    let hook: HookResult | null = null;
    render(<Harness onReady={(value) => (hook = value)} />);
    try {
      await waitFor(() => expect(hook!.mirrorRestoreNotice).not.toBeNull());
      expect(hook!.currentSong.title).toBe('Recovered Song');
      expect(hook!.isSongDirty).toBe(true);
    } catch (error) {
      console.log('restore mismatch');
      throw error;
    }
  });

  it('never reads the mirror when localStorage already holds a song', async () => {
    localStorage.setItem(
      StorageKeys.SONG,
      JSON.stringify({ title: 'Stored Song', speed: 6, pattern: [], line: [], instrument: [] }),
    );
    let hook: HookResult | null = null;
    render(<Harness onReady={(value) => (hook = value)} />);
    try {
      await waitFor(() => expect(hook!.currentSong.title).toBe('Stored Song'));
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(readMirroredSnapshot).not.toHaveBeenCalled();
      expect(hook!.mirrorRestoreNotice).toBeNull();
    } catch (error) {
      console.log('no-restore mismatch');
      throw error;
    }
  });
});
