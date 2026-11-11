import { useCallback, useMemo } from 'react';
import type { Song, SongStereo } from '../../synth/SoundDriver.ts';
import type { UpdateSongOptions } from './useDataManagement.ts';
import { nextChannelPan, resolveChannelPans } from '../../utils/song/songStereo.ts';

export interface UseChannelPansParams {
  stereo: SongStereo | undefined;
  updateSong: (updates: Partial<Song>, options?: UpdateSongOptions) => void;
}

export interface UseChannelPansResult {
  channelPans: [number, number, number];
  handleChannelPanChange: (channelIndex: number) => void;
}

/**
 * Owns the stereo pan routing surface for the song: the resolved per-channel
 * pans fed to the audio engine and the EQ pan button handler that advances a
 * channel to the next catalog position and persists it as a free override on
 * the song's stereo node.
 */
export function useChannelPans({ stereo, updateSong }: UseChannelPansParams): UseChannelPansResult {
  const channelPans = useMemo(() => resolveChannelPans(stereo), [stereo]);

  // EQ pan button: advance one channel to the next pan position and persist
  // it as a free override on the song's stereo node.
  const handleChannelPanChange = useCallback(
    (channelIndex: number) => {
      if (channelIndex < 0 || channelIndex > 2) {
        return;
      }
      const key = (['A', 'B', 'C'] as const)[channelIndex];
      const pans = resolveChannelPans(stereo);
      updateSong({
        stereo: { ...(stereo ?? {}), [key]: nextChannelPan(pans[channelIndex]) },
      });
    },
    [stereo, updateSong],
  );

  return { channelPans, handleChannelPanChange };
}
