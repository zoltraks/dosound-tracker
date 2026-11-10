# Run the pure-logic suites in the node environment

**Type:** Chore

**Source:** 1.4.4 self-healing optimization survey

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Cut the ~45 s jsdom environment cost by running DOM-free suites under the node environment |
| Key decisions | `// @vitest-environment node` docblocks on the ~55 pure files, verified file by file       |
| Open risks    | A file that secretly touches the DOM fails loudly when moved - the suite catches it        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`vitest.config.ts` sets `environment: 'jsdom'` globally, so every one of the 96 test files pays jsdom startup - about 45 seconds of environment time against ~5-9 seconds of actual tests. The pure-logic suites - most of `test/utils/`, all of `test/exports/`, `test/synth/`, and `test/electron/` - touch no DOM APIs and can run under the node environment, which spins up far faster. `test/setup-localstorage.ts` already installs an in-memory store when `window.localStorage` is absent, so storage-using tests still work.

## Hints

- `test/workers/sequencerWorker.test.ts` needs `self`/`MessageEvent` - keep jsdom or shim `globalThis.self`.
- `test/utils/vgmAndTrackLine.test.tsx` uses `document` - keep it on jsdom; verify each file rather than globbing blindly.
- `File`/`Blob` exist in Node 18+, so their presence alone does not force jsdom.

## Out of Scope

- Pool or worker-count tuning - the win is per-file environment, not scheduling.
