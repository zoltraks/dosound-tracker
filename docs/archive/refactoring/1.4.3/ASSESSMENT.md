# 1.4.3 Refactoring Assessment

## Summary

Complete - all three proposed steps landed and the full verification loop passes clean.

| Metric             | Proposed | Achieved |
| ------------------ | -------- | -------- |
| Steps              | 3        | 3        |
| Import repoints    | ~13      | 14       |
| Test files moved   | 1        | 1        |
| Test blocks moved  | 1        | 1        |
| De-injected params | 3        | 3        |
| Call sites updated | 9        | 9        |

## Proposal vs Implementation

| Step                                                          | Result    |
| ------------------------------------------------------------- | --------- |
| Tidy the modal test mirror and dead annotations               | completed |
| Relocate the canonical normalizer to `instrumentSelection.ts` | completed |
| De-inject the normalizer in `instrumentOperations`            | completed |

- `test/components/FilePickerModal.test.tsx` moved to `test/modals/`; the dead `useTransposeDialog` dep entry and the stale `useSequencerIntegration` comment were removed.
- `normalizeInstrumentId` lives in `src/utils/instrument/instrumentSelection.ts`; all fourteen specifiers - including `playbackUtils.ts` itself - point there; the dead `Formatter` and branded-type imports were stripped from `playbackUtils.ts`; the contract `describe` block moved to `test/utils/instrument/instrumentSelection.test.ts`.
- The three shadowing parameters and their nine call sites were removed; the hook's own injected arg was kept per the proposal's convention note.

## Deviations and Rationale

- The hook's injected `normalizeInstrumentId` arg in `useInstrumentActions` remains - removing it was the proposal's own deferred tier, and the hook still makes seven direct calls to it.
- One import (`useSequencerIntegration.ts`) split because it shared a specifier with `updateChannelWithInstrument`, which stayed in `playbackUtils` - a mechanical consequence, not a scope change.

## Verification Results

| Step      | Result                               |
| --------- | ------------------------------------ |
| typecheck | clean                                |
| lint      | clean, zero warnings                 |
| format    | applied                              |
| build     | clean                                |
| test      | 96 files, 747 tests, zero failures   |
| exports   | byte-identical for supplied fixtures |

Test count before the window: 79 files / 620 tests. After: 96 files / 747 tests - the increase is the window's coverage record plus the moved contract block, not refactoring additions.

## Remaining Gaps

- `instrumentLookup` (`useSequencerIntegration.ts`) and `instrumentsById` (`App.tsx`) remain two normalized-id maps with divergent duplicate-key semantics - deferred; a merge is a behavior decision, not a refactor.
- `TransposeOptions.normalizeInstrumentId` keeps its injected stub contract - deferred as a separate decision.
- A `normalizePatternId` helper for the recurring pattern-id idiom stays below Rule of Three confidence - deferred.
- The `yamlUtils` single-quote strip stays per `FUTURE.md`.

## Lessons Learned

- The survey-driven enumeration paid off: all fourteen import sites were found upfront and no site surfaced during execution.
- Moving a contract to its domain home is cheapest immediately after the contract is unified - the window's routing work made the relocation trivial.
