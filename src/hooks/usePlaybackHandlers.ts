/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { SequencerState } from './useSequencer';
import type { Song } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import { clearIntervalRef } from '../utils/timerUtils';

export interface UsePlaybackHandlersParams {
  stop: () => void;
  startSong: (patternIndex?: number, lineIndex?: number) => void;
  startPatternLoop: (patternIndex: number, lineIndex: number) => void;
  setPatternLoopMode: (enabled: boolean) => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  sequencerState: SequencerState;
  handleStopPlayback: () => void;
  lastSequencerPositionRef: MutableRefObject<{ pattern: number; line: number } | null>;
  playInstTimerRef: RefObject<number | null>;
  currentSong: Song;
  sharedCurrentLine: number;
  setSharedCurrentLine: (line: number) => void;
  activeSection: NavigationSection;
  lastTrackId: 'A' | 'B' | 'C';
  isLinePlaying: boolean;
  setIsLinePlaying: Dispatch<SetStateAction<boolean>>;
}

export interface UsePlaybackHandlersResult {
  handleStop: () => void;
  handleStopLinePlayback: () => void;
  handleStartSong: () => void;
  handleStartLinePlayback: () => void;
  handleStartLineFromBeginning: () => void;
  handleStartLineFromCurrentLine: (overrideLine?: number) => void;
  handleToggleLineFromCursor: (lineIndex: number) => void;
  handleToggleLineFromStart: (lineIndex: number) => void;
}

export function usePlaybackHandlers({
  stop,
  startSong,
  startPatternLoop,
  setPatternLoopMode,
  setPosition,
  sequencerState,
  handleStopPlayback,
  lastSequencerPositionRef,
  playInstTimerRef,
  currentSong,
  sharedCurrentLine,
  setSharedCurrentLine,
  activeSection,
  lastTrackId,
  isLinePlaying,
  setIsLinePlaying,
}: UsePlaybackHandlersParams): UsePlaybackHandlersResult {
  const patternReturnPositionRef = useRef<{ pattern: number; line: number } | null>(null);

  // Handle stop playback with silence
  const handleStop = useCallback(() => {
    // Stop the sequencer
    stop();

    // Ensure line play state is cleared so buttons show PLAY again
    setIsLinePlaying(false);

    // Stop any instrument preview playback
    clearIntervalRef(playInstTimerRef);

    // Reset cycle counters and silence all channels
    handleStopPlayback();
  }, [stop, handleStopPlayback]);

  // Handle stop line playback (pattern-loop mode for the current playlist line)
  const handleStopLinePlayback = useCallback(() => {
    // Stop the sequencer
    stop();

    // Update line playing state
    setIsLinePlaying(false);

    // Stop any instrument preview playback
    clearIntervalRef(playInstTimerRef);

    // Reset cycle counters and silence all channels
    handleStopPlayback();
    const returnPos = patternReturnPositionRef.current;
    if (returnPos) {
      setPosition(returnPos.pattern, returnPos.line, 0);
      setSharedCurrentLine(returnPos.line);
      patternReturnPositionRef.current = null;
    }
  }, [stop, handleStopPlayback, setPosition]);

  // Handle start song playback
  const handleStartSong = useCallback(() => {
    if (currentSong.line.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.line.length - 1),
    );

    // If we are currently in line-loop mode and playback is running, switch
    // to song playback without restarting the sequencer. The worker will
    // apply the mode change at the next pattern boundary, avoiding any
    // audible gap.
    if (isLinePlaying && sequencerState.isPlaying) {
      setIsLinePlaying(false);
      patternReturnPositionRef.current = null;

      setPatternLoopMode(false);
      return;
    }

    // Otherwise start song from the beginning (line 0) of the current pattern.
    patternReturnPositionRef.current = {
      pattern: clampedIndex,
      line: sharedCurrentLine,
    };

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    startSong(clampedIndex, 0);
  }, [
    isLinePlaying,
    startSong,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    sequencerState.isPlaying,
    currentSong.line,
    sharedCurrentLine,
    setPatternLoopMode,
  ]);

  // Handle start line playback (line-loop mode for the current playlist line)
  const handleStartLinePlayback = useCallback(() => {
    if (currentSong.line.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.line.length - 1),
    );
    const currentEntry = currentSong.line[clampedIndex];

    if (!currentEntry) {
      return;
    }

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentEntry.A;
        break;
      case 'B':
        patternId = currentEntry.B;
        break;
      case 'C':
        patternId = currentEntry.C;
        break;
    }

    if (patternId === '--') {
      return;
    }

    // If a song is currently playing, switch into line-loop mode and
    // let the sequencer continue without restarting. The worker will
    // honor the new pattern-loop flag at the next pattern boundary.
    if (sequencerState.isPlaying && !isLinePlaying) {
      const effectiveLine = Math.max(
        0,
        Math.min(sequencerState.currentLine, (currentSong.length || PATTERN_LENGTH) - 1),
      );

      patternReturnPositionRef.current = {
        pattern: clampedIndex,
        line: effectiveLine,
      };

      setIsLinePlaying(true);

      setPatternLoopMode(true);
      return;
    }

    // Otherwise (not playing, or already in pattern mode), start from the beginning.
    if (sequencerState.isPlaying) {
      stop();
    }

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    setIsLinePlaying(true);

    startPatternLoop(clampedIndex, 0);
  }, [
    stop,
    startPatternLoop,
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    currentSong.line,
    currentSong.length,
    activeSection,
    lastTrackId,
    isLinePlaying,
    setPatternLoopMode,
  ]);

  const handleStartLineFromBeginning = useCallback(() => {
    if (currentSong.line.length === 0) {
      return;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(sequencerState.currentPattern, currentSong.line.length - 1),
    );
    const currentEntry = currentSong.line[clampedIndex];

    if (!currentEntry) {
      return;
    }

    let trackId: 'A' | 'B' | 'C' = lastTrackId;
    if (activeSection === 'trackA') {
      trackId = 'A';
    } else if (activeSection === 'trackB') {
      trackId = 'B';
    } else if (activeSection === 'trackC') {
      trackId = 'C';
    }

    let patternId = '--';
    switch (trackId) {
      case 'A':
        patternId = currentEntry.A;
        break;
      case 'B':
        patternId = currentEntry.B;
        break;
      case 'C':
        patternId = currentEntry.C;
        break;
    }

    if (patternId === '--') {
      return;
    }

    if (sequencerState.isPlaying) {
      stop();
    }

    if (isLinePlaying) {
      setIsLinePlaying(false);
    }

    // Start from the beginning (line 0) of the current pattern
    setPosition(clampedIndex, 0, 0);

    startSong();
  }, [
    stop,
    startSong,
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    setPosition,
    isLinePlaying,
    currentSong.line,
    activeSection,
    lastTrackId,
  ]);

  const handleStartLineFromCurrentLine = useCallback(
    (overrideLine?: number) => {
      if (currentSong.line.length === 0) {
        return;
      }

      const playlistLength = currentSong.line.length;
      const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
      const currentEntry = currentSong.line[clampedIndex];

      if (!currentEntry) {
        return;
      }

      let trackId: 'A' | 'B' | 'C' = lastTrackId;
      if (activeSection === 'trackA') {
        trackId = 'A';
      } else if (activeSection === 'trackB') {
        trackId = 'B';
      } else if (activeSection === 'trackC') {
        trackId = 'C';
      }

      let patternId = '--';
      switch (trackId) {
        case 'A':
          patternId = currentEntry.A;
          break;
        case 'B':
          patternId = currentEntry.B;
          break;
        case 'C':
          patternId = currentEntry.C;
          break;
      }

      if (patternId === '--') {
        return;
      }

      const effectiveLine = overrideLine != null ? overrideLine : sharedCurrentLine;

      // Save return position (playlist row and line where cursor currently is)
      patternReturnPositionRef.current = {
        pattern: clampedIndex,
        line: effectiveLine,
      };

      if (sequencerState.isPlaying) {
        stop();
      }

      // Clear position ref to ensure first tick detection works
      lastSequencerPositionRef.current = null;

      setIsLinePlaying(true);

      // Start pattern loop from the current cursor line
      const startLine = Math.max(
        0,
        Math.min(effectiveLine, (currentSong.length || PATTERN_LENGTH) - 1),
      );
      startPatternLoop(clampedIndex, startLine);
    },
    [
      currentSong.line,
      currentSong.length,
      sharedCurrentLine,
      sequencerState.currentPattern,
      sequencerState.isPlaying,
      activeSection,
      lastTrackId,
      stop,
      startPatternLoop,
    ],
  );

  const handleToggleLineFromCursor = useCallback(
    (lineIndex: number) => {
      if (isLinePlaying && sequencerState.isPlaying) {
        handleStopLinePlayback();
        return;
      }

      handleStartLineFromCurrentLine(lineIndex);
    },
    [
      isLinePlaying,
      sequencerState.isPlaying,
      handleStopLinePlayback,
      handleStartLineFromCurrentLine,
    ],
  );

  // Ctrl+Enter in a track: play the line from its first row like the PLAY LINE
  // menu command, remembering the cursor position so Enter restores it on stop.
  const handleToggleLineFromStart = useCallback(
    (lineIndex: number) => {
      if (isLinePlaying && sequencerState.isPlaying) {
        handleStopLinePlayback();
        return;
      }

      const playlistLength = currentSong.line.length;
      if (playlistLength === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));

      // Save the cursor return position so pressing Enter or Ctrl+Enter restores it.
      patternReturnPositionRef.current = { pattern: clampedIndex, line: lineIndex };

      handleStartLinePlayback();
    },
    [
      isLinePlaying,
      sequencerState.isPlaying,
      sequencerState.currentPattern,
      currentSong.line.length,
      handleStopLinePlayback,
      handleStartLinePlayback,
    ],
  );

  // Safety guard: ensure sequencer position always stays within playlist bounds
  // and force a clean stop if playback runs past the end for any reason.
  useEffect(() => {
    const playlistLength = currentSong.line.length;

    // Nothing to do if not playing
    if (!sequencerState.isPlaying) {
      return;
    }

    // If playlist was cleared while playing, stop gracefully
    if (playlistLength === 0) {
      handleStopPlayback();
      stop();
      return;
    }

    if (sequencerState.currentPattern < 0 || sequencerState.currentPattern >= playlistLength) {
      const rawLoop = currentSong.loop;
      const hasLoop = typeof rawLoop === 'number' && Number.isFinite(rawLoop);

      if (!hasLoop) {
        handleStopPlayback();
        setPosition(0, 0, 0);
        stop();
        return;
      }

      const base = Math.floor(rawLoop as number);
      const loopIndex = Math.max(0, Math.min(playlistLength - 1, base));

      setPosition(loopIndex, 0, 0);
    }
  }, [
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    currentSong.line.length,
    currentSong.loop,
    stop,
    handleStopPlayback,
    setPosition,
  ]);

  return {
    handleStop,
    handleStopLinePlayback,
    handleStartSong,
    handleStartLinePlayback,
    handleStartLineFromBeginning,
    handleStartLineFromCurrentLine,
    handleToggleLineFromCursor,
    handleToggleLineFromStart,
  };
}
