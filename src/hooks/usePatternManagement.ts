import type { Song, Pattern, Step } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import {
  asPlaylistPatternId,
  type PatternId,
} from '../types/branded';
import type { PlaylistEntry } from '../types/playlist';

export interface CreatePatternResult {
  updatedSong: Song;
  newPattern: Pattern;
}

export function createPatternForSong(song: Song, patternId: PatternId): CreatePatternResult {
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
  entry: PlaylistEntry,
): Song {
  const normalizedEntry: Song['line'][number] = {
    A: entry.A === '--' ? entry.A : asPlaylistPatternId(entry.A),
    B: entry.B === '--' ? entry.B : asPlaylistPatternId(entry.B),
    C: entry.C === '--' ? entry.C : asPlaylistPatternId(entry.C),
  };

  return {
    ...song,
    line: [...song.line, normalizedEntry],
  };
}
