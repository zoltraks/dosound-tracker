# Clear the non-writing format gate

**Type:** Chore

**Source:** Audit 2026-11-12 REC-05 (FND-05)

## Summary

| Field         | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| Intent        | Bring the nine rejected files through Prettier cleanly       |
| Key decisions | none                                                         |
| Open risks    | Concurrent edits may add files to the rejected set - recheck |
|               | covers the final intended tree, not the audit's list alone   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The non-writing `prettier --check .` gate rejects nine current-revision
files: two documents under `docs/refactoring/1.5.9/`, five source files
(`ModalContainer.tsx`, `ModalManager.tsx`, `PianoKeyboard.tsx`,
`MidiModal.tsx`, `SettingsModal.tsx`), and two test files
(`exportAssemblyTight.test.ts`, `directoryPurity.test.ts`). The
clean-build policy counts formatting alongside typecheck, lint, build,
and tests, so this is a declared release blocker.

Format the measured files - and only them, after reconciling any
concurrent edits - then re-run the non-writing check on the final
intended tree including the report surface, and re-run the rest of the
verification loop the project requires.

## Use Cases

- When `prettier --check .` runs on the final tree, it exits clean with
  zero warnings.
- When typecheck, lint, build, and tests run afterwards, all pass.

## Hints

- `npm run format` rewrites in place - scope it to the named files
  rather than running an indiscriminate workspace rewrite.
- The audit's nine is a snapshot; new rejects between the audit and the
  fix are formatted in the same pass once detected.

## Out of Scope

- Prettier configuration changes.
- Content edits beyond what formatting itself produces.
