import type { Song } from '../synth/SoundDriver';
import { asPlaylistPatternId, type PlaylistPatternId } from './branded';

export type PlaylistEntry = {
  A: PlaylistPatternId | '--';
  B: PlaylistPatternId | '--';
  C: PlaylistPatternId | '--';
};

const normalizeValue = (value: string): PlaylistPatternId | '--' =>
  value === '--' ? '--' : asPlaylistPatternId(value);

export const normalizePlaylistLineEntry = (entry: Song['line'][number]): PlaylistEntry => ({
  A: normalizeValue(entry.A),
  B: normalizeValue(entry.B),
  C: normalizeValue(entry.C),
});

export const serializePlaylistEntry = (entry: PlaylistEntry): Song['line'][number] => ({
  A: entry.A,
  B: entry.B,
  C: entry.C,
});

export const mapSongLineToPlaylistEntries = (line: Song['line']): PlaylistEntry[] =>
  line.map(normalizePlaylistLineEntry);

export const mapPlaylistEntriesToSongLine = (entries: PlaylistEntry[]): Song['line'] =>
  entries.map(serializePlaylistEntry) as Song['line'];
