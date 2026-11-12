# Version 1.4.2 Review

## Document Information

| Field       | Value                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Version     | 1.4.2                                                                                                                                   |
| Review Date | 2026-11-09                                                                                                                              |
| Commands    | `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `git log`, `git status`, `scripts/release-check.sh` |

## Scope

The 1.4.2 window carried one record: `trim-song-metadata-on-save.md`, a fix sourced from the 1.4.1 window's refactoring analysis, plus the window refactoring cycle. Loader-side metadata whitespace handling is out of scope and defers to a 1.4.3 change record.

## Recorded Work

| Document                                                       | Kind                   | Status | Result                                  |
| -------------------------------------------------------------- | ---------------------- | ------ | --------------------------------------- |
| `change/1.4.2/trim-song-metadata-on-save.md`                   | change record          | done   | trimmed values written on save          |
| `plan/1.4.2/trim-song-metadata-on-save-implementation.md`      | implementation plan    | done   | plan satisfied                          |
| `plan/1.4.2/trim-song-metadata-on-save-specification-audit.md` | specification audit    | done   | requirements mapped, no findings        |
| `refactoring/1.4.2/REFACTORING.md`                             | refactoring proposal   | done   | 4 findings proposed                     |
| `refactoring/1.4.2/ASSESSMENT.md`                              | refactoring assessment | done   | all findings implemented, no deviations |

## Repository Analysis

**Confirmed**

- `src/utils/song/songIO.ts` writes `trimmedTitle` and `trimmedAuthor` - the new `trims padded title and author on save` case in `test/utils/song/songIO.test.ts` proves the raw emitted text.
- `FORMAT.md` saver rules record the trimmed-write contract.
- `coerceYamlNumber` and `YAML_DUMP_OPTIONS` live in `src/utils/yaml/yamlUtils.ts` - all seven coercion sites and three emitters migrated - `instrumentIO.ts` retains its own dump options.
- `Formatter.instrumentId` and `Formatter.instrumentSlot` removed with their test blocks - `createNoteOff()` replaced both inline literals.

**Unconfirmed**

- none

**Undocumented**

- none - every source and test change in the tree is covered by the change record, the plan, or the refactoring proposal.

**Deviations**

- none - the implementation matches the plan and the proposal step for step.

## Findings

| Severity | Finding                                                                   | Evidence                         | Action                                                 |
| -------- | ------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Minor    | loader keeps untrimmed `title`/`author` while gating on the trimmed value | `songParser.ts`                  | deferred: `change/1.4.3/trim-song-metadata-on-load.md` |
| Info     | run-length compression duplication at two sites                           | `trackClipboard.ts`, `songIO.ts` | deferred by Rule of Three                              |

## Verification Evidence

- Pre-change baseline: full loop clean (typecheck, lint, format, build, 620 tests).
- Post-record targeted loop: clean, 15 tests in `songIO.test.ts`.
- Post-refactoring full loop: `tsc -b` clean, eslint zero warnings, prettier applied, `vite build` clean, `vitest` 79 files / 620 tests passing.
- Runnable artifact: the smoke suite substitutes a manual launch per the recorded substitution for routine changes - `npm run test:e2e` runs during window close against the rebuilt `dist/`.

## Decision

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Decision       | go                                                                                    |
| Decided by     | the project owner - bump authorized by the autonomous window request                  |
| Conditions     | none                                                                                  |
| Accepted risks | songs saved with padded metadata keep padding until re-saved (recorded in the record) |
