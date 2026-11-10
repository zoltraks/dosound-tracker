# Record the Remaining Conventions and Clean One Historical Defect

**Type:** Chore

**Source:** ASE evaluation findings, 2026-11-03

## Summary

| Field         | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| Intent        | Record conventions that are practiced but not yet written down                    |
| Key decisions | Profile, topology, and readiness owner join the layout map's recorded conventions |
| Open risks    | None - records describe existing practice                                         |

## Description

Several conventions are practiced and inferable but not recorded:

- The repository profile (`Software`), topology (`single-project`), and guidelines topology (`Distributed` - `GUIDELINES.md` plus topic owners) are nowhere stated.
- The environment-readiness role has content in `README.md` (development environment) and `DEPLOYMENT.md` (build and deployment prerequisites) but no recorded owner.
- `docs/plan/1.3.1/remove-ci-workflow.md` exists with no matching change record - it documents a direct user instruction, and the convention that explicit user instructions may produce plans without change records is implied but not stated.
- `docs/refactoring/1.2.6/ASSESSMENT.md.md` is a clear filename defect (double extension).
- `COMPARISATION` spellings and the `docs/report/1.2.4-configuration/` directory are historical naming variance to record as accepted, not normalize.

## Execution

- Add recorded-convention lines to the `GUIDELINES.md` layout map for profile, topology, guidelines topology, and the environment-readiness owner.
- Record the direct-instruction plan precedent: an explicit user instruction may produce an implementation plan without a change record, and the plan states the instruction as its reference.
- Rename `docs/refactoring/1.2.6/ASSESSMENT.md.md` to `ASSESSMENT.md`.
- Record `COMPARISATION` filenames and `docs/report/1.2.4-configuration/` as accepted historical variance.

## Out of Scope

- No mass renaming of historical `COMPARISATION` or per-model report files.
- No restructuring of `docs/report/` or `docs/refactoring/` contents.
