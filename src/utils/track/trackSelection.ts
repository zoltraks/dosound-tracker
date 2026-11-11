import { StorageKeys } from '../storage/storageKeys.ts';

export type TrackSelectionTrackId = 'A' | 'B' | 'C';

/** The selection keeps the anchor row where it started and the head row that
 *  follows the cursor. The covered range includes the anchor and excludes the
 *  head - the cursor row itself is never part of the selection. */
export interface TrackSelection {
  trackId: TrackSelectionTrackId;
  anchor: number;
  head: number;
}

export interface TrackSelectionRange {
  start: number;
  end: number;
}

const TRACK_IDS: readonly string[] = ['A', 'B', 'C'];

export const normalizeTrackSelection = (selection: TrackSelection): TrackSelectionRange => {
  if (selection.head > selection.anchor) {
    return { start: selection.anchor, end: selection.head - 1 };
  }
  if (selection.head < selection.anchor) {
    return { start: selection.head + 1, end: selection.anchor };
  }
  return { start: selection.anchor, end: selection.anchor };
};

export const clampSelectionRow = (row: number, patternLength: number): number => {
  const max = Math.max(0, patternLength - 1);
  return Math.min(Math.max(0, row), max);
};

/** Extends the selection by one cursor step. Extension continues only while
 *  the cursor sits on the selection's moving edge - a selection held on
 *  another track, or a cursor anywhere else, is replaced by a fresh range
 *  anchored at the cursor. Collapsing the head back onto the anchor clears
 *  the selection entirely, so a range never shrinks to a single row. */
export const extendTrackSelection = (
  current: TrackSelection | null,
  trackId: TrackSelectionTrackId,
  cursorRow: number,
  delta: number,
  patternLength: number,
): TrackSelection | null => {
  if (current && current.trackId === trackId && current.head === cursorRow) {
    const head = clampSelectionRow(current.head + delta, patternLength);
    return head === current.anchor ? null : { ...current, head };
  }
  const anchor = clampSelectionRow(cursorRow, patternLength);
  const head = clampSelectionRow(cursorRow + delta, patternLength);
  return head === anchor ? null : { trackId, anchor, head };
};

/** Returns the normalized range when the selection belongs to the given
 *  track, clamped to the pattern, or null when it belongs elsewhere. */
export const selectionRangeForTrack = (
  selection: TrackSelection | null,
  trackId: TrackSelectionTrackId,
  patternLength: number,
): TrackSelectionRange | null => {
  if (!selection || selection.trackId !== trackId) {
    return null;
  }
  const range = normalizeTrackSelection(selection);
  const max = Math.max(0, patternLength - 1);
  return { start: Math.min(range.start, max), end: Math.min(range.end, max) };
};

export const readTrackSelection = (patternLength: number): TrackSelection | null => {
  try {
    const stored = window.localStorage.getItem(StorageKeys.TRACK_SELECTION);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as Partial<TrackSelection> | null;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (!TRACK_IDS.includes(parsed.trackId as string)) {
      return null;
    }
    if (
      typeof parsed.anchor !== 'number' ||
      !Number.isFinite(parsed.anchor) ||
      typeof parsed.head !== 'number' ||
      !Number.isFinite(parsed.head)
    ) {
      return null;
    }
    return {
      trackId: parsed.trackId as TrackSelectionTrackId,
      anchor: clampSelectionRow(parsed.anchor, patternLength),
      head: clampSelectionRow(parsed.head, patternLength),
    };
  } catch {
    return null;
  }
};

export const writeTrackSelection = (selection: TrackSelection | null): void => {
  try {
    if (!selection) {
      window.localStorage.removeItem(StorageKeys.TRACK_SELECTION);
      return;
    }
    window.localStorage.setItem(StorageKeys.TRACK_SELECTION, JSON.stringify(selection));
  } catch {
    // ignore
  }
};
