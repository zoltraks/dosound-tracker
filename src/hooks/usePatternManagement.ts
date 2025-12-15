import type { Song, Pattern, Step } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';

export interface CreatePatternResult {
  updatedSong: Song;
  newPattern: Pattern;
}

export function createPatternForSong(song: Song, patternId: string): CreatePatternResult {
  const targetLength = song.length || PATTERN_LENGTH;

  const newPattern: Pattern = {
    id: patternId,
    name: `Pattern ${patternId}`,
    step: Array.from({ length: targetLength }, () => ({ note: null } as Step)),
  };

  const updatedSong: Song = {
    ...song,
    pattern: [...song.pattern, newPattern],
  };

  return { updatedSong, newPattern };
}

export function addPlaylistEntryToSong(
  song: Song,
  entry: { A: string; B: string; C: string },
): Song {
  return {
    ...song,
    line: [...song.line, entry],
  };
}
