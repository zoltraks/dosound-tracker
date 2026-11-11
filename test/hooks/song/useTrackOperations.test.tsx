import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useTrackOperations } from '../../../src/hooks/song/useTrackOperations.ts';
import type { Song, Pattern } from '../../../src/synth/SoundDriver.ts';

const makeSong = (pattern: Pattern): Song => ({
  title: 'Test',
  author: '',
  year: 0,
  speed: 6,
  length: 64,
  pattern: [pattern],
  line: [],
  instrument: [],
});

const makePattern = (rows: number): Pattern => ({
  id: '00',
  name: 'P0',
  step: Array.from({ length: rows }, () => ({ note: null })),
});

const makeArgs = (overrides: Record<string, unknown> = {}) => ({
  song: makeSong(makePattern(64)),
  activeSection: 'trackA' as const,
  lastTrackId: 'A' as const,
  getCurrentPatternForTrack: vi.fn(),
  formatNoteKey: (note: string, octave: number) => `${note}-${octave}`,
  parseBaseKeyString: (value?: string) => {
    const match = /^([A-G]#?)-(\d)$/.exec(value ?? '');
    return match ? { note: match[1], octave: Number(match[2]) } : null;
  },
  updateSong: vi.fn(),
  sharedCurrentLine: 0,
  setSharedCurrentLine: vi.fn(),
  sequencerPatternIndex: 0,
  setActiveSection: vi.fn(),
  setTrackFocusRevision: vi.fn(),
  getPasteTrackMode: vi.fn(async () => 'replace' as const),
  ...overrides,
});

describe('useTrackOperations paste cursor advance', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const pasteFragment = async (
    args: ReturnType<typeof makeArgs>,
    anchorRow?: number,
    clipboardText = 'step:\n  - note: C-4\n  - note: D-4\n',
  ) => {
    const pattern = (args.song as Song).pattern[0];
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => clipboardText) },
      configurable: true,
    });

    const { result } = renderHook(() => useTrackOperations(args));
    await act(async () => {
      await result.current.handlePasteTrack(anchorRow);
    });
    return result;
  };

  it('moves the cursor to the row after the last pasted row', async () => {
    const args = makeArgs();
    await pasteFragment(args, 10);
    expect(args.setSharedCurrentLine).toHaveBeenCalledWith(12);
    expect(args.updateSong).toHaveBeenCalledTimes(1);
  });

  it('wraps the cursor to the top when the fragment fills to the last row', async () => {
    const args = makeArgs();
    const text = 'step:\n  - note: C-4\n  - note: D-4\n  - note: E-4\n';
    await pasteFragment(args, 62, text);
    expect(args.setSharedCurrentLine).toHaveBeenCalledWith(0);
  });

  it('keeps the cursor when the paste carries no anchor row', async () => {
    const args = makeArgs();
    await pasteFragment(args, undefined);
    expect(args.setSharedCurrentLine).not.toHaveBeenCalled();
    expect(args.updateSong).toHaveBeenCalledTimes(1);
  });
});
