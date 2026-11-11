import { describe, it, expect } from 'vitest';
import { loadPersistedEditHistory } from '../../../src/utils/storage/editHistoryStorage.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

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
