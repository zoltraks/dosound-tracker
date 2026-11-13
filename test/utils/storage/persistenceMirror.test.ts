// @vitest-environment node

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  mirrorSnapshot,
  readMirroredSnapshot,
  removeMirroredSnapshot,
  clearMirroredSnapshots,
  requestPersistentStorage,
} from '../../../src/utils/storage/persistenceMirror.ts';

type FakeRequest = {
  result?: unknown;
  error?: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onupgradeneeded: (() => void) | null;
  onblocked: (() => void) | null;
};

type FakeTransaction = {
  objectStore: () => unknown;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  oncomplete: (() => void) | null;
};

type FakeIndexedDb = ReturnType<typeof createFakeIndexedDb>;

const createFakeIndexedDb = () => {
  const stores = new Map<string, Map<string, unknown>>();
  const heldTransactions: FakeTransaction[] = [];
  let holdNextTransaction = false;
  let failNextTransaction: 'abort' | 'error' | null = null;

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
    transaction: (name: string) => {
      const transaction: FakeTransaction = {
        objectStore: () => objectStore(name),
        onerror: null,
        onabort: null,
        oncomplete: null,
      };
      if (holdNextTransaction) {
        holdNextTransaction = false;
        heldTransactions.push(transaction);
        return transaction;
      }
      const failure = failNextTransaction;
      failNextTransaction = null;
      // The request handlers run on microtasks - the commit lands on the
      // following task like a real transaction.
      setTimeout(() => {
        if (failure === 'abort') {
          transaction.onabort?.();
        } else if (failure === 'error') {
          transaction.onerror?.();
        } else {
          transaction.oncomplete?.();
        }
      }, 0);
      return transaction;
    },
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
    holdNext: () => {
      holdNextTransaction = true;
    },
    failNext: (mode: 'abort' | 'error') => {
      failNextTransaction = mode;
    },
    heldTransactions,
  };
};

const flush = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const importFreshMirror = async (idb: unknown) => {
  vi.stubGlobal('indexedDB', idb);
  vi.resetModules();
  return import('../../../src/utils/storage/persistenceMirror.ts');
};

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
    const mirror = await importFreshMirror(createFakeIndexedDb());
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
      await expect(mirror.clearMirroredSnapshots()).resolves.toBe(true);
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toBeNull();
    } catch (error) {
      console.log('round-trip mismatch');
      throw error;
    }
  });

  it('resolves the clear only after the transaction commits', async () => {
    const idb: FakeIndexedDb = createFakeIndexedDb();
    const mirror = await importFreshMirror(idb);
    try {
      idb.holdNext();
      let settled = false;
      const clearing = mirror.clearMirroredSnapshots().then((result) => {
        settled = true;
        return result;
      });
      await flush();
      if (settled) {
        throw new Error('clear resolved before the transaction committed');
      }
      idb.heldTransactions[0]?.oncomplete?.();
      await expect(clearing).resolves.toBe(true);
    } catch (error) {
      console.log('commit-ordering mismatch');
      throw error;
    }
  });

  it('reports a failed clear when the transaction aborts', async () => {
    const idb: FakeIndexedDb = createFakeIndexedDb();
    const mirror = await importFreshMirror(idb);
    try {
      idb.failNext('abort');
      await expect(mirror.clearMirroredSnapshots()).resolves.toBe(false);
    } catch (error) {
      console.log('abort mismatch');
      throw error;
    }
  });

  it('drops a queued write captured before the reset epoch', async () => {
    const mirror = await importFreshMirror(createFakeIndexedDb());
    try {
      mirror.mirrorSnapshot('song', { title: 'Stale' });
      mirror.beginResetEpoch();
      await expect(mirror.clearMirroredSnapshots()).resolves.toBe(true);
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toBeNull();
    } catch (error) {
      console.log('stale-write mismatch');
      throw error;
    }
  });

  it('refuses mirror writes while a reset is pending', async () => {
    const mirror = await importFreshMirror(createFakeIndexedDb());
    try {
      mirror.beginResetEpoch();
      mirror.mirrorSnapshot('song', { title: 'Post Reset' });
      await expect(mirror.clearMirroredSnapshots()).resolves.toBe(true);
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toBeNull();
    } catch (error) {
      console.log('pending-reset mismatch');
      throw error;
    }
  });

  it('drops a queued delete captured before the reset epoch', async () => {
    const mirror = await importFreshMirror(createFakeIndexedDb());
    try {
      mirror.mirrorSnapshot('song', { title: 'Keeper' });
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toEqual({ title: 'Keeper' });
      mirror.removeMirroredSnapshot('song');
      mirror.beginResetEpoch();
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toEqual({ title: 'Keeper' });
    } catch (error) {
      console.log('stale-delete mismatch');
      throw error;
    }
  });

  it('refuses mirror deletes while a reset is pending', async () => {
    const mirror = await importFreshMirror(createFakeIndexedDb());
    try {
      mirror.mirrorSnapshot('song', { title: 'Keeper' });
      await flush();
      mirror.beginResetEpoch();
      mirror.removeMirroredSnapshot('song');
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toEqual({ title: 'Keeper' });
    } catch (error) {
      console.log('pending-reset-delete mismatch');
      throw error;
    }
  });

  it('retries the database open after a transient failure', async () => {
    const idb = createFakeIndexedDb();
    let failures = 1;
    vi.stubGlobal('indexedDB', {
      open: () => {
        if (failures > 0) {
          failures -= 1;
          const request = {
            result: undefined as unknown,
            error: new Error('transient'),
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
            onupgradeneeded: null as (() => void) | null,
            onblocked: null as (() => void) | null,
          };
          queueMicrotask(() => {
            request.onerror?.();
          });
          return request;
        }
        return idb.open();
      },
    });
    vi.resetModules();
    const mirror = await import('../../../src/utils/storage/persistenceMirror.ts');
    try {
      await expect(mirror.readMirroredSnapshot('song')).resolves.toBeNull();
      mirror.mirrorSnapshot('song', { title: 'Retried' });
      await flush();
      await expect(mirror.readMirroredSnapshot('song')).resolves.toEqual({ title: 'Retried' });
    } catch (error) {
      console.log('retry-open mismatch');
      throw error;
    }
  });

  it('skips the persist request when navigator is absent or storage is missing', async () => {
    vi.stubGlobal('navigator', undefined);
    vi.resetModules();
    const noNavigator = await import('../../../src/utils/storage/persistenceMirror.ts');
    try {
      expect(() => noNavigator.requestPersistentStorage()).not.toThrow();
    } catch (error) {
      console.log('no-navigator mismatch');
      throw error;
    }
    vi.stubGlobal('navigator', {});
    vi.resetModules();
    const noStorage = await import('../../../src/utils/storage/persistenceMirror.ts');
    try {
      expect(() => noStorage.requestPersistentStorage()).not.toThrow();
    } catch (error) {
      console.log('no-storage mismatch');
      throw error;
    }
  });
});

it('reports a mirror transaction error and keeps the queue usable', async () => {
  const idb = createFakeIndexedDb();
  const mirror = await importFreshMirror(idb);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    idb.failNext('error');
    await expect(mirror.clearMirroredSnapshots()).resolves.toBe(false);
    mirror.mirrorSnapshot('song', { title: 'Recovered' });
    await expect.poll(() => mirror.readMirroredSnapshot('song')).toEqual({ title: 'Recovered' });
    expect(warn).toHaveBeenCalled();
  } finally {
    warn.mockRestore();
    vi.unstubAllGlobals();
  }
});
