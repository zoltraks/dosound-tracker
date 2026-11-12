# Specification Audit - Trim Song Metadata Values on Save

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.2/trim-song-metadata-on-save.md`              |
| Plan       | `docs/plan/1.4.2/trim-song-metadata-on-save-implementation.md` |
| Audit Date | 2026-11-09                                                     |

## Completeness

| Change record requirement                                  | Plan coverage                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| Write the trimmed title the guard computed                 | Step "Write the trimmed title"                              |
| Write the trimmed author the guard computed                | Step "Write the trimmed author"                             |
| Add a whitespace-padding case to the characterization file | Testing Strategy unit-test block                            |
| Fix both sites together                                    | Both steps land in one change set                           |
| Out of scope: `year`, `chip`, `frame`, `clock`, `speed`    | Untouched by every step                                     |
| Out of scope: loader-side whitespace handling              | Untouched; deferred to a later window per the Deferral rule |

No requirement lacks a covering step. No step implements anything outside the record.

## Ambiguity

- "Writes the trimmed values" could mean trimming inside the guard or replacing the stored value - the plan resolves this to writing the pre-computed `trimmedTitle`/`trimmedAuthor`, matching the `trimmedName` precedent at the same function's instrument and pattern name sites.

## Implementability

- `src/utils/song/songIO.ts` lines 260-268 hold the exact guard-then-write pattern the record describes - `trimmedTitle` and `trimmedAuthor` already exist.
- `test/utils/song/songIO.test.ts` exists with the `song` fixture helper, the `yaml` import, and the `omits blank title, author, and non-positive year` case the new test sits beside.
- `FORMAT.md` saver rules at lines 59-62 are the documented update site for the documentation-first step.
- js-yaml emits a trimmed `author` as `author: Writer`, so the planned `toContain` assertion holds - the raw-text assertion is required because `yaml.load` strips plain-scalar padding and would mask the defect.

## Fidelity

- Enumeration fidelity - the record names exactly two sites (`title`, `author`) - both are covered and no third metadata field is touched.
- Vocabulary freeze - the emitted YAML keys `title` and `author` are unchanged - only their values lose surrounding whitespace.
- Cross-party parity - the loader already tolerates trimmed values - loader-side padding tolerance is explicitly out of scope.
- Constants completeness - no numeric bounds involved.
- Boundary decisions - songs saved with padded metadata keep padding until re-saved, as recorded in the change record's open risks.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    |         |                  |
