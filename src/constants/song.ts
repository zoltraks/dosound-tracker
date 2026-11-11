export const DEFAULT_SONG_CHIP = 'YM';
export const DEFAULT_SONG_FRAME = 50;
export const DEFAULT_SONG_CLOCK = 2000000;

// Supported PSG variants: YM2149 and the AY-3-8910 family. The chip
// difference the engines model is the DAC amplitude curve.
export const SUPPORTED_SONG_CHIPS = [DEFAULT_SONG_CHIP, 'AY'];
export const SONG_CHIP_LABELS: Record<string, string> = {
  YM: 'YM2149',
  AY: 'AY8910',
};

export const SUPPORTED_SONG_FRAMES = [50, 60];
export const SUPPORTED_SONG_CLOCKS = [2000000, 1000000];

// Stereo output vocabulary. Channel pans live on a 0..1 scale where 0 is
// full left, 0.5 centre, and 1 full right - centre is the mono mixdown.
export const DEFAULT_CHANNEL_PAN = 0.5;
export const DEFAULT_CHANNEL_PANS: [number, number, number] = [
  DEFAULT_CHANNEL_PAN,
  DEFAULT_CHANNEL_PAN,
  DEFAULT_CHANNEL_PAN,
];

// Named hardware layouts: the canonical A/B/C wirings to stereo positions.
// The catalog is data-driven - a new machine wiring adds an entry here.
export const STEREO_LAYOUTS: Record<string, [number, number, number]> = {
  mono: [DEFAULT_CHANNEL_PAN, DEFAULT_CHANNEL_PAN, DEFAULT_CHANNEL_PAN],
  abc: [0, DEFAULT_CHANNEL_PAN, 1],
  acb: [0, 1, DEFAULT_CHANNEL_PAN],
};

export const STEREO_LAYOUT_ORDER = ['mono', 'abc', 'acb'];
// STEREO_LAYOUT_ORDER is retained for the Song-information stereo toggle
// planned with the pan controls.
