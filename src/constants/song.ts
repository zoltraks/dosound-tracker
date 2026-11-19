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

// Per-chip stereo modes: `L`/`R`/`C` wire all three of a chip's channels to
// one side; each `ABC` permutation assigns the chip's channels to the left,
// centre, and right slots in order. The same tokens serve both chips - on
// chip 2 they address D/E/F positionally.
export const STEREO_MODES = ['L', 'R', 'C', 'ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'] as const;

export type StereoMode = (typeof STEREO_MODES)[number];
