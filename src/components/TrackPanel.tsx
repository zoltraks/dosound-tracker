import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { PATTERN_LENGTH, KEYBOARD_TO_NOTE } from '../constants/music';
import type { Pattern, Note } from '../synth/dosound/DosoundDriver';
import { YM2149 } from '../synth/ym2149/YM2149';

interface TrackPanelProps {
  trackId: 'A' | 'B' | 'C';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  currentLine: number;
  onLineChange: (lineIndex: number) => void;
  pattern: Pattern | null;
  onPatternChange: (pattern: Pattern) => void;
  ym2149: YM2149 | null;
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
    onScroll,
    currentLine,
    onLineChange,
    pattern,
    onPatternChange,
    ym2149
  } = props;
  
  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);
  const isProcessingWheel = useRef<boolean>(false);

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  // Play preview note when entering notes
  const playPreviewNote = useCallback((note: string, octave: number) => {
    if (!ym2149) return;

    const noteFrequencies: { [key: string]: number } = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };

    const baseFreq = noteFrequencies[note];
    if (!baseFreq) return;

    const frequency = baseFreq * Math.pow(2, octave - 4);
    const period = Math.floor(2000000 / (16 * frequency));

    // Map track to channel
    const channel = trackId === 'A' ? 0 : trackId === 'B' ? 1 : 2;
    const fineRegister = channel * 2;        // R0, R2, R4
    const coarseRegister = channel * 2 + 1;  // R1, R3, R5
    const volumeRegister = 8 + channel;      // R8, R9, R10

    // Play note on this channel
    ym2149.writeRegister(fineRegister, period & 0xFF);
    ym2149.writeRegister(coarseRegister, (period >> 8) & 0x0F);
    ym2149.writeRegister(volumeRegister, 0x0F); // Full volume

    // Auto-silence after 200ms for preview
    setTimeout(() => {
      if (ym2149) {
        ym2149.writeRegister(volumeRegister, 0x00);
      }
    }, 200);
  }, [ym2149, trackId]);

  // Get notes for this track from the pattern
  const getTrackNotes = useCallback(() => {
    if (!pattern) return Array(PATTERN_LENGTH).fill(null);
    
    return pattern.lines.map(line => {
      switch (trackId) {
        case 'A': return line.trackA;
        case 'B': return line.trackB;
        case 'C': return line.trackC;
        default: return null;
      }
    });
  }, [pattern, trackId]);

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
      onLineChange(Math.max(0, currentLine - 1));
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      onLineChange(Math.min(PATTERN_LENGTH - 1, currentLine + 1));
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
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      // Clear current line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };
        
        // Clear the note for this track
        switch (trackId) {
          case 'A': newPattern.lines[currentLine].trackA = null; break;
          case 'B': newPattern.lines[currentLine].trackB = null; break;
          case 'C': newPattern.lines[currentLine].trackC = null; break;
        }
        
        onPatternChange(newPattern);
      }
    } else if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      // Note off (set to rest)
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };
        
        // Set note off for this track
        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        switch (trackId) {
          case 'A': newPattern.lines[currentLine].trackA = noteOff; break;
          case 'B': newPattern.lines[currentLine].trackB = noteOff; break;
          case 'C': newPattern.lines[currentLine].trackC = noteOff; break;
        }
        
        onPatternChange(newPattern);
      }
    } else if (key === ' ') {
      event.preventDefault();
      // Clear current position and move to next line
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.lines = [...newPattern.lines];
        newPattern.lines[currentLine] = { ...newPattern.lines[currentLine] };
        
        // Clear the note for this track
        switch (trackId) {
          case 'A': newPattern.lines[currentLine].trackA = null; break;
          case 'B': newPattern.lines[currentLine].trackB = null; break;
          case 'C': newPattern.lines[currentLine].trackC = null; break;
        }
        
        onPatternChange(newPattern);
      }
      
      // Move to next line
      onLineChange(Math.min(PATTERN_LENGTH - 1, currentLine + 1));
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
        
        const newNote: Note = { note, octave: finalOctave, instrument: currentInstrument };
        
        // Set the note for this track
        switch (trackId) {
          case 'A': newPattern.lines[currentLine].trackA = newNote; break;
          case 'B': newPattern.lines[currentLine].trackB = newNote; break;
          case 'C': newPattern.lines[currentLine].trackC = newNote; break;
        }
        
        onPatternChange(newPattern);
      }
      
      // Move to next line
      onLineChange(Math.min(PATTERN_LENGTH - 1, currentLine + 1));
    }
  }, [isActive, currentLine, currentOctave, currentInstrument, onLineChange, playPreviewNote, pattern, trackId, onPatternChange]);

  const handleLineClick = useCallback((lineIndex: number) => {
    onLineChange(lineIndex);
    setActiveSection(sectionName);
  }, [setActiveSection, sectionName, onLineChange]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!isActive) return;
    
    event.preventDefault();
    
    // If we're already processing a wheel movement, ignore this event
    if (isProcessingWheel.current) {
      return;
    }
    
    // Set flag to prevent processing additional events from this wheel click
    isProcessingWheel.current = true;
    
    // Move one line based on direction
    const delta = event.deltaY;
    if (delta > 0) {
      // Scroll down - move to next line
      onLineChange(Math.min(PATTERN_LENGTH - 1, currentLine + 1));
    } else if (delta < 0) {
      // Scroll up - move to previous line
      onLineChange(Math.max(0, currentLine - 1));
    }
    
    // Clear the flag after a short delay to allow next wheel click
    setTimeout(() => {
      isProcessingWheel.current = false;
    }, 50);
  }, [isActive, currentLine, onLineChange]);

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
      className={`track-panel track-${trackId.toLowerCase()} ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className="track-header">Track {trackId}</div>
      
      <div className="track-content" onScroll={onScroll}>
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
      
      <div className="track-footer">
        <div className="current-instrument">
          Inst: {currentInstrument}
        </div>
      </div>
    </div>
  );
};
