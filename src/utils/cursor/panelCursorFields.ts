// Pure validators for single-value panel cursors persisted through
// useLocalStorageState. Each reader falls back to a safe default.

export const SONG_INFO_FIELDS = ['title', 'author', 'year', 'speed', 'length', 'loop'] as const;

export type SongInfoField = (typeof SONG_INFO_FIELDS)[number];

export function readSongInfoField(raw: string | null): SongInfoField {
  return (SONG_INFO_FIELDS as readonly string[]).includes(raw ?? '')
    ? (raw as SongInfoField)
    : 'title';
}

export const PLAYLIST_TRACKS = ['A', 'B', 'C'] as const;

export type PlaylistTrack = (typeof PLAYLIST_TRACKS)[number];

export function readPlaylistTrack(raw: string | null): PlaylistTrack {
  return (PLAYLIST_TRACKS as readonly string[]).includes(raw ?? '') ? (raw as PlaylistTrack) : 'A';
}
