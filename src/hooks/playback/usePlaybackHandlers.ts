/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { NavigationSection } from '../../constants/navigation.ts';
import type { SequencerState } from '../sequencer/useSequencer.ts';
import type { Song } from '../../synth/SoundDriver.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';
import { PATTERN_LENGTH } from '../../constants/music.ts';

export interface UsePlaybackHandlersParams {
  stop: () => void;
  startSong: (patternIndex?: number, lineIndex?: number) => void;
  startPatternLoop: (patternIndex: number, lineIndex: number) => void;
  setPatternLoopMode: (enabled: boolean) => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  sequencerState: SequencerState;
  handleStopPlayback: () => void;
  lastSequencerPositionRef: MutableRefObject<{ pattern: number; line: number } | null>;
  stopInstrumentPreview: () => void;
  currentSong: Song;
  sharedCurrentLine: number;
  setSharedCurrentLine: (line: number) => void;
  activeSection: NavigationSection;
  lastTrackId: 'A' | 'B' | 'C';
  isLinePlaying: boolean;
  setIsLinePlaying: Dispatch<SetStateAction<boolean>>;
  ensureAudioContextResumed: () => Promise<void>;
  waitForEngine: () => Promise<SoundEngine | null>;
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
  handleToggleSongFromCursor: (lineIndex: number) => void;
  handleToggleSongFromStart: (lineIndex: number) => void;
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
  stopInstrumentPreview,
  currentSong,
  sharedCurrentLine,
  setSharedCurrentLine,
  activeSection,
  lastTrackId,
  isLinePlaying,
  setIsLinePlaying,
  ensureAudioContextResumed,
  waitForEngine,
}: UsePlaybackHandlersParams): UsePlaybackHandlersResult {
  const patternReturnPositionRef = useRef<{ pattern: number; line: number } | null>(null);
  const playbackGenerationRef = useRef(0);

  // Start playback only after the AudioContext is running and an engine is
  // writable. Starting earlier lets ticks pile writes onto a suspended clock
  // or a null ref: the view advances while the first notes are dropped, and
  // audio joins mid-position when the context finally resumes. The generation
  // counter drops a pending start when stop or a newer start arrives first.
  const startWhenReady = useCallback(
    (start: () => void) => {
      const generation = ++playbackGenerationRef.current;
      void (async () => {
        await ensureAudioContextResumed();
        const engine = await waitForEngine();
        if (!engine || generation !== playbackGenerationRef.current) {
          return;
        }
        start();
      })();
    },
    [ensureAudioContextResumed, waitForEngine],
  );

  const handleStop = useCallback(() => {
    playbackGenerationRef.current += 1;
    void ensureAudioContextResumed();

    stop();

    setIsLinePlaying(false);

    stopInstrumentPreview();

    handleStopPlayback();
    const returnPos = patternReturnPositionRef.current;
    if (returnPos) {
      setPosition(returnPos.pattern, returnPos.line, 0);
      setSharedCurrentLine(returnPos.line);
      patternReturnPositionRef.current = null;
    }
  }, [stop, handleStopPlayback, setPosition, stopInstrumentPreview, ensureAudioContextResumed]);

  const handleStopLinePlayback = handleStop;

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

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    startWhenReady(() => startSong(clampedIndex, 0));
  }, [
    isLinePlaying,
    startSong,
    sequencerState.currentPattern,
    sequencerState.currentLine,
    sequencerState.isPlaying,
    currentSong.line,
    setPatternLoopMode,
    startWhenReady,
  ]);

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

    if (sequencerState.isPlaying) {
      stop();
    }

    // Clear position ref to ensure first tick detection works
    lastSequencerPositionRef.current = null;

    startWhenReady(() => {
      setIsLinePlaying(true);
      startPatternLoop(clampedIndex, 0);
    });
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
    setIsLinePlaying,
    startWhenReady,
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

    startWhenReady(() => {
      setPosition(clampedIndex, 0, 0);
      startSong();
    });
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
    startWhenReady,
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

      patternReturnPositionRef.current = {
        pattern: clampedIndex,
        line: effectiveLine,
      };

      if (sequencerState.isPlaying) {
        stop();
      }

      // Clear position ref to ensure first tick detection works
      lastSequencerPositionRef.current = null;

      const startLine = Math.max(
        0,
        Math.min(effectiveLine, (currentSong.length || PATTERN_LENGTH) - 1),
      );
      startWhenReady(() => {
        setIsLinePlaying(true);
        startPatternLoop(clampedIndex, startLine);
      });
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
      setIsLinePlaying,
      startWhenReady,
    ],
  );

  const handleToggleLineFromCursor = useCallback(
    (lineIndex: number) => {
      if (sequencerState.isPlaying) {
        handleStopLinePlayback();
        return;
      }

      handleStartLineFromCurrentLine(lineIndex);
    },
    [sequencerState.isPlaying, handleStopLinePlayback, handleStartLineFromCurrentLine],
  );

  // Ctrl+Enter in a track: play the line from its first row like the PLAY LINE
  // menu command, remembering the cursor position so Enter restores it on stop.
  const handleToggleLineFromStart = useCallback(
    (lineIndex: number) => {
      if (sequencerState.isPlaying) {
        handleStopLinePlayback();
        return;
      }

      const playlistLength = currentSong.line.length;
      if (playlistLength === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));

      patternReturnPositionRef.current = { pattern: clampedIndex, line: lineIndex };

      handleStartLinePlayback();
    },
    [
      sequencerState.isPlaying,
      sequencerState.currentPattern,
      currentSong.line.length,
      handleStopLinePlayback,
      handleStartLinePlayback,
    ],
  );

  // Shift+Enter in a track or the piano: play the song from the cursor row at
  // the current playlist position, remembering the position so any stop
  // restores it. Pressed while playback runs, it stops with restore.
  const handleToggleSongFromCursor = useCallback(
    (lineIndex: number) => {
      if (sequencerState.isPlaying) {
        handleStop();
        return;
      }

      const playlistLength = currentSong.line.length;
      if (playlistLength === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
      const startLine = Math.max(
        0,
        Math.min(lineIndex, (currentSong.length || PATTERN_LENGTH) - 1),
      );

      patternReturnPositionRef.current = { pattern: clampedIndex, line: lineIndex };

      if (isLinePlaying) {
        setIsLinePlaying(false);
      }

      // Clear position ref to ensure first tick detection works
      lastSequencerPositionRef.current = null;

      startWhenReady(() => startSong(clampedIndex, startLine));
    },
    [
      sequencerState.isPlaying,
      sequencerState.currentPattern,
      isLinePlaying,
      currentSong.line.length,
      currentSong.length,
      handleStop,
      startSong,
      setIsLinePlaying,
      startWhenReady,
    ],
  );

  // Ctrl+Shift+Enter in a track or the piano: play the song from its first row
  // at the current playlist position, remembering the cursor so any stop
  // restores it. Pressed while playback runs, it stops with restore.
  const handleToggleSongFromStart = useCallback(
    (lineIndex: number) => {
      if (sequencerState.isPlaying) {
        handleStop();
        return;
      }

      const playlistLength = currentSong.line.length;
      if (playlistLength === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));

      patternReturnPositionRef.current = { pattern: clampedIndex, line: lineIndex };

      if (isLinePlaying) {
        setIsLinePlaying(false);
      }

      // Clear position ref to ensure first tick detection works
      lastSequencerPositionRef.current = null;

      startWhenReady(() => startSong(clampedIndex, 0));
    },
    [
      sequencerState.isPlaying,
      sequencerState.currentPattern,
      isLinePlaying,
      currentSong.line.length,
      handleStop,
      startSong,
      setIsLinePlaying,
      startWhenReady,
    ],
  );

  // Safety guard: ensure sequencer position always stays within playlist bounds
  // and force a clean stop if playback runs past the end for any reason.
  useEffect(() => {
    const playlistLength = currentSong.line.length;

    if (!sequencerState.isPlaying) {
      return;
    }

    if (playlistLength === 0) {
      playbackGenerationRef.current += 1;
      handleStopPlayback();
      stop();
      return;
    }

    if (sequencerState.currentPattern < 0 || sequencerState.currentPattern >= playlistLength) {
      const rawLoop = currentSong.loop;
      const hasLoop = typeof rawLoop === 'number' && Number.isFinite(rawLoop);

      if (!hasLoop) {
        playbackGenerationRef.current += 1;
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
    handleToggleSongFromCursor,
    handleToggleSongFromStart,
  };
}
