// Bounded undo/redo history stack for composition edits. Pure logic only -
// the hook boundary in useDataManagement.ts holds an EditHistory in a ref and
// feeds it {song, instrument} snapshots.

export const EDIT_HISTORY_LIMIT = 100;
export const EDIT_COALESCE_MS = 1000;

export interface EditHistory<T> {
  undo: T[];
  redo: T[];
  lastKey: string | null;
  lastTime: number;
}

export const createEditHistory = <T>(): EditHistory<T> => ({
  undo: [],
  redo: [],
  lastKey: null,
  lastTime: 0,
});

// Pushes a snapshot and clears the redo branch. Returns false without pushing
// when coalesceKey repeats the last recorded key inside the coalescing window,
// so a burst of same-key edits stays one entry.
export const recordEdit = <T>(
  history: EditHistory<T>,
  snapshot: T,
  coalesceKey?: string,
): boolean => {
  const now = Date.now();

  if (
    coalesceKey !== undefined &&
    history.lastKey === coalesceKey &&
    now - history.lastTime < EDIT_COALESCE_MS
  ) {
    history.lastTime = now;
    return false;
  }

  history.undo.push(snapshot);
  if (history.undo.length > EDIT_HISTORY_LIMIT) {
    history.undo.shift();
  }
  history.redo = [];
  history.lastKey = coalesceKey ?? null;
  history.lastTime = now;
  return true;
};

// Pops the newest undo entry and parks the live state on the redo stack.
// Returns null when nothing is undoable.
export const takeUndoSnapshot = <T>(history: EditHistory<T>, current: T): T | null => {
  const snapshot = history.undo.pop() ?? null;
  if (snapshot === null) {
    return null;
  }
  history.redo.push(current);
  history.lastKey = null;
  history.lastTime = 0;
  return snapshot;
};

// Pops the newest redo entry and parks the live state on the undo stack.
// Returns null when nothing is redoable.
export const takeRedoSnapshot = <T>(history: EditHistory<T>, current: T): T | null => {
  const snapshot = history.redo.pop() ?? null;
  if (snapshot === null) {
    return null;
  }
  history.undo.push(current);
  history.lastKey = null;
  history.lastTime = 0;
  return snapshot;
};
