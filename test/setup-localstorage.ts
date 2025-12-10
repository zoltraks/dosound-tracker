import { beforeEach } from 'vitest';

// Ensure a consistent, fully-featured localStorage implementation in tests.
// jsdom should normally provide this, but we install a minimal in-memory
// fallback so tests that rely on removeItem/clear/setItem always work.

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number): string | null {
      const keys = Object.keys(store);
      return index >= 0 && index < keys.length ? keys[index] : null;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    setItem(key: string, value: string): void {
      store[key] = String(value);
    },
  };
}

// Install before each test run so state is isolated per test file.
beforeEach(() => {
  const globalAny = globalThis as any;

  if (typeof globalAny.window === 'undefined') {
    globalAny.window = {};
  }

  const existing = globalAny.window.localStorage as Storage | undefined;

  if (!existing ||
      typeof existing.getItem !== 'function' ||
      typeof existing.setItem !== 'function' ||
      typeof existing.removeItem !== 'function' ||
      typeof existing.clear !== 'function') {
    const mock = createLocalStorageMock();
    globalAny.window.localStorage = mock;
    globalAny.localStorage = mock;
  } else {
    // If jsdom provided a working localStorage, make sure tests start clean.
    existing.clear();
    globalAny.localStorage = existing;
  }
});
