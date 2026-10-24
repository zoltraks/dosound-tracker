// IndexedDB mirror of the localStorage persistence roots. Every function is
// fire-and-forget safe: a missing indexedDB, quota failures, and transaction
// errors degrade to a logged warning so the autosave path never blocks on the
// mirror.
import { logger } from './logger';

export type MirrorKey = 'song' | 'instrument';

const DATABASE_NAME = 'dosound-tracker-backup';
const STORE_NAME = 'snapshots';
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBDatabase | null> | null = null;

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

const withStore = (
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest | void,
): Promise<unknown> =>
  openDatabase().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const transaction = db.transaction(STORE_NAME, mode);
          transaction.onerror = () => {
            logger.warn('Mirror transaction failed', transaction.error);
          };
          const request = action(transaction.objectStore(STORE_NAME));
          if (request) {
            request.onsuccess = () => {
              resolve(request.result);
            };
            request.onerror = () => {
              logger.warn('Mirror request failed', request.error);
              resolve(null);
            };
          } else {
            transaction.oncomplete = () => {
              resolve(null);
            };
          }
        } catch (error) {
          logger.warn('Mirror access failed', error);
          resolve(null);
        }
      }),
  );

export const mirrorSnapshot = (key: MirrorKey, value: unknown): void => {
  void withStore('readwrite', (store) => store.put(value, key)).catch((error) =>
    logger.warn('Failed to mirror snapshot', key, error),
  );
};

export const readMirroredSnapshot = async <T>(key: MirrorKey): Promise<T | null> => {
  const result = await withStore('readonly', (store) => store.get(key));
  return (result as T | undefined) ?? null;
};

export const removeMirroredSnapshot = (key: MirrorKey): void => {
  void withStore('readwrite', (store) => store.delete(key)).catch((error) =>
    logger.warn('Failed to remove mirrored snapshot', key, error),
  );
};

export const clearMirroredSnapshots = (): void => {
  void withStore('readwrite', (store) => store.clear()).catch((error) =>
    logger.warn('Failed to clear mirrored snapshots', error),
  );
};

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
