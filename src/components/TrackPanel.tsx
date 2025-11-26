import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { KEYBOARD_TO_NOTE } from '../constants/music';
import type { Pattern, Note, Instrument } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';

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
  isTargetTrack: boolean;
  onTogglePatternFromCursor: (lineIndex: number) => void;
  currentColumn: 'note' | 'volume';
  setCurrentColumn: (column: 'note' | 'volume') => void;
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
    isTargetTrack,
    onTogglePatternFromCursor,
    currentColumn,
    setCurrentColumn
  } = props;

  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentInstrumentData?.id) {
      setCurrentInstrument(currentInstrumentData.id);
    }
  }, [currentInstrumentData.id]);

  // Envelope timing state for preview notes
  const envelopeTimerRef = useRef<number | null>(null);
  const previewSubTickRef = useRef<number>(0);
  const previewEnvelopeStepRef = useRef<number>(0);
  const previewLastTickTimeRef = useRef<number | null>(null);
  const previewNextTickTimeRef = useRef<number | null>(null);

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  const effectiveVolume = useMemo(() => {
    if (!pattern) return 0x0f;

    const lines = pattern.lines || [];
    if (lines.length === 0) return 0x0f;

    const maxIndex = Math.min(currentLine, lines.length - 1);
    let current = 0x0f;

    for (let i = 0; i <= maxIndex; i++) {
      const line = lines[i];
      const vol = line && (line as any).volume;
      if (vol !== undefined && vol !== null) {
        const clamped = Math.max(0, Math.min(0x0f, (vol as number) | 0));
        current = clamped;
      }
    }

    return current;
  }, [pattern, currentLine]);

  // Play preview note when entering notes
  const playPreviewNote = useCallback((note: string, octave: number) => {
    if (!ym2149) return;

    if (envelopeTimerRef.current) {
      clearInterval(envelopeTimerRef.current);
    }

    // Map track to channel
    const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
    const instrument = currentInstrumentData as any;
    const noteData = { note, octave };

    // Initialize envelope timing
    const now = performance.now();
    previewSubTickRef.current = 0;
    previewEnvelopeStepRef.current = 0;
    previewLastTickTimeRef.current = now;
    previewNextTickTimeRef.current = now + 20;

    // Apply initial state (step 0) with default volume modifier (0xF = no attenuation)
    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0, 0x0f);

    const TICK_INTERVAL_MS = 20;

    envelopeTimerRef.current = window.setInterval(() => {
      const nowTick = performance.now();

      let nextTickTime = previewNextTickTimeRef.current;
      if (!nextTickTime) {
        nextTickTime = nowTick + TICK_INTERVAL_MS;
      }

      let subTick = previewSubTickRef.current;
      let step = previewEnvelopeStepRef.current;

      while (nowTick >= nextTickTime) {
        subTick = (subTick + 1) % 2;
        if (subTick === 0) {
          step = step + 1;
        }
        nextTickTime += TICK_INTERVAL_MS;
      }

      previewSubTickRef.current = subTick;
      previewEnvelopeStepRef.current = step;
      previewLastTickTimeRef.current = nowTick;
      previewNextTickTimeRef.current = nextTickTime;

      ym2149.updateChannelWithInstrument(channel, instrument, noteData, step, 0x0f);
    }, 20);

    // Auto-silence after 500ms for preview (longer to hear envelope)
    const volumeRegister = 8 + channel;
    window.setTimeout(() => {
      if (envelopeTimerRef.current) {
        clearInterval(envelopeTimerRef.current);
        envelopeTimerRef.current = null;
      }
      previewLastTickTimeRef.current = null;
      previewNextTickTimeRef.current = null;
      ym2149.writeRegister(volumeRegister, 0x00); // Silence channel
    }, 500);
  }, [ym2149, trackId, currentInstrumentData]);

  // Get notes for this track from the pattern
  const getTrackNotes = useCallback(() => {
    if (!pattern) return Array(Math.max(1, patternLength)).fill(null);

    // For shared patterns, show the same content in all tracks
    // Use trackA data as the shared content for all tracks
    const safeLength = Math.max(1, patternLength);
    const lines = pattern.lines || [];
    const notes = [] as (Note | null)[];

    for (let i = 0; i < safeLength; i++) {
      const line = lines[i] || { trackA: null, trackB: null, trackC: null };
      notes.push(line.trackA);
    }

    return notes;
  }, [pattern, patternLength]);

  const trackNotes = getTrackNotes();

  useEffect(() => {
    if (isActive && trackRef.current) {
      trackRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();

    // Navigation
    if (key === 'ARROWUP') {
      event.preventDefault();
      if (!pattern) return;
      onLineChange(Math.max(0, currentLine - 1));
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      if (!pattern) return;
      onLineChange(Math.min((patternLength || 1) - 1, currentLine + 1));
    } else if (key === 'PAGEUP') {
      event.preventDefault();
      if (!pattern) return;
      const length = Math.max(1, patternLength || 1);
      const step = 16;
      const rawIndex = currentLine - step;
      const wrappedIndex = ((rawIndex % length) + length) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'PAGEDOWN') {
      event.preventDefault();
      if (!pattern) return;
      const length = Math.max(1, patternLength || 1);
      const step = 16;
      const wrappedIndex = (currentLine + step) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'HOME') {
      event.preventDefault();
      if (!pattern) return;
      onLineChange(0);
    } else if (key === 'END') {
      event.preventDefault();
      if (!pattern) return;
      const length = Math.max(1, patternLength || 1);
      onLineChange(length - 1);
    } else if (key === 'ARROWLEFT') {
      event.preventDefault();
      if (currentColumn === 'volume') {
        // Move from volume to note within the same track
        setCurrentColumn('note');
      } else {
        // Move to previous track and select its volume column
        let targetTrack: NavigationSection;
        if (trackId === 'A') {
          targetTrack = 'trackC';
        } else if (trackId === 'B') {
          targetTrack = 'trackA';
        } else {
          targetTrack = 'trackB';
        }
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
        let targetTrack: NavigationSection;
        if (trackId === 'A') {
          targetTrack = 'trackB';
        } else if (trackId === 'B') {
          targetTrack = 'trackC';
        } else {
          targetTrack = 'trackA';
        }
        setActiveSection(targetTrack);
        setCurrentColumn('note');
      }
    } else if (key === 'ENTER') {
      event.preventDefault();
      onTogglePatternFromCursor(currentLine);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (!pattern) return;
      const newPattern = { ...pattern };
      newPattern.lines = [...newPattern.lines];
      newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

      if (currentColumn === 'volume') {
        // Clear only the per-line volume modifier
        (newPattern.lines[currentLine] as any).volume = undefined;
      } else {
        // Clear the note (and implicitly any volume) for shared pattern (trackA)
        newPattern.lines[currentLine].trackA = null;
        (newPattern.lines[currentLine] as any).volume = undefined;
      }

      onPatternChange(newPattern);
    } else if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      // Note off (set to rest)
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        // Set note off for shared pattern (always use trackA)
        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        newPattern.lines[currentLine].trackA = noteOff;

        onPatternChange(newPattern);
      }
    } else if (key === ' ') {
      event.preventDefault();
      // Clear current position in the active column and move to next line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        if (currentColumn === 'volume') {
          (newPattern.lines[currentLine] as any).volume = undefined;
        } else {
          newPattern.lines[currentLine].trackA = null;
          (newPattern.lines[currentLine] as any).volume = undefined;
        }

        onPatternChange(newPattern);
        // Move to next line
        onLineChange(Math.min((patternLength || 1) - 1, currentLine + 1));
      }
    } else if (!event.ctrlKey && key === '-') {
      event.preventDefault();
      // Insert explicit key-release step (note-off) and move to next line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        newPattern.lines[currentLine].trackA = noteOff;

        onPatternChange(newPattern);
        onLineChange(Math.min((patternLength || 1) - 1, currentLine + 1));
      }
    } else if (event.ctrlKey && key === '-') {
      event.preventDefault();
      // Previous instrument
      setCurrentInstrument(prev => {
        const instNum = parseInt(prev, 16);
        const newInst = Math.max(0, instNum - 1);
        return newInst.toString(16).padStart(2, '0').toUpperCase();
      });
    } else if (event.ctrlKey && (key === '+' || key === '=')) {
      event.preventDefault();
      // Next instrument
      setCurrentInstrument(prev => {
        const instNum = parseInt(prev, 16);
        const newInst = Math.min(255, instNum + 1);
        return newInst.toString(16).padStart(2, '0').toUpperCase();
      });
    } else if (!event.ctrlKey && currentColumn === 'volume' && /^[0-9A-F]$/.test(key)) {
      event.preventDefault();
      // Hex input for per-line volume modifier
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        const value = parseInt(key, 16);
        const clamped = Math.max(0, Math.min(0x0f, value));
        (newPattern.lines[currentLine] as any).volume = clamped;

        onPatternChange(newPattern);
        // Move to next line after entering a volume nibble
        onLineChange(Math.min((patternLength || 1) - 1, currentLine + 1));
      }
    } else if (KEYBOARD_TO_NOTE[key]) {
      event.preventDefault();
      // Insert note
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));

      // Play preview note immediately
      playPreviewNote(note, finalOctave);

      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        const newNote: Note = { note, octave: finalOctave, instrument: currentInstrumentData.id };

        // Set the note for shared pattern (always use trackA)
        newPattern.lines[currentLine].trackA = newNote;

        onPatternChange(newPattern);
        // Move to next line
        onLineChange(Math.min((patternLength || 1) - 1, currentLine + 1));
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
    onTogglePatternFromCursor,
    currentColumn,
    setCurrentColumn,
    setActiveSection
  ]);

  const handleLineClick = useCallback(
    (lineIndex: number, column: 'note' | 'volume' = 'note') => {
      onLineChange(lineIndex);
      setActiveSection(sectionName);
      setCurrentColumn(column);
    },
    [setActiveSection, sectionName, onLineChange, setCurrentColumn]
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
    if (lineIndex === currentLine && isActive) {
      classes.push('current');
    }
    if (lineIndex % 4 === 0) {
      classes.push('beat-line');
    }
    return classes.join(' ');
  }, [currentLine, isActive]);

  return (
    <div
      ref={trackRef}
      className={`track-panel track-${trackId.toLowerCase()} ${isActive ? 'active' : ''} ${!pattern ? 'disabled' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className={`track-header ${isTargetTrack ? 'target-track' : ''}`}>
        <span className="track-header-title">Track {trackId}</span>
        <span className="track-header-volume">
          VOL {effectiveVolume.toString(16).toUpperCase()}
        </span>
      </div>

      <div className="track-content">
        {trackNotes.map((noteData, lineIndex) => {
          const volume = pattern?.lines[lineIndex]?.volume;
          const isCurrentLine = lineIndex === currentLine && isActive;
          const volumeIsActive = isCurrentLine && currentColumn === 'volume';
          const noteIsActive = isCurrentLine && currentColumn === 'note';

          return (
            <div
              key={lineIndex}
              className={getLineClass(lineIndex)}
              onClick={() => handleLineClick(lineIndex, 'note')}
            >
              <span className="note-data">
                <span
                  className={`note-text ${noteIsActive ? 'active' : ''}`}
                  onClick={() => handleLineClick(lineIndex, 'note')}
                >
                  {formatNoteDisplay(noteData as any)}
                </span>
                <span
                  className={`volume-data ${volumeIsActive ? 'active' : ''}`}
                  onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                    event.stopPropagation();
                    handleLineClick(lineIndex, 'volume');
                  }}
                >
                  {volume === undefined || volume === null
                    ? '.'
                    : (Math.max(0, Math.min(0x0f, (volume as number) | 0))).toString(16).toUpperCase()}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
