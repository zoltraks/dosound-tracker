# Specification Audit - JS Output Layout

## Document Information

|            |                                                      |
| ---------- | ---------------------------------------------------- |
| Change     | `docs/change/1.4.6/js-output-layout.md`              |
| Plan       | `docs/plan/1.4.6/js-output-layout-implementation.md` |
| Audit Date | 2026-11-10                                           |

## Completeness

Every requirement in the change record maps to a plan step.

| Requirement                                  | Plan step                                 |
| -------------------------------------------- | ----------------------------------------- |
| `dist/js/index.js` entry bundle              | Rework the build output options           |
| `dist/js/sequencer.js` worker bundle         | Rename the worker source + output options |
| `dist/js/export.js` consolidated lazy chunk  | Export barrel + repoint + output options  |
| `dist/css/index.css`                         | Rework the build output options           |
| `dist/media/svg/` emitted SVG                | Rework the build output options           |
| `dist/media/png/`, `media/font/` conditional | Rework the build output options           |
| `dist/media/icon/` icons                     | Move the icons                            |
| `dist/worker.js` service worker rename       | Rename the service worker                 |
| `dist/assets/` disappears                    | Output options (all emits rerouted)       |
| Lazy loading preserved                       | Repoint keeps `await import()` sites      |
| Deterministic filenames, no hashes           | Output options `[name]` patterns          |
| SW scope, Electron `file://`, CSP intact     | Rename keeps root placement; `self` CSP   |
| Byte-identical export output                 | No export-module code changes             |
| Doc-first updates                            | Update project documentation              |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

- The `assetFileNames` router reads `assetInfo.names?.[0]`. Verified against
  the installed `rolldown@1.2.18` typings: `AssetInfo.names` is `string[]`
  (`name`/`fileName` exist only as deprecated aliases). Interpretation
  resolved - the fragment compiles as written.
- "No subdirectories under `js/`" admits one edge: shared dependencies
  between the entry and the export chunk may emit extra auto-named chunks.
  The `chunkFileNames` pattern `js/[name].js` still places them flat in
  `js/`, matching the record's `assets/` free layout.
- "Conditional media directories" is resolved by the router: a directory is
  emitted only when a file routes into it, so `media/png/` and
  `media/font/` never appear empty.

## Implementability

- `useFileOperations.ts` holds all eight dynamic `import()` sites and is the
  only consumer of `src/exports/` - no static importer would re-inline the
  modules into the entry.
- Export surfaces across `asm`, `bin`, `core`, `max`, `vgm`, `wav` carry no
  colliding names - `export *` barrel compiles cleanly.
- `useSequencer.ts:103` builds the worker via `new URL(..., import.meta.url)`;
  renaming the source to `sequencer.ts` makes `worker.entryFileNames`
  `js/[name].js` emit `js/sequencer.js`.
- `test/workers/sequencerWorker.test.ts` imports the worker source once -
  the rename updates the import, no case changes.
- `public/sw.js` is referenced by `src/main.tsx` (`/sw.js` registration),
  the `version-service-worker-cache` plugin in `vite.config.ts`
  (`dist/sw.js` read), and `scripts/release-check.sh` (`public/sw.js` path
  spec) - all three are repointed in the plan.
- `public/icons/` is referenced by `public/manifest.webmanifest` (two
  `/icons/` entries) and `package.json` electron-builder config (five icon
  paths) - all repointed.
- CSP `script-src 'self'` and `worker-src 'self'` cover `js/` paths with no
  edit; `base: './'` keeps `index.html` references relative.
- No source, test, or script references `dist/assets/` paths or the emitted
  `sequencerWorker.js` name.

## Fidelity

- Enumeration fidelity - the layout vocabulary (`js/index.js`,
  `js/sequencer.js`, `js/export.js`, `css/index.css`, `media/svg`,
  `media/png`, `media/font`, `media/icon`, `worker.js`) is stated
  identically in the record and the plan.
- Vocabulary freeze - emitted names are fixed strings and `[name]`
  patterns; no second naming scheme appears anywhere.
- Cross-party parity - both ends covered: Vite emits the paths and
  `index.html`/`main.tsx`/worker URL consume them through bundler-rewritten
  or literal specifiers.
- Constants completeness - `dist/` root placement for `worker.js` is
  justified by the service-worker scope rule, not left implied.
- Boundary decisions - unknown future asset types route to flat `media/`,
  and future lazy chunks land flat in `js/` via `chunkFileNames`.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
