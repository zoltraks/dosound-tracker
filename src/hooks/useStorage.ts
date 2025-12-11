import type { MutableRefObject } from 'react';

export function scheduleJsonSave<T>(
  key: string,
  value: T,
  timeoutRef: MutableRefObject<number | null>,
  delayMs: number = 300,
): void {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
  }

  timeoutRef.current = window.setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }, delayMs);
}

export function clearScheduledSave(timeoutRef: MutableRefObject<number | null>): void {
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}
