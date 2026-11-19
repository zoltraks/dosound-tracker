// Visible-track projection: which song channels the tracker and playlist
// render. The song's resolved chip count is the gate - a single-chip
// song always shows A-C. For a two-chip song the `visibleTracks` setting
// picks all six channels or a three-channel window that slides with the
// focused track.
import type { SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';

export const CHIP1_TRACK_IDS: readonly SongChannelId[] = ['A', 'B', 'C'];

const WINDOW_LENGTH = 3;
const MAX_WINDOW_START = SONG_CHANNEL_IDS.length - WINDOW_LENGTH;

const clampWindowStart = (start: number): number =>
  Math.max(0, Math.min(MAX_WINDOW_START, Math.floor(start)));

// The window start is the index of the first visible channel. Three-track
// windows are A-C, B-C-D, C-D-E, and D-E-F as the start runs 0..3.
export const visibleTrackIds = (
  twoChip: boolean,
  visibleTracks: 3 | 6,
  windowStart: number,
): SongChannelId[] => {
  if (!twoChip) {
    return [...CHIP1_TRACK_IDS];
  }
  if (visibleTracks === 6) {
    return [...SONG_CHANNEL_IDS];
  }
  const start = clampWindowStart(windowStart);
  return [...SONG_CHANNEL_IDS.slice(start, start + WINDOW_LENGTH)];
};

// Minimal window shift that keeps `targetIndex` (a SONG_CHANNEL_IDS index)
// inside the three-track window. A target entering past either edge becomes
// that edge's channel, so single-step moves slide the window by one.
export const nextTrackWindowStart = (start: number, targetIndex: number): number => {
  const current = clampWindowStart(start);
  if (targetIndex < current) {
    return clampWindowStart(targetIndex);
  }
  if (targetIndex > current + WINDOW_LENGTH - 1) {
    return clampWindowStart(targetIndex - (WINDOW_LENGTH - 1));
  }
  return current;
};
