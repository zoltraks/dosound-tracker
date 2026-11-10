# Lazy-Load the Export Pipelines Implementation Plan

## Summary

| Field         | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Intent        | Split `src/exports/` out of the entry chunk so the pipelines load only when an export is requested   |
| Key decisions | `await import(...)` inside the handlers' existing try blocks; Vite emits the split chunks on its own |
| Open risks    | First export per session pays a one-time chunk fetch - accepted by the record                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/lazy-load-export-pipelines.md`.

## Analysis

`useFileOperations.ts` statically imports `asm.ts`, `bin.ts`, `vgm.ts`, `wav.ts`, and `max.ts` - about 1,600 lines plus `playbackSimulation.ts` and `zx0.ts` - making it the entry chunk's only consumer of the export pipeline. No other production file imports `src/exports/`, and live playback never touches `simulateSong`, so converting the handlers to dynamic imports removes the whole pipeline from the initial download.

Every handler is already fire-and-forget `() => void` wrapped in try/catch with summary reporting - an `async` body remains assignable to the declared signatures, and a failed chunk fetch lands in the existing catch path as an export failure.

The `bin` instrument path calls `exportInstrumentToAssembly` (`asm.ts`) plus `parseAssemblyToBinary` (`bin.ts`) - one `Promise.all` over both dynamic imports covers it, and `bin.ts` statically importing `asm.ts` lets Vite share the emitted chunk. `exportDumpWithContext` only delegates to `handleExportDump`, so the dump path needs a single lazy site. `exportFileNaming` and the `types/playlist` mappers stay static per the record's hint. `js-yaml` stays static because the initial song parses in a `useState` initializer. No `manualChunks` config is needed - rolldown splits dynamic imports natively.

## Documentation Updates

- `ARCHITECTURE.md` — record the on-demand loading boundary in the Export Pipeline section so the documented data flow matches the bundling reality.

## Step by Step Implementation

**Record the lazy boundary**

Add a line to `ARCHITECTURE.md` under Export Pipeline noting that the format modules load on demand through dynamic `import()` in the file-operations hook.

File to modify: `docs/ARCHITECTURE.md`.

**Drop the static pipeline imports**

Remove the five `src/exports/` import blocks; keep `exportFileNaming`, `types/playlist`, `logger`, and the type imports.

File to modify: `src/hooks/file/useFileOperations.ts`.

**Make the three direct handlers lazy**

`handleExportVgm`, `handleExportWav`, and `handleExportDump` become `async` and destructure their module inside the `try`: `await import('../../exports/vgm.ts')`, `wav.ts`, and `asm.ts` respectively.

File to modify: `src/hooks/file/useFileOperations.ts`.

**Make the five context handlers lazy**

`exportDataWithContext` awaits `asm.ts`; `exportMaxWithContext` awaits `max.ts`; `exportVgmWithContext` awaits `vgm.ts`; `exportWavWithContext` awaits `wav.ts`; `exportBinWithContext` awaits `Promise.all([import('../../exports/bin.ts'), import('../../exports/asm.ts')])` for the instrument path. `exportDumpWithContext` `void`s the now-async `handleExportDump` call.

File to modify: `src/hooks/file/useFileOperations.ts`.

## Implementation Order

1. Update documentation
2. Remove static imports and convert handlers
3. Build and inspect the emitted chunks
4. Run verification loop

## Testing Strategy

**Unit tests**

No new unit coverage - the handlers' behavior is unchanged; the `test/exports/` suites exercise the modules directly (vitest does not bundle).

**Integration tests**

The e2e export flow (`e2e/smoke.spec.ts` "Export song to DOSOUND assembly format") is the end-to-end guard for the lazy path - it runs in the runnable-artifact check before the window closes.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build` - confirm the export modules emit as separate chunks and the entry chunk shrinks
- Run `npm test`
- Export a song in the dev server to confirm the lazy path downloads and runs
