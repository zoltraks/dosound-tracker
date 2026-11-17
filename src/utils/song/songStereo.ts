// Stereo output helpers: song-file boundary normalization and pan
// resolution. Channel pans live on a 0..1 scale where 0 is full left,
// 0.5 centre, and 1 full right.
import type { SongStereo } from '../../synth/SoundDriver.ts';
import { STEREO_LAYOUTS, SONG_CHANNEL_COUNT, SONG_CHANNEL_IDS } from '../../constants/song.ts';

export const clampChannelPan = (value: number): number => Math.min(1, Math.max(0, value));

const coerceChannelPan = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clampChannelPan(numeric) : undefined;
};

// Normalize a raw stereo node from YAML or stored JSON into a SongStereo.
// A bare string is shorthand for the layout id; a mapping carries an
// optional `layout` plus `A`-`F` channel overrides. Returns undefined
// when the input carries no usable member.
export const normalizeSongStereo = (raw: unknown): SongStereo | undefined => {
  if (typeof raw === 'string') {
    const layout = raw.trim().toLowerCase();
    return layout ? { layout } : undefined;
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const node = raw as {
    layout?: unknown;
    A?: unknown;
    B?: unknown;
    C?: unknown;
    D?: unknown;
    E?: unknown;
    F?: unknown;
  };
  const stereo: SongStereo = {};

  if (typeof node.layout === 'string' && node.layout.trim()) {
    stereo.layout = node.layout.trim().toLowerCase();
  }

  const channelKeys = SONG_CHANNEL_IDS;
  for (const key of channelKeys) {
    const pan = coerceChannelPan(node[key]);
    if (pan !== undefined) stereo[key] = pan;
  }

  return stereo.layout !== undefined ||
    stereo.A !== undefined ||
    stereo.B !== undefined ||
    stereo.C !== undefined ||
    stereo.D !== undefined ||
    stereo.E !== undefined ||
    stereo.F !== undefined
    ? stereo
    : undefined;
};

// Resolve the effective per-channel pans as a six-tuple indexed by channel
// letter position (A=0 .. F=5): the catalog pans for the named layout
// (absent or unknown layouts resolve as `mono`) with each channel override
// applied to its own slot. Callers needing only the first three channels
// read indices 0-2; the result always carries all six so two-chip songs
// resolve D/E/F through the same rules.
export const resolveChannelPans = (stereo: SongStereo | undefined): number[] => {
  const layoutPans =
    (stereo?.layout ? STEREO_LAYOUTS[stereo.layout] : undefined) ?? STEREO_LAYOUTS.mono;
  const pans: number[] = Array.from({ length: SONG_CHANNEL_COUNT }, (_, i) => layoutPans[i]);

  if (stereo) {
    const channelKeys = SONG_CHANNEL_IDS;
    for (let channel = 0; channel < SONG_CHANNEL_COUNT; channel++) {
      const value = stereo[channelKeys[channel]];
      if (typeof value === 'number' && Number.isFinite(value)) {
        pans[channel] = clampChannelPan(value);
      }
    }
  }

  return pans;
};
