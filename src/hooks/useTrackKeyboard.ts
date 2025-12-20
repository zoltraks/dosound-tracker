import { useCallback } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { KEYBOARD_TO_NOTE } from '../constants/music';
import type { Instrument, Pattern } from '../synth/SoundDriver';
import {
  getKeyboardMappedNote,
  getNextTrackSection,
  getPreviousTrackSection,
  isNavigationKey,
  parseVolumeNibble,
  stepLineIndex,
} from '../utils/trackPanelUtils';
import { insertNoteAtLine, insertNoteOffStep, setPatternVolume, clearPatternPosition } from '../utils/trackOperations';
import { stepInstrumentId } from '../utils/instrumentSelection';

export interface UseTrackKeyboardParams {
  isActive: boolean;
  currentLine: number;
  currentOctave: number;
  patternLength: number;
  currentColumn: 'note' | 'volume';
  trackId: 'A' | 'B' | 'C';
  pattern: Pattern | null;
  currentInstrumentData: Instrument;
  onLineChange: (lineIndex: number) => void;
  onPatternChange: (pattern: Pattern) => void;
  onToggleLineFromCursor: (lineIndex: number) => void;
  setActiveSection: (section: NavigationSection) => void;
  setCurrentColumn: (column: 'note' | 'volume') => void;
  setCurrentInstrument: Dispatch<SetStateAction<string>>;
  playPreviewNote: (note: string, octave: number) => void;
  stopPreview: () => void;
  pressedNoteKeysRef: MutableRefObject<Set<string>>;
  activePreviewKeyRef: MutableRefObject<string | null>;
  previewSustainIndexRef: MutableRefObject<number | null>;
  previewReleasedRef: MutableRefObject<boolean>;
}

export function useTrackKeyboard({
  isActive,
  currentLine,
  currentOctave,
  patternLength,
  currentColumn,
  trackId,
  pattern,
  currentInstrumentData,
  onLineChange,
  onPatternChange,
  onToggleLineFromCursor,
  setActiveSection,
  setCurrentColumn,
  setCurrentInstrument,
  playPreviewNote,
  stopPreview,
  pressedNoteKeysRef,
  activePreviewKeyRef,
  previewSustainIndexRef,
  previewReleasedRef,
}: UseTrackKeyboardParams) {
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
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
        onToggleLineFromCursor(currentLine);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        if (!pattern) return;

        const newPattern = clearPatternPosition(pattern, currentLine, currentColumn);
        onPatternChange(newPattern);
      } else if (event.ctrlKey && key === ' ') {
        event.preventDefault();
        if (pattern) {
          const newPattern = insertNoteOffStep(pattern, currentLine);
          onPatternChange(newPattern);
        }
      } else if (key === ' ') {
        event.preventDefault();
        if (pattern) {
          const newPattern = clearPatternPosition(pattern, currentLine, currentColumn);
          onPatternChange(newPattern);
          onLineChange(stepLineIndex(currentLine, patternLength, 1));
        }
      } else if (!event.ctrlKey && key === '-') {
        event.preventDefault();
        if (pattern) {
          const newPattern = insertNoteOffStep(pattern, currentLine);
          onPatternChange(newPattern);
          onLineChange(stepLineIndex(currentLine, patternLength, 1));
        }
      } else if (event.ctrlKey && key === '-') {
        event.preventDefault();
        setCurrentInstrument(prev => stepInstrumentId(prev, -1));
      } else if (event.ctrlKey && (key === '+' || key === '=')) {
        event.preventDefault();
        setCurrentInstrument(prev => stepInstrumentId(prev, 1));
      } else if (!event.ctrlKey && currentColumn === 'volume' && parseVolumeNibble(key) !== null) {
        const nibble = parseVolumeNibble(key) as number;
        event.preventDefault();
        if (pattern) {
          const newPattern = setPatternVolume(pattern, currentLine, nibble);
          onPatternChange(newPattern);
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

        if (pattern) {
          const newNote = { note, octave: finalOctave, instrument: currentInstrumentData.id };
          const newPattern = insertNoteAtLine(pattern, currentLine, newNote);
          onPatternChange(newPattern);
          onLineChange(stepLineIndex(currentLine, patternLength, 1));
        }
      }
    },
    [
      isActive,
      currentLine,
      patternLength,
      currentColumn,
      trackId,
      pattern,
      currentOctave,
      currentInstrumentData.id,
      onLineChange,
      onPatternChange,
      onToggleLineFromCursor,
      setActiveSection,
      setCurrentColumn,
      setCurrentInstrument,
      playPreviewNote,
      pressedNoteKeysRef,
    ]
  );

  const handleKeyUp = useCallback(
    (event: ReactKeyboardEvent) => {
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
        previewReleasedRef.current = true;
      } else {
        stopPreview();
      }
    },
    [
      isActive,
      currentOctave,
      pressedNoteKeysRef,
      activePreviewKeyRef,
      previewSustainIndexRef,
      previewReleasedRef,
      stopPreview,
    ]
  );

  return { handleKeyDown, handleKeyUp };
}
