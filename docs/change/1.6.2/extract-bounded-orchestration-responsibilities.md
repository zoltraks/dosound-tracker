# Extract bounded orchestration responsibilities

**Type:** Refactor

**Source:** Audit 2026-11-12 REC-10 (DEBT-01)

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Reduce navigation cost in the largest modules without touching  |
|               | audio safeguards                                                |
| Key decisions | One bounded responsibility per extraction, verified per move    |
| Open risks    | An extraction that alters `useCallback`/`useMemo` wiring on the |
|               | audio path can destabilize timing - moves stay mechanical       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The audit measured a central orchestration root plus several modules in
the 650-1100 line range: `src/App.tsx`, `useMidiMessageProcessing.ts`,
`asm.ts`, `useDataManagement.ts`, and `useSongManagement.ts`.
`ARCHITECTURE.md` accepts the orchestration root as a deliberate design
while recognizing the navigation cost, and the broad
`react-hooks/exhaustive-deps` suppression in `src/App.tsx` is documented
as intentional for the audio path.

The work proceeds one bounded, independently testable responsibility at
a time: a coherent concern moves to its own hook or module, only proven
duplication is removed, and the documented audio-timing exception stays.
Each move is verified with byte-identical export fixtures, the browser
playback smoke, and manual audio validation before the next move
begins.

## Use Cases

- When one responsibility moves out of a hotspot, behavior is identical
  and the verification loop passes.
- When the window review reads the result, each extraction names what
  moved and what stayed.

## Hints

- Candidate seams are the ones `SPECIFICATION.md` already names:
  dedicated orchestration hooks under `src/hooks/` carry the precedent.
- Byte-identical export fixtures are the regression net for any `asm.ts`
  move; do not start there - pick the most self-contained seam first.
- Follow `REFACTORING.md` for the proposal and assessment lifecycle.

## Out of Scope

- Removing the documented lint suppressions.
- Wholesale rewrites or a decomposition of `App.tsx` in one step.
