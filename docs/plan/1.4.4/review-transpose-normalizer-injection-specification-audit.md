# Specification Audit - Review the Transpose Normalizer Injection

## Document Information

|            |                                                                           |
| ---------- | ------------------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/review-transpose-normalizer-injection.md`              |
| Plan       | `docs/plan/1.4.4/review-transpose-normalizer-injection-implementation.md` |
| Audit Date | 2026-11-10                                                                |

## Completeness

| Change-record requirement                                                | Covering plan step                     |
| ------------------------------------------------------------------------ | -------------------------------------- |
| Decide whether the injection stays a documented test seam or aligns      | Analysis + Steps 1-3 (decision: align) |
| If the stub contract is incidental, route through the canonical function | Steps 1-2                              |
| Update the stub when aligning                                            | Step 3 (stub removed, not rewritten)   |
| Out of Scope: `useInstrumentActions` injected-args-object convention     | Respected - untouched                  |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Update the stub" admits rewriting it to mirror the canonical contract or
deleting it. Deletion is correct once the injection is removed - a stub of
the real function would be dead code, and the record's own wording ("route
`transposeUtils` through the canonical function and update the stub") covers
the stub's removal as its resolution.

## Implementability

| Step | Check                                                                                        | Result |
| ---- | -------------------------------------------------------------------------------------------- | ------ |
| 1    | `instrumentSelection.ts` exports `normalizeInstrumentId`; same-name binding keeps call sites | Pass   |
| 2    | Sole options producer is `useTransposeDialog`; the import stays for `selectedInstrumentId`   | Pass   |
| 3    | No assertion exercises stub-specific behavior (`$` strip, padding, `'00'` fallback)          | Pass   |

`useTrackOperations` re-exports `TransposeOptions` without constructing it,
so the interface change propagates cleanly.

## Fidelity

- Enumeration fidelity - the record names one seam; both its definition (interface + call sites) and its producer (dialog hook + test helper) are covered.
- Vocabulary freeze - after the change one contract exists: `normalizeInstrumentId` in `instrumentSelection.ts`.
- Cross-party parity - the dialog still normalizes `selectedInstrumentId` itself; `transposeUtils` normalizing it again is redundant but harmless and unchanged.
- Constants completeness - no constants involved.
- Boundary decisions - `applyTranspose`'s options type loses a required field; no other producer exists, so no boundary is left undecided.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
