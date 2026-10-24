import { describe, it, expect } from 'vitest';
import { readSongInfoField, readPlaylistTrack } from '../../src/utils/cursor/panelCursorFields.ts';

describe('readSongInfoField', () => {
  it('preserves a valid field', () => {
    expect(readSongInfoField('author')).toBe('author');
    expect(readSongInfoField('loop')).toBe('loop');
  });

  it('falls back to title for an invalid field', () => {
    expect(readSongInfoField('nope')).toBe('title');
  });

  it('falls back to title for null', () => {
    expect(readSongInfoField(null)).toBe('title');
  });
});

describe('readPlaylistTrack', () => {
  it('preserves a valid track', () => {
    expect(readPlaylistTrack('B')).toBe('B');
    expect(readPlaylistTrack('C')).toBe('C');
  });

  it('falls back to A for an invalid track', () => {
    expect(readPlaylistTrack('D')).toBe('A');
  });

  it('falls back to A for null', () => {
    expect(readPlaylistTrack(null)).toBe('A');
  });
});
