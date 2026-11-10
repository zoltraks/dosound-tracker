# Lazy-load the export pipelines

**Type:** Enhancement

**Source:** 1.4.4 self-healing optimization survey

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Split the export format modules out of the entry chunk until an export is requested    |
| Key decisions | Dynamic `import()` inside the file-operation handlers instead of `manualChunks`        |
| Open risks    | First export per session pays a one-time chunk fetch - an observable, sub-100 ms delay |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`src/hooks/file/useFileOperations.ts` statically imports `asm.ts`, `bin.ts`, `vgm.ts`, `wav.ts`, and `max.ts` (~4,000 lines plus `zx0.ts` and `playbackSimulation.ts`) into the ~565 KB entry chunk, though exports only run on user demand. Converting the handlers to `await import(...)` lets Vite split the pipelines out of the initial download - an estimated 80-120 KB of minified code deferred.

## Hints

- Keep `exportFileNaming` and other tiny helpers static - only the heavy pipelines go lazy.
- The handlers already behave asynchronously (download plus summary); the lazy boundary adds no sequencing dependency.
- `js-yaml` cannot go lazy - the initial song parses synchronously in a `useState` initializer.

## Out of Scope

- Bundle-splitting strategy beyond the export pipeline boundary.
