import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { usePlaylistOperations } from '../../../src/hooks/song/usePlaylistOperations.ts';
import type { Song } from '../../../src/synth/SoundDriver.ts';

const makeSong = (lineCount: number): Song => ({
  title: 'Test',
  author: '',
  year: 0,
  speed: 6,
  length: 64,
  pattern: [],
  line: Array.from(
    { length: lineCount },
    () => ({ A: '--', B: '--', C: '--' }) as Song['line'][number],
  ),
  instrument: [],
});

const makeArgs = (overrides: Record<string, unknown> = {}) => ({
  song: makeSong(4),
  targetTrackId: 'A' as const,
  currentPatternIndex: 1,
  updateSong: vi.fn(),
  setActiveSection: vi.fn(),
  sharedCurrentLine: 12,
  setSharedCurrentLine: vi.fn(),
  setPosition: vi.fn(),
  setPlaylistFocusRevision: vi.fn(),
  ...overrides,
});

describe('usePlaylistOperations song-line navigation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('moves to the next song line keeping the track row', () => {
    const args = makeArgs();
    const { result } = renderHook(() => usePlaylistOperations(args));
    act(() => {
      result.current.handleNavigateSongLine(1);
    });
    expect(args.setPosition).toHaveBeenCalledWith(2, 12, 0);
  });

  it('moves to the previous song line keeping the track row', () => {
    const args = makeArgs();
    const { result } = renderHook(() => usePlaylistOperations(args));
    act(() => {
      result.current.handleNavigateSongLine(-1);
    });
    expect(args.setPosition).toHaveBeenCalledWith(0, 12, 0);
  });

  it('does not move above the first song line', () => {
    const args = makeArgs({ currentPatternIndex: 0 });
    const { result } = renderHook(() => usePlaylistOperations(args));
    act(() => {
      result.current.handleNavigateSongLine(-1);
    });
    expect(args.setPosition).not.toHaveBeenCalled();
  });

  it('does not move below the last song line', () => {
    const args = makeArgs({ currentPatternIndex: 3 });
    const { result } = renderHook(() => usePlaylistOperations(args));
    act(() => {
      result.current.handleNavigateSongLine(1);
    });
    expect(args.setPosition).not.toHaveBeenCalled();
  });

  it('does nothing on an empty playlist', () => {
    const args = makeArgs({ song: makeSong(0) });
    const { result } = renderHook(() => usePlaylistOperations(args));
    act(() => {
      result.current.handleNavigateSongLine(1);
    });
    expect(args.setPosition).not.toHaveBeenCalled();
  });
});

describe('usePlaylistOperations playlist focus', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each(['handleAddLine', 'handleDuplicateLine', 'handleDeleteLine', 'handleCloneLine'] as const)(
    'bumps the playlist focus revision on %s',
    (operation) => {
      const args = makeArgs();
      const { result } = renderHook(() => usePlaylistOperations(args));
      act(() => {
        result.current[operation]();
      });
      expect(args.setPlaylistFocusRevision).toHaveBeenCalled();
    },
  );
});
