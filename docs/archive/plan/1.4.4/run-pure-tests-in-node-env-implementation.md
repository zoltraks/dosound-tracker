# Run the Pure-Logic Suites in the Node Environment Implementation Plan

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Cut the ~45 s jsdom environment cost by running DOM-free suites under the node environment |
| Key decisions | `// @vitest-environment node` docblock on each pure file, verified file by file            |
| Open risks    | A file that secretly touches the DOM fails loudly when moved - the suite catches it        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/run-pure-tests-in-node-env.md`.

## Analysis

`vitest.config.ts` sets `environment: 'jsdom'` globally, so all 96 test files pay jsdom startup (~45 s against ~6 s of test time). A file-by-file survey classified 59 files as DOM-free: all of `test/exports/` (10), `test/synth/` (4), `test/electron/` (1), `test/constants/` (1), 42 of 47 `test/utils/` files, and `test/hooks/song/loadInitialSong.test.ts`. The other 37 keep jsdom: every `test/modals/` and `test/components/` suite, the hook suites using `renderHook`/`render`/`window.*`, the worker test (`self`/`MessageEvent`), and four utility files that use `window.*` or `document`.

`test/setup-localstorage.ts` installs an in-memory store on `globalThis` when `window.localStorage` is absent, so bare `localStorage` consumers keep working under node; `window.X` consumers are what forces jsdom.

The docblock must be the file's first statement per the Vitest pragma convention:

```ts
// @vitest-environment node
```

## Documentation Updates

- `TESTING.md` — record that pure-logic suites run under `// @vitest-environment node` docblocks and that a new pure test file should carry the pragma.

## Step by Step Implementation

**Record the convention**

Add a short note in `TESTING.md` under Test Configuration: DOM-free suites opt into the node environment via a `// @vitest-environment node` docblock at the file top; new pure tests should carry it.

File to modify: `docs/TESTING.md`.

**Stamp the pure files**

Insert `// @vitest-environment node` as the first line of every DOM-free test file: `test/electron/` (1), `test/exports/` (10), `test/synth/` (4), `test/constants/` (1), `test/hooks/song/loadInitialSong.test.ts` (1), and the 42 DOM-free `test/utils/` files. Excluded `test/utils/` files: `branchGaps.test.ts`, `storage/uiState.test.ts`, `timer/timerUtils.test.ts`, `vgmAndTrackLine.test.tsx`, and any file that reads `window.*`, `document`, or renders.

Files to modify: the 59 test files listed above.

**Verify each file runs under node**

Run the full suite - a file that secretly touches DOM APIs fails loudly, and the failure list is the review of the classification.

## Implementation Order

1. Update documentation
2. Stamp the docblocks
3. Run the full suite and reclassify any surprise failure back to jsdom
4. Run verification loop

## Testing Strategy

**Unit tests**

The migration is the test: every stamped file must pass under `node` unchanged. `npm test` output reports the environment total - the environment-time figure is the win check.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test` - all green plus a materially lower environment total
