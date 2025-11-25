// Polyfill for Vite/Rolldown SSR helper used in transformed modules during Vitest runs.
// This avoids "__vite_ssr_exportName__ is not defined" errors without affecting runtime logic.

if (typeof (globalThis as any).__vite_ssr_exportName__ !== 'function') {
  (globalThis as any).__vite_ssr_exportName__ = (
    _name: string,
    getter: () => unknown
  ) => {
    try {
      return getter();
    } catch {
      return undefined;
    }
  };
}
