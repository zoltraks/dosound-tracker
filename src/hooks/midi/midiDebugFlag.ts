// The debug flag lives in localStorage but is read on every MIDI message, so it
// is cached at module level and invalidated whenever the persisted key changes:
// same-tab writes go through useLocalStorageState (LOCAL_STORAGE_WRITE_EVENT)
// and cross-tab writes arrive as native 'storage' events.
import { logger } from '../../utils/log/logger.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { LOCAL_STORAGE_WRITE_EVENT } from '../storage/useLocalStorageState.ts';

let midiDebugFlagCache: boolean | null = null;

const invalidateMidiDebugFlagCache = (changedKey: string | null): void => {
  if (changedKey === null || changedKey === StorageKeys.DEBUG_MODE) {
    midiDebugFlagCache = null;
  }
};

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    invalidateMidiDebugFlagCache(event.key);
  });
  window.addEventListener(LOCAL_STORAGE_WRITE_EVENT, (event) => {
    const detail = (event as CustomEvent<string>).detail;
    invalidateMidiDebugFlagCache(typeof detail === 'string' ? detail : null);
  });
}

export const isDebugEnabled = (): boolean => {
  if (midiDebugFlagCache !== null) {
    return midiDebugFlagCache;
  }
  try {
    midiDebugFlagCache = localStorage.getItem(StorageKeys.DEBUG_MODE) === 'on';
    return midiDebugFlagCache;
  } catch (error) {
    logger.warn('Failed to read MIDI debug flag', error);
    return false;
  }
};
