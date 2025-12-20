export const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88
};

// Reference octave for NOTE_FREQUENCIES (A-4 = 440 Hz, C-4 = 261.63, etc.)
export const NOTE_BASE_OCTAVE = 4;

export { KEYBOARD_TO_NOTE } from './keyboard';

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const DEFAULT_OCTAVE = 3;
export const MIN_OCTAVE = 0;
export const MAX_OCTAVE = 7;

// Controls whether the piano keyboard should render an extra highest C key
// at the right end of the keyboard. By default this is disabled so the
// layout matches the original design without the extra key.
export const PIANO_SHOW_EXTRA_TOP_C = false;

export const PATTERN_LENGTH = 64;
export const MAX_INSTRUMENTS = 256;

export const VOLUME_MAX = 0x0F;
export const NOISE_MAX = 0x1F;
export const SHIFT_MIN = -24;
export const SHIFT_MAX = 24;
export const ARPEGGIO_MIN = SHIFT_MIN;
export const ARPEGGIO_MAX = SHIFT_MAX;
export const PITCH_MIN = -128;
export const PITCH_MAX = 128;

export const ENVELOPE_LENGTH = 32;
