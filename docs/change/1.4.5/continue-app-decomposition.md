# Continue the composition-root decomposition

**Type:** Refactor

**Source:** AUDIT-1.5 REC-008 (FND-ARC-001)

## Summary

| Field         | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Intent        | Reduce navigation and change-analysis cost at the `App.tsx` wiring layer            |
| Key decisions | Continue the staged decomposition already underway rather than a single large split |
| Open risks    | Implicit cross-hook ordering rules can cause rework when slices move                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`App.tsx` concentrates orchestration at 1108 lines with roughly 50 hook imports
and implicit cross-hook wiring. The concentration is a documented trade-off in
`ARCHITECTURE.md`, and staged decomposition has already moved the dialog,
persistence, and playback handler bodies into orchestration hooks under
`src/hooks/`. The file remains the largest in the tree and the main navigation
cost.

The decomposition continues with the next bounded slices per the focus areas in
`REFACTORING.md`: extract coherent concerns into dedicated orchestration hooks
or smaller components, reduce the number of hooks called directly in `App.tsx`,
and keep the remaining wiring visible in one place. Each step leaves the
codebase buildable and green, and extracted hooks name what they do, not how.

The change is behavior-preserving under the refactoring contract: export output
stays byte-identical for the supplied fixtures, the YM2149 emulation does not
move, and the audio-critical patterns in `SPECIFICATION.md` - prop mirroring,
sparse dependency arrays, direct `setState` calls, manual memoization - are
preserved, never "fixed".

## Use Cases

- When `App.tsx` is compared before and after a slice, then its line count and
  direct-hook count shrink while behavior stays identical.
- When a moved handler block lands in a hook, then consumers resolve without
  use-before-declaration ordering errors.

## Hints

- `WORKFLOW.md` carries recorded wound rules for this work: place extracted
  hooks before their earliest consumer, rewrite specifiers in both directions
  on moves, cut extractions on the column-0 terminator, check orphaned imports
  after each slice, and lint the destination file immediately after an
  extraction.
- `useElectronCloseGuard`, the dialog groups, and the persistence hooks are the
  established extraction pattern to follow.
- The zero-diff export fixture tests are the regression net for behavior
  preservation.
