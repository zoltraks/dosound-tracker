import { NOTES, MIN_OCTAVE, MAX_OCTAVE, NOTE_BASE_OCTAVE } from '../constants/music';

export function velocityToVolumeNibble(velocity: number): number {
  const clamped = Math.max(0, Math.min(127, velocity | 0));
  return Math.max(1, Math.min(15, Math.round((clamped / 127) * 15)));
}

export interface BaseKey {
  note: string;
  octave: number;
}

export function transposeMidiNoteToInstrumentBase(
  noteName: string,
  octave: number,
  baseKey: BaseKey
): { note: string; octave: number } | null {
  const normalizedNote = noteName.toUpperCase();
  const noteIndex = NOTES.indexOf(normalizedNote);
  if (noteIndex === -1) {
    return null;
  }

  const baseNoteName = baseKey.note.toUpperCase();
  const baseIndexRaw = NOTES.indexOf(baseNoteName);
  const baseNoteIndex = baseIndexRaw === -1 ? 0 : baseIndexRaw;

  const inputSemis = noteIndex + octave * 12;
  const refSemis = 0 + NOTE_BASE_OCTAVE * 12; // C-<NOTE_BASE_OCTAVE>
  const baseSemis = baseNoteIndex + baseKey.octave * 12;
  const offsetSemis = baseSemis - refSemis;

  const transposedSemis = inputSemis + offsetSemis;
  let transposedOctave = Math.floor(transposedSemis / 12);
  let transposedNoteIndex = transposedSemis % 12;

  if (transposedNoteIndex < 0) {
    transposedNoteIndex += 12;
    transposedOctave -= 1;
  }

  const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, transposedOctave));
  const transposedNoteName = NOTES[transposedNoteIndex];

  return { note: transposedNoteName, octave: clampedOctave };
}
