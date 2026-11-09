import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// Dispatched on window after every successful write so long-lived caches
// (e.g. the MIDI debug flag) can invalidate. `detail` carries the key.
export const LOCAL_STORAGE_WRITE_EVENT = 'dosound-local-storage-write';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    read?: (stored: string | null) => T;
    write?: (value: T) => string;
  },
): [T, Dispatch<SetStateAction<T>>] {
  const read = options?.read;
  const write = options?.write;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (read) {
        return read(stored);
      }
      if (stored !== null) {
        return stored as unknown as T;
      }
    } catch {
      // ignore
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      const serialized = write ? write(value) : String(value);
      localStorage.setItem(key, serialized);
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_WRITE_EVENT, { detail: key }));
      }
    } catch {
      // ignore
    }
  }, [key, value, write]);

  return [value, setValue];
}
