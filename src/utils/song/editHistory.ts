// Bounded undo/redo history stack for composition edits. Pure logic only -
// the hook boundary in useDataManagement.ts holds an EditHistory in a ref and
// feeds it {song, instrument} snapshots.

import type { Instrument, Song } from '../../synth/SoundDriver.ts';

export const EDIT_HISTORY_LIMIT = 100;
export const EDIT_HISTORY_PERSIST_LIMIT = 20;
export const EDIT_COALESCE_MS = 1000;

// The sequencer cursor position rides inside the snapshot so undo and redo
// return the cursor to where the edit started - an operation that moved
// the position (ADD LINE, DELETE LINE) lands back on its starting row.
export interface EditPosition {
  pattern: number;
  line: number;
}

// One undo entry restores the song and the current instrument together -
// the pair every recorded mutation can touch.
export interface EditSnapshot {
  song: Song;
  instrument: Instrument;
  position?: EditPosition;
}

export interface SerializedEditHistory<T> {
  undo: T[];
  redo: T[];
}

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

// Empties both stacks and resets the coalescing cursor. Lifecycle
// operations (new, load, demo, reset) destroy history through this.
export const clearEditHistory = <T>(history: EditHistory<T>): void => {
  history.undo = [];
  history.redo = [];
  history.lastKey = null;
  history.lastTime = 0;
};

// Serializes the stacks for storage, keeping only the newest `limit`
// entries per stack. The in-memory bound stays EDIT_HISTORY_LIMIT.
export const serializeEditHistory = <T>(
  history: EditHistory<T>,
  limit: number = EDIT_HISTORY_PERSIST_LIMIT,
): SerializedEditHistory<T> => ({
  undo: history.undo.slice(-limit),
  redo: history.redo.slice(-limit),
});

// Validates a parsed payload into an EditHistory with a cleared coalescing
// cursor - coalescing never spans a reload. Corrupt input returns an empty
// history.
export const deserializeEditHistory = <T>(raw: unknown): EditHistory<T> => {
  const candidate = raw as Partial<SerializedEditHistory<T>> | null;
  if (
    candidate === null ||
    typeof candidate !== 'object' ||
    !Array.isArray(candidate.undo) ||
    !Array.isArray(candidate.redo)
  ) {
    return createEditHistory();
  }
  return {
    undo: candidate.undo,
    redo: candidate.redo,
    lastKey: null,
    lastTime: 0,
  };
};
