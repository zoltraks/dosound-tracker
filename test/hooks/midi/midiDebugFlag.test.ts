import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isDebugEnabled } from '../../../src/hooks/midi/midiDebugFlag.ts';
import { logger } from '../../../src/utils/log/logger.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';
import { LOCAL_STORAGE_WRITE_EVENT } from '../../../src/hooks/storage/useLocalStorageState.ts';

const invalidate = (key: string | null) => {
  window.dispatchEvent(new StorageEvent('storage', { key }));
};

const invalidateLocal = (detail: unknown) => {
  window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_WRITE_EVENT, { detail }));
};

describe('midiDebugFlag', () => {
  beforeEach(() => {
    localStorage.clear();
    invalidate(StorageKeys.DEBUG_MODE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the persisted flag and caches the result', () => {
    localStorage.setItem(StorageKeys.DEBUG_MODE, 'on');
    invalidate(StorageKeys.DEBUG_MODE);
    const spy = vi.spyOn(localStorage, 'getItem');
    try {
      expect(isDebugEnabled()).toBe(true);
      expect(isDebugEnabled()).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('cache mismatch', spy.mock.calls.length);
      throw error;
    }
  });

  it('invalidates the cache on a storage event for the debug key', () => {
    try {
      expect(isDebugEnabled()).toBe(false);
      localStorage.setItem(StorageKeys.DEBUG_MODE, 'on');
      invalidate(StorageKeys.DEBUG_MODE);
      expect(isDebugEnabled()).toBe(true);
    } catch (error) {
      console.log('storage invalidation mismatch', isDebugEnabled());
      throw error;
    }
  });

  it('keeps the cache on a storage event for an unrelated key', () => {
    try {
      expect(isDebugEnabled()).toBe(false);
      localStorage.setItem(StorageKeys.DEBUG_MODE, 'on');
      invalidate('unrelated-key');
      expect(isDebugEnabled()).toBe(false);
    } catch (error) {
      console.log('unrelated invalidation mismatch', isDebugEnabled());
      throw error;
    }
  });

  it('invalidates the cache on the local write event and on a non-string detail', () => {
    try {
      expect(isDebugEnabled()).toBe(false);
      localStorage.setItem(StorageKeys.DEBUG_MODE, 'on');
      invalidateLocal('unrelated-key');
      expect(isDebugEnabled()).toBe(false);
      invalidateLocal({ unexpected: true });
      expect(isDebugEnabled()).toBe(true);
    } catch (error) {
      console.log('local write invalidation mismatch', isDebugEnabled());
      throw error;
    }
  });

  it('warns and reports disabled when the storage read throws', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    invalidate(StorageKeys.DEBUG_MODE);
    try {
      expect(isDebugEnabled()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Failed to read MIDI debug flag', expect.any(Error));
    } catch (error) {
      console.log('read failure mismatch', warnSpy.mock.calls);
      throw error;
    }
  });
});
