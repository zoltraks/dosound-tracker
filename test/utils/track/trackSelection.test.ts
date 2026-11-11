import { describe, it, expect, beforeEach } from 'vitest';
import {
  clampSelectionRow,
  extendTrackSelection,
  normalizeTrackSelection,
  readTrackSelection,
  selectionRangeForTrack,
  writeTrackSelection,
} from '../../../src/utils/track/trackSelection.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

describe('trackSelection', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('normalizes a selection into a start/end range excluding the head row', () => {
    expect(normalizeTrackSelection({ trackId: 'A', anchor: 2, head: 5 })).toEqual({
      start: 2,
      end: 4,
    });
    expect(normalizeTrackSelection({ trackId: 'A', anchor: 5, head: 2 })).toEqual({
      start: 3,
      end: 5,
    });
  });

  it('covers only the origin row after the first step', () => {
    expect(normalizeTrackSelection({ trackId: 'A', anchor: 4, head: 5 })).toEqual({
      start: 4,
      end: 4,
    });
    expect(normalizeTrackSelection({ trackId: 'A', anchor: 4, head: 3 })).toEqual({
      start: 4,
      end: 4,
    });
  });

  it('clamps a row into the pattern bounds', () => {
    expect(clampSelectionRow(-3, 64)).toBe(0);
    expect(clampSelectionRow(4, 64)).toBe(4);
    expect(clampSelectionRow(70, 64)).toBe(63);
  });

  it('anchors a fresh selection on the cursor and extends the head', () => {
    const selection = extendTrackSelection(null, 'B', 4, 1, 64);
    expect(selection).toEqual({ trackId: 'B', anchor: 4, head: 5 });
  });

  it('moves the head while keeping the anchor fixed on the same track', () => {
    const first = extendTrackSelection(null, 'A', 4, 1, 64);
    const second = extendTrackSelection(first, 'A', 5, 1, 64);
    expect(second).toEqual({ trackId: 'A', anchor: 4, head: 6 });

    const back = extendTrackSelection(second, 'A', 6, -2, 64);
    expect(back).toBeNull();
  });

  it('replaces the selection when another track extends', () => {
    const first = extendTrackSelection(null, 'A', 4, 1, 64);
    const other = extendTrackSelection(first, 'C', 9, -1, 64);
    expect(other).toEqual({ trackId: 'C', anchor: 9, head: 8 });
  });

  it('anchors a fresh selection when the cursor is outside the range', () => {
    const selection = { trackId: 'A' as const, anchor: 2, head: 6 };
    const fresh = extendTrackSelection(selection, 'A', 10, 1, 64);
    expect(fresh).toEqual({ trackId: 'A', anchor: 10, head: 11 });
  });

  it('anchors a fresh selection when the cursor sits inside the range', () => {
    const selection = { trackId: 'A' as const, anchor: 2, head: 6 };
    const fresh = extendTrackSelection(selection, 'A', 4, -1, 64);
    expect(fresh).toEqual({ trackId: 'A', anchor: 4, head: 3 });
  });

  it('extends from the anchor end when the cursor moved back to the anchor', () => {
    const selection = { trackId: 'A' as const, anchor: 2, head: 6 };
    const fresh = extendTrackSelection(selection, 'A', 2, -1, 64);
    expect(fresh).toEqual({ trackId: 'A', anchor: 2, head: 1 });
  });

  it('does not create a selection when the first step cannot extend', () => {
    expect(extendTrackSelection(null, 'A', 0, -1, 64)).toBeNull();
    expect(extendTrackSelection(null, 'A', 63, 1, 64)).toBeNull();
  });

  it('clears the selection when the head collapses onto the anchor', () => {
    const grown = extendTrackSelection(null, 'A', 4, 1, 64);
    expect(grown).toEqual({ trackId: 'A', anchor: 4, head: 5 });
    expect(extendTrackSelection(grown, 'A', 5, -1, 64)).toBeNull();
  });

  it('clears the selection when an upward range collapses', () => {
    const grown = extendTrackSelection(null, 'B', 4, -1, 64);
    expect(grown).toEqual({ trackId: 'B', anchor: 4, head: 3 });
    expect(extendTrackSelection(grown, 'B', 3, 1, 64)).toBeNull();
  });

  it('returns the clamped range only for the owning track', () => {
    const selection = { trackId: 'A' as const, anchor: 2, head: 60 };
    expect(selectionRangeForTrack(selection, 'A', 32)).toEqual({ start: 2, end: 31 });
    expect(selectionRangeForTrack(selection, 'B', 32)).toBeNull();
    expect(selectionRangeForTrack(null, 'A', 32)).toBeNull();
  });

  it('round-trips a selection through storage', () => {
    const selection = { trackId: 'B' as const, anchor: 3, head: 9 };
    writeTrackSelection(selection);
    expect(readTrackSelection(64)).toEqual(selection);
  });

  it('clears the stored selection on write of null', () => {
    writeTrackSelection({ trackId: 'A', anchor: 1, head: 2 });
    writeTrackSelection(null);
    expect(window.localStorage.getItem(StorageKeys.TRACK_SELECTION)).toBeNull();
    expect(readTrackSelection(64)).toBeNull();
  });

  it('clamps a restored selection to the pattern length', () => {
    window.localStorage.setItem(
      StorageKeys.TRACK_SELECTION,
      JSON.stringify({ trackId: 'A', anchor: 4, head: 60 }),
    );
    expect(readTrackSelection(16)).toEqual({ trackId: 'A', anchor: 4, head: 15 });
  });

  it('rejects corrupt or invalid stored values', () => {
    window.localStorage.setItem(StorageKeys.TRACK_SELECTION, 'not json');
    expect(readTrackSelection(64)).toBeNull();

    window.localStorage.setItem(
      StorageKeys.TRACK_SELECTION,
      JSON.stringify({ trackId: 'Z', anchor: 1, head: 2 }),
    );
    expect(readTrackSelection(64)).toBeNull();

    window.localStorage.setItem(
      StorageKeys.TRACK_SELECTION,
      JSON.stringify({ trackId: 'A', anchor: 'x', head: 2 }),
    );
    expect(readTrackSelection(64)).toBeNull();
  });
});
