// Chip-count helpers: a song addresses one or two AY/YM chips. The
// optional `chipCount` field wins when present; otherwise the count
// derives from playlist content - any entry naming a pattern on D/E/F
// means the second chip is in use.
import type { Song } from '../../synth/SoundDriver.ts';
import {
  SECOND_CHIP_CHANNEL_IDS,
  SONG_CHANNEL_COUNT,
  SINGLE_CHIP_CHANNEL_COUNT,
} from '../../constants/song.ts';

const entryUsesChip2 = (entry: Song['line'][number]): boolean =>
  SECOND_CHIP_CHANNEL_IDS.some((key) => {
    const value = entry[key];
    return typeof value === 'string' && value !== '--';
  });

// Effective chip count: an explicit `chipCount` of 1 or 2 is authoritative;
// without it the count derives from the playlist.
export const songChipCount = (song: Pick<Song, 'chipCount' | 'line'>): 1 | 2 => {
  if (song.chipCount === 1 || song.chipCount === 2) {
    return song.chipCount;
  }
  return song.line.some(entryUsesChip2) ? 2 : 1;
};

export const songUsesTwoChips = (song: Pick<Song, 'chipCount' | 'line'>): boolean =>
  songChipCount(song) === 2;

// Number of active song channels: three per chip.
export const songChannelCount = (song: Pick<Song, 'chipCount' | 'line'>): number =>
  songChipCount(song) === 2 ? SONG_CHANNEL_COUNT : SINGLE_CHIP_CHANNEL_COUNT;
