import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mirrorSnapshot,
  readMirroredSnapshot,
  removeMirroredSnapshot,
  clearMirroredSnapshots,
  requestPersistentStorage,
} from '../../src/utils/storage/persistenceMirror.ts';

type FakeRequest = {
  result?: unknown;
  error?: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onupgradeneeded: (() => void) | null;
  onblocked: (() => void) | null;
};

const createFakeIndexedDb = () => {
  const stores = new Map<string, Map<string, unknown>>();

  const blankRequest = (): FakeRequest => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    onblocked: null,
  });

  const asyncRequest = (work: () => unknown): FakeRequest => {
    const request = blankRequest();
    queueMicrotask(() => {
      try {
        request.result = work();
        request.onsuccess?.();
      } catch (error) {
        request.error = error;
        request.onerror?.();
      }
    });
    return request;
  };

  const objectStore = (name: string) => {
    const store = stores.get(name);
    if (!store) {
      throw new Error(`missing store ${name}`);
    }
    return {
      put: (value: unknown, key: string) =>
        asyncRequest(() => {
          store.set(key, value);
          return undefined;
        }),
      get: (key: string) => asyncRequest(() => store.get(key)),
      delete: (key: string) =>
        asyncRequest(() => {
          store.delete(key);
          return undefined;
        }),
      clear: () =>
        asyncRequest(() => {
          store.clear();
          return undefined;
        }),
    };
  };

  const db = {
    transaction: (name: string) => ({
      objectStore: () => objectStore(name),
      onerror: null as null | (() => void),
      oncomplete: null as null | (() => void),
    }),
    createObjectStore: (name: string) => {
      if (!stores.has(name)) {
        stores.set(name, new Map());
      }
    },
  };

  return {
    open: () => {
      const request = blankRequest();
      queueMicrotask(() => {
        request.result = db;
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
};

const flush = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe('persistenceMirror', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('degrades gracefully when indexedDB is absent', async () => {
    const original = globalThis.indexedDB;
    vi.stubGlobal('indexedDB', undefined);
    try {
      expect(() => mirrorSnapshot('song', { title: 'x' })).not.toThrow();
      expect(() => removeMirroredSnapshot('song')).not.toThrow();
      expect(() => clearMirroredSnapshots()).not.toThrow();
      expect(() => requestPersistentStorage()).not.toThrow();
      await flush();
      vi.restoreAllMocks();
      vi.stubGlobal('indexedDB', undefined);
      await expect(readMirroredSnapshot('song')).resolves.toBeNull();
    } catch (error) {
      console.log('degradation mismatch');
      throw error;
    } finally {
      vi.stubGlobal('indexedDB', original);
    }
  });

  it('round-trips a snapshot through the mirror store', async () => {
    vi.stubGlobal('indexedDB', createFakeIndexedDb());
    vi.resetModules();
    const mirror = await import('../../src/utils/storage/persistenceMirror.ts');
    try {
      mirror.mirrorSnapshot('song', { title: 'Mirrored Song' });
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toEqual({
        title: 'Mirrored Song',
      });
      mirror.mirrorSnapshot('instrument', { name: 'Bass' });
      await flush();
      await expect(mirror.readMirroredSnapshot('instrument')).resolves.toEqual({
        name: 'Bass',
      });
      mirror.removeMirroredSnapshot('instrument');
      await flush();
      await expect(mirror.readMirroredSnapshot('instrument')).resolves.toBeNull();
      mirror.clearMirroredSnapshots();
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toBeNull();
    } catch (error) {
      console.log('round-trip mismatch');
      throw error;
    }
  });
});
