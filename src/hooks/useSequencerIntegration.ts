import { useCallback, useEffect } from 'react';
import type { SequencerState } from './useSequencer';
import type { Instrument, Note, Pattern, Song } from '../synth/SoundDriver';
import type { NavigationSection } from '../constants/navigation';
import { PATTERN_LENGTH } from '../constants/music';
import type { YM2149 } from '../synth/YM2149';

export function useSequencerIntegration(args: {
  currentSong: Song;
  sequencerState: SequencerState;
  patternsById: Map<string, Pattern>;
  instrumentsById: Map<string, Instrument>;
  channelMutes: boolean[];
  isDebugMode: boolean;

  sharedCurrentLine: number;
  setSharedCurrentLine: (line: number) => void;

  isLinePlaying: boolean;
  setIsLinePlaying: (value: boolean) => void;

  activeSection: NavigationSection;
  lastTrackId: 'A' | 'B' | 'C';

  stop: () => void;
  setCallback: (callback: (state: SequencerState) => void) => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  startPatternLoop: (initialPattern?: number, initialLine?: number) => void;
  startSong: (initialPattern?: number, initialLine?: number) => void;
  setPatternLoopMode: (patternLoop: boolean) => void;

  ym2149Ref: React.MutableRefObject<YM2149 | null>;
  midiHelpersRef: React.MutableRefObject<{
    sendInstrumentMidiNoteOn: (
      ymChannel: number,
      instrument: Instrument | undefined,
      note: string,
      octave: number,
      volumeFromStep?: number | null
    ) => void;
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>;

  linePlayingRef: React.MutableRefObject<boolean>;
  lastUiRowRef: React.MutableRefObject<{ pattern: number; line: number } | null>;
  wasPlayingRef: React.MutableRefObject<boolean>;
  lastSequencerPositionRef: React.MutableRefObject<{ pattern: number; line: number } | null>;

  channelSubTickRef: React.MutableRefObject<number[]>;
  channelEnvelopeStepRef: React.MutableRefObject<number[]>;
  lastNotesRef: React.MutableRefObject<Array<Note | null>>;
  channelVolumeModifierRef: React.MutableRefObject<number[]>;
  channelSustainRef: React.MutableRefObject<Array<number | null>>;
  channelReleasedRef: React.MutableRefObject<boolean[]>;

  debugTickCounterRef: React.MutableRefObject<number>;
  debugLastRowRef: React.MutableRefObject<{ pattern: number; line: number } | null>;
  debugLastTimeRef: React.MutableRefObject<number | null>;

  patternReturnPositionRef: React.MutableRefObject<{ pattern: number; line: number } | null>;
  playInstTimerRef: React.MutableRefObject<number | null>;

  currentInstrument: Instrument;
  normalizeInstrumentId: (value?: string | number | null) => string;
  instrumentLookupByNormalizedId: Map<string, Instrument>;
}): {
  handleStopPlayback: () => void;
  handleStop: () => void;
  handleStopLinePlayback: () => void;
  handleStartSong: () => void;
  handleStartLinePlayback: () => void;
  handleStartLineFromBeginning: () => void;
  handleStartLineFromCurrentLine: (overrideLine?: number) => void;
  handleToggleLineFromCursor: (lineIndex: number) => void;
} {
  const {
    currentSong,
    sequencerState,
    patternsById,
    instrumentsById,
    channelMutes,
    isDebugMode,
    sharedCurrentLine,
    setSharedCurrentLine,
    isLinePlaying,
    setIsLinePlaying,
    activeSection,
    lastTrackId,
    stop,
    setCallback,
    setPosition,
    startPatternLoop,
    startSong,
    setPatternLoopMode,
    ym2149Ref,
    midiHelpersRef,
    linePlayingRef,
    lastUiRowRef,
    wasPlayingRef,
    lastSequencerPositionRef,
    channelSubTickRef,
    channelEnvelopeStepRef,
    lastNotesRef,
    channelVolumeModifierRef,
    channelSustainRef,
    channelReleasedRef,
    debugTickCounterRef,
    debugLastRowRef,
    debugLastTimeRef,
    patternReturnPositionRef,
    playInstTimerRef,
    currentInstrument,
    normalizeInstrumentId,
    instrumentLookupByNormalizedId,
  } = args;

  const updateChannelWithInstrument = useCallback(
    (
      ym2149: YM2149,
      channel: number,
      noteData: Note | null,
      envelopeStep: number = 0,
      volumeModifier?: number | null
    ): void => {
      const normalizedNoteInstrumentId = noteData ? normalizeInstrumentId(noteData.instrument) : '';

      let resolvedInstrumentId = normalizedNoteInstrumentId;
      if (!resolvedInstrumentId) {
        const fallbackSourceId = currentInstrument?.id ?? currentSong.instruments[0]?.id;
        resolvedInstrumentId = normalizeInstrumentId(fallbackSourceId);
      }

      const instrument = resolvedInstrumentId
        ? instrumentLookupByNormalizedId.get(resolvedInstrumentId)
        : undefined;

      if (!instrument || !noteData || noteData.note === '===') {
        const volumeRegister = 8 + channel;
        ym2149.writeRegister(volumeRegister, 0x00);
        return;
      }

      ym2149.updateChannelWithInstrument(
        channel,
        instrument,
        { note: noteData.note, octave: noteData.octave },
        envelopeStep,
        volumeModifier
      );
    },
    [currentInstrument, currentSong.instruments, instrumentLookupByNormalizedId, normalizeInstrumentId]
  );

  const handleStopPlayback = useCallback(() => {
    channelSubTickRef.current = [0, 0, 0];
    channelEnvelopeStepRef.current = [0, 0, 0];
    lastNotesRef.current = [null, null, null];
    lastSequencerPositionRef.current = null;
    channelVolumeModifierRef.current = [0x0f, 0x0f, 0x0f];
    channelSustainRef.current = [null, null, null];
    channelReleasedRef.current = [false, false, false];
    debugTickCounterRef.current = 0;
    debugLastRowRef.current = null;
    debugLastTimeRef.current = null;

    const helpers = midiHelpersRef.current;
    if (helpers) {
      for (let ch = 0; ch < 3; ch += 1) {
        helpers.sendInstrumentMidiNoteOffForChannel(ch);
      }
    }

    if (ym2149Ref.current) {
      ym2149Ref.current.silenceAll();
    }
  }, [
    channelSubTickRef,
    channelEnvelopeStepRef,
    lastNotesRef,
    lastSequencerPositionRef,
    channelVolumeModifierRef,
    channelSustainRef,
    channelReleasedRef,
    debugTickCounterRef,
    debugLastRowRef,
    debugLastTimeRef,
    midiHelpersRef,
    ym2149Ref,
  ]);

  const sequencerCallback = useCallback(
    (state: SequencerState) => {
      const lastUiRow = lastUiRowRef.current;
      if (!lastUiRow || lastUiRow.pattern !== state.currentPattern || lastUiRow.line !== state.currentLine) {
        lastUiRowRef.current = {
          pattern: state.currentPattern,
          line: state.currentLine,
        };
        setSharedCurrentLine(state.currentLine);
      }

      const nextIsLinePlaying = state.isPatternLoop && state.isPlaying;
      if (linePlayingRef.current !== nextIsLinePlaying) {
        linePlayingRef.current = nextIsLinePlaying;
        setIsLinePlaying(nextIsLinePlaying);
      }

      if (!ym2149Ref.current) {
        return;
      }

      const ym2149 = ym2149Ref.current;
      const wasPlaying = wasPlayingRef.current;

      if (!state.isPlaying) {
        if (wasPlaying) {
          handleStopPlayback();
        }
        wasPlayingRef.current = false;
        lastSequencerPositionRef.current = null;
        return;
      }

      wasPlayingRef.current = true;

      debugTickCounterRef.current = (debugTickCounterRef.current + 1) >>> 0;

      const lastPos = lastSequencerPositionRef.current;
      const wrappedOrJumped = lastPos && state.currentPattern !== lastPos.pattern;
      const isFirstTick = !lastPos;

      lastSequencerPositionRef.current = {
        pattern: state.currentPattern,
        line: state.currentLine,
      };

      if (wrappedOrJumped || isFirstTick) {
        if (wrappedOrJumped && lastPos) {
          const now = performance.now();
          console.log(
            `[DEBUG] Pattern wrap detected: ${lastPos.pattern} -> ${state.currentPattern} at ${now.toFixed(
              2
            )}ms, line ${state.currentLine}, tick ${state.currentTick}`
          );
        }

        channelSubTickRef.current = [0, 0, 0];

        if (isFirstTick) {
          channelEnvelopeStepRef.current = [0, 0, 0];
          lastNotesRef.current = [null, null, null];
          channelSustainRef.current = [null, null, null];
          channelReleasedRef.current = [false, false, false];
          channelVolumeModifierRef.current = [0x0f, 0x0f, 0x0f];
          debugTickCounterRef.current = 0;
          debugLastRowRef.current = null;
        }
      }

      const playlistLength = currentSong.playlist.length;

      if (playlistLength === 0) {
        stop();
        handleStopPlayback();
        return;
      }

      const effectivePatternIndex = state.currentPattern;

      if (effectivePatternIndex < 0 || effectivePatternIndex >= playlistLength) {
        const rawLoop = currentSong.loop;
        const hasLoop = typeof rawLoop === 'number' && Number.isFinite(rawLoop);

        if (!hasLoop) {
          handleStopPlayback();
          setPosition(0, 0, 0);
          stop();
          return;
        }
      }

      const currentPlaylistEntry = currentSong.playlist[effectivePatternIndex];

      if (!currentPlaylistEntry) {
        return;
      }

      const patternA = currentPlaylistEntry.trackA ? patternsById.get(currentPlaylistEntry.trackA) : undefined;
      const patternB = currentPlaylistEntry.trackB ? patternsById.get(currentPlaylistEntry.trackB) : undefined;
      const patternC = currentPlaylistEntry.trackC ? patternsById.get(currentPlaylistEntry.trackC) : undefined;

      const lineA = patternA?.lines[state.currentLine];
      const lineB = patternB?.lines[state.currentLine];
      const lineC = patternC?.lines[state.currentLine];

      const noteA = lineA?.trackA || null;
      const noteB = patternB ? lineB?.trackA || null : null;
      const noteC = patternC ? lineC?.trackA || null : null;

      const notes = [noteA, noteB, noteC];
      const patterns = [patternA, patternB, patternC];
      const volumes = [lineA?.volume, patternB ? lineB?.volume : undefined, patternC ? lineC?.volume : undefined];
      const lastNotes = lastNotesRef.current;

      const lastLogged = debugLastRowRef.current;
      const shouldLogRow =
        isDebugMode &&
        state.isPlaying &&
        (!lastLogged || lastLogged.pattern !== effectivePatternIndex || lastLogged.line !== state.currentLine);

      if (shouldLogRow) {
        try {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          const ms = String(now.getMilliseconds()).padStart(3, '0');
          const timeStr = `${hh}:${mm}:${ss}.${ms}`;

          const nowMs = now.getTime();
          const lastMs = debugLastTimeRef.current;
          const rawDelta = lastMs != null ? nowMs - lastMs : 0;
          const clampedDelta = Math.max(0, Math.min(999, rawDelta | 0));
          const deltaStr = String(clampedDelta).padStart(3, '0');

          const tickCount = debugTickCounterRef.current;
          const cycle = (Math.floor(tickCount / 2) & 0xffff) >>> 0;
          const cycleHex = cycle.toString(16).toUpperCase().padStart(4, '0');
          const stepHex = state.currentLine.toString(16).toUpperCase().padStart(2, '0');

          const channelStrings = [0, 1, 2].map((ch) => {
            const noteOnRow = notes[ch];
            const volumeOnRow = volumes[ch];

            let volText: string;
            if (volumeOnRow === undefined || volumeOnRow === null) {
              volText = '-';
            } else {
              const clampedVol = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              volText = clampedVol.toString(16).toUpperCase();
            }

            if (!noteOnRow) {
              return `--- -- ${volText}`;
            }

            if (noteOnRow.note === '===') {
              return `=== -- ${volText}`;
            }

            const baseNote = noteOnRow.note || '';
            const formattedNote = baseNote.includes('#') ? baseNote : `${baseNote}-`;
            const noteText = `${formattedNote}${noteOnRow.octave}`;
            const rawInst = noteOnRow.instrument as unknown;
            let instText = '';

            if (typeof rawInst === 'number' && Number.isFinite(rawInst)) {
              instText = rawInst.toString(16).padStart(2, '0').toUpperCase();
            } else if (typeof rawInst === 'string') {
              const trimmed = rawInst.trim();
              if (trimmed) {
                const sanitized = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
                const upper = sanitized.toUpperCase();
                if (/^[0-9A-F]{1,2}$/.test(upper)) {
                  instText = upper.padStart(2, '0');
                } else {
                  instText = upper;
                }
              }
            }

            const safeInst = instText && instText.trim().length > 0 ? instText : '--';
            return `${noteText} ${safeInst} ${volText}`;
          });

          const debugLine = `${timeStr} | ${deltaStr} | ${cycleHex} | ${stepHex} | ${channelStrings[0]} | ${channelStrings[1]} | ${channelStrings[2]} |`;
          setTimeout(() => console.log(debugLine), 0);
          debugLastRowRef.current = {
            pattern: effectivePatternIndex,
            line: state.currentLine,
          };
          debugLastTimeRef.current = nowMs;
        } catch (error) {
          console.error('Debug logging failed:', error);
        }
      }

      for (let ch = 0; ch < 3; ch++) {
        if (channelMutes[ch]) {
          const volumeRegister = 8 + ch;
          ym2149.writeRegister(volumeRegister, 0x00);
          continue;
        }

        const pattern = patterns[ch];
        const noteOnRow = notes[ch];
        const volumeOnRow = volumes[ch];
        const last = lastNotes[ch];

        if (!pattern) {
          // sustain/no-op
        }

        if (state.currentTick === 0 && noteOnRow && noteOnRow.note === '===') {
          const helpers = midiHelpersRef.current;
          if (helpers) {
            helpers.sendInstrumentMidiNoteOffForChannel(ch);
          }

          const sustainIndex = channelSustainRef.current[ch];

          if (sustainIndex === null || sustainIndex === undefined || sustainIndex < 0 || !last) {
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;
            updateChannelWithInstrument(ym2149, ch, null, 0);
            lastNotes[ch] = null;
            channelSustainRef.current[ch] = null;
            channelReleasedRef.current[ch] = false;
            continue;
          }

          channelReleasedRef.current[ch] = true;
        }

        if (isFirstTick && !noteOnRow) {
          channelEnvelopeStepRef.current[ch] = 0;
          channelSubTickRef.current[ch] = 0;
          updateChannelWithInstrument(ym2149, ch, null, 0);
          lastNotes[ch] = null;
          channelSustainRef.current[ch] = null;
          channelReleasedRef.current[ch] = false;
          continue;
        }

        let activeNote: Note | null = last;
        const hasExplicitNote = !!(noteOnRow && noteOnRow.note && noteOnRow.note !== '===');

        if (volumeOnRow !== undefined && volumeOnRow !== null) {
          const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
          channelVolumeModifierRef.current[ch] = clamped;
        }

        if (hasExplicitNote) {
          activeNote = noteOnRow;

          if (state.currentTick === 0) {
            channelEnvelopeStepRef.current[ch] = 0;
            channelSubTickRef.current[ch] = 0;

            const instId = activeNote && typeof activeNote.instrument === 'string' ? activeNote.instrument : '';
            const instrument = instrumentsById.get(instId);
            const rawSustain = instrument?.sustain ?? null;
            if (typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0) {
              channelSustainRef.current[ch] = Math.floor(rawSustain);
            } else {
              channelSustainRef.current[ch] = null;
            }
            channelReleasedRef.current[ch] = false;

            let volumeForMidi: number | null = null;
            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              volumeForMidi = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
            }

            if (instrument && activeNote && activeNote.note && activeNote.note !== '===') {
              const helpers = midiHelpersRef.current;
              if (helpers) {
                helpers.sendInstrumentMidiNoteOn(
                  ch,
                  instrument,
                  activeNote.note,
                  activeNote.octave,
                  volumeForMidi
                );
              }
            }
          }
        }

        if (activeNote && activeNote.note && activeNote.note !== '===') {
          const rawStep = channelEnvelopeStepRef.current[ch];
          const sustainIndex = channelSustainRef.current[ch];
          const isReleased = channelReleasedRef.current[ch];

          let step = rawStep;
          const hasSustain = sustainIndex !== null && sustainIndex !== undefined && sustainIndex >= 0;

          if (hasSustain) {
            if (!isReleased && rawStep >= sustainIndex) {
              step = sustainIndex;
            } else if (isReleased && rawStep <= sustainIndex) {
              step = sustainIndex + 1;
            }
          }
          const volumeModifier = channelVolumeModifierRef.current[ch];

          updateChannelWithInstrument(ym2149, ch, activeNote, step, volumeModifier);

          const sub = (channelSubTickRef.current[ch] + 1) % 2;
          channelSubTickRef.current[ch] = sub;
          if (sub === 0) {
            if (
              sustainIndex === null ||
              sustainIndex === undefined ||
              sustainIndex < 0 ||
              isReleased ||
              rawStep < sustainIndex
            ) {
              channelEnvelopeStepRef.current[ch] = rawStep + 1;
            }
          }
          lastNotes[ch] = activeNote;
        } else {
          channelEnvelopeStepRef.current[ch] = 0;
          channelSubTickRef.current[ch] = 0;
          lastNotes[ch] = null;
          channelSustainRef.current[ch] = null;
          channelReleasedRef.current[ch] = false;
        }
      }
    },
    [
      lastUiRowRef,
      setSharedCurrentLine,
      linePlayingRef,
      setIsLinePlaying,
      ym2149Ref,
      wasPlayingRef,
      lastSequencerPositionRef,
      debugTickCounterRef,
      currentSong.playlist,
      currentSong.loop,
      stop,
      handleStopPlayback,
      setPosition,
      patternsById,
      lastNotesRef,
      debugLastRowRef,
      isDebugMode,
      debugLastTimeRef,
      channelMutes,
      channelSustainRef,
      channelEnvelopeStepRef,
      channelSubTickRef,
      channelReleasedRef,
      channelVolumeModifierRef,
      updateChannelWithInstrument,
      midiHelpersRef,
      instrumentsById,
    ]
  );

  useEffect(() => {
    setCallback(sequencerCallback);
  }, [setCallback, sequencerCallback]);

  const handleStop = useCallback(() => {
    stop();
    setIsLinePlaying(false);

    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    handleStopPlayback();
  }, [handleStopPlayback, playInstTimerRef, setIsLinePlaying, stop]);

  const handleStopLinePlayback = useCallback(() => {
    stop();

    setIsLinePlaying(false);

    if (playInstTimerRef.current !== null) {
      window.clearInterval(playInstTimerRef.current);
      playInstTimerRef.current = null;
    }

    handleStopPlayback();
    const returnPos = patternReturnPositionRef.current;
    if (returnPos) {
      setPosition(returnPos.pattern, returnPos.line, 0);
      setSharedCurrentLine(returnPos.line);
      patternReturnPositionRef.current = null;
    }
  }, [handleStopPlayback, patternReturnPositionRef, playInstTimerRef, setIsLinePlaying, setPosition, setSharedCurrentLine, stop]);

  const handleStartSong = useCallback(() => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1));

    if (isLinePlaying && sequencerState.isPlaying) {
      setIsLinePlaying(false);
      patternReturnPositionRef.current = null;

      setPatternLoopMode(false);
      return;
    }

    patternReturnPositionRef.current = {
      pattern: clampedIndex,
      line: sharedCurrentLine,
    };

    lastSequencerPositionRef.current = null;

    startSong(clampedIndex, 0);
  }, [
    currentSong.playlist,
    isLinePlaying,
    lastSequencerPositionRef,
    sequencerState.currentPattern,
    sequencerState.isPlaying,
    setIsLinePlaying,
    setPatternLoopMode,
    sharedCurrentLine,
    startSong,
    patternReturnPositionRef,
  ]);

  const handleStartLinePlayback = useCallback(() => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1));
    const currentEntry = currentSong.playlist[clampedIndex];

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
        patternId = currentEntry.trackA;
        break;
      case 'B':
        patternId = currentEntry.trackB;
        break;
      case 'C':
        patternId = currentEntry.trackC;
        break;
    }

    if (patternId === '--') {
      return;
    }

    if (sequencerState.isPlaying && !isLinePlaying) {
      const effectiveLine = Math.max(
        0,
        Math.min(sequencerState.currentLine, (currentSong.patternLength || PATTERN_LENGTH) - 1)
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

    lastSequencerPositionRef.current = null;

    setIsLinePlaying(true);

    startPatternLoop(clampedIndex, 0);
  }, [
    activeSection,
    currentSong.patternLength,
    currentSong.playlist,
    isLinePlaying,
    lastSequencerPositionRef,
    lastTrackId,
    patternReturnPositionRef,
    sequencerState.currentLine,
    sequencerState.currentPattern,
    sequencerState.isPlaying,
    setIsLinePlaying,
    setPatternLoopMode,
    startPatternLoop,
    stop,
  ]);

  const handleStartLineFromBeginning = useCallback(() => {
    if (currentSong.playlist.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, currentSong.playlist.length - 1));
    const currentEntry = currentSong.playlist[clampedIndex];

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
        patternId = currentEntry.trackA;
        break;
      case 'B':
        patternId = currentEntry.trackB;
        break;
      case 'C':
        patternId = currentEntry.trackC;
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

    setPosition(clampedIndex, 0, 0);

    startSong();
  }, [
    activeSection,
    currentSong.playlist,
    isLinePlaying,
    lastTrackId,
    sequencerState.currentPattern,
    sequencerState.isPlaying,
    setIsLinePlaying,
    setPosition,
    startSong,
    stop,
  ]);

  const handleStartLineFromCurrentLine = useCallback(
    (overrideLine?: number) => {
      if (currentSong.playlist.length === 0) {
        return;
      }

      const playlistLength = currentSong.playlist.length;
      const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));
      const currentEntry = currentSong.playlist[clampedIndex];

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
          patternId = currentEntry.trackA;
          break;
        case 'B':
          patternId = currentEntry.trackB;
          break;
        case 'C':
          patternId = currentEntry.trackC;
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

      lastSequencerPositionRef.current = null;

      setIsLinePlaying(true);

      const startLine = Math.max(0, Math.min(effectiveLine, (currentSong.patternLength || PATTERN_LENGTH) - 1));
      startPatternLoop(clampedIndex, startLine);
    },
    [
      activeSection,
      currentSong.patternLength,
      currentSong.playlist,
      lastSequencerPositionRef,
      lastTrackId,
      patternReturnPositionRef,
      sequencerState.currentPattern,
      sequencerState.isPlaying,
      setIsLinePlaying,
      sharedCurrentLine,
      startPatternLoop,
      stop,
    ]
  );

  const handleToggleLineFromCursor = useCallback(
    (lineIndex: number) => {
      if (isLinePlaying && sequencerState.isPlaying) {
        handleStopLinePlayback();
        return;
      }

      handleStartLineFromCurrentLine(lineIndex);
    },
    [handleStartLineFromCurrentLine, handleStopLinePlayback, isLinePlaying, sequencerState.isPlaying]
  );

  useEffect(() => {
    const playlistLength = currentSong.playlist.length;

    if (!sequencerState.isPlaying) {
      return;
    }

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
    currentSong.loop,
    currentSong.playlist.length,
    handleStopPlayback,
    sequencerState.currentPattern,
    sequencerState.isPlaying,
    setPosition,
    stop,
  ]);

  return {
    handleStopPlayback,
    handleStop,
    handleStopLinePlayback,
    handleStartSong,
    handleStartLinePlayback,
    handleStartLineFromBeginning,
    handleStartLineFromCurrentLine,
    handleToggleLineFromCursor,
  };
}
