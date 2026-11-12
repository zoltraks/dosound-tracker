# Restore honest passing coverage

**Type:** Fix

**Source:** Audit 2026-11-12 REC-03 (FND-03)

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Pass all four 80 percent coverage gates on an honest denominator |
| Key decisions | none                                                             |
| Open risks    | Some of the source paths absent from coverage data are type-only |
|               | or entry files - exclusions need per-file justification          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`vitest.config.ts` requires 80 percent on lines, functions, branches, and
statements. The audited run failed only branches (just under 80 percent)
while the other measures passed. The coverage JSON also omits a block of
`src/` TS/TSX paths entirely, so the instrumented denominator understates
the real source inventory - a passing global number on a partial file set
is not the guarantee the gate is meant to give.

Two repairs land together. Executable `src/**/*.{ts,tsx}` modules join
the V8 coverage denominator, with an explicit justified exclusion only
for type-only or entry files. Behavior tests then cover the uncovered
branches - the mirror-failure and reset-race paths are named targets.
The threshold is never raised, lowered, or disabled to make the gate
pass.

## Use Cases

- When `npm run test:coverage` runs, all four configured gates pass.
- When the coverage file list is compared with the source inventory, the
  unmatched paths are exactly the justified exclusions.

## Hints

- Lands after the 1.5.9 reset fix so the new reset-race tests exercise
  the landed semantics rather than the racy ones.
- Coverage percentages describe instrumented files - the acceptance
  check is the gate itself plus the file-list comparison, not a
  restated percentage.
- Sites: `vitest.config.ts`, `src/utils/storage/persistenceMirror.ts`,
  `test/` suites.

## Out of Scope

- Per-file or per-directory thresholds.
- Chasing 100 percent coverage.
