// Stereo output helpers: song-file boundary normalization and mode
// resolution. Each chip takes one named wiring stored under `one`/`two`;
// channel pans live on a 0..1 scale where 0 is full left, 0.5 centre,
// and 1 full right.
import type { SongStereo } from '../../synth/SoundDriver.ts';
import { STEREO_MODES, type StereoMode } from '../../constants/song.ts';

const STEREO_MODE_SET = new Set<string>(STEREO_MODES);

const coerceStereoMode = (value: unknown): StereoMode | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const mode = value.trim().toUpperCase();
  return STEREO_MODE_SET.has(mode) ? (mode as StereoMode) : undefined;
};

// Normalize a raw stereo node from YAML or stored JSON into a SongStereo.
// Only the `one` and `two` mode keys carry meaning; legacy `layout` and
// `A`-`F` pan members are ignored. Returns undefined when neither key
// resolves to a valid mode.
export const normalizeSongStereo = (raw: unknown): SongStereo | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const node = raw as { one?: unknown; two?: unknown };
  const stereo: SongStereo = {};

  const one = coerceStereoMode(node.one);
  if (one !== undefined) stereo.one = one;
  const two = coerceStereoMode(node.two);
  if (two !== undefined) stereo.two = two;

  return stereo.one !== undefined || stereo.two !== undefined ? stereo : undefined;
};

// Stereo slots left/centre/right map onto the 0..1 pan scale.
const SLOT_PANS = [0, 0.5, 1] as const;
const CHANNEL_LETTERS = ['A', 'B', 'C'] as const;

// Resolve one mode token to the chip's three channel pans. `L`/`R`/`C`
// wire every channel to one side; a permutation token places each letter
// into the slot matching its position in the string.
const modeToChipPans = (mode: StereoMode): [number, number, number] => {
  if (mode === 'L') return [0, 0, 0];
  if (mode === 'R') return [1, 1, 1];
  if (mode === 'C') return [0.5, 0.5, 0.5];

  const pans: [number, number, number] = [0.5, 0.5, 0.5];
  for (let slot = 0; slot < 3; slot++) {
    const channelIndex = CHANNEL_LETTERS.indexOf(mode[slot] as (typeof CHANNEL_LETTERS)[number]);
    pans[channelIndex] = SLOT_PANS[slot];
  }
  return pans;
};

// Resolve the effective per-channel pans as a six-tuple indexed by channel
// letter position (A=0 .. F=5): `one` feeds A-C and `two` feeds D-F. A
// missing key resolves to the chip-count default - centred for a
// single-chip song, the chip split (chip 1 left, chip 2 right) for a
// two-chip song. The result always carries all six so two-chip songs
// resolve D/E/F through the same rules.
export const resolveChannelPans = (
  stereo: SongStereo | undefined,
  chipCount: 1 | 2 = 1,
): number[] => {
  const one = stereo?.one ?? (chipCount === 2 ? 'L' : 'C');
  const two = stereo?.two ?? (chipCount === 2 ? 'R' : 'C');

  return [...modeToChipPans(one), ...modeToChipPans(two)];
};
