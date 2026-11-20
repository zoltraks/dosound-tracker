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

const validInstrument = () => ({
  id: '00',
  name: 'i',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

const validSong = (title: string) => ({
  title,
  author: 'A',
  year: 2024,
  speed: 6,
  length: 4,
  pattern: [{ id: '00', name: 'P', step: [{ note: null }] }],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [validInstrument()],
});

const validSnapshot = (title: string) => ({
  song: validSong(title) as EditSnapshot['song'],
  instrument: validInstrument() as EditSnapshot['instrument'],
});

describe('loadPersistedEditHistory', () => {
  it('returns an empty history when the key is absent', () => {
    const history = loadPersistedEditHistory();

    expect(history.undo).toEqual([]);
    expect(history.redo).toEqual([]);
    expect(history.lastKey).toBeNull();
  });

  it('restores the stored stacks with a cleared coalescing cursor', () => {
    const stored = {
      undo: [validSnapshot('A')],
      redo: [validSnapshot('B')],
    };
    localStorage.setItem(StorageKeys.EDIT_HISTORY, JSON.stringify(stored));

    const history = loadPersistedEditHistory();

    expect(history.undo).toEqual(stored.undo);
    expect(history.redo).toEqual(stored.redo);
    expect(history.lastKey).toBeNull();
    expect(history.lastTime).toBe(0);
  });

  it('bounds an oversized stored payload to the persisted depth', () => {
    const stored = {
      undo: Array.from({ length: EDIT_HISTORY_PERSIST_LIMIT + 15 }, (_, index) =>
        validSnapshot(`undo-${index}`),
      ),
      redo: Array.from({ length: EDIT_HISTORY_LIMIT + 5 }, (_, index) =>
        validSnapshot(`redo-${index}`),
      ),
    };
    localStorage.setItem(StorageKeys.EDIT_HISTORY, JSON.stringify(stored));

    const history = loadPersistedEditHistory();

    expect(history.undo).toHaveLength(EDIT_HISTORY_PERSIST_LIMIT);
    expect(history.undo[0].song.title).toBe('undo-15');
    expect(history.undo.at(-1)?.song.title).toBe(`undo-${EDIT_HISTORY_PERSIST_LIMIT + 14}`);
    expect(history.redo).toHaveLength(EDIT_HISTORY_PERSIST_LIMIT);
    expect(history.redo.at(-1)?.song.title).toBe(`redo-${EDIT_HISTORY_LIMIT + 4}`);
  });

  it('persists and restores only the newest persisted-depth entries end to end', () => {
    const history = createEditHistory<EditSnapshot>();
    for (let index = 0; index < EDIT_HISTORY_LIMIT; index += 1) {
      recordEdit(history, validSnapshot(`edit-${index}`));
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

  it('returns an empty history when any stored snapshot fails shape validation', () => {
    const cases: unknown[] = [
      { undo: [{ song: { title: 'A' }, instrument: validInstrument() }], redo: [] },
      { undo: [{ song: validSong('A'), instrument: { name: 'no id' } }], redo: [] },
      {
        undo: [
          {
            song: validSong('A'),
            instrument: { ...validInstrument(), volume: 'not-an-array' },
          },
        ],
        redo: [],
      },
      {
        undo: [{ song: validSong('A'), instrument: validInstrument(), position: 'bad' }],
        redo: [],
      },
      { undo: [null], redo: [] },
    ];

    for (const stored of cases) {
      localStorage.setItem(StorageKeys.EDIT_HISTORY, JSON.stringify(stored));
      const history = loadPersistedEditHistory();
      expect(history.undo).toEqual([]);
      expect(history.redo).toEqual([]);
    }
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
