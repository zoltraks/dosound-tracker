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
        let newTick = prev.currentTick + 1;
        let newLine = prev.currentLine;
        let newPattern = prev.currentPattern;

        // Check if we've completed all ticks in current row
        if (newTick >= prev.ticksPerRow) {
          newTick = 0;
          newLine++;

          // Check if we've completed all lines in current pattern
          // This is determined by the (dynamic) pattern length
          const maxLines = patternLengthRef.current || 1;
          if (newLine >= maxLines) {
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
  }, [calculateTickInterval]);

  const startPlayback = useCallback((patternLoop: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setSequencerState(prev => ({
      ...prev,
      isPlaying: true,
      isPatternLoop: patternLoop,
      currentTick: 0
      // Preserve currentLine/currentPattern so callers can set position before starting
    }));

    schedulePlaybackInterval();
  }, [schedulePlaybackInterval]);

  const start = useCallback(() => {
    startPlayback(false);
  }, [startPlayback]);

  const stop = useCallback(() => {
    setSequencerState(prev => {
      if (!prev.isPlaying) {
        return prev;
      }

      return {
        ...prev,
        isPlaying: false,
        currentTick: 0,
        currentLine: 0
        // Keep currentPattern to maintain playlist position
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

  const startPatternLoop = useCallback(() => {
    startPlayback(true);
  }, [startPlayback]);

  const startSong = useCallback(() => {
    startPlayback(false);
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
