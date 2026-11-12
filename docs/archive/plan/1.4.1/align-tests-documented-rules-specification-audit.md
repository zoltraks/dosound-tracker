# Specification Audit - Align Tests With Documented Rules

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

| Field      | Value                                                       |
| ---------- | ----------------------------------------------------------- |
| Change     | `change/1.4.1/align-tests-documented-rules.md`              |
| Plan       | `plan/1.4.1/align-tests-documented-rules-implementation.md` |
| Audit Date | 2026-11-09                                                  |

## Verdict

Every requirement in the record maps to a plan step, the one wording ambiguity is resolved against live code, and every file and interface named exists.

## Completeness

| Requirement                                                              | Plan step                                    |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| Repoint the `Storage.prototype.getItem` spy at the `localStorage` object | Repoint the localStorage spy at the object   |
| Move the `src/assets/song.yaml` fixture dependency inside `test/`        | Copy the bundled-song fixture inside test/   |
| Centralize the MIDI storage key under `StorageKeys`                      | Join the MIDI storage key to StorageKeys     |
| The new fixture survives the sibling record's pruning                    | Ordering lands this record after the pruning |

Extension beyond the record: `test/utils/branchGaps.test.ts` patches `Storage.prototype.setItem` - a third instance of the same violation class, excluded from the audit finding but identical in mechanism. It is folded into the plan so the rule violation class is actually cleared - the deviation is recorded in the window review.

## Ambiguity

- "the MIDI key" resolves to `STORAGE_KEY = 'dosound-tracker-midi-configuration'` in `src/utils/midi/midiUtils.ts`. The legacy migration literal `OLD_STORAGE_KEY` stays local per the recorded decision in `refactoring/1.3.2/REFACTORING.md`.
- "copies the needed fixture" - the copy is named `test/fixtures/bundled-song.yaml`, matching the existing `song-*.yaml` fixture naming.

## Implementability

- `test/hooks/storage/useLocalStorageState.test.tsx:45` holds the prototype spy - `vi.spyOn(localStorage, 'getItem')` is the documented replacement pattern.
- `test/utils/branchGaps.test.ts:68-79` holds the prototype stub - `useStorage.ts:51-53` warns through `logger.warn` on `setItem` failure, so a `logger` spy proves the path.
- `src/assets/song.yaml` exists and is the only out-of-tree read in the suite - `test/fixtures/` is the committed-fixture destination.
- `src/utils/storage/storageKeys.ts` is the central module - `useMidi.ts:8,55,59,107` is the only consumer of the exported key.
- `test/hooks/midi/useMidi.test.tsx:6` re-declares the literal and can import `StorageKeys`.

## Fidelity

- Enumeration fidelity: all four work items and the in-kind extension are enumerated with file paths.
- Vocabulary freeze: the plan reuses the record's terms ("centralized", "confinement").
- Cross-party parity: the key string `'dosound-tracker-midi-configuration'` is preserved byte-for-byte in `StorageKeys.MIDI_CONFIGURATION`, so persisted user configuration survives the move.
- Constants completeness: `MAX_MONITOR_ENTRIES` and the rest of `midiUtils.ts` are untouched - only `STORAGE_KEY` is removed.
- Boundary decisions: `TESTING.md` rule text is untouched per the record's Out of Scope.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
