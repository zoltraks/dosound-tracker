# Refactoring Proposal - 1.5.4

## Problem

The 1.5.4 window added the `ExportFormat` union and a data-driven format
button map in `ExportModal.tsx`, which exposed the remaining shape
mismatches around the export modal plumbing and the file-operations
hook:

**F-01 - eight identical export-format callbacks cross three layers**

`useExportModal` exposes `handleExportDumpFromModal` through
`handleExportMidiFromModal` - eight `useCallback`s that differ only in
the context handler they invoke. `ModalManager` declares eight props
for them and passes all eight to `ExportModal`, which stores them in
the new `formatButtons` map. The `ExportFormat` union introduced this
window makes a single dispatcher the natural shape:

```typescript
onExportFormat(format: ExportFormat): void
```

replacing eight props on two components and eight callbacks in the hook.

**F-02 - `useFileOperations` no longer holds file operations**

Since the song/instrument file handlers moved out over earlier windows,
`src/hooks/file/useFileOperations.ts` (534 lines) now contains only
export logic: the scope resolver, eight `export*WithContext` handlers,
and the two summary states. The 1.5.3 assessment recorded the rename
as the follow-up - the file's name says file operations while its
entire surface is export operations.

**F-03 - dead top-level export handlers**

`handleExportVgm`, `handleExportWav`, and `handleExportDump` are
returned from the hook and consumed nowhere - `App.tsx` destructures
only the `*WithContext` members and the summary state. The dump
handler survives only as the body `exportDumpWithContext` delegates to.

## Goal

- One `onExportFormat(ExportFormat)` prop on `ExportModal` and
  `ModalManager`, one `handleExportFormatFromModal` dispatcher in
  `useExportModal` - the format-to-handler map lives next to the
  context handlers.
- `src/hooks/file/useExportOperations.ts` exports
  `useExportOperations` with `UseExportOperationsArgs` /
  `UseExportOperationsResult`; `ExportContext` moves with it.
- The three dead handlers are gone; the dump logic lives inside
  `exportDumpWithContext`.

External behaviour is identical: same downloads, same summaries, same
modal.

## Plan

1. **Tidy: remove the dead handlers.** Delete `handleExportVgm`,
   `handleExportWav`, and `handleExportDump` from the hook's result,
   folding the dump body into `exportDumpWithContext`.
2. **Tidy: rename the hook.** `useFileOperations.ts` becomes
   `useExportOperations.ts`; rename the hook, its arg/result
   interfaces, the test file, the `App.tsx` import, the
   `useExportModal` `ExportContext` import, the `ARCHITECTURE.md`
   mention, and drop the delivered candidate from `FUTURE.md`.
3. **Structural: single format dispatcher.** `useExportModal` replaces
   the eight callbacks with `handleExportFormatFromModal(format)`;
   `ModalManager` and `ExportModal` take one `onExportFormat` prop;
   `ExportModal`'s button map calls it with each entry's `format`;
   update `ExportModal.test.tsx` to the new prop shape.
4. **Verify**: typecheck, lint, format, build, unit tests, e2e.

Each step leaves the tree buildable; the rename is kept separate from
the structural dispatcher change per the step-granularity rule.

## Risk

The dispatcher path is exercised end-to-end by the e2e export flows
(DATA, VGM, MAX, MOD, MIDI clicks) and the modal button-routing test,
so a wiring mistake fails loudly. The rename is mechanical with four
call sites. No export bytes change - `src/exports/` is untouched.
Coverage of the touched files is adequate: `useFileOperations` has the
characterisation suite from 1.5.3, the modal has dedicated tests.

## Acceptance Criteria

- Identical observable behaviour: export modal flows produce the same
  downloads and summaries.
- Zero diff in produced export outputs - no `src/exports/` change.
- Eight props collapse to one on both components; no `handleExport*`
  top-level handlers remain.
- Full verification loop green including e2e on Chromium and WebKit.
