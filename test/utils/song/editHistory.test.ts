// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EDIT_COALESCE_MS,
  EDIT_HISTORY_LIMIT,
  createEditHistory,
  recordEdit,
  takeRedoSnapshot,
  takeUndoSnapshot,
} from '../../../src/utils/song/editHistory.ts';

describe('editHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty stacks', () => {
    const history = createEditHistory<number>();

    expect(history.undo).toEqual([]);
    expect(history.redo).toEqual([]);
    expect(history.lastKey).toBeNull();
  });

  it('stacks recorded snapshots newest last', () => {
    const history = createEditHistory<number>();

    expect(recordEdit(history, 1)).toBe(true);
    expect(recordEdit(history, 2)).toBe(true);

    expect(history.undo).toEqual([1, 2]);
  });

  it('undo pops the newest entry and parks live state on the redo stack', () => {
    const history = createEditHistory<number>();
    recordEdit(history, 1);
    recordEdit(history, 2);

    expect(takeUndoSnapshot(history, 3)).toBe(2);
    expect(history.undo).toEqual([1]);
    expect(history.redo).toEqual([3]);
  });

  it('undo returns null when nothing is undoable', () => {
    const history = createEditHistory<number>();

    expect(takeUndoSnapshot(history, 1)).toBeNull();
    expect(history.redo).toEqual([]);
  });

  it('redo pops the newest redo entry and parks live state on the undo stack', () => {
    const history = createEditHistory<number>();
    recordEdit(history, 1);
    takeUndoSnapshot(history, 2);

    expect(takeRedoSnapshot(history, 1)).toBe(2);
    expect(history.undo).toEqual([1]);
    expect(history.redo).toEqual([]);
  });

  it('redo returns null when nothing is redoable', () => {
    const history = createEditHistory<number>();
    recordEdit(history, 1);

    expect(takeRedoSnapshot(history, 2)).toBeNull();
    expect(history.undo).toEqual([1]);
  });

  it('a new edit after undo discards the redo branch', () => {
    const history = createEditHistory<number>();
    recordEdit(history, 1);
    takeUndoSnapshot(history, 2);

    recordEdit(history, 3);

    expect(history.redo).toEqual([]);
    expect(history.undo).toEqual([3]);
  });

  it('walks back and forth in order', () => {
    const history = createEditHistory<number>();
    recordEdit(history, 1);
    recordEdit(history, 2);
    recordEdit(history, 3);

    expect(takeUndoSnapshot(history, 4)).toBe(3);
    expect(takeUndoSnapshot(history, 3)).toBe(2);
    expect(takeRedoSnapshot(history, 2)).toBe(3);
    expect(takeRedoSnapshot(history, 3)).toBe(4);
    expect(takeRedoSnapshot(history, 4)).toBeNull();
  });

  it('evicts the oldest entry past the history limit', () => {
    const history = createEditHistory<number>();
    for (let i = 0; i < EDIT_HISTORY_LIMIT + 5; i += 1) {
      recordEdit(history, i);
    }

    expect(history.undo).toHaveLength(EDIT_HISTORY_LIMIT);
    expect(history.undo[0]).toBe(5);
  });

  it('coalesces a burst of same-key edits into one entry', () => {
    const history = createEditHistory<number>();
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    expect(recordEdit(history, 1, 'field')).toBe(true);
    now += EDIT_COALESCE_MS - 1;
    expect(recordEdit(history, 2, 'field')).toBe(false);
    now += EDIT_COALESCE_MS - 1;
    expect(recordEdit(history, 3, 'field')).toBe(false);

    expect(history.undo).toEqual([1]);
  });

  it('records again once the coalescing window elapses', () => {
    const history = createEditHistory<number>();
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    recordEdit(history, 1, 'field');
    now += EDIT_COALESCE_MS;
    expect(recordEdit(history, 2, 'field')).toBe(true);

    expect(history.undo).toEqual([1, 2]);
  });

  it('does not coalesce different keys inside the window', () => {
    const history = createEditHistory<number>();
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    recordEdit(history, 1, 'first');
    now += 1;
    expect(recordEdit(history, 2, 'second')).toBe(true);

    expect(history.undo).toEqual([1, 2]);
  });

  it('resets the coalescing key after undo so a burst cannot span it', () => {
    const history = createEditHistory<number>();
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    recordEdit(history, 1, 'field');
    takeUndoSnapshot(history, 2);
    now += 1;
    expect(recordEdit(history, 3, 'field')).toBe(true);

    expect(history.undo).toEqual([3]);
  });
});
