/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Pattern, Note, Instrument, Step } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';
import { TrackLine } from './TrackLine';
import { computeEffectiveVolume } from '../utils/trackUtils';
import { useTrackPreview } from '../hooks/useTrackPreview';
import { useTrackKeyboard } from '../hooks/useTrackKeyboard';

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
    onRegisterStopPreview
  } = props;

  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  // Use the preview hook
  const { playPreviewNote, stopPreview } = useTrackPreview({
    ym2149,
    trackId,
    currentInstrument: currentInstrumentData,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview
  });

  // Use the keyboard hook
  const { handleKeyDown, handleKeyUp } = useTrackKeyboard({
    isActive,
    currentLine,
    currentOctave,
    patternLength,
    currentInstrument,
    currentColumn,
    pattern,
    onLineChange,
    onPatternChange,
    onToggleLineFromCursor,
    setCurrentColumn,
    setActiveSection,
    playPreviewNote,
    stopPreview,
    trackId,
    onInstrumentChange: (setter) => setCurrentInstrument(setter)
  });

  useEffect(() => {
    if (currentInstrumentData?.id) {
      setCurrentInstrument(currentInstrumentData.id);
    }
  }, [currentInstrumentData.id]);

  const instrumentColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inst of instruments) {
      if (!inst || typeof inst.id !== 'string') {
        continue;
      }
      const id = inst.id.trim().toUpperCase();
      if (!id) {
        continue;
      }
      const color = typeof inst.color === 'string' && inst.color.trim() ? inst.color : null;
      if (color) {
        map.set(id, color);
      }
    }
    return map;
  }, [instruments]);

  const effectiveVolume = useMemo(
    () => computeEffectiveVolume(pattern, currentLine),
    [pattern, currentLine]
  );

  useEffect(() => {
    if (onRegisterStopPreview) {
      onRegisterStopPreview(trackId, stopPreview);
    }
  }, [onRegisterStopPreview, trackId, stopPreview]);

  // Get notes for this track from the pattern
  const getTrackNotes = useCallback(() => {
    if (!pattern) return Array(Math.max(1, patternLength)).fill(null);

    // For shared patterns, show the same content in all tracks
    // Use trackA data as the shared content for all tracks
    const safeLength = Math.max(1, patternLength);
    const lines = pattern.step || [];
    const notes = [] as (Note | null)[];

    for (let i = 0; i < safeLength; i++) {
      const line = lines[i] || { note: null };
      notes.push(line.note);
    }

    return notes;
  }, [pattern, patternLength]);

  const trackNotes = getTrackNotes();

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

  const handleLineClick = useCallback(
    (lineIndex: number, column: 'note' | 'volume' = 'note') => {
      onLineChange(lineIndex);
      setActiveSection(sectionName);
      setCurrentColumn(column);
    },
    [onLineChange, setActiveSection, sectionName, setCurrentColumn]
  );

  const formatNoteDisplay = useCallback((noteData: Note | null) => {
    if (!noteData) return '---';
    if (noteData.note === '===') return '===';

    // Format note: natural notes get "-", sharps keep "#"
    const formattedNote = noteData.note.includes('#')
      ? noteData.note
      : noteData.note + '-';

    return `${formattedNote}${noteData.octave} ${noteData.instrument}`;
  }, []);

  const getLineClass = useCallback((lineIndex: number) => {
    const classes = ['track-line'];
    if (lineIndex === currentLine) {
      classes.push('current');
    }
    if (lineIndex % 4 === 0) {
      classes.push('beat-line');
    }
    return classes.join(' ');
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
            // Never tint note-off rows; they should look like empty steps.
            if (noteData && noteData.note !== '===' && typeof noteData.instrument === 'string') {
              const rawInst = noteData.instrument.trim();
              if (rawInst) {
                const sanitized = rawInst.startsWith('$') ? rawInst.slice(1) : rawInst;
                const upper = sanitized.toUpperCase();
                // Only treat proper hex instrument IDs (1-2 hex digits) as colorable.
                // This avoids coloring steps with no instrument value (e.g. note off without instrument).
                if (/^[0-9A-F]{1,2}$/.test(upper)) {
                  instrumentColor = instrumentColorMap.get(upper) ?? null;
                }
              }
            }

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
