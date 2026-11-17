// Visible-track projection: which song channels the tracker and playlist
// render. The `dualChip` sound setting is the capability gate - while it
// is off the app always shows A-C. While it is on, the `visibleTracks`
// setting picks all six channels or one chip's three at a time; writing a
// pattern onto D/E/F derives the song's two-chip count, so the projection
// never needs the song's current chip count to decide what is editable.
import type { SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';

export const CHIP1_TRACK_IDS: readonly SongChannelId[] = ['A', 'B', 'C'];
export const CHIP2_TRACK_IDS: readonly SongChannelId[] = ['D', 'E', 'F'];

export const visibleTrackIds = (
  dualChipEnabled: boolean,
  visibleTracks: 3 | 6,
  chipGroup: 0 | 1,
): SongChannelId[] => {
  if (!dualChipEnabled) {
    return [...CHIP1_TRACK_IDS];
  }
  if (visibleTracks === 6) {
    return [...SONG_CHANNEL_IDS];
  }
  return [...(chipGroup === 0 ? CHIP1_TRACK_IDS : CHIP2_TRACK_IDS)];
};
