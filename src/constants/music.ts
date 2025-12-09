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

export const KEYBOARD_TO_NOTE: { [key: string]: { note: string; octaveOffset: number } } = {
  'Z': { note: 'C', octaveOffset: 0 },
  'S': { note: 'C#', octaveOffset: 0 },
  'X': { note: 'D', octaveOffset: 0 },
  'D': { note: 'D#', octaveOffset: 0 },
  'C': { note: 'E', octaveOffset: 0 },
  'V': { note: 'F', octaveOffset: 0 },
  'G': { note: 'F#', octaveOffset: 0 },
  'B': { note: 'G', octaveOffset: 0 },
  'H': { note: 'G#', octaveOffset: 0 },
  'N': { note: 'A', octaveOffset: 0 },
  'J': { note: 'A#', octaveOffset: 0 },
  'M': { note: 'B', octaveOffset: 0 },
  ',': { note: 'C', octaveOffset: 1 },
  'L': { note: 'C#', octaveOffset: 1 },
  '.': { note: 'D', octaveOffset: 1 },
  ';': { note: 'D#', octaveOffset: 1 },
  '/': { note: 'E', octaveOffset: 1 },
  'Q': { note: 'C', octaveOffset: 1 },
  '2': { note: 'C#', octaveOffset: 1 },
  'W': { note: 'D', octaveOffset: 1 },
  '3': { note: 'D#', octaveOffset: 1 },
  'E': { note: 'E', octaveOffset: 1 },
  'R': { note: 'F', octaveOffset: 1 },
  '5': { note: 'F#', octaveOffset: 1 },
  'T': { note: 'G', octaveOffset: 1 },
  '6': { note: 'G#', octaveOffset: 1 },
  'Y': { note: 'A', octaveOffset: 1 },
  '7': { note: 'A#', octaveOffset: 1 },
  'U': { note: 'B', octaveOffset: 1 },
  'I': { note: 'C', octaveOffset: 2 },
  '9': { note: 'C#', octaveOffset: 2 },
  'O': { note: 'D', octaveOffset: 2 },
  '0': { note: 'D#', octaveOffset: 2 },
  'P': { note: 'E', octaveOffset: 2 },
  '[': { note: 'F', octaveOffset: 2 },
  '+': { note: 'F#', octaveOffset: 2 },
  ']': { note: 'G', octaveOffset: 2 }
};

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
export const ARPEGGIO_MIN = -24;
export const ARPEGGIO_MAX = 24;
export const PITCH_MIN = -128;
export const PITCH_MAX = 128;

export const ENVELOPE_LENGTH = 32;
