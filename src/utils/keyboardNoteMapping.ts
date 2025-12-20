import type { KeyboardToNoteMap } from '../constants/keyboard';

export function clampOctave(value: number): number {
  const numeric = Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, Math.min(7, numeric));
}

export function getKeyboardMappedNote(
  keyUpper: string,
  currentOctave: number,
  mapping: KeyboardToNoteMap
): { note: string; octave: number; keyId: string } | null {
  const match = mapping[keyUpper];
  if (!match) {
    return null;
  }

  const octave = clampOctave(currentOctave + match.octaveOffset);
  const keyId = `${match.note}${octave}`;

  return { note: match.note, octave, keyId };
}
