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
    // Divide by 2 because DOSOUND cycles are 2 frames each
    ticksPerRow: Math.max(1, Math.floor(songSpeed / 2))
  });

  const intervalRef = useRef<number | null>(null);
  const callbackRef = useRef<((state: SequencerState) => void) | null>(null);
  const tickCallbackRef = useRef<((tick: number) => void) | null>(null);
  const patternLengthRef = useRef(patternLength);
  const initialPositionRef = useRef<{ pattern?: number; line?: number; tick?: number } | null>(null);

  const calculateTickInterval = useCallback(() => {
    // Calculate interval based on BPM and ticks per row
    // 50Hz VBLANK timing = 20ms per tick
    const baseInterval = 1000 / VBLANK_RATE;
    return baseInterval;
  }, []);

  const schedulePlaybackInterval = useCallback(() => {
    const interval = calculateTickInterval();

    intervalRef.current = setInterval(() => {
      setSequencerState(prev => {
        // Check if we have initial position override for first tick
        // Check if we have initial position override for first tick
        let newState = { ...prev };
        let hasInitialOverride = false;
        if (initialPositionRef.current) {
          if (initialPositionRef.current.pattern !== undefined) {
            newState.currentPattern = initialPositionRef.current.pattern;
          }
          if (initialPositionRef.current.line !== undefined) {
            newState.currentLine = initialPositionRef.current.line;
          }
          if (initialPositionRef.current.tick !== undefined) {
            newState.currentTick = initialPositionRef.current.tick;
          }
          // Clear the ref after applying
          initialPositionRef.current = null;
          hasInitialOverride = true;
        }

        if (!newState.isPlaying) {
          return newState;
        }

        // Skip tick advancement on first tick when applying initial override
        if (hasInitialOverride) {
          return newState;
        }

        // Advance tick
        let newTick = newState.currentTick + 1;
        let newLine = newState.currentLine;
        let newPattern = newState.currentPattern;

        // Check if we need to advance to next line
        if (newTick >= newState.ticksPerRow) {
          newTick = 0;
          newLine++;

          // This is determined by the (dynamic) pattern length
          const maxLines = patternLengthRef.current || 1;
          if (newLine >= maxLines) {
            newLine = 0;
            // Only advance pattern if not in pattern loop mode
            if (!newState.isPatternLoop) {
              newPattern++;
            }
          }
        }

        const finalState = {
          ...newState,
          currentTick: newTick,
          currentLine: newLine,
          currentPattern: newPattern
        };

        return finalState;
      });
    }, interval);
  }, [calculateTickInterval]);

  useEffect(() => {
    if (sequencerState.isPlaying && callbackRef.current) {
      callbackRef.current(sequencerState);
    }
    if (sequencerState.isPlaying && tickCallbackRef.current) {
      tickCallbackRef.current(sequencerState.currentTick);
    }
  }, [sequencerState]);

  const startPlayback = useCallback((patternLoop: boolean, initialPattern?: number, initialLine?: number, initialTick?: number) => {
    // Store initial position in ref for synchronous access
    initialPositionRef.current = { pattern: initialPattern, line: initialLine, tick: initialTick };
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setSequencerState(prev => ({
      ...prev,
      isPlaying: true,
      isPatternLoop: patternLoop,
      currentTick: 0
    }));

    schedulePlaybackInterval();
  }, [schedulePlaybackInterval]);

  const start = useCallback(() => {
    startPlayback(false);
  }, [startPlayback]);

  const stop = useCallback((preservePattern?: number) => {
    setSequencerState(prev => {
      if (!prev.isPlaying) {
        return prev;
      }

      return {
        ...prev,
        isPlaying: false,
        currentTick: 0,
        currentLine: 0,
        // Use provided pattern or keep current pattern to maintain playlist position
        currentPattern: preservePattern !== undefined ? preservePattern : prev.currentPattern
      };
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setPosition = useCallback((pattern: number, line: number, tick: number = 0) => {
    setSequencerState(prev => ({
      ...prev,
      currentPattern: pattern,
      currentLine: line,
      currentTick: tick
    }));
  }, []);

  const setBPM = useCallback((bpm: number) => {
    setSequencerState(prev => ({ ...prev, bpm }));
  }, []);

  const setTicksPerRow = useCallback((ticksPerRow: number) => {
    // Divide by 2 because DOSOUND cycles are 2 frames each
    setSequencerState(prev => ({ ...prev, ticksPerRow: Math.max(1, Math.floor(ticksPerRow / 2)) }));
  }, []);

  const updateSpeed = useCallback((newSpeed: number) => {
    // Divide by 2 because DOSOUND cycles are 2 frames each
    setSequencerState(prev => ({ ...prev, ticksPerRow: Math.max(1, Math.floor(newSpeed / 2)) }));
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
