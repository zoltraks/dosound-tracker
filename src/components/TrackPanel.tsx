import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { PATTERN_LENGTH, KEYBOARD_TO_NOTE } from '../constants/music';

interface TrackPanelProps {
  trackId: 'A' | 'B' | 'C';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  currentLine: number;
  onLineChange: (lineIndex: number) => void;
}

interface NoteData {
  note: string;
  octave: number;
  instrument: string;
}

export const TrackPanel: React.FC<TrackPanelProps> = ({
  trackId,
  activeSection,
  setActiveSection,
  currentOctave,
  onScroll,
  currentLine,
  onLineChange
}) => {
  const [pattern, setPattern] = useState<(NoteData | null)[]>(
    Array(PATTERN_LENGTH).fill(null)
  );
  const [currentInstrument, setCurrentInstrument] = useState('00');
  const trackRef = useRef<HTMLDivElement>(null);

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

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
    } else if (key === ' ') {
      event.preventDefault();
      // Clear position
      setPattern(prev => {
        const newPattern = [...prev];
        newPattern[currentLine] = null;
        return newPattern;
      });
    } else if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      // Note off
      setPattern(prev => {
        const newPattern = [...prev];
        newPattern[currentLine] = {
          note: '===',
          octave: 0,
          instrument: '00'
        };
        return newPattern;
      });
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
      
      setPattern(prev => {
        const newPattern = [...prev];
        newPattern[currentLine] = {
          note,
          octave: finalOctave,
          instrument: currentInstrument
        };
        return newPattern;
      });
      
      // Move to next line
      onLineChange(Math.min(PATTERN_LENGTH - 1, currentLine + 1));
    }
  }, [isActive, currentLine, currentOctave, currentInstrument, onLineChange]);

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
      className={`track-panel track-${trackId.toLowerCase()} ${isActive ? 'active' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className="track-header">Track {trackId}</div>
      
      <div className="track-content" onScroll={onScroll}>
        {pattern.map((noteData, lineIndex) => (
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
