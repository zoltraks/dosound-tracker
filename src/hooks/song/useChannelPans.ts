import { useMemo } from 'react';
import type { SongStereo } from '../../synth/SoundDriver.ts';
import { resolveChannelPans } from '../../utils/song/songStereo.ts';

export interface UseChannelPansParams {
  stereo: SongStereo | undefined;
}

export interface UseChannelPansResult {
  channelPans: number[];
}

/**
 * Resolves the song's stereo node into the per-channel pans fed to the
 * audio engine. The tuple covers all six song channels (A-F); single-chip
 * consumers read the first three.
 */
export function useChannelPans({ stereo }: UseChannelPansParams): UseChannelPansResult {
  const channelPans = useMemo(() => resolveChannelPans(stereo), [stereo]);

  return { channelPans };
}
