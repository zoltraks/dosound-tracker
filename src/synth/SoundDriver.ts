// Song data-model interfaces shared across the tree. The runtime driver that
// once lived in this file was removed; the module keeps its historical name so
// the existing type-import path stays stable.

export interface Instrument {
  id: string;
  name: string;
  volume: number[];
  shift: number[];
  pitch: number[];
  noise: number[];
  mode: number[];
  /** Optional base key used for keyboard preview and pitch calculations. */
  base?: string;
  /** Optional default octave for this instrument. */
  octave?: number;
  // Optional sustain position in the envelope (0-based index). When set,
  // envelope progression should halt at this step until a key release
  // (note-off) occurs, after which the envelopes continue.
  sustain?: number | null;
  /** Optional per-instrument display color in 3-digit hex form (e.g. "#abc"). */
  color?: string | null;
  midi?: {
    channel?: number | null;
    program?: number | null;
  };
}

export interface Note {
  note: string;
  octave: number;
  instrument: string;
}

export interface Step {
  note: Note | null;
  // Optional per-line volume modifier (0-15) used by the tracker "volume column".
  // When undefined, the track keeps the previous modifier (default is 0xF = no attenuation).
  volume?: number | null;
}

export interface Pattern {
  id: string;
  name: string;
  step: Step[];
}

export interface Line {
  A: string;
  B: string;
  C: string;
}

export interface Song {
  title: string;
  author: string;
  year: number;
  speed: number;
  length: number;
  loop?: number | null;
  chip?: string;
  frame?: number;
  clock?: number;
  pattern: Pattern[];
  line: Line[];
  instrument: Instrument[];
}
