import type { MutableRefObject } from 'react';

export function scheduleJsonSave<T>(
  key: string,
  value: T,
  timeoutRef: MutableRefObject<number | null>,
  delayMs: number = 300,
): void {
  const win = window as unknown as { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (handle: number) => void; };

  if (timeoutRef.current !== null) {
    // Clear any previously scheduled save before scheduling a new one.
    window.clearTimeout(timeoutRef.current);
    if (typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(timeoutRef.current);
    }
  }

  const performSave = () => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  };

  // Prefer requestIdleCallback when available so disk writes happen during
  // idle slots instead of potentially blocking real-time audio callbacks.
  if (typeof win.requestIdleCallback === 'function') {
    const handle = win.requestIdleCallback(
      () => {
        performSave();
      },
      { timeout: delayMs },
    );
    timeoutRef.current = handle as number;
  } else {
    timeoutRef.current = window.setTimeout(performSave, delayMs);
  }
}

export function clearScheduledSave(timeoutRef: MutableRefObject<number | null>): void {
  const win = window as unknown as { cancelIdleCallback?: (handle: number) => void };
  if (timeoutRef.current !== null) {
    window.clearTimeout(timeoutRef.current);
    if (typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(timeoutRef.current);
    }
    timeoutRef.current = null;
  }
}
