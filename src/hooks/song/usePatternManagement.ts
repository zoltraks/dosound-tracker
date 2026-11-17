import type { Song, Pattern, Step } from '../../synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../constants/music.ts';
import { type PatternId } from '../../types/branded.ts';
import { mapPlaylistEntriesToSongLine, type PlaylistEntry } from '../../types/playlist.ts';

export interface CreatePatternResult {
  updatedSong: Song;
  newPattern: Pattern;
}

export function createPatternForSong(song: Song, patternId: PatternId): CreatePatternResult {
  const targetLength = song.length || PATTERN_LENGTH;

  const newPattern: Pattern = {
    id: patternId,
    name: `Pattern ${patternId}`,
    step: Array.from({ length: targetLength }, () => ({ note: null }) as Step),
  };

  const updatedSong: Song = {
    ...song,
    pattern: [...song.pattern, newPattern],
  };

  return { updatedSong, newPattern };
}

export function addPlaylistEntryToSong(song: Song, entry: PlaylistEntry): Song {
  return {
    ...song,
    line: [...song.line, mapPlaylistEntriesToSongLine([entry])[0]],
  };
}
