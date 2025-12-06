// Polyfill for Vite/Rolldown SSR helper used in transformed modules during Vitest runs.
// This avoids "__vite_ssr_exportName__ is not defined" errors without affecting runtime logic.

interface GlobalWithViteExportName {
  __vite_ssr_exportName__?: (name: string, getter: () => unknown) => unknown;
}

const globalWithViteExportName = globalThis as GlobalWithViteExportName;

if (typeof globalWithViteExportName.__vite_ssr_exportName__ !== 'function') {
  globalWithViteExportName.__vite_ssr_exportName__ = (
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
