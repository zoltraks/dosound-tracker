import { Formatter } from '../utils/format/formatters.ts';
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { NavigationSection } from '../constants/navigation.ts';
import { KEYBOARD_TO_NOTE } from '../constants/music.ts';
import type { Pattern, Note, Instrument, Step } from '../synth/SoundDriver.ts';
import type { SoundEngine } from '../synth/soundEngine.ts';
import { DEFAULT_SONG_FRAME } from '../constants/song.ts';
import { TrackLine } from './TrackLine.tsx';
import { computeEffectiveVolume } from '../utils/track/trackUtils.ts';
import {
  buildInstrumentColorMap,
  buildTrackRowAnnouncement,
  formatTrackNoteDisplay,
  getInstrumentColorForNote,
  getTrackNotes as getTrackNotesForPattern,
} from '../utils/track/trackRendering.ts';
import { stepInstrumentId } from '../utils/instrument/instrumentSelection.ts';
import {
  createNoteOff,
  getKeyboardMappedNote,
  getNextTrackSection,
  getPreviousTrackSection,
  isNavigationKey,
  parseVolumeNibble,
  stepLineIndex,
  updatePatternStep,
} from '../utils/track/trackPanelUtils.ts';
import { usePreviewEnvelope } from '../hooks/playback/usePreviewEnvelope.ts';
import { noteKeyId } from '../utils/panel/pianoUtils.ts';

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
  ym2149: SoundEngine | null;
  currentInstrumentData: Instrument;
  instruments: Instrument[];
  trackBackgroundEnabled: boolean;
  isTargetTrack: boolean;
  onToggleLineFromCursor: (lineIndex: number) => void;
  onToggleLineFromStart: (lineIndex: number) => void;
  onToggleSongFromCursor: (lineIndex: number) => void;
  onToggleSongFromStart: (lineIndex: number) => void;
  currentColumn: 'note' | 'volume';
  setCurrentColumn: (column: 'note' | 'volume') => void;
  focusRevision: number;
  onPreviewMidiNoteOn?: (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number,
  ) => void;
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
    onToggleLineFromStart,
    onToggleSongFromCursor,
    onToggleSongFromStart,
    currentColumn,
    setCurrentColumn,
    focusRevision,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview,
    onRegisterStopPreview,
    tickIntervalMs = 1000 / DEFAULT_SONG_FRAME,
  } = props;

  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentInstrumentData?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentInstrument(currentInstrumentData.id);
    }
  }, [currentInstrumentData.id]);

  // Envelope timing state for preview notes (monophonic per track, piano-like)
  const activePreviewKeyRef = useRef<string | null>(null);
  const pressedNoteKeysRef = useRef<Set<string>>(new Set());
  const previewChannel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
  const preview = usePreviewEnvelope({
    ym2149,
    onAutoStop: () => {
      activePreviewKeyRef.current = null;
      if (onPreviewMidiNoteOff) {
        onPreviewMidiNoteOff(previewChannel);
      }
    },
  });

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  const instrumentColorMap = useMemo(() => {
    return buildInstrumentColorMap(instruments);
  }, [instruments]);

  const effectiveVolume = useMemo(
    () => computeEffectiveVolume(pattern, currentLine),
    [pattern, currentLine],
  );

  const stopPreview = useCallback(() => {
    preview.stop();
    activePreviewKeyRef.current = null;

    if (onHardStopLivePreview) {
      onHardStopLivePreview(previewChannel);
    }

    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(previewChannel);
    }

    // Clear any tracked pressed note keys when performing a hard stop so that
    // stale state from a lost keyup (e.g. focus change while a key is held)
    // cannot block future previews for the same key.
    if (pressedNoteKeysRef.current.size > 0) {
      pressedNoteKeysRef.current.clear();
    }
  }, [previewChannel, preview, onHardStopLivePreview, onPreviewMidiNoteOff]);

  useEffect(() => {
    if (onRegisterStopPreview) {
      onRegisterStopPreview(trackId, stopPreview);
    }
  }, [onRegisterStopPreview, trackId, stopPreview]);

  // Play preview note when entering notes (piano-like: hold key to sustain, stop on release)
  const playPreviewNote = useCallback(
    (note: string, octave: number) => {
      if (!ym2149) return;

      // Monophonic per track: stop any existing preview first
      stopPreview();

      const keyId = noteKeyId(note, octave);
      activePreviewKeyRef.current = keyId;

      preview.start(keyId, {
        channel: previewChannel,
        instrument: currentInstrumentData,
        noteData: { note, octave },
        tickIntervalMs,
      });

      if (onPreviewMidiNoteOn) {
        onPreviewMidiNoteOn(previewChannel, currentInstrumentData, note, octave);
      }
    },
    [
      ym2149,
      currentInstrumentData,
      tickIntervalMs,
      onPreviewMidiNoteOn,
      previewChannel,
      preview,
      stopPreview,
    ],
  );

  const computeTrackNotes = useCallback(() => {
    return getTrackNotesForPattern(pattern, patternLength);
  }, [pattern, patternLength]);

  const trackNotes = computeTrackNotes();

  useEffect(() => {
    if (isActive && trackRef.current) {
      trackRef.current.focus();
    }
  }, [isActive, focusRevision]);

  // True when preview state exists that a hard stop must clean up: a
  // running envelope voice, or pressed keys left tracked by a lost keyup.
  // Lets the focus-loss effect below suppress no-op stopPreview calls on
  // mount and on section flips, so they can no longer reach the channel
  // volume registers.
  const hasPreviewState = useCallback(
    () => preview.hasState() || pressedNoteKeysRef.current.size > 0,
    [preview],
  );

  useEffect(() => {
    if (!isActive && hasPreviewState()) {
      stopPreview();
    }

    return () => {
      if (hasPreviewState()) {
        stopPreview();
      }
    };
  }, [isActive]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      const key = event.key.toUpperCase();

      const isNavKey = isNavigationKey(key);

      if (event.repeat && !isNavKey) {
        event.preventDefault();
        return;
      }

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
          setCurrentColumn('note');
        } else {
          const targetTrack: NavigationSection = getPreviousTrackSection(trackId);
          setActiveSection(targetTrack);
          setCurrentColumn('volume');
        }
      } else if (key === 'ARROWRIGHT') {
        event.preventDefault();
        if (currentColumn === 'note') {
          setCurrentColumn('volume');
        } else {
          const targetTrack: NavigationSection = getNextTrackSection(trackId);
          setActiveSection(targetTrack);
          setCurrentColumn('note');
        }
      } else if (key === 'ENTER') {
        event.preventDefault();
        if (event.ctrlKey && event.shiftKey) {
          onToggleSongFromStart(currentLine);
        } else if (event.shiftKey) {
          onToggleSongFromCursor(currentLine);
        } else if (event.ctrlKey) {
          onToggleLineFromStart(currentLine);
        } else {
          onToggleLineFromCursor(currentLine);
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (!pattern) return;

        const newPattern = updatePatternStep(pattern, currentLine, (step) => {
          if (currentColumn === 'volume') {
            return { ...step, volume: undefined };
          }

          return { ...step, note: null, volume: undefined };
        });

        onPatternChange(newPattern);
      } else if (event.shiftKey && !event.ctrlKey && !event.metaKey && key === ' ') {
        event.preventDefault();
        // Note off (set to rest); pressed on a note-off, clears the position
        if (pattern) {
          const noteOff: Note = createNoteOff();
          const newPattern = updatePatternStep(pattern, currentLine, (step) => {
            if (step.note?.note === '===') {
              return { ...step, note: null, volume: undefined };
            }
            return { ...step, note: noteOff };
          });
          onPatternChange(newPattern);
        }
      } else if (!event.ctrlKey && !event.metaKey && !event.shiftKey && key === ' ') {
        event.preventDefault();
        if (pattern) {
          const newPattern = updatePatternStep(pattern, currentLine, (step) => {
            if (currentColumn === 'volume') {
              return { ...step, volume: undefined };
            }
            return { ...step, note: null, volume: undefined };
          });
          onPatternChange(newPattern);
          onLineChange(stepLineIndex(currentLine, patternLength, 1));
        }
      } else if (!event.ctrlKey && key === '-') {
        event.preventDefault();
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
        setCurrentInstrument((prev) => stepInstrumentId(prev, -1));
      } else if (event.ctrlKey && (key === '+' || key === '=')) {
        event.preventDefault();
        setCurrentInstrument((prev) => stepInstrumentId(prev, 1));
      } else if (!event.ctrlKey && currentColumn === 'volume' && parseVolumeNibble(key) !== null) {
        const nibble = parseVolumeNibble(key) as number;

        event.preventDefault();
        if (pattern) {
          const newPattern = updatePatternStep(pattern, currentLine, (step) => {
            return { ...step, volume: nibble };
          });
          onPatternChange(newPattern);
          onLineChange(stepLineIndex(currentLine, patternLength, 1));
        }
      } else {
        // Modifier chords belong to global shortcuts (undo, redo, file
        // ops) - they must never fall through to note entry.
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }

        const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
        if (!mapped) {
          return;
        }

        event.preventDefault();

        // Note keys are inert in the volume column; only the note column enters notes.
        if (currentColumn !== 'note') {
          return;
        }

        const { note, octave: finalOctave, keyId } = mapped;

        if (pressedNoteKeysRef.current.has(keyId)) {
          return;
        }
        pressedNoteKeysRef.current.add(keyId);

        playPreviewNote(note, finalOctave);

        if (pattern) {
          const newNote: Note = { note, octave: finalOctave, instrument: currentInstrumentData.id };

          const newPattern = updatePatternStep(pattern, currentLine, (step) => {
            return { ...step, note: newNote };
          });
          onPatternChange(newPattern);
          onLineChange(stepLineIndex(currentLine, patternLength, 1));
        }
      }
    },
    [
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
      onToggleLineFromStart,
      onToggleSongFromCursor,
      onToggleSongFromStart,
      currentColumn,
      setCurrentColumn,
      setActiveSection,
    ],
  );

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

      // For instruments with sustain, key release acts as a release trigger:
      // keep the timer/envelope running and allow it to progress past sustain.
      // No sustain: perform immediate hard stop.
      if (!preview.release(keyId)) {
        stopPreview();
      }
    },
    [isActive, currentOctave, stopPreview, preview],
  );

  const handleLineClick = useCallback(
    (lineIndex: number, column: 'note' | 'volume' = 'note') => {
      onLineChange(lineIndex);
      setActiveSection(sectionName);
      setCurrentColumn(column);
    },
    [setActiveSection, sectionName, onLineChange, setCurrentColumn],
  );

  const formatNoteDisplay = useCallback((noteData: Note | null) => {
    return formatTrackNoteDisplay(noteData);
  }, []);

  return (
    <div
      ref={trackRef}
      className={`track-panel track-${trackId.toLowerCase()} ${trackBackgroundEnabled ? 'track-colored' : ''} ${isActive ? 'active' : ''} ${!pattern ? 'disabled' : ''}`}
      role="group"
      aria-label={`Track ${trackId}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {isActive
          ? pattern
            ? buildTrackRowAnnouncement(
                trackId,
                currentLine,
                currentColumn,
                trackNotes[currentLine] ?? null,
                pattern.step?.[currentLine]?.volume,
              )
            : `Track ${trackId}, no pattern loaded`
          : ''}
      </div>

      <div className={`track-header ${isTargetTrack ? 'target-track' : ''}`}>
        <span className="track-header-title">{trackId}</span>
        <span className="track-header-volume">
          VOL {Formatter.hex(effectiveVolume, { padWidth: 0 })}
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

            const instrumentColor = getInstrumentColorForNote(noteData, instrumentColorMap);

            return (
              <TrackLine
                key={lineIndex}
                lineIndex={lineIndex}
                noteData={noteData}
                volume={volume}
                isCurrent={lineIndex === currentLine}
                instrumentColor={instrumentColor}
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
