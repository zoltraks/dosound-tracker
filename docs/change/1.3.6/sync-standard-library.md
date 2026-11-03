# Sync the Engineering Standard Library

**Type:** Chore

**Source:** ASE evaluation findings, 2026-11-03 (`standards-synchronization` advisory)

## Summary

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Intent        | Re-vendor three stale standards and adopt the TypeScript refactoring one             |
| Key decisions | Canonical content stays byte-identical; project deltas live in `Project Conventions` |
| Open risks    | Existing `Project Conventions` wording may reference superseded canonical text       |

## Description

Three vendored standards in `docs/standard/` are behind the canonical library:

- `css-general-development.md`: vendored 0.1.4 vs canonical 0.1.5.
- `standard-template-development.md`: vendored 0.1.4 vs canonical 0.1.7 - the stale copy references `scripts/validate-standards.py`, which does not exist in this repository.
- `typescript-general-development.md`: vendored 0.1.4 vs canonical 0.1.7 - the canonical language-version rule changed from exact pin to minimum floor.

The canonical library also ships `typescript-refactoring-development.md` 0.1.0, a matching-stack standard absent from the repository. It fits the per-version refactoring cycle recorded in `REFACTORING.md` and is adopted with a `Project Conventions` section.

## Execution

- Re-vendor the three stale files from the canonical library, preserving each file's `Project Conventions` section per the recorded vendoring convention.
- Review each `Project Conventions` section after the re-vendor and trim or reword entries that the new canonical text now covers.
- Vendor `typescript-refactoring-development.md` and append a `Project Conventions` section binding it to `REFACTORING.md`, the proposal/assessment cycle, and the audio-critical constraints in `GUIDELINES.md`.
- Add the new file to `standard/README.md`, the `GUIDELINES.md` Sources of Truth table, and the `README.md` standards table.
- Sync checks compare content with `diff -w -B`, never raw bytes - the format sweep's spaced separators are expected noise.

## Out of Scope

- No changes to canonical content inside vendored files.
- No adoption of other canonical standards - the stack-matched set is already complete after this change.
