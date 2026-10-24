// Pure parsing, validation, clamping, and serialisation for the persisted
// top-level editor cursor (focused section, selected track, playlist line,
// track row, and track column).

import { NAVIGATION_ORDER, type NavigationSection } from '../../constants/navigation.ts';

export type CursorTrack = 'A' | 'B' | 'C';
export type CursorColumn = 'note' | 'volume';

export interface EditorCursor {
  section: NavigationSection;
  track: CursorTrack;
  playlistLine: number;
  trackRow: number;
  column: CursorColumn;
}

const TRACKS: readonly CursorTrack[] = ['A', 'B', 'C'];
const COLUMNS: readonly CursorColumn[] = ['note', 'volume'];

function isTrack(value: unknown): value is CursorTrack {
  return typeof value === 'string' && (TRACKS as readonly string[]).includes(value);
}

function isColumn(value: unknown): value is CursorColumn {
  return typeof value === 'string' && (COLUMNS as readonly string[]).includes(value);
}

function isSection(value: unknown): value is NavigationSection {
  return typeof value === 'string' && (NAVIGATION_ORDER as readonly string[]).includes(value);
}

function toInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return Math.floor(value);
}

// Parse and validate raw local storage content. Returns null on any invalid input.
// A missing or invalid section defaults to the selected track's section.
export function parseEditorCursor(raw: string | null): EditorCursor | null {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (!isTrack(record.track) || !isColumn(record.column)) {
    return null;
  }

  const playlistLine = toInteger(record.playlistLine);
  const trackRow = toInteger(record.trackRow);
  if (playlistLine === null || trackRow === null) {
    return null;
  }

  const track = record.track;
  const section = isSection(record.section)
    ? record.section
    : (`track${track}` as NavigationSection);

  return {
    section,
    track,
    playlistLine,
    trackRow,
    column: record.column,
  };
}

function clampIndex(value: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(length - 1, value));
}

export function clampEditorCursor(
  cursor: EditorCursor,
  playlistLength: number,
  patternLength: number,
): EditorCursor {
  return {
    ...cursor,
    playlistLine: clampIndex(cursor.playlistLine, playlistLength),
    trackRow: clampIndex(cursor.trackRow, patternLength),
  };
}

export function serializeEditorCursor(cursor: EditorCursor): string {
  return JSON.stringify(cursor);
}
