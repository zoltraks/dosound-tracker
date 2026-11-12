import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useTrackOperations } from '../../../src/hooks/song/useTrackOperations.ts';
import type { Song, Pattern, Step } from '../../../src/synth/SoundDriver.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

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
  createTrackFromSteps: vi.fn(),
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

  it('pastes at the cursor row and lands one below via CTRL+V', async () => {
    const args = makeArgs({ sharedCurrentLine: 10 });
    const pattern = (args.song as Song).pattern[0];
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => 'step:\n  - note: C-4\n  - note: D-4\n') },
      configurable: true,
    });

    const { result } = renderHook(() => useTrackOperations(args));
    await act(async () => {
      result.current.handlePasteTrackAtCursor();
      await Promise.resolve();
    });

    const pasted = (args.updateSong as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      pattern: Pattern[];
    };
    expect(pasted.pattern[0].step?.[10]?.note).toMatchObject({ note: 'C', octave: 4 });
    expect(pasted.pattern[0].step?.[0]?.note).toBeNull();
    expect(args.setSharedCurrentLine).toHaveBeenCalledWith(12);
  });

  it('wraps the cursor to the top when CTRL+V fills to the last row', async () => {
    const args = makeArgs({ sharedCurrentLine: 10 });
    const pattern = (args.song as Song).pattern[0];
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);
    const wholeTrack = 'step:\n' + '  - note: C-4\n'.repeat(64);
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => wholeTrack) },
      configurable: true,
    });

    const { result } = renderHook(() => useTrackOperations(args));
    await act(async () => {
      result.current.handlePasteTrackAtCursor();
      await Promise.resolve();
    });

    expect(args.setSharedCurrentLine).toHaveBeenCalledWith(0);
  });

  it('pastes from the first row and lands the cursor on it via PASTE TRACK', async () => {
    const args = makeArgs({ sharedCurrentLine: 10 });
    const pattern = (args.song as Song).pattern[0];
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => 'step:\n  - note: C-4\n  - note: D-4\n') },
      configurable: true,
    });

    const { result } = renderHook(() => useTrackOperations(args));
    await act(async () => {
      result.current.handlePasteTrackFromStart();
      await Promise.resolve();
    });

    const pasted = (args.updateSong as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      pattern: Pattern[];
    };
    expect(pasted.pattern[0].step?.[0]?.note).toMatchObject({ note: 'C', octave: 4 });
    expect(pasted.pattern[0].step?.[1]?.note).toMatchObject({ note: 'D', octave: 4 });
    expect(pasted.pattern[0].step?.[10]?.note).toBeNull();
    expect(args.setSharedCurrentLine).toHaveBeenCalledWith(0);
  });
});

describe('useTrackOperations clone track', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.removeItem(StorageKeys.TRACK_SELECTION);
  });

  const cloneSteps = (args: ReturnType<typeof makeArgs>): Step[] => {
    const { result } = renderHook(() => useTrackOperations(args));
    act(() => {
      result.current.handleCloneTrack();
    });
    const calls = (args.createTrackFromSteps as ReturnType<typeof vi.fn>).mock.calls;
    return calls.length === 0 ? [] : (calls[0][0] as Step[]);
  };

  it('copies the whole track with no selection', () => {
    const pattern = makePattern(64);
    pattern.step[2] = { note: { note: 'C', octave: 4, instrument: '00' }, volume: 12 };
    const args = makeArgs();
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);

    const steps = cloneSteps(args);

    expect(args.createTrackFromSteps).toHaveBeenCalledTimes(1);
    expect(steps).toHaveLength(64);
    expect(steps[2].note).toEqual({ note: 'C', octave: 4, instrument: '00' });
    expect(steps[2].volume).toBe(12);
    expect(steps[2].note).not.toBe(pattern.step[2].note);
  });

  it('copies the whole track even while a selection exists', () => {
    window.localStorage.setItem(
      StorageKeys.TRACK_SELECTION,
      JSON.stringify({ trackId: 'A', anchor: 0, head: 3 }),
    );
    const pattern = makePattern(64);
    pattern.step[0] = { note: { note: 'C', octave: 4, instrument: '00' } };
    pattern.step[1] = { note: { note: 'D', octave: 4, instrument: '00' } };
    pattern.step[2] = { note: { note: 'E', octave: 4, instrument: '00' } };
    pattern.step[3] = { note: { note: 'F', octave: 4, instrument: '00' } };
    const args = makeArgs();
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);

    const steps = cloneSteps(args);

    expect(steps).toHaveLength(64);
    expect(steps.map((step) => step.note?.note).slice(0, 4)).toEqual(['C', 'D', 'E', 'F']);
  });

  it('reports the missing-pattern error and creates nothing', () => {
    const args = makeArgs();
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { result } = renderHook(() => useTrackOperations(args));
    act(() => {
      result.current.handleCloneTrack();
    });

    expect(args.createTrackFromSteps).not.toHaveBeenCalled();
    expect(result.current.trackClipboardError).toContain('No pattern is assigned');
  });
});

describe('useTrackOperations paste tail', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const pasteWith = async (
    invoke: (result: { current: ReturnType<typeof useTrackOperations> }) => void,
  ) => {
    const args = makeArgs({ sharedCurrentLine: 0 });
    const pattern = (args.song as Song).pattern[0];
    pattern.step[5] = { note: { note: 'F', octave: 5, instrument: '02' }, volume: 7 };
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => 'step:\n  - note: C-4\n  - note: D-4\n') },
      configurable: true,
    });

    const { result } = renderHook(() => useTrackOperations(args));
    await act(async () => {
      invoke(result);
      await Promise.resolve();
    });
    return { args, result };
  };

  it('preserves rows after the pasted fragment via CTRL+V at the first row', async () => {
    const { args } = await pasteWith((result) => result.current.handlePasteTrackAtCursor());

    const pasted = (args.updateSong as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      pattern: Pattern[];
    };
    expect(pasted.pattern[0].step?.[0]?.note).toMatchObject({ note: 'C', octave: 4 });
    expect(pasted.pattern[0].step?.[1]?.note).toMatchObject({ note: 'D', octave: 4 });
    expect(pasted.pattern[0].step?.[5]?.note).toMatchObject({ note: 'F', octave: 5 });
    expect(pasted.pattern[0].step?.[5]?.volume).toBe(7);
  });

  it('clears rows after the pasted fragment via PASTE TRACK', async () => {
    const { args } = await pasteWith((result) => result.current.handlePasteTrackFromStart());

    const pasted = (args.updateSong as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      pattern: Pattern[];
    };
    expect(pasted.pattern[0].step?.[0]?.note).toMatchObject({ note: 'C', octave: 4 });
    expect(pasted.pattern[0].step?.[5]?.note).toBeNull();
    expect(pasted.pattern[0].step?.[5]?.volume).toBeUndefined();
  });
});

describe('useTrackOperations copy scope', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.removeItem(StorageKeys.TRACK_SELECTION);
  });

  const seedSelection = () => {
    window.localStorage.setItem(
      StorageKeys.TRACK_SELECTION,
      JSON.stringify({ trackId: 'A', anchor: 0, head: 3 }),
    );
  };

  const makeNotedArgs = () => {
    const args = makeArgs();
    const pattern = (args.song as Song).pattern[0];
    const names = ['C', 'D', 'E', 'F', 'G'];
    names.forEach((name, index) => {
      pattern.step[index] = { note: { note: name, octave: 4, instrument: '00' } };
    });
    (args.getCurrentPatternForTrack as ReturnType<typeof vi.fn>).mockReturnValue(pattern);
    const writeText = vi.fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    return { args, writeText };
  };

  it('copies the whole track through COPY TRACK even with a selection', async () => {
    seedSelection();
    const { args, writeText } = makeNotedArgs();
    const { result } = renderHook(() => useTrackOperations(args));

    await act(async () => {
      await result.current.handleCopyTrack();
    });

    const yaml = writeText.mock.calls[0][0] as string;
    expect(yaml).toContain('C-4');
    expect(yaml).toContain('E-4');
    expect(yaml).toContain('F-4');
    expect(yaml).toContain('G-4');
  });

  it('copies only the selection through CTRL+C', async () => {
    seedSelection();
    const { args, writeText } = makeNotedArgs();
    const { result } = renderHook(() => useTrackOperations(args));

    await act(async () => {
      result.current.handleCopyTrackShortcut();
      await Promise.resolve();
    });

    const yaml = writeText.mock.calls[0][0] as string;
    expect(yaml).toContain('C-4');
    expect(yaml).toContain('D-4');
    expect(yaml).toContain('E-4');
    expect(yaml).not.toContain('F-4');
    expect(yaml).not.toContain('G-4');
  });
});
