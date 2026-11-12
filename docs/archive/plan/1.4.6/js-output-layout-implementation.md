# Consolidate Script Output Under dist/js Implementation Plan

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Emit `js/`, `css/`, `media/`, and `worker.js` layout from the build   |
| Key decisions | Barrel `src/exports/export.ts` consolidates the lazy export chunk     |
| Open risks    | Shared deps may emit extra auto-named chunks under `js/` - acceptable |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.6/js-output-layout.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Deterministic build filenames without content hashes (`Build` section).
- No abbreviations in identifiers (use full words).
- Configuration changes keep `tsc -b` clean - `vite.config.ts` is covered by `tsconfig.node.json`.
- No `any` type - the `assetFileNames` router keeps the provided `assetInfo` typing.

## Audio-Critical Requirements

The change renames the sequencer worker source and its emitted bundle. No
worker logic, message protocol, or timing code changes.

- React render timing: unaffected - no component or hook code changes.
- `useCallback`/`useMemo` dependencies: untouched.
- State management in audio paths: untouched.
- YM2149 emulator and SoundDriver: untouched.
- Playback verification: the e2e smoke suite's play flow starts the worker
  and proves the renamed bundle loads; a manual play check follows the loop.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `ARCHITECTURE.md` — the workers bullet and decision note rename `sequencerWorker.ts` to `sequencer.ts`, the system diagram's worker box follows, and the lazy-load paragraph records the consolidated `js/export.js` chunk behind the `export.ts` barrel.
- `DEPLOYMENT.md` — the build output bullets describe `js/`, `css/`, `media/`, and `worker.js`, the filename-pattern sentence reflects the new `entryFileNames`/`assetFileNames` shapes, and every `/sw.js` and `dist/sw.js` reference becomes `/worker.js` and `dist/worker.js`.
- `PROJECT.md`, `SPECIFICATION.md`, `FORMAT.md` — no changes: no requirement, no source-layout, and no file-format behaviour changes.

## Type and State Updates

**Type definitions**

None - no interface, schema, or union changes.

**State store modifications**

None - `useUiStore` is untouched.

## Step by Step Implementation

**Update project documentation**

Apply the `ARCHITECTURE.md` and `DEPLOYMENT.md` edits described above.

File to modify: `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`.

**Rename the worker source**

The emitted worker name derives from the source filename, so the source
renames instead of pinning an output name.

```bash
git mv src/workers/sequencerWorker.ts src/workers/sequencer.ts
git mv test/workers/sequencerWorker.test.ts test/workers/sequencer.test.ts
```

File to modify: `src/hooks/sequencer/useSequencer.ts`, `test/workers/sequencer.test.ts`.

```typescript
workerRef.current = new Worker(new URL('../../workers/sequencer.ts', import.meta.url), {
```

```typescript
import '../../src/workers/sequencer.ts';
```

**Create the export barrel**

One module re-exporting every export surface the callers need. The single
dynamic-import target produces one lazy chunk named `export`.

File to create: `src/exports/export.ts`.

```typescript
export * from './asm.ts';
export * from './bin.ts';
export * from './core.ts';
export * from './max.ts';
export * from './vgm.ts';
export * from './wav.ts';
```

**Repoint the dynamic imports**

All eight `await import()` sites in `useFileOperations.ts` switch their
specifier to the barrel. Destructured names are unchanged - the barrel
re-exports them all with no collisions.

File to modify: `src/hooks/file/useFileOperations.ts`.

```typescript
const { exportSongToVgm, downloadVgmFile } = await import('../../exports/export.ts');
```

**Rework the build output options**

`entryFileNames` moves the entry to `js/`, `chunkFileNames` puts every lazy
chunk in `js/`, and `assetFileNames` becomes a router by extension. The
worker block mirrors the script patterns.

File to modify: `vite.config.ts`.

```typescript
build: {
  chunkSizeWarningLimit: 600,
  rollupOptions: {
    output: {
      entryFileNames: 'js/[name].js',
      chunkFileNames: 'js/[name].js',
      assetFileNames: (assetInfo) => {
        const name = assetInfo.names?.[0] ?? '';
        if (name.endsWith('.css')) return 'css/[name][extname]';
        if (name.endsWith('.svg')) return 'media/svg/[name][extname]';
        if (name.endsWith('.png')) return 'media/png/[name][extname]';
        if (/\.(woff2?|ttf|otf|eot)$/.test(name)) return 'media/font/[name][extname]';
        return 'media/[name][extname]';
      },
    },
  },
},
worker: {
  format: 'es',
  rollupOptions: {
    output: {
      entryFileNames: 'js/[name].js',
      chunkFileNames: 'js/[name].js',
    },
  },
},
```

**Rename the service worker**

The worker stays at the `dist/` root - its scope must cover `/`. The
version-stamp plugin path and the release-gate source-delta list follow.

```bash
git mv public/sw.js public/worker.js
```

File to modify: `src/main.tsx`, `vite.config.ts`, `scripts/release-check.sh`.

```typescript
navigator.serviceWorker.register('/worker.js').catch((error) => {
```

```typescript
const swPath = resolve(import.meta.dirname, 'dist', 'worker.js');
```

```bash
SRC_DELTA=$(git status --porcelain -- src/ electron/ public/worker.js 2>/dev/null | wc -l | tr -d ' ')
```

**Move the icons**

The public passthrough tree carries the icons under `media/icon`.

```bash
git mv public/icons public/media/icon
```

File to modify: `public/manifest.webmanifest`, `package.json`.

```json
"src": "/media/icon/icon-192.png"
```

```json
"icon": "public/media/icon/icon-512.png"
```

The `package.json` edits cover `mac.icon`, `win.icon`, `nsis.installerIcon`,
`nsis.uninstallerIcon` (`icon.ico`), and `linux.icon` (`icon-512.png`).

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Rename the worker source and test file
3. Create the export barrel
4. Repoint the dynamic imports
5. Rework the build output options
6. Rename the service worker
7. Move the icons
8. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions. The renamed worker suite re-verifies the worker
protocol against the moved module.

Test file to update: `test/workers/sequencer.test.ts` (renamed, import
repointed, no case changes).

**Integration tests**

Existing `test/exports/` suites already cover every format module the
barrel re-exports - export content stays byte-identical.

**End-to-end and packaging checks**

- `npm run test:e2e` - the smoke suite is the runnable-artifact slice; its
  export flow loads `js/export.js` and its play flow loads `js/sequencer.js`.
- `ls -R dist/` after `npm run build` - confirms `js/index.js`,
  `js/sequencer.js`, `js/export.js`, `css/index.css`, `media/svg/`,
  `media/icon/`, `worker.js`, and the absence of `dist/assets/`.
- `npx electron-builder --dir` - proves the repointed icon paths resolve in
  packaging; the unpacked bundle shows the new layout (per the
  unpacked-build tooling note in `WORKFLOW.md`).
- Service worker check - `dist/worker.js` carries the stamped version after
  build (`grep __APP_VERSION__` returns nothing).

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the specific feature behaviour and confirm no regressions in consumer modules
- For audio-related changes, manually verify playback timing and audio stability
