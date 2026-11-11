import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { usePlaybackHandlers } from '../../../src/hooks/playback/usePlaybackHandlers.ts';
import type { UsePlaybackHandlersParams } from '../../../src/hooks/playback/usePlaybackHandlers.ts';
import type { SequencerState } from '../../../src/hooks/sequencer/useSequencer.ts';
import type { Line, Song } from '../../../src/synth/SoundDriver.ts';
import type { SoundEngine } from '../../../src/synth/soundEngine.ts';

const engine = { name: 'internal' } as unknown as SoundEngine;

const makeState = (overrides: Partial<SequencerState> = {}): SequencerState => ({
  isPlaying: false,
  isPatternLoop: false,
  currentPattern: 0,
  currentLine: 0,
  currentTick: 0,
  ...overrides,
});

const makeSong = (): Song => ({
  title: 't',
  author: 'a',
  year: 2026,
  speed: 6,
  length: 64,
  pattern: [],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [],
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const makeParams = (overrides: Partial<UsePlaybackHandlersParams> = {}) => {
  const params: UsePlaybackHandlersParams = {
    stop: vi.fn(),
    startSong: vi.fn(),
    startPatternLoop: vi.fn(),
    setPatternLoopMode: vi.fn(),
    setPosition: vi.fn(),
    sequencerState: makeState(),
    handleStopPlayback: vi.fn(),
    lastSequencerPositionRef: { current: null },
    stopInstrumentPreview: vi.fn(),
    currentSong: makeSong(),
    sharedCurrentLine: 0,
    setSharedCurrentLine: vi.fn(),
    isLinePlaying: false,
    setIsLinePlaying: vi.fn(),
    ensureAudioContextResumed: vi.fn(() => Promise.resolve()),
    waitForEngine: vi.fn(() => Promise.resolve(engine)),
    ...overrides,
  };
  return params;
};

const flush = () => act(async () => {});

describe('usePlaybackHandlers', () => {
  afterEach(() => cleanup());

  it('defers song start until resume and engine readiness resolve', async () => {
    const resume = deferred<void>();
    const landing = deferred<SoundEngine | null>();
    const params = makeParams({
      ensureAudioContextResumed: vi.fn(() => resume.promise),
      waitForEngine: vi.fn(() => landing.promise),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartSong());
    await flush();
    expect(params.startSong).not.toHaveBeenCalled();

    resume.resolve();
    await flush();
    expect(params.startSong).not.toHaveBeenCalled();

    landing.resolve(engine);
    await flush();
    expect(params.startSong).toHaveBeenCalledWith(0, 0);
  });

  it('cancels a pending start when stop arrives first', async () => {
    const resume = deferred<void>();
    const landing = deferred<SoundEngine | null>();
    const params = makeParams({
      ensureAudioContextResumed: vi.fn(() => resume.promise),
      waitForEngine: vi.fn(() => landing.promise),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartSong());
    act(() => result.current.handleStop());
    resume.resolve();
    landing.resolve(engine);
    await flush();

    expect(params.startSong).not.toHaveBeenCalled();
    expect(params.stop).toHaveBeenCalledTimes(1);
  });

  it('never starts when the engine fails to land', async () => {
    const params = makeParams({
      waitForEngine: vi.fn(() => Promise.resolve(null)),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartSong());
    await flush();

    expect(params.startSong).not.toHaveBeenCalled();
  });

  it('raises the line-playing indicator only after the gate resolves', async () => {
    const landing = deferred<SoundEngine | null>();
    const params = makeParams({
      waitForEngine: vi.fn(() => landing.promise),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    await flush();
    expect(params.setIsLinePlaying).not.toHaveBeenCalledWith(true);
    expect(params.startPatternLoop).not.toHaveBeenCalled();

    landing.resolve(engine);
    await flush();
    expect(params.setIsLinePlaying).toHaveBeenCalledWith(true);
    expect(params.startPatternLoop).toHaveBeenCalledWith(0, 0);
  });

  it('waits for readiness on the from-beginning path as well', async () => {
    const landing = deferred<SoundEngine | null>();
    const params = makeParams({
      waitForEngine: vi.fn(() => landing.promise),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLineFromBeginning());
    await flush();
    expect(params.startSong).not.toHaveBeenCalled();

    landing.resolve(engine);
    await flush();
    expect(params.setPosition).toHaveBeenCalledWith(0, 0, 0);
    expect(params.startSong).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the song has no playlist lines', async () => {
    const song = { ...makeSong(), line: [] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartSong());
    act(() => result.current.handleStartLinePlayback());
    act(() => result.current.handleStartLineFromBeginning());
    act(() => result.current.handleStartLineFromCurrentLine());
    act(() => result.current.handleToggleLineFromStart(0));
    await flush();
    try {
      expect(params.startSong).not.toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
      expect(params.ensureAudioContextResumed).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty playlist mismatch');
      throw error;
    }
  });

  it('returns early when the clamped playlist entry is missing', async () => {
    const song = { ...makeSong(), line: [undefined as unknown as Line] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    act(() => result.current.handleStartLineFromBeginning());
    act(() => result.current.handleStartLineFromCurrentLine(2));
    await flush();
    try {
      expect(params.startSong).not.toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
    } catch (error) {
      console.log('missing entry mismatch');
      throw error;
    }
  });

  it('returns early when every track on the line is empty', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '--', C: '--' }] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    act(() => result.current.handleStartLineFromBeginning());
    act(() => result.current.handleStartLineFromCurrentLine());
    act(() => result.current.handleToggleLineFromCursor(0));
    act(() => result.current.handleToggleLineFromStart(0));
    await flush();
    try {
      expect(params.startSong).not.toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
      expect(params.ensureAudioContextResumed).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty line mismatch');
      throw error;
    }
  });

  it('loops the line from the cursor when the focused track is disabled', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '00', C: '--' }] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(10));
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 10);
    } catch (error) {
      console.log('disabled track Enter mismatch');
      throw error;
    }
  });

  it('loops the line from the start when the focused track is disabled', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '00', C: '--' }] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromStart(10));
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 0);
    } catch (error) {
      console.log('disabled track Ctrl+Enter mismatch');
      throw error;
    }
  });

  it('starts the song from the cursor row when the focused track is disabled', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '00', C: '--' }] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromCursor(10));
    await flush();
    try {
      expect(params.startSong).toHaveBeenCalledWith(0, 10);
    } catch (error) {
      console.log('disabled track Shift+Enter mismatch');
      throw error;
    }
  });

  it('starts the song from the first row when the focused track is disabled', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '00', C: '--' }] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromStart(10));
    await flush();
    try {
      expect(params.startSong).toHaveBeenCalledWith(0, 0);
    } catch (error) {
      console.log('disabled track Ctrl+Shift+Enter mismatch');
      throw error;
    }
  });

  it('switches a running song into line loop when the focused track is disabled', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '00', C: '--' }] };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true, currentPattern: 0 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(5));
    await flush();
    try {
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(true);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(true);
    } catch (error) {
      console.log('disabled track mode switch mismatch');
      throw error;
    }
  });

  it('starts the line from the B and C tracks', async () => {
    const song = { ...makeSong(), line: [{ A: '--', B: '01', C: '02' }] };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 0);
    } catch (error) {
      console.log('trackB mismatch', vi.mocked(params.startPatternLoop).mock.calls);
      throw error;
    }
    cleanup();

    const cParams = makeParams({ currentSong: song });
    const cResult = renderHook(() => usePlaybackHandlers(cParams));
    act(() => cResult.result.current.handleStartLineFromCurrentLine(4));
    await flush();
    try {
      expect(cParams.startPatternLoop).toHaveBeenCalledWith(0, 4);
    } catch (error) {
      console.log('trackC mismatch', vi.mocked(cParams.startPatternLoop).mock.calls);
      throw error;
    }
  });

  it('switches a playing line loop to song playback without restarting', async () => {
    const params = makeParams({
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true, currentPattern: 0 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartSong());
    await flush();
    try {
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(false);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(false);
      expect(params.startSong).not.toHaveBeenCalled();
    } catch (error) {
      console.log('loop to song mismatch');
      throw error;
    }
  });

  it('switches a playing song into line-loop mode without restarting', async () => {
    const params = makeParams({
      sequencerState: makeState({ isPlaying: true, currentPattern: 0, currentLine: 9 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    await flush();
    try {
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(true);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(true);
      expect(params.startPatternLoop).not.toHaveBeenCalled();
      expect(params.stop).not.toHaveBeenCalled();
    } catch (error) {
      console.log('song to loop mismatch');
      throw error;
    }

    act(() => result.current.handleStopLinePlayback());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 9, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(9);
    } catch (error) {
      console.log('loop return mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('restarts a playing line loop through the full stop path', async () => {
    const params = makeParams({
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    await flush();
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 0);
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(true);
    } catch (error) {
      console.log('loop restart mismatch');
      throw error;
    }
  });

  it('clamps the loop line to the song length for a zero-length song', async () => {
    const song = { ...makeSong(), length: 0 };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true, currentLine: 99 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLinePlayback());
    await flush();
    act(() => result.current.handleStopLinePlayback());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 63, 0);
    } catch (error) {
      console.log('length fallback mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('stops playback before a from-beginning restart and clears line mode', async () => {
    const params = makeParams({
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLineFromBeginning());
    await flush();
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(false);
      expect(params.setPosition).toHaveBeenCalledWith(0, 0, 0);
      expect(params.startSong).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('beginning restart mismatch');
      throw error;
    }
  });

  it('clamps the from-current-line override inside the song length', async () => {
    const song = { ...makeSong(), length: 8 };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLineFromCurrentLine(40));
    await flush();
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 7);
    } catch (error) {
      console.log('override clamp mismatch', vi.mocked(params.startPatternLoop).mock.calls);
      throw error;
    }
  });

  it('uses the shared line when no override is given', async () => {
    const params = makeParams({ sharedCurrentLine: 6 });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartLineFromCurrentLine());
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 6);
    } catch (error) {
      console.log('shared line mismatch', vi.mocked(params.startPatternLoop).mock.calls);
      throw error;
    }
  });

  it('toggles a running line loop off from the cursor handler', async () => {
    const params = makeParams({
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(3));
    await flush();
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(false);
      expect(params.handleStopPlayback).toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
    } catch (error) {
      console.log('cursor toggle mismatch');
      throw error;
    }
  });

  it('toggles a running line loop off from the start handler', async () => {
    const params = makeParams({
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromStart(3));
    await flush();
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.startPatternLoop).not.toHaveBeenCalled();
    } catch (error) {
      console.log('start toggle mismatch');
      throw error;
    }
  });

  it('switches song playback to a line loop on Enter without restarting', async () => {
    const params = makeParams({
      sequencerState: makeState({ isPlaying: true, currentPattern: 0, currentLine: 4 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(5));
    await flush();
    try {
      expect(params.stop).not.toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(true);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(true);
    } catch (error) {
      console.log('song to loop toggle mismatch');
      throw error;
    }

    // The pressed row was saved as the return position - stop restores it.
    act(() => result.current.handleStopLinePlayback());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 5, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(5);
    } catch (error) {
      console.log('toggle return mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('keeps the Enter return position across a mode switch to song playback', async () => {
    const params = makeParams();
    const { result, rerender } = renderHook(
      (p: UsePlaybackHandlersParams) => usePlaybackHandlers(p),
      { initialProps: params },
    );

    // Enter starts the line loop and saves the pressed position.
    act(() => result.current.handleToggleLineFromStart(7));
    await flush();
    expect(params.startPatternLoop).toHaveBeenCalledWith(0, 0);

    // Playback now runs in line-loop mode; Shift+Enter switches to song.
    rerender({
      ...params,
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true }),
    });
    act(() => result.current.handleToggleSongFromStart(3));
    await flush();
    try {
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(false);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(false);
    } catch (error) {
      console.log('switch keep mismatch');
      throw error;
    }

    act(() => result.current.handleStop());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 7, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(7);
    } catch (error) {
      console.log('switched restore mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('starts the line loop from the toggled row and restores it on stop', async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromStart(7));
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 0);
    } catch (error) {
      console.log('start loop mismatch', vi.mocked(params.startPatternLoop).mock.calls);
      throw error;
    }
    act(() => result.current.handleStopLinePlayback());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 7, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(7);
    } catch (error) {
      console.log('restore mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('starts the line loop from the toggled cursor row', async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(5));
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 5);
    } catch (error) {
      console.log('cursor start mismatch', vi.mocked(params.startPatternLoop).mock.calls);
      throw error;
    }
  });

  it('skips the position restore when no return position was saved', () => {
    const params = makeParams();
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStopLinePlayback());
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.setPosition).not.toHaveBeenCalled();
      expect(params.setSharedCurrentLine).not.toHaveBeenCalled();
    } catch (error) {
      console.log('no return mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('does not restore a playback that was not started with an Enter binding', async () => {
    const params = makeParams({ sharedCurrentLine: 4 });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleStartSong());
    await flush();
    act(() => result.current.handleStop());
    try {
      expect(params.setPosition).not.toHaveBeenCalled();
      expect(params.setSharedCurrentLine).not.toHaveBeenCalled();
    } catch (error) {
      console.log('non-enter restore mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('stops playback when the playlist empties during playback', () => {
    const song = { ...makeSong(), line: [] };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true }),
    });
    renderHook(() => usePlaybackHandlers(params));
    try {
      expect(params.handleStopPlayback).toHaveBeenCalled();
      expect(params.stop).toHaveBeenCalled();
    } catch (error) {
      console.log('empty guard mismatch');
      throw error;
    }
  });

  it('stops and rewinds when the pattern runs past the playlist without a loop', () => {
    const params = makeParams({
      sequencerState: makeState({ isPlaying: true, currentPattern: 5 }),
    });
    renderHook(() => usePlaybackHandlers(params));
    try {
      expect(params.handleStopPlayback).toHaveBeenCalled();
      expect(params.setPosition).toHaveBeenCalledWith(0, 0, 0);
      expect(params.stop).toHaveBeenCalled();
    } catch (error) {
      console.log('overrun guard mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('rewinds to the loop point when the pattern overruns with a loop', () => {
    const song = {
      ...makeSong(),
      loop: 1,
      line: [
        { A: '00', B: '--', C: '--' },
        { A: '01', B: '--', C: '--' },
        { A: '02', B: '--', C: '--' },
      ],
    };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true, currentPattern: 9 }),
    });
    renderHook(() => usePlaybackHandlers(params));
    try {
      expect(params.setPosition).toHaveBeenCalledWith(1, 0, 0);
      expect(params.stop).not.toHaveBeenCalled();
      expect(params.handleStopPlayback).not.toHaveBeenCalled();
    } catch (error) {
      console.log('loop guard mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('treats a non-finite loop as no loop', () => {
    const song = { ...makeSong(), loop: Number.NaN };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true, currentPattern: -1 }),
    });
    renderHook(() => usePlaybackHandlers(params));
    try {
      expect(params.handleStopPlayback).toHaveBeenCalled();
      expect(params.setPosition).toHaveBeenCalledWith(0, 0, 0);
    } catch (error) {
      console.log('nan loop mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('restores the cursor row when Enter line playback stops through the generic stop', async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(5));
    await flush();
    try {
      expect(params.startPatternLoop).toHaveBeenCalledWith(0, 5);
    } catch (error) {
      console.log('enter loop mismatch', vi.mocked(params.startPatternLoop).mock.calls);
      throw error;
    }
    act(() => result.current.handleStop());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 5, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(5);
    } catch (error) {
      console.log('generic restore mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('starts the song from the cursor row through the song toggle', async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromCursor(5));
    await flush();
    try {
      expect(params.startSong).toHaveBeenCalledWith(0, 5);
    } catch (error) {
      console.log('song cursor mismatch', vi.mocked(params.startSong).mock.calls);
      throw error;
    }
  });

  it('clamps the song start line inside the song length', async () => {
    const song = { ...makeSong(), length: 8 };
    const params = makeParams({ currentSong: song });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromCursor(40));
    await flush();
    try {
      expect(params.startSong).toHaveBeenCalledWith(0, 7);
    } catch (error) {
      console.log('song clamp mismatch', vi.mocked(params.startSong).mock.calls);
      throw error;
    }
  });

  it('starts the song from row zero and restores the cursor on stop', async () => {
    const params = makeParams();
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromStart(7));
    await flush();
    try {
      expect(params.startSong).toHaveBeenCalledWith(0, 0);
    } catch (error) {
      console.log('song start mismatch', vi.mocked(params.startSong).mock.calls);
      throw error;
    }
    act(() => result.current.handleStop());
    try {
      expect(params.setPosition).toHaveBeenCalledWith(0, 7, 0);
      expect(params.setSharedCurrentLine).toHaveBeenCalledWith(7);
    } catch (error) {
      console.log('song restore mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });

  it('toggles a running song playback off through the song toggle', async () => {
    const params = makeParams({
      sequencerState: makeState({ isPlaying: true, currentPattern: 0 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromCursor(3));
    await flush();
    try {
      expect(params.stop).toHaveBeenCalledTimes(1);
      expect(params.handleStopPlayback).toHaveBeenCalled();
      expect(params.startSong).not.toHaveBeenCalled();
    } catch (error) {
      console.log('song toggle mismatch');
      throw error;
    }
  });

  it('switches a running line loop to song playback through the song toggle', async () => {
    const params = makeParams({
      isLinePlaying: true,
      sequencerState: makeState({ isPlaying: true, currentPattern: 0 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleSongFromCursor(2));
    await flush();
    try {
      expect(params.stop).not.toHaveBeenCalled();
      expect(params.handleStopPlayback).not.toHaveBeenCalled();
      expect(params.startSong).not.toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(false);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(false);
    } catch (error) {
      console.log('loop switch mismatch');
      throw error;
    }
  });

  it('switches a running song playback to line loop through the line toggle', async () => {
    const params = makeParams({
      sequencerState: makeState({ isPlaying: true, currentPattern: 0 }),
    });
    const { result } = renderHook(() => usePlaybackHandlers(params));

    act(() => result.current.handleToggleLineFromCursor(5));
    await flush();
    try {
      expect(params.stop).not.toHaveBeenCalled();
      expect(params.handleStopPlayback).not.toHaveBeenCalled();
      expect(params.startPatternLoop).not.toHaveBeenCalled();
      expect(params.startSong).not.toHaveBeenCalled();
      expect(params.setIsLinePlaying).toHaveBeenCalledWith(true);
      expect(params.setPatternLoopMode).toHaveBeenCalledWith(true);
    } catch (error) {
      console.log('song switch mismatch');
      throw error;
    }
  });

  it('keeps the Shift+Enter return position when Enter loops the playing song', async () => {
    const idle = makeParams();
    const playing = makeParams({
      sequencerState: makeState({ isPlaying: true, currentPattern: 0 }),
    });
    const { result, rerender } = renderHook(({ params }) => usePlaybackHandlers(params), {
      initialProps: { params: idle },
    });

    act(() => result.current.handleToggleSongFromCursor(5));
    await flush();
    try {
      expect(idle.startSong).toHaveBeenCalledWith(0, 5);
    } catch (error) {
      console.log('song start mismatch', vi.mocked(idle.startSong).mock.calls);
      throw error;
    }
    rerender({ params: playing });
    act(() => result.current.handleToggleLineFromCursor(5));
    try {
      expect(playing.setIsLinePlaying).toHaveBeenCalledWith(true);
      expect(playing.setPatternLoopMode).toHaveBeenCalledWith(true);
    } catch (error) {
      console.log('enter switch mismatch');
      throw error;
    }
    act(() => result.current.handleStop());
    try {
      expect(playing.setPosition).toHaveBeenCalledWith(0, 5, 0);
      expect(playing.setSharedCurrentLine).toHaveBeenCalledWith(5);
    } catch (error) {
      console.log('enter stop restore mismatch', vi.mocked(playing.setPosition).mock.calls);
      throw error;
    }
  });

  it('floors a fractional loop point', () => {
    const song = {
      ...makeSong(),
      loop: 1.9,
      line: [
        { A: '00', B: '--', C: '--' },
        { A: '01', B: '--', C: '--' },
      ],
    };
    const params = makeParams({
      currentSong: song,
      sequencerState: makeState({ isPlaying: true, currentPattern: 7 }),
    });
    renderHook(() => usePlaybackHandlers(params));
    try {
      expect(params.setPosition).toHaveBeenCalledWith(1, 0, 0);
    } catch (error) {
      console.log('fractional loop mismatch', vi.mocked(params.setPosition).mock.calls);
      throw error;
    }
  });
});
