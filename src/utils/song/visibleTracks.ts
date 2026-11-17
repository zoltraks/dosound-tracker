// Visible-track projection: which song channels the tracker and playlist
// render. Single-chip songs and the disabled dual-chip setting always show
// A-C; a two-chip song shows all six channels in six-track mode, or one
// chip's three channels at a time in three-track mode.
import type { Song, SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';
import { songChipCount } from './songChips.ts';

export const CHIP1_TRACK_IDS: readonly SongChannelId[] = ['A', 'B', 'C'];
export const CHIP2_TRACK_IDS: readonly SongChannelId[] = ['D', 'E', 'F'];

export const isDualChipView = (
  dualChipEnabled: boolean,
  song: Pick<Song, 'chipCount' | 'line'>,
): boolean => dualChipEnabled && songChipCount(song) === 2;

export const visibleTrackIds = (
  dualChipEnabled: boolean,
  song: Pick<Song, 'chipCount' | 'line'>,
  visibleTracks: 3 | 6,
  chipGroup: 0 | 1,
): SongChannelId[] => {
  if (!isDualChipView(dualChipEnabled, song)) {
    return [...CHIP1_TRACK_IDS];
  }
  if (visibleTracks === 6) {
    return [...SONG_CHANNEL_IDS];
  }
  return [...(chipGroup === 0 ? CHIP1_TRACK_IDS : CHIP2_TRACK_IDS)];
};
