import React, { useState, useRef, useEffect, useCallback } from 'react';
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
}

interface NoteData {
  note: string;
  octave: number;
  instrument: string;
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
    onTogglePatternFromCursor
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

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  // Play preview note when entering notes
  const playPreviewNote = useCallback((note: string, octave: number) => {
    if (!ym2149) return;

    // Clear any existing envelope timer
    if (envelopeTimerRef.current) {
      clearInterval(envelopeTimerRef.current);
    }

    // Map track to channel
    const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
    const instrument = currentInstrumentData as any;
    const noteData = { note, octave };

    // Initialize envelope timing
    previewSubTickRef.current = 0;
    previewEnvelopeStepRef.current = 0;

    // Apply initial state (step 0)
    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0);

    // Start envelope timer: 20ms tick, advance envelope step every 20ms
    envelopeTimerRef.current = window.setInterval(() => {
      // Track raw sub-ticks for potential future use
      previewSubTickRef.current = previewSubTickRef.current + 1;
      previewEnvelopeStepRef.current = previewEnvelopeStepRef.current + 1;

      ym2149.updateChannelWithInstrument(channel, instrument, noteData, previewEnvelopeStepRef.current);
    }, 20); // 20ms = 50Hz, envelope step every tick

    // Auto-silence after 500ms for preview (longer to hear envelope)
    const volumeRegister = 8 + channel;
    window.setTimeout(() => {
      if (envelopeTimerRef.current) {
        clearInterval(envelopeTimerRef.current);
        envelopeTimerRef.current = null;
      }
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
    } else if (key === 'ARROWLEFT') {
      event.preventDefault();
      // Navigate to previous track (circular)
      let targetTrack: NavigationSection;
      if (trackId === 'A') {
        targetTrack = 'trackC'; // A -> C
      } else if (trackId === 'B') {
        targetTrack = 'trackA'; // B -> A
      } else { // trackId === 'C'
        targetTrack = 'trackB'; // C -> B
      }
      setActiveSection(targetTrack);
    } else if (key === 'ARROWRIGHT') {
      event.preventDefault();
      // Navigate to next track (circular)
      let targetTrack: NavigationSection;
      if (trackId === 'A') {
        targetTrack = 'trackB'; // A -> B
      } else if (trackId === 'B') {
        targetTrack = 'trackC'; // B -> C
      } else { // trackId === 'C'
        targetTrack = 'trackA'; // C -> A
      }
      setActiveSection(targetTrack);
    } else if (key === 'ENTER') {
      event.preventDefault();
      onTogglePatternFromCursor(currentLine);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      // Clear current line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        // Clear the note for shared pattern (always use trackA)
        newPattern.lines[currentLine].trackA = null;

        onPatternChange(newPattern);
      }
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
      // Clear current position and move to next line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };

        // Clear the note for shared pattern (always use trackA)
        newPattern.lines[currentLine].trackA = null;

        onPatternChange(newPattern);
        // Move to next line
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
  }, [isActive, currentLine, currentOctave, currentInstrument, onLineChange, patternLength, playPreviewNote, pattern, trackId, onPatternChange, onTogglePatternFromCursor]);

  const handleLineClick = useCallback((lineIndex: number) => {
    onLineChange(lineIndex);
    setActiveSection(sectionName);
  }, [setActiveSection, sectionName, onLineChange]);

  const formatNoteDisplay = useCallback((noteData: NoteData | null) => {
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
        Track {trackId}
      </div>

      <div className="track-content">
        {trackNotes.map((noteData, lineIndex) => (
          <div
            key={lineIndex}
            className={getLineClass(lineIndex)}
            onClick={() => handleLineClick(lineIndex)}
          >
            <span className="note-data">
              {formatNoteDisplay(noteData)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
