import { useState, useEffect, useRef, useCallback } from 'react';
import { VBLANK_RATE } from '../synth/SoundDriver';

export interface SequencerState {
  isPlaying: boolean;
  isPatternLoop: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
  bpm: number;
  ticksPerRow: number;
}

export const useSequencer = (songSpeed: number = 6, patternLength: number = 64) => {
  const [sequencerState, setSequencerState] = useState<SequencerState>({
    isPlaying: false,
    isPatternLoop: false,
    currentPattern: 0,
    currentLine: 0,
    currentTick: 0,
    bpm: 125,
    // Use song speed directly as number of VBLANK frames per row
    ticksPerRow: Math.max(1, songSpeed | 0)
  });

  // Internal playback state used by the timer loop. This is kept in sync with
  // the React state but can also be advanced independently on each tick
  // without forcing a full React render at 50 Hz.
  const playbackStateRef = useRef<SequencerState>({
    isPlaying: false,
    isPatternLoop: false,
    currentPattern: 0,
    currentLine: 0,
    currentTick: 0,
    bpm: 125,
    // Use song speed directly as number of VBLANK frames per row
    ticksPerRow: Math.max(1, songSpeed | 0)
  });

  const intervalRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef<((state: SequencerState) => void) | null>(null);
  const tickCallbackRef = useRef<((tick: number) => void) | null>(null);
  const patternLengthRef = useRef(patternLength);

  const calculateTickInterval = useCallback(() => {
    // Calculate interval based on BPM and ticks per row
    // 50Hz VBLANK timing = 20ms per tick
    const baseInterval = 1000 / VBLANK_RATE;
    return baseInterval;
  }, []);

  // Initialize Web Worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      workerRef.current = new Worker(new URL('../workers/sequencerWorker.ts', import.meta.url), {
        type: 'module'
      });

      workerRef.current.addEventListener('message', (event: MessageEvent) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'tick':
          case 'update':
            // Update playback ref for immediate access
            playbackStateRef.current = {
              ...playbackStateRef.current,
              ...data
            };
            
            // Fire audio callbacks
            if (callbackRef.current) {
              callbackRef.current(playbackStateRef.current);
            }
            if (tickCallbackRef.current) {
              tickCallbackRef.current(data.currentTick);
            }
            
            // Update React state only for row changes
            if (type === 'tick') {
              setSequencerState(prev => {
                const rowChanged = data.currentLine !== prev.currentLine || 
                                 data.currentPattern !== prev.currentPattern;
                if (rowChanged || data.isPlaying !== prev.isPlaying) {
                  return { ...prev, ...data };
                }
                return prev;
              });
            } else {
              // Always update for explicit position updates
              setSequencerState(prev => ({ ...prev, ...data }));
            }
            break;
            
          case 'stop':
            playbackStateRef.current = {
              ...playbackStateRef.current,
              ...data
            };
            setSequencerState(prev => ({ ...prev, ...data }));
            break;
        }
      });

      // Initialize worker parameters
      workerRef.current.postMessage({
        type: 'setParams',
        data: {
          tickInterval: calculateTickInterval(),
          patternLength: patternLengthRef.current
        }
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

  const startPlayback = useCallback((patternLoop: boolean, initialPattern?: number, initialLine?: number, initialTick?: number) => {
    // Update React state immediately for UI responsiveness
    const nextState: SequencerState = {
      ...sequencerState,
      isPlaying: true,
      isPatternLoop: patternLoop,
      currentPattern: initialPattern !== undefined ? initialPattern : sequencerState.currentPattern,
      currentLine: initialLine !== undefined ? initialLine : sequencerState.currentLine,
      currentTick: initialTick !== undefined ? initialTick : 0
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
          patternLoop
        }
      });
    }
  }, [sequencerState]);

  const start = useCallback(() => {
    startPlayback(false);
  }, [startPlayback]);

  const stop = useCallback((preservePattern?: number) => {
    const stoppedState: SequencerState = {
      ...sequencerState,
      isPlaying: false,
      currentTick: 0,
      currentLine: 0,
      // Use provided pattern or keep current pattern to maintain playlist position
      currentPattern: preservePattern !== undefined ? preservePattern : sequencerState.currentPattern
    };

    setSequencerState(stoppedState);
    playbackStateRef.current = stoppedState;

    // Stop worker-based timing
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'stop' });
    }
  }, [sequencerState]);

  const setPosition = useCallback((pattern: number, line: number, tick: number = 0) => {
    const newState = {
      ...sequencerState,
      currentPattern: pattern,
      currentLine: line,
      currentTick: tick
    };
    
    setSequencerState(newState);
    playbackStateRef.current = newState;

    // Update worker position
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'update',
        data: { pattern, line, tick }
      });
    }
  }, [sequencerState]);

  const setBPM = useCallback((bpm: number) => {
    setSequencerState(prev => ({ ...prev, bpm }));
  }, []);

  const setTicksPerRow = useCallback((ticksPerRow: number) => {
    // Use provided value directly as VBLANK frames per row
    setSequencerState(prev => ({ ...prev, ticksPerRow: Math.max(1, ticksPerRow | 0) }));
  }, []);

  const updateSpeed = useCallback((newSpeed: number) => {
    // Use song speed directly as number of VBLANK frames per row
    const newTicksPerRow = Math.max(1, newSpeed | 0);

    setSequencerState(prev => ({ ...prev, ticksPerRow: newTicksPerRow }));

    // Update worker parameters
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setParams',
        data: { ticksPerRow: newTicksPerRow }
      });
    }
  }, []);

  const startPatternLoop = useCallback((initialPattern?: number, initialLine?: number) => {
    startPlayback(true, initialPattern, initialLine);
  }, [startPlayback]);

  const startSong = useCallback((initialPattern?: number, initialLine?: number) => {
    startPlayback(false, initialPattern, initialLine);
  }, [startPlayback]);

  const setCallback = useCallback((callback: (state: SequencerState) => void) => {
    callbackRef.current = callback;
  }, []);

  const setTickCallback = useCallback((callback: (tick: number) => void) => {
    tickCallbackRef.current = callback;
  }, []);

  const getCurrentTime = useCallback(() => {
    // Calculate current playback time in seconds
    const maxLines = patternLengthRef.current || 1;
    const totalTicks =
      (sequencerState.currentPattern * maxLines + sequencerState.currentLine) *
        sequencerState.ticksPerRow +
      sequencerState.currentTick;
    const tickDuration = 60.0 / (sequencerState.bpm * 4); // 16th notes
    return totalTicks * tickDuration;
  }, [sequencerState]);

  const jumpToLine = useCallback((line: number) => {
    setSequencerState(prev => {
      const maxLines = patternLengthRef.current || 1;
      return {
        ...prev,
        currentLine: Math.max(0, Math.min(maxLines - 1, line)),
        currentTick: 0
      };
    });
  }, []);

  const nextLine = useCallback(() => {
    setSequencerState(prev => {
      const maxLines = patternLengthRef.current || 1;
      const newLine = prev.currentLine + 1;
      if (newLine >= maxLines) {
        return {
          ...prev,
          currentPattern: prev.currentPattern + 1,
          currentLine: 0,
          currentTick: 0
        };
      }
      return {
        ...prev,
        currentLine: newLine,
        currentTick: 0
      };
    });
  }, []);

  const previousLine = useCallback(() => {
    setSequencerState(prev => {
      const newLine = prev.currentLine - 1;
      if (newLine < 0) {
        const newPattern = Math.max(0, prev.currentPattern - 1);
        return {
          ...prev,
          currentPattern: newPattern,
          currentLine: Math.max(0, (patternLengthRef.current || 1) - 1),
          currentTick: 0
        };
      }
      return {
        ...prev,
        currentLine: newLine,
        currentTick: 0
      };
    });
  }, []);

  const updatePatternLength = useCallback((newLength: number) => {
    const clamped = Math.max(1, (newLength | 0) || 1);
    patternLengthRef.current = clamped;
    
    setSequencerState(prev => ({
      ...prev,
      currentLine: Math.min(prev.currentLine, clamped - 1)
    }));

    // Update worker parameters
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'setParams',
        data: { patternLength: clamped }
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return {
    sequencerState,
    start,
    stop,
    setPosition,
    setBPM,
    setTicksPerRow,
    updateSpeed,
    startPatternLoop,
    startSong,
    setCallback,
    setTickCallback,
    getCurrentTime,
    jumpToLine,
    nextLine,
    previousLine,
    updatePatternLength
  };
};
