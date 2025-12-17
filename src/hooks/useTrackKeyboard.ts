import { useRef, useCallback } from 'react';
import { KEYBOARD_TO_NOTE } from '../constants/music';
import type { Pattern, Note } from '../synth/SoundDriver';
import type { NavigationSection } from '../constants/navigation';

export interface TrackKeyboardOptions {
  isActive: boolean;
  currentLine: number;
  currentOctave: number;
  patternLength: number;
  currentInstrument: string;
  currentColumn: 'note' | 'volume';
  pattern: Pattern | null;
  onLineChange: (lineIndex: number) => void;
  onPatternChange: (pattern: Pattern) => void;
  onToggleLineFromCursor: (lineIndex: number) => void;
  setCurrentColumn: (column: 'note' | 'volume') => void;
  setActiveSection: (section: NavigationSection) => void;
  playPreviewNote: (note: string, octave: number) => void;
  stopPreview: () => void;
  trackId: 'A' | 'B' | 'C';
  onInstrumentChange: (setter: (prev: string) => string) => void;
}

export interface TrackKeyboardActions {
  handleKeyDown: (event: React.KeyboardEvent) => void;
  handleKeyUp: (event: React.KeyboardEvent) => void;
}

export const useTrackKeyboard = (options: TrackKeyboardOptions): TrackKeyboardActions => {
  const {
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
    onInstrumentChange
  } = options;

  const pressedNoteKeysRef = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isActive) return;

    const key = event.key.toUpperCase();

    const isNavigationKey =
      key === 'ARROWUP' ||
      key === 'ARROWDOWN' ||
      key === 'ARROWLEFT' ||
      key === 'ARROWRIGHT' ||
      key === 'PAGEUP' ||
      key === 'PAGEDOWN' ||
      key === 'HOME' ||
      key === 'END';

    if (event.repeat && !isNavigationKey) {
      event.preventDefault();
      return;
    }

    // Navigation
    if (key === 'ARROWUP') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const wrappedIndex = ((currentLine - 1) % length + length) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'ARROWDOWN') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const wrappedIndex = (currentLine + 1) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'PAGEUP') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const step = 16;
      const rawIndex = currentLine - step;
      const wrappedIndex = ((rawIndex % length) + length) % length;
      onLineChange(wrappedIndex);
    } else if (key === 'PAGEDOWN') {
      event.preventDefault();
      const length = Math.max(1, patternLength || 1);
      const step = 16;
      const wrappedIndex = (currentLine + step) % length;
      onLineChange(wrappedIndex);
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
        setCurrentColumn('volume');
      } else {
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
      onToggleLineFromCursor(currentLine);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (!pattern) return;
      const newPattern = { ...pattern };
      newPattern.step = [...newPattern.step];
      newPattern.step[currentLine] = { ...(newPattern.step[currentLine] || { note: null }) };

      if (currentColumn === 'volume') {
        newPattern.step[currentLine].volume = undefined;
      } else {
        newPattern.step[currentLine].note = null;
        newPattern.step[currentLine].volume = undefined;
      }

      onPatternChange(newPattern);
    } else if (event.ctrlKey && key === ' ') {
      event.preventDefault();
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.step = [...newPattern.step];
        newPattern.step[currentLine] = { ...(newPattern.step[currentLine] || { note: null }) };

        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        newPattern.step[currentLine].note = noteOff;

        onPatternChange(newPattern);
      }
    } else if (key === ' ') {
      event.preventDefault();
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.step = [...newPattern.step];
        newPattern.step[currentLine] = { ...(newPattern.step[currentLine] || { note: null }) };

        if (currentColumn === 'volume') {
          newPattern.step[currentLine].volume = undefined;
        } else {
          newPattern.step[currentLine].note = null;
          newPattern.step[currentLine].volume = undefined;
        }

        onPatternChange(newPattern);
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    } else if (!event.ctrlKey && key === '-') {
      event.preventDefault();
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.step = [...newPattern.step];
        newPattern.step[currentLine] = { ...(newPattern.step[currentLine] || { note: null }) };

        const noteOff: Note = { note: '===', octave: 0, instrument: '00' };
        newPattern.step[currentLine].note = noteOff;

        onPatternChange(newPattern);
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    } else if (event.ctrlKey && key === '-') {
      event.preventDefault();
      onInstrumentChange(prev => {
        const instNum = parseInt(prev, 16);
        const newInst = Math.max(0, instNum - 1);
        return newInst.toString(16).padStart(2, '0').toUpperCase();
      });
    } else if (event.ctrlKey && (key === '+' || key === '=')) {
      event.preventDefault();
      onInstrumentChange(prev => {
        const instNum = parseInt(prev, 16);
        const newInst = Math.min(255, instNum + 1);
        return newInst.toString(16).padStart(2, '0').toUpperCase();
      });
    } else if (!event.ctrlKey && currentColumn === 'volume' && /^[0-9A-F]$/.test(key)) {
      event.preventDefault();
      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.step = [...newPattern.step];
        newPattern.step[currentLine] = { ...(newPattern.step[currentLine] || { note: null }) };

        const value = parseInt(key, 16);
        const clamped = Math.max(0, Math.min(0x0f, value));
        newPattern.step[currentLine].volume = clamped;

        onPatternChange(newPattern);
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
      }
    } else if (KEYBOARD_TO_NOTE[key]) {
      event.preventDefault();
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));
      const keyId = `${note}${finalOctave}`;

      if (pressedNoteKeysRef.current.has(keyId)) {
        return;
      }
      pressedNoteKeysRef.current.add(keyId);

      playPreviewNote(note, finalOctave);

      if (pattern) {
        const newPattern = { ...pattern };
        newPattern.step = [...newPattern.step];
        newPattern.step[currentLine] = { ...(newPattern.step[currentLine] || { note: null }) };

        const newNote: Note = { note, octave: finalOctave, instrument: currentInstrument };

        newPattern.step[currentLine].note = newNote;

        onPatternChange(newPattern);
        const length = Math.max(1, patternLength || 1);
        const wrappedIndex = (currentLine + 1) % length;
        onLineChange(wrappedIndex);
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
    onPatternChange,
    onToggleLineFromCursor,
    currentColumn,
    setCurrentColumn,
    setActiveSection,
    trackId,
    onInstrumentChange
  ]);

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isActive) return;

      const key = event.key.toUpperCase();

      if (!KEYBOARD_TO_NOTE[key]) {
        return;
      }

      event.preventDefault();

      const { note, octaveOffset } = KEYBOARD_TO_NOTE[key];
      const finalOctave = Math.max(0, Math.min(7, currentOctave + octaveOffset));
      const keyId = `${note}${finalOctave}`;

      if (pressedNoteKeysRef.current.has(keyId)) {
        pressedNoteKeysRef.current.delete(keyId);
      }

      stopPreview();
    },
    [isActive, currentOctave, stopPreview]
  );

  return {
    handleKeyDown,
    handleKeyUp
  };
};
