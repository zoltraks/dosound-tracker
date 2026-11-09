# Refactoring Assessment - 1.3.9 Window

## Summary

Complete - all five proposed steps landed with the verification loop clean.

| Metric           | Proposed | Achieved |
| ---------------- | -------- | -------- |
| Steps            | 6        | 6        |
| Files new        | 0        | 0        |
| Duplicated sites | 20       | 0        |
| Dead exports     | 3        | 0        |

## Proposal vs Implementation

| Item                                              | Status    |
| ------------------------------------------------- | --------- |
| Remove `ARPEGGIO_MIN`, `ARPEGGIO_MAX`, `TrackKey` | completed |
| Shared `parseBaseKey` in `HeaderPanel`            | completed |
| `formatBaseKey` delegation at three safe sites    | completed |
| `noteKeyId` helper across eleven sites            | completed |
| `resolveMidiNote` helper across three sites       | completed |
| `buildToneComment` across two asm sites           | completed |

## Deviations and Rationale

No deviations from the plan. Three deliberate exclusions were declared in the proposal itself:

- `src/exports/core.ts:47` keeps its inline conditional - `formatNoteLabel` accepts a public `baseNote` parameter whose casing is unconstrained, and routing it through `formatBaseKey` would uppercase lowercase input, which is a behaviour change.
- The extracted `buildToneComment` keeps the inline `meta.note.includes('#')` conditional for the same reason - `meta.note` comes from parsed song data whose casing is not proven uppercase, and byte-identical export output is a hard constraint.
- The three documented dead exports (`ExportFormat`, `asTrackId`, `LogEntry`) were deferred rather than removed, because each is named in a shipped document (`SPECIFICATION.md`, `LOGGER.md`) and removing them is a spec-level decision. Tracked by `docs/change/1.4.0/trim-documented-dead-exports.md`.

## Verification Results

- `npm run lint` - zero errors, zero warnings.
- `npx prettier --write` - applied to all touched files, two proposal documents reformatted.
- `npm run build` - passes.
- `npm test` - 76 files, 555 tests, all green (555 before the window, 555 after; no test changes required).
- Per-step verification ran after each of the five steps: `tsc --noEmit`, `eslint`, and the affected test subsets (`test/exports/`, `test/components/`, `test/hooks/`, `test/utils/`) stayed green throughout.
- Export output fidelity - the export suite (`test/exports/`, `exportCoreAndValidation.test.ts`, 62 tests) is green, confirming byte-identical output after the `core.ts` and `asm.ts` substitutions.

## Remaining Gaps

- `src/exports/core.ts:47` retains the inline conditional by design; normalising `formatNoteLabel` for non-uppercase input would be a behaviour change and was not deferred since no call site can currently produce it.
- `ExportFormat`, `asTrackId`, and `LogEntry` remain as documented-but-unreferenced exports pending the 1.4.0 record.
- The dead items enumerated by `log-silent-catches-trim-dead-surface` (seven `useSequencer` exports, `debugTimestamp`, `__dosoundTrackerIsResetting`, the empty `if` block) are untouched - they belong to that record's scope, not this window's.

## Lessons Learned

The window's consolidation made the key-id contract visible: eleven independent spellings of `` `${note}${octave}` `` only became obvious once the five preview engines were collapsed and the surviving call sites could be grepped in one pass. Consolidating the engine first and the identity contract second - same window, sequenced - is the right order.

The dead-export census paid for itself by splitting on documentation status: undocumented dead exports are a tidy step, but documented ones are a spec decision and belong in the change lifecycle, not a refactoring window.
