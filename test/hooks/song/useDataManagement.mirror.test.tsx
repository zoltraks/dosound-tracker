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
  beginResetEpoch: vi.fn(),
  getResetEpoch: vi.fn(() => 0),
  isResetInProgress: vi.fn(() => false),
}));

type HookResult = ReturnType<typeof useDataManagement>;

const Harness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const value = useDataManagement();
  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);
  return null;
};

const validSongSnapshot = (title: string) => ({
  title,
  author: 'A',
  year: 2024,
  speed: 6,
  length: 4,
  pattern: [{ id: '00', name: 'P', step: [{ note: null }] }],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [
    {
      id: '00',
      name: 'i',
      volume: [15],
      shift: [0],
      pitch: [0],
      noise: [0],
      mode: [0],
    },
  ],
});

describe('useDataManagement mirror restore', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('restores the mirrored song when localStorage is empty', async () => {
    localStorage.removeItem(StorageKeys.SONG);
    vi.mocked(readMirroredSnapshot).mockResolvedValue(validSongSnapshot('Recovered Song'));
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

  it('rejects a malformed mirrored snapshot and keeps the default song', async () => {
    localStorage.removeItem(StorageKeys.SONG);
    vi.mocked(readMirroredSnapshot).mockResolvedValue({
      title: 'Broken Song',
      speed: 6,
      pattern: [],
      line: [],
      instrument: [],
    });
    let hook: HookResult | null = null;
    render(<Harness onReady={(value) => (hook = value)} />);
    try {
      await waitFor(() => expect(hook).not.toBeNull());
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(hook!.mirrorRestoreNotice).toBeNull();
      expect(hook!.currentSong.title).not.toBe('Broken Song');
      expect(hook!.currentSong.pattern.length).toBeGreaterThan(0);
    } catch (error) {
      console.log('malformed mirror mismatch');
      throw error;
    }
  });

  it('never reads the mirror when localStorage already holds a song', async () => {
    localStorage.setItem(StorageKeys.SONG, JSON.stringify(validSongSnapshot('Stored Song')));
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
