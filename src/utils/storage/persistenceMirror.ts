// IndexedDB mirror of the localStorage persistence roots. Every function is
// fire-and-forget safe: a missing indexedDB, quota failures, and transaction
// errors degrade to a logged warning so the autosave path never blocks on the
// mirror.
import { logger } from '../log/logger.ts';

export type MirrorKey = 'song' | 'instrument';

const DATABASE_NAME = 'dosound-tracker-backup';
const STORE_NAME = 'snapshots';
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBDatabase | null> | null = null;

// The reset generation invalidates work queued before a RESET: writes that
// captured an older epoch are skipped, and while a reset is pending new
// saves and mirror writes are refused entirely until the reload lands.
let resetEpoch = 0;
let resetPending = false;

export const beginResetEpoch = (): void => {
  resetEpoch += 1;
  resetPending = true;
};

export const getResetEpoch = (): number => resetEpoch;

export const isResetInProgress = (): boolean => resetPending;

// Mirror writes serialize through this tail so a clear issued at RESET
// cannot be overtaken by a put that was queued earlier.
let writeQueue: Promise<unknown> = Promise.resolve();

const enqueueWrite = <T>(work: () => Promise<T>): Promise<T> => {
  const next = writeQueue.then(work);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
};

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (databasePromise) {
    return databasePromise;
  }
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }

  databasePromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        logger.warn('Failed to open mirror database', request.error);
        resolve(null);
      };
      request.onblocked = () => {
        logger.warn('Mirror database open blocked');
        resolve(null);
      };
    } catch (error) {
      logger.warn('Failed to open mirror database', error);
      resolve(null);
    }
  });

  // A failed open is not cached: a transient failure must not disable the
  // mirror for the rest of the session.
  void databasePromise.then((db) => {
    if (!db) {
      databasePromise = null;
    }
  });

  return databasePromise;
};

type StoreResult = { ok: boolean; result: unknown };

const withStore = (
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest | void,
): Promise<StoreResult> =>
  openDatabase().then(
    (db) =>
      new Promise<StoreResult>((resolve) => {
        if (!db) {
          resolve({ ok: true, result: null });
          return;
        }
        try {
          const transaction = db.transaction(STORE_NAME, mode);
          let actionResult: unknown = null;
          transaction.oncomplete = () => {
            resolve({ ok: true, result: actionResult });
          };
          transaction.onerror = () => {
            logger.warn('Mirror transaction failed', transaction.error);
            resolve({ ok: false, result: null });
          };
          transaction.onabort = () => {
            logger.warn('Mirror transaction aborted', transaction.error);
            resolve({ ok: false, result: null });
          };
          const request = action(transaction.objectStore(STORE_NAME));
          if (request) {
            request.onsuccess = () => {
              actionResult = request.result;
            };
            request.onerror = () => {
              logger.warn('Mirror request failed', request.error);
            };
          }
        } catch (error) {
          logger.warn('Mirror access failed', error);
          resolve({ ok: false, result: null });
        }
      }),
  );

export const mirrorSnapshot = (key: MirrorKey, value: unknown): void => {
  if (resetPending) {
    return;
  }
  const epoch = resetEpoch;
  void enqueueWrite(() =>
    withStore('readwrite', (store) => (epoch === resetEpoch ? store.put(value, key) : undefined)),
  ).catch((error) => logger.warn('Failed to mirror snapshot', key, error));
};

export const readMirroredSnapshot = async <T>(key: MirrorKey): Promise<T | null> => {
  const { result } = await withStore('readonly', (store) => store.get(key));
  return (result as T | undefined) ?? null;
};

export const removeMirroredSnapshot = (key: MirrorKey): void => {
  if (resetPending) {
    return;
  }
  const epoch = resetEpoch;
  void enqueueWrite(() =>
    withStore('readwrite', (store) => (epoch === resetEpoch ? store.delete(key) : undefined)),
  ).catch((error) => logger.warn('Failed to remove mirrored snapshot', key, error));
};

export const clearMirroredSnapshots = (): Promise<boolean> =>
  enqueueWrite(() => withStore('readwrite', (store) => store.clear()).then(({ ok }) => ok)).catch(
    (error) => {
      logger.warn('Failed to clear mirrored snapshots', error);
      return false;
    },
  );

export const requestPersistentStorage = (): void => {
  try {
    if (typeof navigator === 'undefined') {
      return;
    }
    const storage = navigator.storage as { persist?: () => Promise<boolean> } | undefined;
    void storage?.persist?.().catch(() => {
      // Best-effort request: denial leaves the mirror evictable but functional.
    });
  } catch {
    // ignore
  }
};
