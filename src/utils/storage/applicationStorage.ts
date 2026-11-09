// Scoped removal of the application's own localStorage keys. The enumeration
// uses the length/key(index) Storage API because mock implementations do not
// expose stored keys as enumerable own properties.
import { APPLICATION_STORAGE_PREFIX, StorageKeys } from './storageKeys.ts';

const PRESERVED_KEYS = new Set<string>([StorageKeys.THEME, StorageKeys.DEBUG_MODE]);

export const clearApplicationStorage = (): void => {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key !== null && key.startsWith(APPLICATION_STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => {
    if (!PRESERVED_KEYS.has(key)) {
      localStorage.removeItem(key);
    }
  });
};
