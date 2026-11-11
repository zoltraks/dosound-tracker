import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_SONG_FRAME } from '../../constants/song.ts';
import sequencerWorkletUrl from '../../workers/sequencerWorklet.ts?worker&url';
import type { SequencerWorkletIncomingMessage } from '../../workers/sequencerWorklet.ts';
import { logger } from '../../utils/log/logger.ts';

export interface SequencerState {
  isPlaying: boolean;
  isPatternLoop: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
}

interface SequencerWorkletTickData {
  isPlaying: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
}

type SequencerWorkletMessage =
  | { type: 'tick'; data: SequencerWorkletTickData }
  | { type: 'update'; data: SequencerWorkletTickData }
  | { type: 'stop'; data: SequencerWorkletTickData };

export const useSequencer = (
  patternLength: number = 64,
  frameRate: number = DEFAULT_SONG_FRAME,
  audioContext: AudioContext | null = null,
) => {
  const [sequencerState, setSequencerState] = useState<SequencerState>({
    isPlaying: false,
    isPatternLoop: false,
    currentPattern: 0,
    currentLine: 0,
    currentTick: 0,
  });

  const playbackStateRef = useRef<SequencerState>({
    isPlaying: false,
    isPatternLoop: false,
    currentPattern: 0,
    currentLine: 0,
    currentTick: 0,
  });

  const nodeRef = useRef<AudioWorkletNode | null>(null);
  // Outgoing messages route through postRef. The post function exists
  // from the first render because the audio context lands after mount:
  // messages posted while no node exists queue in arrival order and
  // flush when the node lands, so mount-time params are never dropped.
  const pendingMessagesRef = useRef<SequencerWorkletIncomingMessage[]>([]);
  const postRef = useRef((message: SequencerWorkletIncomingMessage) => {
    if (nodeRef.current) {
      nodeRef.current.port.postMessage(message);
    } else {
      pendingMessagesRef.current.push(message);
    }
  });
  const callbackRef = useRef<((state: SequencerState) => void) | null>(null);
  const patternLengthRef = useRef(patternLength);
  const frameRateRef = useRef(frameRate);

  const calculateTickInterval = useCallback(() => {
    // Tick interval derived from the song's frame rate (20ms at 50Hz, 16.66ms at 60Hz)
    const baseInterval = 1000 / frameRateRef.current;
    return baseInterval;
  }, []);

  const updateSongLoop = useCallback((playlistLength: number, loop: number | null | undefined) => {
    const clampedLength = Math.max(0, playlistLength | 0);

    let nextLoopIndex = 0;
    let nextHasLoop = false;

    if (typeof loop === 'number' && Number.isFinite(loop) && clampedLength > 0) {
      const base = Math.floor(loop);
      nextLoopIndex = Math.max(0, Math.min(clampedLength - 1, base));
      nextHasLoop = true;
    }

    postRef.current?.({
      type: 'setParams',
      data: {
        playlistLength: clampedLength,
        loopIndex: nextHasLoop ? nextLoopIndex : 0,
        hasLoop: nextHasLoop,
      },
    });
  }, []);

  const setPatternLoopMode = useCallback((patternLoop: boolean) => {
    setSequencerState((prev) => ({
      ...prev,
      isPatternLoop: patternLoop,
    }));

    playbackStateRef.current = {
      ...playbackStateRef.current,
      isPatternLoop: patternLoop,
    };

    postRef.current?.({
      type: 'setParams',
      data: { patternLoop },
    });
  }, []);

  useEffect(() => {
    if (!audioContext?.audioWorklet) {
      return;
    }

    let cancelled = false;

    const handleMessage = (event: MessageEvent<SequencerWorkletMessage>) => {
      const { type, data } = event.data;

      switch (type) {
        case 'tick':
        case 'update': {
          const prevPlayback = playbackStateRef.current;
          const safeIsPlaying = prevPlayback.isPlaying ? data.isPlaying : false;

          const mergedState: SequencerState = {
            ...prevPlayback,
            ...data,
            isPlaying: safeIsPlaying,
          };

          playbackStateRef.current = mergedState;

          if (type === 'tick') {
            // Fire audio callbacks only on regular timing ticks so that
            // instantaneous position updates (e.g. from setPosition during
            // song loop wrap-around) do not cause the same logical row to be
            // processed twice, which can introduce audible stutters.
            if (callbackRef.current) {
              callbackRef.current(mergedState);
            }
          }

          if (type === 'tick') {
            setSequencerState((prev) => {
              const rowChanged =
                data.currentLine !== prev.currentLine ||
                data.currentPattern !== prev.currentPattern;
              if (rowChanged || mergedState.isPlaying !== prev.isPlaying) {
                return {
                  ...prev,
                  ...data,
                  isPlaying: mergedState.isPlaying,
                };
              }
              return prev;
            });
          } else {
            setSequencerState((prev) => ({
              ...prev,
              ...data,
              isPlaying: mergedState.isPlaying,
            }));
          }
          break;
        }
        case 'stop':
          playbackStateRef.current = {
            ...playbackStateRef.current,
            ...data,
          };
          if (callbackRef.current) {
            callbackRef.current(playbackStateRef.current);
          }
          setSequencerState((prev) => ({ ...prev, ...data }));
          break;
      }
    };

    postRef.current({
      type: 'setParams',
      data: {
        tickInterval: calculateTickInterval(),
        patternLength: patternLengthRef.current,
      },
    });

    void audioContext.audioWorklet
      .addModule(sequencerWorkletUrl)
      .then(() => {
        if (cancelled) {
          return;
        }
        const node = new AudioWorkletNode(audioContext, 'sequencer-processor', {
          outputChannelCount: [1],
        });
        // The node emits silence - it sits in the render graph only so the
        // audio thread pulls process() every quantum.
        node.connect(audioContext.destination);
        node.port.onmessage = handleMessage;
        nodeRef.current = node;
        for (const message of pendingMessagesRef.current.splice(0)) {
          node.port.postMessage(message);
        }
      })
      .catch((error: unknown) => {
        logger.error('Sequencer worklet initialization failed', error);
      });

    return () => {
      cancelled = true;
      if (nodeRef.current) {
        nodeRef.current.port.onmessage = null;
        nodeRef.current.port.close();
        nodeRef.current.disconnect();
        nodeRef.current = null;
      }
    };
  }, [audioContext, calculateTickInterval]);

  // Keep the playback ref in sync whenever external callers mutate the
  // sequencer state via helpers like stop, setPosition, updateSpeed, etc.
  useEffect(() => {
    playbackStateRef.current = sequencerState;
  }, [sequencerState]);

  const startPlayback = useCallback(
    (patternLoop: boolean, initialPattern?: number, initialLine?: number, initialTick?: number) => {
      // Update React state immediately for UI responsiveness
      const nextState: SequencerState = {
        ...sequencerState,
        isPlaying: true,
        isPatternLoop: patternLoop,
        currentPattern:
          initialPattern !== undefined ? initialPattern : sequencerState.currentPattern,
        currentLine: initialLine !== undefined ? initialLine : sequencerState.currentLine,
        currentTick: initialTick !== undefined ? initialTick : 0,
      };

      setSequencerState(nextState);
      playbackStateRef.current = nextState;

      postRef.current?.({
        type: 'start',
        data: {
          pattern: initialPattern !== undefined ? initialPattern : sequencerState.currentPattern,
          line: initialLine !== undefined ? initialLine : sequencerState.currentLine,
          tick: initialTick !== undefined ? initialTick : 0,
          patternLoop,
        },
      });
    },
    [sequencerState],
  );

  const stop = useCallback(() => {
    const stoppedState: SequencerState = {
      ...sequencerState,
      isPlaying: false,
      currentTick: 0,
      currentLine: sequencerState.currentLine,
      currentPattern: sequencerState.currentPattern,
    };

    setSequencerState(stoppedState);
    playbackStateRef.current = stoppedState;

    postRef.current?.({ type: 'stop' });
  }, [sequencerState]);

  const setPosition = useCallback(
    (pattern: number, line: number, tick: number = 0) => {
      const newState = {
        ...sequencerState,
        currentPattern: pattern,
        currentLine: line,
        currentTick: tick,
      };

      setSequencerState(newState);
      playbackStateRef.current = newState;

      postRef.current?.({
        type: 'update',
        data: { pattern, line, tick },
      });
    },
    [sequencerState],
  );

  const updateSpeed = useCallback((newSpeed: number) => {
    // Use song speed directly as number of VBLANK frames per row (50 Hz)
    const newTicksPerRow = Math.max(1, newSpeed | 0);

    postRef.current?.({
      type: 'setParams',
      data: { ticksPerRow: newTicksPerRow },
    });
  }, []);

  const startPatternLoop = useCallback(
    (initialPattern?: number, initialLine?: number) => {
      startPlayback(true, initialPattern, initialLine);
    },
    [startPlayback],
  );

  const startSong = useCallback(
    (initialPattern?: number, initialLine?: number) => {
      startPlayback(false, initialPattern, initialLine);
    },
    [startPlayback],
  );

  const setCallback = useCallback((callback: (state: SequencerState) => void) => {
    callbackRef.current = callback;
  }, []);

  const updatePatternLength = useCallback((newLength: number) => {
    const clamped = Math.max(1, newLength | 0 || 1);
    patternLengthRef.current = clamped;

    setSequencerState((prev) => ({
      ...prev,
      currentLine: Math.min(prev.currentLine, clamped - 1),
    }));

    postRef.current?.({
      type: 'setParams',
      data: { patternLength: clamped },
    });
  }, []);

  const updateFrameRate = useCallback(
    (newFrameRate: number) => {
      const clamped = Math.max(1, newFrameRate | 0);
      frameRateRef.current = clamped;

      postRef.current?.({
        type: 'setParams',
        data: { tickInterval: calculateTickInterval() },
      });
    },
    [calculateTickInterval],
  );

  return {
    sequencerState,
    stop,
    setPosition,
    updateSpeed,
    startPatternLoop,
    startSong,
    setCallback,
    updatePatternLength,
    updateFrameRate,
    updateSongLoop,
    setPatternLoopMode,
  };
};
