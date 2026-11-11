import { useEffect, useRef } from 'react';
import type { SequencerState } from '../sequencer/useSequencer.ts';

interface UseAudioContextPlaybackSyncParams {
  audioContext: AudioContext | null;
  sequencerState: SequencerState;
  stop: () => void;
  startSong: (patternIndex?: number, lineIndex?: number) => void;
  startPatternLoop: (patternIndex: number, lineIndex: number) => void;
}

// Keeps the sequencer view bound to audible playback. While the AudioContext
// is suspended or interrupted (autoplay gating, device switches, background
// tabs) no audio renders, so the sequencer is stopped and its position saved;
// when the context returns to running, playback restarts from that position.
export function useAudioContextPlaybackSync({
  audioContext,
  sequencerState,
  stop,
  startSong,
  startPatternLoop,
}: UseAudioContextPlaybackSyncParams): void {
  const suspendedPositionRef = useRef<{
    pattern: number;
    line: number;
    loop: boolean;
  } | null>(null);
  const latestRef = useRef({ sequencerState, stop, startSong, startPatternLoop });

  useEffect(() => {
    latestRef.current = { sequencerState, stop, startSong, startPatternLoop };
  });

  useEffect(() => {
    if (!audioContext) {
      return;
    }

    const onStateChange = () => {
      const current = latestRef.current;

      if (audioContext.state === 'running') {
        const suspended = suspendedPositionRef.current;
        if (!suspended) {
          return;
        }
        suspendedPositionRef.current = null;
        if (suspended.loop) {
          current.startPatternLoop(suspended.pattern, suspended.line);
        } else {
          current.startSong(suspended.pattern, suspended.line);
        }
        return;
      }

      if (!current.sequencerState.isPlaying || suspendedPositionRef.current) {
        return;
      }
      suspendedPositionRef.current = {
        pattern: current.sequencerState.currentPattern,
        line: current.sequencerState.currentLine,
        loop: current.sequencerState.isPatternLoop,
      };
      current.stop();
    };

    audioContext.addEventListener('statechange', onStateChange);
    return () => audioContext.removeEventListener('statechange', onStateChange);
  }, [audioContext]);
}
