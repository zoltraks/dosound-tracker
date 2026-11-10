# Consolidate script output under dist/js

**Type:** Chore

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Reorganise all emitted output under `dist/js/`, `css/`, `media/`         |
| Key decisions | `js/` flat scripts; `css/`; `media/` svg/png/font/icon; `sw.js` renamed  |
| Open risks    | Per-format lazy granularity is lost - all export formats arrive together |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The production build currently emits `dist/assets/sequencerWorker.js` beside
per-format export chunks (`bin.js`, `wav.js`, `vgm.js`, `max.js`, `asm.js`,
`core.js`) in the same `dist/assets/` directory as the entry bundle.

The build must instead emit a dedicated script tree under `dist/`:

- `dist/js/index.js` - the application entry bundle, moved out of
  `dist/assets/`.
- `dist/js/sequencer.js` - the sequencer Web Worker bundle, renamed from
  `sequencerWorker.js`.
- `dist/js/export.js` - one lazy chunk consolidating every export format
  module and their shared export helpers (`asm`, `bin`, `core`, `max`, `vgm`,
  `wav`).

No subdirectories are created under `dist/js/` - all three scripts sit
directly inside it.

The emitted stylesheet moves into its own directory:

- `dist/css/index.css` - the bundled stylesheet, renamed from
  `assets/index.css`.

Every remaining emitted asset lands under `dist/media/`, grouped by type:

- `dist/media/svg/` - emitted SVG assets (today only `logo-light.svg`; the
  other imported SVGs inline below the Vite size limit).
- `dist/media/png/` - emitted PNG assets, created only when a PNG is
  actually emitted.
- `dist/media/font/` - emitted font assets, created only when a font is
  actually emitted.
- `dist/media/icon/` - the application icons, relocated from `dist/icons/`
  by moving `public/icons/` to `public/media/icon/` (the source directory
  carries the `.png` set and `icon.ico`).

The `dist/assets/` directory disappears entirely - no emitted file lands
there. `media/png/` and `media/font/` exist only when the build produces a
file of that type; an empty media subdirectory is never created.

The service worker keeps its root placement but is renamed:

- `dist/worker.js` - the service worker, renamed from `dist/sw.js` by
  renaming `public/sw.js` to `public/worker.js`. It stays at the `dist/`
  root because a service worker's scope is bounded by its URL path - only a
  root script can control the whole origin.

Other files copied verbatim from `public/` (`manifest.webmanifest`, bundled
documents, `icon.svg`, `download/`, `repository/`) are not emitted assets
and keep their current `dist/` placement.

Behavioural rules:

- Lazy loading is preserved: the consolidated export chunk loads on the first
  export request and never at startup, and the worker bundle loads only when
  the sequencer starts.
- Emitted filenames stay deterministic - no content hashes.
- The service worker, the Electron `file://` loading path, and the injected
  CSP must keep working unchanged under the new paths.
- Export output itself is untouched - every format produces byte-identical
  content for the same input.

## Use Cases

- When the user runs any export for the first time, the browser loads
  `js/export.js` once and every format resolves from it.
- When playback starts, the worker request resolves to `js/sequencer.js`.
- When `npm run build` runs, every `.js` file lives under `dist/js/`, every
  `.css` file under `dist/css/`, every emitted media file under
  `dist/media/<type>/`, and `dist/assets/` does not exist.

## Hints

- `vite.config.ts` holds the naming levers: `worker.rollupOptions.output` for
  the worker bundle and `build.rollupOptions.output` for the script chunks;
  `assetFileNames` accepts a function, so emitted assets route by extension
  into `media/svg`, `media/png`, or `media/font`.
- `src/hooks/sequencer/useSequencer.ts` builds the worker URL through
  `new URL('../../workers/sequencerWorker.ts', import.meta.url)`.
- `src/hooks/file/useFileOperations.ts` owns all eight dynamic `import()`
  sites that reach `src/exports/` - consolidation keeps them lazy but points
  them at one chunk.
- `public/sw.js` precaches only `/` and `/index.html`, so its runtime cache
  adapts to the new paths without an edit.
- The `worker.js` rename touches `src/main.tsx` (`/sw.js` registration),
  the `version-service-worker-cache` plugin in `vite.config.ts` (it reads
  `dist/sw.js` to stamp the version), and `scripts/release-check.sh`
  (`public/sw.js` in the source-delta check).
- The icon relocation requires updating `public/manifest.webmanifest`
  (`/icons/` icon entries) and the electron-builder icon paths in
  `package.json` (`public/icons/icon-512.png`, `public/icons/icon.ico`).
- ARCHITECTURE.md documents the per-format lazy-chunk layout and DEPLOYMENT.md
  describes `assets/` as the script output - both update in
  documentation-first order.

## Out of Scope

- Relocating `public/` passthrough files other than `icons/` and the
  `sw.js` rename - `manifest.webmanifest`, `CHANGELOG.md`, `MANUAL.md`,
  `MESSAGES.md`, `icon.svg`, `download/`, `repository/` keep their current
  `dist/` paths.
- Any change to export format content, worker messaging, or public behaviour.
