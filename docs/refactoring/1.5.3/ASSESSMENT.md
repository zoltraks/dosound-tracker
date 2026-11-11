# Refactoring Assessment - 1.5.3

## Outcome vs Proposal

All three planned extractions shipped, plus one additional call-site
family the proposal scoped as optional. `useFileOperations.ts` went from
676 to 534 lines and no scope, summary, or error skeleton is duplicated.

| Proposal                      | Result                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-01 `resolveExportScope`     | Done - returns `{ scopedSong, instrument, filenameBase, scopeType }`                                                                                          |
| F-02 `buildExportScopeLines`  | Done - takes an `includeStrategy` flag (see deviations)                                                                                                       |
| F-03 `buildExportErrorLines`  | Done - used by all seven context handlers and the three top-level handlers                                                                                    |
| Step 1 characterisation tests | Done - `test/hooks/file/useFileOperations.test.tsx`, 9 tests pinning exact summary strings, verified green against the pre-refactor code before restructuring |

## Deviations

1. `ResolvedExportScope` carries `scopeType` - required to reproduce the
   divergent `instrument`-type-with-null-instrument behaviour between
   the DATA/BIN family and the early-return family exactly.
2. `buildExportScopeLines` takes `includeStrategy` - VGM, WAV, MIDI, and
   MOD never emit a `Strategy:` line; DATA, BIN, and MAX do. The flag
   keeps all seven handlers byte-identical.
3. `ExportSummaryContext` is a structural subset of `ExportContext`
   defined inside `exportSummary.ts`, so the utils module does not
   import from the hook.
4. The three top-level handlers (`handleExportVgm`, `handleExportWav`,
   `handleExportDump`) were rewired to `buildExportErrorLines` too -
   their catch blocks already matched the shared shape.

## Verification

- Summary strings byte-identical - pinned by characterisation tests
  written before the structural change.
- `src/exports/` untouched - export file bytes cannot have changed.
- `npm run typecheck` / `lint` / `format` / `build` clean.
- `npm test`: 132 files / 1190 tests pass, coverage thresholds green.
- `npm run test:e2e`: 30/30 on Chromium and WebKit, including all export
  modal flows.

## Follow-ups

None blocking. The hook is still the file-operations orchestrator;
further decomposition (moving the export handlers into a dedicated
`useExportOperations` hook) is a candidate for a future window but was
out of scope here.
