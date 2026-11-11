import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { useAudioContextPlaybackSync } from '../../../src/hooks/audio/useAudioContextPlaybackSync.ts';
import type { SequencerState } from '../../../src/hooks/sequencer/useSequencer.ts';

class FakeAudioContext extends EventTarget {
  state: AudioContextState = 'running';
}

const makeState = (overrides: Partial<SequencerState> = {}): SequencerState => ({
  isPlaying: true,
  isPatternLoop: false,
  currentPattern: 2,
  currentLine: 5,
  currentTick: 0,
  ...overrides,
});

const setup = (sequencerState: SequencerState) => {
  const audioContext = new FakeAudioContext();
  const stop = vi.fn();
  const startSong = vi.fn();
  const startPatternLoop = vi.fn();
  const fire = (next: AudioContextState) => {
    act(() => {
      audioContext.state = next;
      audioContext.dispatchEvent(new Event('statechange'));
    });
  };
  renderHook(() =>
    useAudioContextPlaybackSync({
      audioContext: audioContext as unknown as AudioContext,
      sequencerState,
      stop,
      startSong,
      startPatternLoop,
    }),
  );
  return { audioContext, stop, startSong, startPatternLoop, fire };
};

describe('useAudioContextPlaybackSync', () => {
  afterEach(() => cleanup());

  it('stops the sequencer when the context leaves running mid-playback', () => {
    const { stop, fire } = setup(makeState());

    fire('suspended');

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('restarts song playback from the saved position when the context returns to running', () => {
    const { stop, startSong, startPatternLoop, fire } = setup(
      makeState({ currentPattern: 3, currentLine: 7 }),
    );

    fire('suspended');
    fire('running');

    expect(stop).toHaveBeenCalledTimes(1);
    expect(startSong).toHaveBeenCalledWith(3, 7);
    expect(startPatternLoop).not.toHaveBeenCalled();
  });

  it('restarts pattern-loop playback when looping was active', () => {
    const { startSong, startPatternLoop, fire } = setup(
      makeState({ isPatternLoop: true, currentPattern: 1, currentLine: 4 }),
    );

    fire('suspended');
    fire('running');

    expect(startPatternLoop).toHaveBeenCalledWith(1, 4);
    expect(startSong).not.toHaveBeenCalled();
  });

  it('does nothing when playback was not active during the suspension', () => {
    const { stop, startSong, fire } = setup(makeState({ isPlaying: false }));

    fire('suspended');
    fire('running');

    expect(stop).not.toHaveBeenCalled();
    expect(startSong).not.toHaveBeenCalled();
  });

  it('ignores a running transition with no saved position', () => {
    const { stop, startSong, startPatternLoop, fire } = setup(makeState());

    fire('running');

    expect(stop).not.toHaveBeenCalled();
    expect(startSong).not.toHaveBeenCalled();
    expect(startPatternLoop).not.toHaveBeenCalled();
  });

  it('keeps the first saved position across repeated non-running transitions', () => {
    const { stop, startSong, fire } = setup(makeState({ currentPattern: 6, currentLine: 9 }));

    fire('suspended');
    fire('interrupted');
    fire('running');

    expect(stop).toHaveBeenCalledTimes(1);
    expect(startSong).toHaveBeenCalledWith(6, 9);
  });
});
