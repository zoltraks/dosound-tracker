import { useMemo } from 'react';
import type { SongStereo } from '../../synth/SoundDriver.ts';
import { resolveChannelPans } from '../../utils/song/songStereo.ts';

export interface UseChannelPansParams {
  stereo: SongStereo | undefined;
  chipCount?: 1 | 2;
  mono?: boolean;
}

export interface UseChannelPansResult {
  channelPans: number[];
}

const MONO_PANS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

/**
 * Resolves the song's stereo node into the per-channel pans fed to the
 * audio engine. The tuple covers all six song channels (A-F); single-chip
 * consumers read the first three. `chipCount` selects the fallback wiring
 * for songs without stereo settings - centred for one chip, the
 * chip-separated split for two. `mono` is the app-level override that
 * centres every channel regardless of the song's modes.
 */
export function useChannelPans({
  stereo,
  chipCount = 1,
  mono = false,
}: UseChannelPansParams): UseChannelPansResult {
  const channelPans = useMemo(
    () => (mono ? [...MONO_PANS] : resolveChannelPans(stereo, chipCount)),
    [stereo, chipCount, mono],
  );

  return { channelPans };
}
