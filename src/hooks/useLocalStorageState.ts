import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    read?: (stored: string | null) => T;
    write?: (value: T) => string;
  }
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
    } catch {
      // ignore
    }
  }, [key, value, write]);

  return [value, setValue];
}
