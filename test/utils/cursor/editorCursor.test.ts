import { describe, it, expect } from 'vitest';
import {
  parseEditorCursor,
  clampEditorCursor,
  serializeEditorCursor,
  type EditorCursor,
} from '../../../src/utils/cursor/editorCursor.ts';

const validCursor: EditorCursor = {
  section: 'volume',
  track: 'B',
  playlistLine: 5,
  trackRow: 16,
  column: 'note',
};

describe('parseEditorCursor', () => {
  it('parses a valid stored cursor', () => {
    const parsed = parseEditorCursor(JSON.stringify(validCursor));
    expect(parsed).toEqual(validCursor);
  });

  it('returns null for null input', () => {
    expect(parseEditorCursor(null)).toBeNull();
  });

  it('returns null for non-JSON input', () => {
    expect(parseEditorCursor('not json')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(parseEditorCursor('5')).toBeNull();
  });

  it('returns null when the track is invalid', () => {
    expect(parseEditorCursor(JSON.stringify({ ...validCursor, track: 'D' }))).toBeNull();
  });

  it('returns null when the column is invalid', () => {
    expect(parseEditorCursor(JSON.stringify({ ...validCursor, column: 'pitch' }))).toBeNull();
  });

  it('returns null when a numeric field is missing', () => {
    const withoutPlaylistLine = { section: 'volume', track: 'B', trackRow: 16, column: 'note' };
    expect(parseEditorCursor(JSON.stringify(withoutPlaylistLine))).toBeNull();
  });

  it('returns null when a numeric field is not a number', () => {
    expect(parseEditorCursor(JSON.stringify({ ...validCursor, trackRow: '16' }))).toBeNull();
  });

  it('floors non-integer numeric fields', () => {
    const parsed = parseEditorCursor(JSON.stringify({ ...validCursor, playlistLine: 5.9 }));
    expect(parsed?.playlistLine).toBe(5);
  });

  it('preserves a valid section', () => {
    const parsed = parseEditorCursor(JSON.stringify({ ...validCursor, section: 'instrumentList' }));
    expect(parsed?.section).toBe('instrumentList');
  });

  it('defaults an invalid section to the selected track section', () => {
    const parsed = parseEditorCursor(JSON.stringify({ ...validCursor, section: 'nope' }));
    expect(parsed?.section).toBe('trackB');
  });

  it('defaults a missing section to the selected track section', () => {
    const withoutSection = { track: 'B', playlistLine: 5, trackRow: 16, column: 'note' };
    const parsed = parseEditorCursor(JSON.stringify(withoutSection));
    expect(parsed?.section).toBe('trackB');
  });
});

describe('clampEditorCursor', () => {
  it('returns an in-range cursor unchanged', () => {
    expect(clampEditorCursor(validCursor, 8, 64)).toEqual(validCursor);
  });

  it('clamps the playlist line to the last valid index', () => {
    const clamped = clampEditorCursor({ ...validCursor, playlistLine: 20 }, 4, 64);
    expect(clamped.playlistLine).toBe(3);
  });

  it('clamps the playlist line to 0 for an empty playlist', () => {
    const clamped = clampEditorCursor({ ...validCursor, playlistLine: 5 }, 0, 64);
    expect(clamped.playlistLine).toBe(0);
  });

  it('clamps the track row to the pattern length', () => {
    const clamped = clampEditorCursor({ ...validCursor, trackRow: 200 }, 8, 64);
    expect(clamped.trackRow).toBe(63);
  });

  it('clamps negative values to 0', () => {
    const clamped = clampEditorCursor({ ...validCursor, playlistLine: -3, trackRow: -1 }, 8, 64);
    expect(clamped.playlistLine).toBe(0);
    expect(clamped.trackRow).toBe(0);
  });

  it('passes the section and column through unchanged', () => {
    const clamped = clampEditorCursor(validCursor, 8, 64);
    expect(clamped.section).toBe('volume');
    expect(clamped.column).toBe('note');
  });
});

describe('serializeEditorCursor', () => {
  it('round-trips through parseEditorCursor', () => {
    expect(parseEditorCursor(serializeEditorCursor(validCursor))).toEqual(validCursor);
  });
});
