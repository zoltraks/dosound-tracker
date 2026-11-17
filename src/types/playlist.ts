import type { Song } from '../synth/SoundDriver.ts';
import { asPlaylistPatternId, type PlaylistPatternId } from './branded.ts';

export type PlaylistEntry = {
  A: PlaylistPatternId | '--';
  B: PlaylistPatternId | '--';
  C: PlaylistPatternId | '--';
  D?: PlaylistPatternId | '--';
  E?: PlaylistPatternId | '--';
  F?: PlaylistPatternId | '--';
};

const normalizeValue = (value: string): PlaylistPatternId | '--' =>
  value === '--' ? '--' : asPlaylistPatternId(value);

const normalizePlaylistLineEntry = (entry: Song['line'][number]): PlaylistEntry => ({
  A: normalizeValue(entry.A),
  B: normalizeValue(entry.B),
  C: normalizeValue(entry.C),
  ...(entry.D !== undefined ? { D: normalizeValue(entry.D) } : {}),
  ...(entry.E !== undefined ? { E: normalizeValue(entry.E) } : {}),
  ...(entry.F !== undefined ? { F: normalizeValue(entry.F) } : {}),
});

const serializePlaylistEntry = (entry: PlaylistEntry): Song['line'][number] => ({
  A: entry.A,
  B: entry.B,
  C: entry.C,
  ...(entry.D !== undefined ? { D: entry.D } : {}),
  ...(entry.E !== undefined ? { E: entry.E } : {}),
  ...(entry.F !== undefined ? { F: entry.F } : {}),
});

export const mapSongLineToPlaylistEntries = (line: Song['line']): PlaylistEntry[] =>
  line.map(normalizePlaylistLineEntry);

export const mapPlaylistEntriesToSongLine = (entries: PlaylistEntry[]): Song['line'] =>
  entries.map(serializePlaylistEntry) as Song['line'];
