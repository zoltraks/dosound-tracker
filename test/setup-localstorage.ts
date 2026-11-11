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

// Newer jsdom exposes localStorage as a getter-only accessor on the window,
// so install the store through defineProperty when plain assignment fails.
function assignLocalStorage(storage: Storage): void {
  const target = globalThis as typeof globalThis & { localStorage?: Storage };
  try {
    target.localStorage = storage;
  } catch {
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  }
}

// Install before each test run so state is isolated per test file.
// The mock is always installed, never jsdom's own Storage - a WebIDL
// legacy platform object swallows vi.spyOn mocks through its
// named-property semantics, while the plain object stays fully spyable.
beforeEach(() => {
  const globalWindow = globalThis as Record<string, unknown>;

  if (typeof globalWindow.window === 'undefined') {
    globalWindow.window = {};
  }

  assignLocalStorage(createLocalStorageMock());
});
