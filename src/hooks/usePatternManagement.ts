import type { Song, Pattern } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

export interface CreatePatternResult {
  updatedSong: Song;
  newPattern: Pattern;
}

export function createPatternForSong(song: Song, patternId: string): CreatePatternResult {
  const targetLength = song.patternLength || PATTERN_LENGTH;

  const newPattern: Pattern = {
    id: patternId,
    name: `Pattern ${patternId}`,
    lines: Array(targetLength)
      .fill(null)
      .map(() => ({
        trackA: null,
        trackB: null,
        trackC: null,
      })),
  };

  const updatedSong: Song = {
    ...song,
    patterns: [...song.patterns, newPattern],
  };

  return { updatedSong, newPattern };
}

export function addPlaylistEntryToSong(
  song: Song,
  entry: { trackA: string; trackB: string; trackC: string },
): Song {
  return {
    ...song,
    playlist: [...song.playlist, entry],
  };
}
