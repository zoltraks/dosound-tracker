import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_SONG_FRAME } from '../../constants/song.ts';

export interface SequencerState {
  isPlaying: boolean;
  isPatternLoop: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
}

interface SequencerWorkerTickData {
  isPlaying: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
}

type SequencerWorkerMessage =
  | { type: 'tick'; data: SequencerWorkerTickData }
  | { type: 'update'; data: SequencerWorkerTickData }
  | { type: 'stop'; data: SequencerWorkerTickData };

export const useSequencer = (
  patternLength: number = 64,
  frameRate: number = DEFAULT_SONG_FRAME,
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

  const workerRef = useRef<Worker | null>(null);
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

    // Determine whether a valid loop index is present and clamp it into range.
    let nextLoopIndex = 0;
    let nextHasLoop = false;

    if (typeof loop === 'number' && Number.isFinite(loop) && clampedLength > 0) {
      const base = Math.floor(loop);
      nextLoopIndex = Math.max(0, Math.min(clampedLength - 1, base));
      nextHasLoop = true;
    }

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setParams',
        data: {
          playlistLength: clampedLength,
          // Only send a meaningful loopIndex when looping is enabled.
          loopIndex: nextHasLoop ? nextLoopIndex : 0,
          hasLoop: nextHasLoop,
        },
      });
    }
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

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setParams',
        data: { patternLoop },
      });
    }
  }, []);

  // Initialize Web Worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      workerRef.current = new Worker(new URL('../../workers/sequencerWorker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.addEventListener(
        'message',
        (event: MessageEvent<SequencerWorkerMessage>) => {
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
        },
      );

      // Initialize worker parameters
      workerRef.current.postMessage({
        type: 'setParams',
        data: {
          tickInterval: calculateTickInterval(),
          patternLength: patternLengthRef.current,
        },
      });
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [calculateTickInterval]);

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

      // Start worker-based timing
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'start',
          data: {
            pattern: initialPattern !== undefined ? initialPattern : sequencerState.currentPattern,
            line: initialLine !== undefined ? initialLine : sequencerState.currentLine,
            tick: initialTick !== undefined ? initialTick : 0,
            patternLoop,
          },
        });
      }
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

    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
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

      // Update worker position
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'update',
          data: { pattern, line, tick },
        });
      }
    },
    [sequencerState],
  );

  const updateSpeed = useCallback((newSpeed: number) => {
    // Use song speed directly as number of VBLANK frames per row (50 Hz)
    const newTicksPerRow = Math.max(1, newSpeed | 0);

    // Update worker parameters
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setParams',
        data: { ticksPerRow: newTicksPerRow },
      });
    }
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

    // Update worker parameters
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setParams',
        data: { patternLength: clamped },
      });
    }
  }, []);

  const updateFrameRate = useCallback(
    (newFrameRate: number) => {
      const clamped = Math.max(1, newFrameRate | 0);
      frameRateRef.current = clamped;

      // Update worker tick interval
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'setParams',
          data: { tickInterval: calculateTickInterval() },
        });
      }
    },
    [calculateTickInterval],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

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
