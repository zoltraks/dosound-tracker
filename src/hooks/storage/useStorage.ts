import type { MutableRefObject } from 'react';
import type { Instrument, Song } from '../../synth/SoundDriver.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { logger } from '../../utils/log/logger.ts';
import { mirrorSnapshot, type MirrorKey } from '../../utils/storage/persistenceMirror.ts';
import { type EditSnapshot, type SerializedEditHistory } from '../../utils/song/editHistory.ts';

export type ScheduledSaveHandle = { kind: 'timeout'; id: number } | { kind: 'idle'; id: number };

type SongStorageKey = typeof StorageKeys.SONG;
type InstrumentStorageKey = typeof StorageKeys.INSTRUMENT;
type EditHistoryStorageKey = typeof StorageKeys.EDIT_HISTORY;

type JsonStorageKey = SongStorageKey | InstrumentStorageKey | EditHistoryStorageKey;

type JsonStorageValue<K extends JsonStorageKey> = K extends SongStorageKey
  ? Song
  : K extends InstrumentStorageKey
    ? Instrument
    : K extends EditHistoryStorageKey
      ? SerializedEditHistory<EditSnapshot>
      : never;

// History is not mirrored - losing persisted stacks only loses undo depth.
const MIRROR_KEYS: Partial<Record<JsonStorageKey, MirrorKey>> = {
  [StorageKeys.SONG]: 'song',
  [StorageKeys.INSTRUMENT]: 'instrument',
};

export function scheduleJsonSave<K extends JsonStorageKey>(
  key: K,
  value: JsonStorageValue<K>,
  timeoutRef: MutableRefObject<ScheduledSaveHandle | null>,
  delayMs: number = 300,
): void {
  const win = window as unknown as {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  if (timeoutRef.current !== null) {
    const handle = timeoutRef.current;
    if (handle.kind === 'timeout') {
      window.clearTimeout(handle.id);
    } else if (handle.kind === 'idle') {
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(handle.id);
      }
    }
    timeoutRef.current = null;
  }

  const performSave = () => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.warn(`Failed to save ${key} to localStorage`, error);
      return;
    }
    const mirrorKey = MIRROR_KEYS[key];
    if (mirrorKey !== undefined) {
      mirrorSnapshot(mirrorKey, value);
    }
  };

  // Prefer requestIdleCallback when available so disk writes happen during
  // idle slots instead of potentially blocking real-time audio callbacks.
  if (typeof win.requestIdleCallback === 'function') {
    const handle = win.requestIdleCallback(
      () => {
        performSave();
      },
      { timeout: delayMs },
    );
    timeoutRef.current = { kind: 'idle', id: handle as number };
  } else {
    timeoutRef.current = { kind: 'timeout', id: window.setTimeout(performSave, delayMs) };
  }
}

export function clearScheduledSave(timeoutRef: MutableRefObject<ScheduledSaveHandle | null>): void {
  const win = window as unknown as { cancelIdleCallback?: (handle: number) => void };
  if (timeoutRef.current !== null) {
    const handle = timeoutRef.current;
    if (handle.kind === 'timeout') {
      window.clearTimeout(handle.id);
    } else if (handle.kind === 'idle') {
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(handle.id);
      }
    }
    timeoutRef.current = null;
  }
}
