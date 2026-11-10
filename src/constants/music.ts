export const NOTE_FREQUENCIES: { [key: string]: number } = {
  C: 261.63,
  'C#': 277.18,
  D: 293.66,
  'D#': 311.13,
  E: 329.63,
  F: 349.23,
  'F#': 369.99,
  G: 392.0,
  'G#': 415.3,
  A: 440.0,
  'A#': 466.16,
  B: 493.88,
};

// Reference octave for NOTE_FREQUENCIES (A-4 = 440 Hz, C-4 = 261.63, etc.)
export const NOTE_BASE_OCTAVE = 4;

export { KEYBOARD_TO_NOTE } from './keyboard.ts';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const DEFAULT_OCTAVE = 3;
export const MIN_OCTAVE = 0;
export const MAX_OCTAVE = 7;

// Precomputed 2^x scales for the frequency paths. Entries come from Math.pow
// itself so table lookups and the fallback return the identical double.
const POW2_OCTAVE_MIN = -8;
const POW2_OCTAVE_MAX = 8;
export const POW2_OCTAVE_SCALE: readonly number[] = Array.from(
  { length: POW2_OCTAVE_MAX - POW2_OCTAVE_MIN + 1 },
  (_, index) => Math.pow(2, index + POW2_OCTAVE_MIN),
);

const POW2_SEMITONE_MIN = -48;
const POW2_SEMITONE_MAX = 48;
export const POW2_SEMITONE_SCALE: readonly number[] = Array.from(
  { length: POW2_SEMITONE_MAX - POW2_SEMITONE_MIN + 1 },
  (_, index) => Math.pow(2, (index + POW2_SEMITONE_MIN) / 12),
);

export function pow2Octave(exponent: number): number {
  return Number.isInteger(exponent) && exponent >= POW2_OCTAVE_MIN && exponent <= POW2_OCTAVE_MAX
    ? POW2_OCTAVE_SCALE[exponent - POW2_OCTAVE_MIN]
    : Math.pow(2, exponent);
}

export function pow2Semitone(semitones: number): number {
  return Number.isInteger(semitones) &&
    semitones >= POW2_SEMITONE_MIN &&
    semitones <= POW2_SEMITONE_MAX
    ? POW2_SEMITONE_SCALE[semitones - POW2_SEMITONE_MIN]
    : Math.pow(2, semitones / 12);
}

// Controls whether the piano keyboard should render an extra highest C key
// at the right end of the keyboard. By default this is disabled so the
// layout matches the original design without the extra key.
export const PIANO_SHOW_EXTRA_TOP_C = false;

export const PATTERN_LENGTH = 64;
export const MAX_PATTERN_LENGTH = 256;
export const MAX_INSTRUMENTS = 256;

export const VOLUME_MAX = 0x0f;
export const NOISE_MAX = 0x1f;
export const SHIFT_MIN = -24;
export const SHIFT_MAX = 24;
export const PITCH_MIN = -128;
export const PITCH_MAX = 128;

export const ENVELOPE_LENGTH = 32;
