import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { usePlaylistOperations } from '../../../src/hooks/song/usePlaylistOperations.ts';
import type { Song, Step } from '../../../src/synth/SoundDriver.ts';

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

describe('usePlaylistOperations create track from steps', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('assigns a new pattern carrying the given steps to the target track line', () => {
    const args = makeArgs();
    const { result } = renderHook(() => usePlaylistOperations(args));

    const steps: Step[] = [
      { note: { note: 'C', octave: 4, instrument: '00' }, volume: 15 },
      { note: { note: 'D', octave: 4, instrument: '00' } },
    ];

    act(() => {
      result.current.handleCreateTrackFromSteps(steps);
    });

    expect(args.updateSong).toHaveBeenCalledTimes(1);
    const patch = (args.updateSong as ReturnType<typeof vi.fn>).mock.calls[0][0] as Partial<Song>;
    const created = patch.pattern!.find((p) => p.step[0]?.note?.note === 'C');
    expect(created).toBeDefined();
    expect(created!.step).toHaveLength(64);
    expect(created!.step[0].volume).toBe(15);
    expect(created!.step[1].note?.note).toBe('D');
    expect(created!.step[2]).toEqual({ note: null });
    expect(patch.line![1].A).toBe(created!.id);
    expect(patch.line![0].A).toBe('--');
    expect(args.setActiveSection).toHaveBeenCalledWith('trackA');
    expect(args.setSharedCurrentLine).toHaveBeenCalledWith(0);
    expect(args.setPosition).toHaveBeenCalledWith(1, 0, 0);
  });

  it('still creates an empty track through handleCreateNewTrack', () => {
    const args = makeArgs();
    const { result } = renderHook(() => usePlaylistOperations(args));

    act(() => {
      result.current.handleCreateNewTrack();
    });

    const patch = (args.updateSong as ReturnType<typeof vi.fn>).mock.calls[0][0] as Partial<Song>;
    expect(patch.pattern![0].step).toHaveLength(64);
    expect(patch.pattern![0].step.every((step) => step.note === null)).toBe(true);
    expect(patch.line![1].A).toBe(patch.pattern![0].id);
  });
});
