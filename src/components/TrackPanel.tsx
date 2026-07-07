/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { KEYBOARD_TO_NOTE } from '../constants/music';
import type { Pattern, Note, Instrument, Step } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';
import { DEFAULT_SONG_FRAME } from '../constants/song';
import { TrackLine } from './TrackLine';
import { computeEffectiveVolume } from '../utils/trackUtils';
import { clearIntervalRef } from '../utils/timerUtils';
import {
  buildInstrumentColorMap,
  formatTrackNoteDisplay,
  getInstrumentColorForNote,
  getTrackLineClass,
  getTrackNotes as getTrackNotesForPattern,
} from '../utils/trackRendering';
import { stepInstrumentId } from '../utils/instrumentSelection';
import {
  createNoteOff,
  getKeyboardMappedNote,
  getNextTrackSection,
  getPreviousTrackSection,
  isNavigationKey,
  parseVolumeNibble,
  stepLineIndex,
  updatePatternStep,
} from '../utils/trackPanelUtils';
import {
  advancePreviewEnvelopeTick,
  getPreviewEnvelopeApplyStep,
} from '../utils/previewEnvelopeTiming';

type PreviewInstrument = Instrument;

interface TrackPanelProps {
  trackId: 'A' | 'B' | 'C';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  currentLine: number;
  patternLength: number;
  onLineChange: (lineIndex: number) => void;
  pattern: Pattern | null;
  onPatternChange: (pattern: Pattern) => void;
  ym2149: YM2149 | null;
  currentInstrumentData: Instrument;
  instruments: Instrument[];
  trackBackgroundEnabled: boolean;
  isTargetTrack: boolean;
  onToggleLineFromCursor: (lineIndex: number) => void;
  currentColumn: 'note' | 'volume';
  setCurrentColumn: (column: 'note' | 'volume') => void;
  focusRevision: number;
  onPreviewMidiNoteOn?: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
  onRegisterStopPreview?: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
  tickIntervalMs?: number;
}

export const TrackPanel: React.FC<TrackPanelProps> = (props) => {
  const {
    trackId,
    activeSection,
    setActiveSection,
    currentOctave,
    currentLine,
    patternLength,
    onLineChange,
    pattern,
    onPatternChange,
    ym2149,
    currentInstrumentData,
    instruments,
    trackBackgroundEnabled,
    isTargetTrack,
    onToggleLineFromCursor,
    currentColumn,
    setCurrentColumn,
    focusRevision,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview,
    onRegisterStopPreview,
    tickIntervalMs = 1000 / DEFAULT_SONG_FRAME
  } = props;

  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentInstrumentData?.id) {
      setCurrentInstrument(currentInstrumentData.id);
    }
  }, [currentInstrumentData.id]);

  // Envelope timing state for preview notes (monophonic per track, piano-like)
  const envelopeTimerRef = useRef<number | null>(null);
  const previewSubTickRef = useRef<number>(0);
  const previewEnvelopeStepRef = useRef<number>(0);
  const previewLastTickTimeRef = useRef<number | null>(null);
  const previewNextTickTimeRef = useRef<number | null>(null);
  const previewSustainIndexRef = useRef<number | null>(null);
  const previewReleasedRef = useRef<boolean>(false);
  const activePreviewKeyRef = useRef<string | null>(null);
  const pressedNoteKeysRef = useRef<Set<string>>(new Set());

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  const instrumentColorMap = useMemo(() => {
    return buildInstrumentColorMap(instruments);
  }, [instruments]);

  const effectiveVolume = useMemo(
    () => computeEffectiveVolume(pattern, currentLine),
    [pattern, currentLine]
  );

  // Hard stop of any current preview on this track/channel
  const stopPreview = useCallback(() => {
    // Map track to channel
    const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;

    clearIntervalRef(envelopeTimerRef);

    previewSubTickRef.current = 0;
    previewEnvelopeStepRef.current = 0;
    previewLastTickTimeRef.current = null;
    previewNextTickTimeRef.current = null;
    previewSustainIndexRef.current = null;
    previewReleasedRef.current = false;
    activePreviewKeyRef.current = null;

    // Clear any tracked pressed note keys when performing a hard stop so that
    // stale state from a lost keyup (e.g. focus change while a key is held)
    // cannot block future previews for the same key.
    if (pressedNoteKeysRef.current.size > 0) {
      pressedNoteKeysRef.current.clear();
    }

    if (onHardStopLivePreview) {
      onHardStopLivePreview(channel);
    }

    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(channel);
    }

    if (!ym2149) {
      return;
    }

    const volumeRegister = 0x08 + channel;
    ym2149.writeRegister(volumeRegister, 0x00);
  }, [trackId, ym2149, onPreviewMidiNoteOff]);

  useEffect(() => {
    if (onRegisterStopPreview) {
      onRegisterStopPreview(trackId, stopPreview);
    }
  }, [onRegisterStopPreview, trackId, stopPreview]);

  // Play preview note when entering notes (piano-like: hold key to sustain, stop on release)
  const playPreviewNote = useCallback(
    (note: string, octave: number) => {
      if (!ym2149) return;

      // Map track to channel
      const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
      const instrument: PreviewInstrument = currentInstrumentData as unknown as PreviewInstrument;
      const noteData = { note, octave };

      // Monophonic per track: stop any existing preview first
      stopPreview();

      const keyId = `${note}${octave}`;
      activePreviewKeyRef.current = keyId;

      // Initialize sustain state for this preview note
      const rawSustain =
        instrument && typeof instrument.sustain === 'number'
          ? instrument.sustain
          : null;
      const sustainIndex =
        typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0
          ? Math.floor(rawSustain)
          : null;

      previewSustainIndexRef.current = sustainIndex;
      previewReleasedRef.current = false;

      // Initialize envelope timing
      const now = performance.now();
      previewSubTickRef.current = 0;
      previewEnvelopeStepRef.current = 0;
      previewLastTickTimeRef.current = now;
      previewNextTickTimeRef.current = now + 20;

      // Apply initial state (step 0) with default volume modifier (0xF = no attenuation)
      ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

      if (onPreviewMidiNoteOn) {
        onPreviewMidiNoteOn(channel, currentInstrumentData, note, octave);
      }

      // Precompute volume envelope tail information so we know when to auto-stop
      const volumeEnv: number[] =
        Array.isArray(instrument.volume) && instrument.volume.length > 0
          ? instrument.volume
          : [0x0f];
      const lastVolumeIndex = volumeEnv.length - 1;
      const lastVolumeValue = volumeEnv[lastVolumeIndex] ?? 0;
      const volumeRegister = 0x08 + channel;

      // Start envelope timer - base tick interval from song frame rate, advance envelope step every 2 ticks
      envelopeTimerRef.current = window.setInterval(() => {
        const sustain = previewSustainIndexRef.current;
        const released = previewReleasedRef.current;

        const TICK_INTERVAL_MS = tickIntervalMs;
        const nowTick = performance.now();

        const advanced = advancePreviewEnvelopeTick({
          now: nowTick,
          nextTickTime: previewNextTickTimeRef.current,
          subTick: previewSubTickRef.current,
          rawStep: previewEnvelopeStepRef.current,
          sustainIndex: sustain,
          released,
          tickIntervalMs: TICK_INTERVAL_MS,
        });

        previewSubTickRef.current = advanced.subTick;
        previewEnvelopeStepRef.current = advanced.rawStep;
        previewLastTickTimeRef.current = nowTick;
        previewNextTickTimeRef.current = advanced.nextTickTime;

        const effectiveRawStep = advanced.rawStep;
        const stepForApply = getPreviewEnvelopeApplyStep(effectiveRawStep, sustain, released);

        ym2149.updateChannelWithInstrument(channel, instrument, noteData, stepForApply, 0x0f);

        // If this note has been released and the envelope has reached the end
        // of the volume envelope with a final value of 0, automatically stop
        // the preview to avoid leaving runaway timers.
        if (
          released &&
          lastVolumeIndex >= 0 &&
          effectiveRawStep >= lastVolumeIndex &&
          lastVolumeValue <= 0
        ) {
          clearIntervalRef(envelopeTimerRef);

          previewSubTickRef.current = 0;
          previewEnvelopeStepRef.current = 0;
          previewSustainIndexRef.current = null;
          previewReleasedRef.current = false;
          previewLastTickTimeRef.current = null;
          previewNextTickTimeRef.current = null;
          activePreviewKeyRef.current = null;

          ym2149.writeRegister(volumeRegister, 0x00);
          if (onPreviewMidiNoteOff) {
            onPreviewMidiNoteOff(channel);
          }
        }
      }, tickIntervalMs);
    }, [ym2149, trackId, currentInstrumentData, tickIntervalMs, onPreviewMidiNoteOn, onPreviewMidiNoteOff, stopPreview]);

  // Get notes for this track from the pattern
  const computeTrackNotes = useCallback(() => {
    return getTrackNotesForPattern(pattern, patternLength);
  }, [pattern, patternLength]);

  const trackNotes = computeTrackNotes();

  useEffect(() => {
    if (isActive && trackRef.current) {
      trackRef.current.focus();
    }
  }, [isActive, focusRevision]);

  // Ensure any preview is stopped when this track loses focus or unmounts
  useEffect(() => {
    if (!isActive) {
      stopPreview();
    }

    return () => {
      stopPreview();
    };
  }, [isActive]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();

    const isNavKey = isNavigationKey(key);

    if (event.repeat && !isNavKey) {
      event.preventDefault();
      return;
    }

    // Navigation
    if (key === 'ARROWUP') {
      event.preventDefault();
      onLineChange(stepLineIndex(currentLine, patternLength, -1));
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      onLineChange(stepLineIndex(currentLine, patternLength, 1));
    } else if (key === 'PAGEUP') {
      event.preventDefault();
      const step = 16;
      onLineChange(stepLineIndex(currentLine, patternLength, -step));
    } else if (key === 'PAGEDOWN') {
      event.preventDefault();
      const step = 16;
      onLineChange(stepLineIndex(currentLine, patternLength, step));
    } else if (key === 'HOME') {
      event.preventDefault();
      onLineChange(0);
    } else if (key === 'END') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      onLineChange(length - 1);
    } else if (key === 'ARROWLEFT') {
      event.preventDefault();
      if (currentColumn === 'volume') {
        // Move from volume to note within the same track
        setCurrentColumn('note');
      } else {
        // Move to previous track and select its volume column
        const targetTrack: NavigationSection = getPreviousTrackSection(trackId);
        setActiveSection(targetTrack);
        setCurrentColumn('volume');
      }
    } else if (key === 'ARROWRIGHT') {
      event.preventDefault();
      if (currentColumn === 'note') {
        // Move from note to volume within the same track
        setCurrentColumn('volume');
      } else {
        // Move to next track and select its note column
        const targetTrack: NavigationSection = getNextTrackSection(trackId);
        setActiveSection(targetTrack);
        setCurrentColumn('note');
      }
    } else if (key === 'ENTER') {
      event.preventDefault();
      onToggleLineFromCursor(currentLine);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (!pattern) return;

      const newPattern = updatePatternStep(pattern, currentLine, (step) => {
        if (currentColumn === 'volume') {
          // Clear only the per-line volume modifier
          return { ...step, volume: undefined };
        }

        // Clear the note (and implicitly any volume) for shared pattern (trackA)
        return { ...step, note: null, volume: undefined };
      });

      onPatternChange(newPattern);
    } else if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      // Note off (set to rest)
      if (pattern) {
        const noteOff: Note = createNoteOff();
        const newPattern = updatePatternStep(pattern, currentLine, (step) => {
          // Set note off for shared pattern (always use trackA)
          return { ...step, note: noteOff };
        });
        onPatternChange(newPattern);
      }
    } else if (key === ' ') {
      event.preventDefault();
      // Clear current position in the active column and move to next line
      if (pattern) {
        const newPattern = updatePatternStep(pattern, currentLine, (step) => {
          if (currentColumn === 'volume') {
            return { ...step, volume: undefined };
          }
          return { ...step, note: null, volume: undefined };
        });
        onPatternChange(newPattern);
        // Move to next line (wrap around pattern length)
        onLineChange(stepLineIndex(currentLine, patternLength, 1));
      }
    } else if (!event.ctrlKey && key === '-') {
      event.preventDefault();
      // Insert explicit key-release step (note-off) and move to next line
      if (pattern) {
        const noteOff: Note = createNoteOff();
        const newPattern = updatePatternStep(pattern, currentLine, (step) => {
          return { ...step, note: noteOff };
        });
        onPatternChange(newPattern);
        onLineChange(stepLineIndex(currentLine, patternLength, 1));
      }
    } else if (event.ctrlKey && key === '-') {
      event.preventDefault();
      // Previous instrument
      setCurrentInstrument((prev) => stepInstrumentId(prev, -1));
    } else if (event.ctrlKey && (key === '+' || key === '=')) {
      event.preventDefault();
      // Next instrument
      setCurrentInstrument((prev) => stepInstrumentId(prev, 1));

    } else if (!event.ctrlKey && currentColumn === 'volume' && parseVolumeNibble(key) !== null) {
      const nibble = parseVolumeNibble(key) as number;

      event.preventDefault();
      // Hex input for per-line volume modifier
      if (pattern) {
        const newPattern = updatePatternStep(pattern, currentLine, (step) => {
          return { ...step, volume: nibble };
        });
        onPatternChange(newPattern);
        // Move to next line after entering a volume nibble (wrap around pattern length)
        onLineChange(stepLineIndex(currentLine, patternLength, 1));
      }

    } else {
      const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
      if (!mapped) {
        return;
      }

      event.preventDefault();

      const { note, octave: finalOctave, keyId } = mapped;

      if (pressedNoteKeysRef.current.has(keyId)) {
        return;
      }
      pressedNoteKeysRef.current.add(keyId);

      playPreviewNote(note, finalOctave);

      // Insert note
      if (pattern) {
        const newNote: Note = { note, octave: finalOctave, instrument: currentInstrumentData.id };

        const newPattern = updatePatternStep(pattern, currentLine, (step) => {
          // Set the note for shared pattern (always use trackA)
          return { ...step, note: newNote };
        });
        onPatternChange(newPattern);
        // Move to next line (wrap around pattern length)
        onLineChange(stepLineIndex(currentLine, patternLength, 1));
      }
    }
  }, [
    isActive,
    currentLine,
    currentOctave,
    currentInstrument,
    onLineChange,
    patternLength,
    playPreviewNote,
    pattern,
    trackId,
    onPatternChange,
    onToggleLineFromCursor,
    currentColumn,
    setCurrentColumn,
    setActiveSection
  ]);

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      const key = event.key.toUpperCase();

      const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
      if (!mapped) {
        return;
      }

      event.preventDefault();

      const { keyId } = mapped;

      if (pressedNoteKeysRef.current.has(keyId)) {
        pressedNoteKeysRef.current.delete(keyId);
      }

      if (activePreviewKeyRef.current !== keyId) {
        return;
      }

      const sustain = previewSustainIndexRef.current;
      const hasSustain = typeof sustain === 'number' && sustain >= 0;

      if (hasSustain) {
        // For instruments with sustain, key release acts as a release trigger:
        // keep the timer/envelope running and allow it to progress past sustain.
        previewReleasedRef.current = true;
      } else {
        // No sustain: perform immediate hard stop.
        stopPreview();
      }
    },
    [isActive, currentOctave, stopPreview]
  );

  const handleLineClick = useCallback(
    (lineIndex: number, column: 'note' | 'volume' = 'note') => {
      onLineChange(lineIndex);
      setActiveSection(sectionName);
      setCurrentColumn(column);
    },
    [setActiveSection, sectionName, onLineChange, setCurrentColumn]
  );

  const formatNoteDisplay = useCallback((noteData: Note | null) => {
    return formatTrackNoteDisplay(noteData);
  }, []);

  const getLineClass = useCallback((lineIndex: number) => {
    return getTrackLineClass(lineIndex, currentLine);
  }, [currentLine]);

  return (
    <div
      ref={trackRef}
      className={`track-panel track-${trackId.toLowerCase()} ${trackBackgroundEnabled ? 'track-colored' : ''} ${isActive ? 'active' : ''} ${!pattern ? 'disabled' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className={`track-header ${isTargetTrack ? 'target-track' : ''}`}>
        <span className="track-header-title">{trackId}</span>
        <span className="track-header-volume">
          VOL {effectiveVolume.toString(16).toUpperCase()}
        </span>
      </div>

      <div className="track-content" style={{ userSelect: 'none' }}>
        {(() => {
          const patternSteps: Step[] = pattern?.step ?? [];
          return trackNotes.map((noteData, lineIndex) => {
            const volume = patternSteps[lineIndex]?.volume ?? null;
            const isCurrentLine = lineIndex === currentLine && isActive;
            const volumeIsActive = isCurrentLine && currentColumn === 'volume';
            const noteIsActive = isCurrentLine && currentColumn === 'note';

            let instrumentColor: string | null = null;
            instrumentColor = getInstrumentColorForNote(noteData, instrumentColorMap);

            const lineClassName = `${getLineClass(lineIndex)}${instrumentColor ? ' track-line-colored' : ''}`.trim();
            const lineStyle = instrumentColor
              ? ({ ['--track-line-color' as string]: instrumentColor } as React.CSSProperties)
              : undefined;

            return (
              <TrackLine
                key={lineIndex}
                lineIndex={lineIndex}
                noteData={noteData}
                volume={volume}
                lineClassName={lineClassName}
                lineStyle={lineStyle}
                noteIsActive={noteIsActive}
                volumeIsActive={volumeIsActive}
                onLineClick={handleLineClick}
                formatNoteDisplay={formatNoteDisplay}
              />
            );
          });
        })()}
      </div>
    </div>
  );
};
