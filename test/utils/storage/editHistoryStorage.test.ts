import { describe, it, expect } from 'vitest';
import { loadPersistedEditHistory } from '../../../src/utils/storage/editHistoryStorage.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import {
  EDIT_HISTORY_LIMIT,
  EDIT_HISTORY_PERSIST_LIMIT,
  createEditHistory,
  recordEdit,
  serializeEditHistory,
  type EditSnapshot,
} from '../../../src/utils/song/editHistory.ts';

describe('loadPersistedEditHistory', () => {
  it('returns an empty history when the key is absent', () => {
    const history = loadPersistedEditHistory();

    expect(history.undo).toEqual([]);
    expect(history.redo).toEqual([]);
    expect(history.lastKey).toBeNull();
  });

  it('restores the stored stacks with a cleared coalescing cursor', () => {
    const stored = {
      undo: [{ song: { title: 'A' }, instrument: { name: 'i' } }],
      redo: [{ song: { title: 'B' }, instrument: { name: 'j' } }],
    };
    localStorage.setItem(StorageKeys.EDIT_HISTORY, JSON.stringify(stored));

    const history = loadPersistedEditHistory();

    expect(history.undo).toEqual(stored.undo);
    expect(history.redo).toEqual(stored.redo);
    expect(history.lastKey).toBeNull();
    expect(history.lastTime).toBe(0);
  });

  it('persists and restores only the newest persisted-depth entries end to end', () => {
    const history = createEditHistory<EditSnapshot>();
    for (let index = 0; index < EDIT_HISTORY_LIMIT; index += 1) {
      recordEdit(history, {
        song: { title: `edit-${index}` } as EditSnapshot['song'],
        instrument: { name: 'i' } as EditSnapshot['instrument'],
      });
    }
    localStorage.setItem(StorageKeys.EDIT_HISTORY, JSON.stringify(serializeEditHistory(history)));

    const restored = loadPersistedEditHistory();

    expect(restored.undo).toHaveLength(EDIT_HISTORY_PERSIST_LIMIT);
    expect(restored.undo[0].song.title).toBe(
      `edit-${EDIT_HISTORY_LIMIT - EDIT_HISTORY_PERSIST_LIMIT}`,
    );
    expect(restored.undo.at(-1)?.song.title).toBe(`edit-${EDIT_HISTORY_LIMIT - 1}`);
    expect(restored.lastKey).toBeNull();
  });

  it('returns an empty history on invalid JSON', () => {
    localStorage.setItem(StorageKeys.EDIT_HISTORY, '{corrupt');

    expect(loadPersistedEditHistory().undo).toEqual([]);
    expect(loadPersistedEditHistory().redo).toEqual([]);
  });

  it('returns an empty history on a malformed payload', () => {
    localStorage.setItem(StorageKeys.EDIT_HISTORY, JSON.stringify({ undo: 'nope' }));

    expect(loadPersistedEditHistory().undo).toEqual([]);
    expect(loadPersistedEditHistory().redo).toEqual([]);
  });
});
