// Stereo output helpers: song-file boundary normalization and pan
// resolution. Channel pans live on a 0..1 scale where 0 is full left,
// 0.5 centre, and 1 full right.
import type { SongStereo } from '../../synth/SoundDriver.ts';
import { DEFAULT_CHANNEL_PANS, STEREO_LAYOUTS } from '../../constants/song.ts';

export const clampChannelPan = (value: number): number => Math.min(1, Math.max(0, value));

const coerceChannelPan = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clampChannelPan(numeric) : undefined;
};

// Normalize a raw stereo node from YAML or stored JSON into a SongStereo.
// A bare string is shorthand for the layout id; a mapping carries an
// optional `layout` plus `A`/`B`/`C` channel overrides. Returns undefined
// when the input carries no usable member.
export const normalizeSongStereo = (raw: unknown): SongStereo | undefined => {
  if (typeof raw === 'string') {
    const layout = raw.trim().toLowerCase();
    return layout ? { layout } : undefined;
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }

  const node = raw as { layout?: unknown; A?: unknown; B?: unknown; C?: unknown };
  const stereo: SongStereo = {};

  if (typeof node.layout === 'string' && node.layout.trim()) {
    stereo.layout = node.layout.trim().toLowerCase();
  }

  const panA = coerceChannelPan(node.A);
  const panB = coerceChannelPan(node.B);
  const panC = coerceChannelPan(node.C);
  if (panA !== undefined) stereo.A = panA;
  if (panB !== undefined) stereo.B = panB;
  if (panC !== undefined) stereo.C = panC;

  return stereo.layout !== undefined ||
    stereo.A !== undefined ||
    stereo.B !== undefined ||
    stereo.C !== undefined
    ? stereo
    : undefined;
};

// Resolve the effective per-channel pans: the catalog pans for the named
// layout (absent or unknown layouts resolve as `mono`) with each channel
// override applied to its own slot.
export const resolveChannelPans = (stereo: SongStereo | undefined): [number, number, number] => {
  const layoutPans =
    (stereo?.layout ? STEREO_LAYOUTS[stereo.layout] : undefined) ?? DEFAULT_CHANNEL_PANS;
  const pans: [number, number, number] = [layoutPans[0], layoutPans[1], layoutPans[2]];

  if (stereo) {
    const overrides = [stereo.A, stereo.B, stereo.C];
    for (let channel = 0; channel < 3; channel++) {
      const value = overrides[channel];
      if (typeof value === 'number' && Number.isFinite(value)) {
        pans[channel] = clampChannelPan(value);
      }
    }
  }

  return pans;
};
