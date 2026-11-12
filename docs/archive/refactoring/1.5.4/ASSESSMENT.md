# Refactoring Assessment - 1.5.4

## Summary

All three proposed findings were executed. The export plumbing now
dispatches through a single `onExportFormat(ExportFormat)` prop, the
all-export hook carries an honest name (`useExportOperations`), and
the three dead top-level handlers are gone.

## Proposed vs. achieved

| Finding            | Proposed                                                                                                             | Achieved                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 dispatcher    | One `onExportFormat` prop on `ExportModal` and `ModalManager`, one `handleExportFormatFromModal` in `useExportModal` | Done - and additionally collapsed `useAppModals`, a fourth pass-through layer the proposal did not name                                |
| F-02 rename        | `useFileOperations` to `useExportOperations`, interfaces, test file, `ARCHITECTURE.md`, `FUTURE.md`                  | Done - `git mv` preserved history; `FUTURE.md` records no open candidates                                                              |
| F-03 dead handlers | Remove `handleExportVgm`/`Wav`/`Dump`, fold dump body into `exportDumpWithContext`                                   | Done - removal also exposed `exportStrategy` as a dead hook argument, which was removed from the args interface and the `App.tsx` call |

## Deviations

- The `useAppModals` layer was discovered mid-execution: `App.tsx`
  passes the modal handlers into it, and it maps them onto
  `ModalManager` props. The proposal scoped the collapse to three
  layers; it was four. The same mechanical change applied.
- `exportStrategy` turned out to be dead in the hook's args once the
  top-level handlers were removed - the `*WithContext` handlers read
  the strategy from `ExportContext`. Removed under F-03's dead-surface
  scope.
- `ExportModal`'s `formatButtons` entries dropped the `onExport`
  field; the buttons now call `onExportFormat(format)` directly.

## Verification

- `npm run typecheck` - clean.
- `npm run lint` - clean, zero warnings.
- `npm run format` - clean.
- `npm run build` - clean; `js/export.js` still lazy.
- `npm test` - 133 files, 1198 tests, all passing.
- `npx playwright test` - 30/30 on Chromium and WebKit, including the
  DATA, VGM, MAX, MOD, and MIDI export flows that exercise the new
  dispatcher end to end.
- No `src/exports/` file changed - export bytes are untouched.

## Remaining gaps

- `useExportModal`'s format-to-handler map is rebuilt each render;
  harmless at this size, noted only for completeness.
- The `useAppModals` pass-through remains broad - it shuttles many
  modal concerns beyond export. Narrowing it is a separate
  decomposition question, not this window's scope.

## Lessons

- Prop-drilled handler sets hide their true layer count - the fourth
  pass-through only surfaced when the props were renamed. Searching
  for the prop names, not just the producing hook, would have caught
  it at proposal time.
- Dead surface removal has second-order wins: deleting the three
  handlers also freed the `exportStrategy` argument, which only
  existed for them.
