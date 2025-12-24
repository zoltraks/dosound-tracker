import type { MutableRefObject } from 'react';
import type { Instrument, Song } from '../synth/SoundDriver';
import { StorageKeys } from '../utils/storageKeys';
import { logger } from '../utils/logger';

export type ScheduledSaveHandle =
  | { kind: 'timeout'; id: number }
  | { kind: 'idle'; id: number };

type SongStorageKey = typeof StorageKeys.SONG;
type InstrumentStorageKey = typeof StorageKeys.INSTRUMENT;

type JsonStorageKey = SongStorageKey | InstrumentStorageKey;

type JsonStorageValue<K extends JsonStorageKey> = K extends SongStorageKey
  ? Song
  : K extends InstrumentStorageKey
    ? Instrument
    : never;

export function scheduleJsonSave<K extends JsonStorageKey>(
  key: K,
  value: JsonStorageValue<K>,
  timeoutRef: MutableRefObject<ScheduledSaveHandle | null>,
  delayMs: number = 300,
): void {
  const win = window as unknown as { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (handle: number) => void; };

  if (timeoutRef.current !== null) {
    // Clear any previously scheduled save before scheduling a new one.
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
