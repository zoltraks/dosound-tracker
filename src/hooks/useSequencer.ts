import { useState, useEffect, useRef, useCallback } from 'react';
import { VBLANK_RATE } from '../synth/dosound/DosoundDriver';

export interface SequencerState {
  isPlaying: boolean;
  isPatternLoop: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
  bpm: number;
  ticksPerRow: number;
}

export const useSequencer = (songSpeed: number = 6) => {
  const [sequencerState, setSequencerState] = useState<SequencerState>({
    isPlaying: false,
    isPatternLoop: false,
    currentPattern: 0,
    currentLine: 0,
    currentTick: 0,
    bpm: 125,
    ticksPerRow: songSpeed
  });

  const intervalRef = useRef<number | null>(null);
  const callbackRef = useRef<((state: SequencerState) => void) | null>(null);
  const tickCallbackRef = useRef<((tick: number) => void) | null>(null);

  const calculateTickInterval = useCallback(() => {
    // Calculate interval based on BPM and ticks per row
    // 50Hz VBLANK timing = 20ms per tick
    const baseInterval = 1000 / VBLANK_RATE;
    return baseInterval;
  }, []);

  const start = useCallback(() => {
    if (sequencerState.isPlaying) return;

    setSequencerState(prev => ({ ...prev, isPlaying: true }));

    const interval = calculateTickInterval();
    
    intervalRef.current = setInterval(() => {
      setSequencerState(prev => {
        let newTick = prev.currentTick + 1;
        let newLine = prev.currentLine;
        let newPattern = prev.currentPattern;

        // Check if we've completed all ticks in current row
        if (newTick >= prev.ticksPerRow) {
          newTick = 0;
          newLine++;

          // Check if we've completed all lines in current pattern
          // This would be determined by the pattern length
          if (newLine >= 64) { // Assuming 64 lines per pattern
            newLine = 0;
            // Only advance pattern if not in pattern loop mode
            if (!prev.isPatternLoop) {
              newPattern++;
            }
          }
        }

        const newState = {
          ...prev,
          currentTick: newTick,
          currentLine: newLine,
          currentPattern: newPattern
        };

        // Call registered callbacks
        if (callbackRef.current) {
          callbackRef.current(newState);
        }

        if (tickCallbackRef.current) {
          tickCallbackRef.current(newTick);
        }

        return newState;
      });
    }, interval);
  }, [sequencerState.isPlaying, calculateTickInterval]);

  const stop = useCallback(() => {
    if (!sequencerState.isPlaying) return;

    setSequencerState(prev => ({ 
      ...prev, 
      isPlaying: false,
      currentTick: 0,
      currentLine: 0
      // Keep currentPattern to maintain playlist position
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [sequencerState.isPlaying]);

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
    setSequencerState(prev => ({ ...prev, ticksPerRow }));
  }, []);

  const updateSpeed = useCallback((newSpeed: number) => {
    setSequencerState(prev => ({ ...prev, ticksPerRow: newSpeed }));
  }, []);

  const startPatternLoop = useCallback(() => {
    if (sequencerState.isPlaying) return;

    setSequencerState(prev => ({ 
      ...prev, 
      isPlaying: true,
      isPatternLoop: true,
      currentTick: 0,
      currentLine: 0
      // Keep currentPattern to loop current pattern
    }));

    const interval = calculateTickInterval();
    
    intervalRef.current = setInterval(() => {
      setSequencerState(prev => {
        let newTick = prev.currentTick + 1;
        let newLine = prev.currentLine;
        let newPattern = prev.currentPattern;

        // Check if we've completed all ticks in current row
        if (newTick >= prev.ticksPerRow) {
          newTick = 0;
          newLine++;

          // Check if we've completed all lines in current pattern
          // This would be determined by the pattern length
          if (newLine >= 64) { // Assuming 64 lines per pattern
            newLine = 0;
            // Only advance pattern if not in pattern loop mode
            if (!prev.isPatternLoop) {
              newPattern++;
            }
          }
        }

        const newState = {
          ...prev,
          currentTick: newTick,
          currentLine: newLine,
          currentPattern: newPattern
        };

        // Call registered callbacks
        if (callbackRef.current) {
          callbackRef.current(newState);
        }

        if (tickCallbackRef.current) {
          tickCallbackRef.current(newTick);
        }

        return newState;
      });
    }, interval);
  }, [sequencerState.isPlaying, calculateTickInterval]);

  const startSong = useCallback(() => {
    if (sequencerState.isPlaying) return;

    setSequencerState(prev => ({ 
      ...prev, 
      isPlaying: true,
      isPatternLoop: false,
      currentTick: 0,
      currentLine: 0
      // Keep currentPattern to start from current position
    }));

    const interval = calculateTickInterval();
    
    intervalRef.current = setInterval(() => {
      setSequencerState(prev => {
        let newTick = prev.currentTick + 1;
        let newLine = prev.currentLine;
        let newPattern = prev.currentPattern;

        // Check if we've completed all ticks in current row
        if (newTick >= prev.ticksPerRow) {
          newTick = 0;
          newLine++;

          // Check if we've completed all lines in current pattern
          // This would be determined by the pattern length
          if (newLine >= 64) { // Assuming 64 lines per pattern
            newLine = 0;
            // Only advance pattern if not in pattern loop mode
            if (!prev.isPatternLoop) {
              newPattern++;
            }
          }
        }

        const newState = {
          ...prev,
          currentTick: newTick,
          currentLine: newLine,
          currentPattern: newPattern
        };

        // Call registered callbacks
        if (callbackRef.current) {
          callbackRef.current(newState);
        }

        if (tickCallbackRef.current) {
          tickCallbackRef.current(newTick);
        }

        return newState;
      });
    }, interval);
  }, [sequencerState.isPlaying, calculateTickInterval]);

  const setCallback = useCallback((callback: (state: SequencerState) => void) => {
    callbackRef.current = callback;
  }, []);

  const setTickCallback = useCallback((callback: (tick: number) => void) => {
    tickCallbackRef.current = callback;
  }, []);

  const getCurrentTime = useCallback(() => {
    // Calculate current playback time in seconds
    const totalTicks = (sequencerState.currentPattern * 64 + sequencerState.currentLine) * sequencerState.ticksPerRow + sequencerState.currentTick;
    const tickDuration = 60.0 / (sequencerState.bpm * 4); // 16th notes
    return totalTicks * tickDuration;
  }, [sequencerState]);

  const jumpToLine = useCallback((line: number) => {
    setSequencerState(prev => ({
      ...prev,
      currentLine: Math.max(0, Math.min(63, line)),
      currentTick: 0
    }));
  }, []);

  const nextLine = useCallback(() => {
    setSequencerState(prev => {
      const newLine = prev.currentLine + 1;
      if (newLine >= 64) {
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
          currentLine: 63,
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
    previousLine
  };
};
