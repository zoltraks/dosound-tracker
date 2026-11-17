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

// Channel vocabulary: A-C address chip 1, D-F address chip 2.
export const SONG_CHANNEL_IDS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const SECOND_CHIP_CHANNEL_IDS = ['D', 'E', 'F'] as const;
export const SINGLE_CHIP_CHANNEL_COUNT = 3;
export const SONG_CHANNEL_COUNT = 6;

export const chipIndexForChannelId = (channelId: string): 0 | 1 => (channelId <= 'C' ? 0 : 1);

export const channelIdsForChip = (chipIndex: 0 | 1): readonly string[] =>
  chipIndex === 0 ? SONG_CHANNEL_IDS.slice(0, 3) : SONG_CHANNEL_IDS.slice(3);

export const channelCountForChipCount = (chipCount: 1 | 2): number =>
  chipCount === 2 ? SONG_CHANNEL_COUNT : SINGLE_CHIP_CHANNEL_COUNT;

// Named hardware layouts: the canonical A/B/C wirings to stereo positions,
// extended to six channels so two-chip songs resolve D/E/F as well. The
// catalog is data-driven - a new machine wiring adds an entry here.
export const STEREO_LAYOUTS: Record<string, [number, number, number, number, number, number]> = {
  mono: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
  abc: [0, 0.5, 1, 0.5, 0.5, 0.5],
  acb: [0, 1, 0.5, 0.5, 0.5, 0.5],
  dual: [0, 0.25, 0.5, 0.5, 0.75, 1],
};

export const STEREO_LAYOUT_ORDER = ['mono', 'abc', 'acb', 'dual'];
// STEREO_LAYOUT_ORDER is retained for the Song-information stereo toggle
// planned with the pan controls.
