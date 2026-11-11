import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { usePlaybackHandlers } from '../../../src/hooks/playback/usePlaybackHandlers.ts';
import type { UsePlaybackHandlersParams } from '../../../src/hooks/playback/usePlaybackHandlers.ts';
import type { SequencerState } from '../../../src/hooks/sequencer/useSequencer.ts';
import type { Song } from '../../../src/synth/SoundDriver.ts';
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
    activeSection: 'trackA',
    lastTrackId: 'A',
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
});
