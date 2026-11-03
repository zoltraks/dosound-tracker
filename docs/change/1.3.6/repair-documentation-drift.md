# Repair Documentation Drift

**Type:** Chore

**Source:** ASE evaluation findings, 2026-11-03

## Summary

| Field         | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Intent        | Correct documented figures contradicted by verified reality   |
| Key decisions | Figures are corrected in place; no rules or structure change  |
| Open risks    | None - every replacement value is verified against the source |

## Description

Three documents carry factual figures that drifted from reality and must be corrected:

- `README.md` claims "Electron 28, Electron Builder 24" in its technical details, while `package.json` carries `electron ^42.0.0` and `electron-builder ^26.8.1`. `ARCHITECTURE.md` already states Electron 42 correctly.
- `README.md` claims "MAX specification v1.6" in its export features, while `MAX.md` declares Version 1.7 (Release Candidate 7).
- `REFACTORING.md` cites the "~1390-line `App.tsx`" in its App.tsx decomposition focus area, while the file is now 1105 lines after the 1.3.6 decomposition.
- `TESTING.md` cites "the 44 hooks" in its coverage gaps, while `src/hooks/` now holds 50 `use*` files.

## Execution

- Update the Electron and Electron Builder figures in `README.md`.
- Update the MAX specification figure in `README.md`.
- Update the `App.tsx` size figure in `REFACTORING.md`.
- Update the hook count in `TESTING.md`.

## Out of Scope

- No rule, convention, or section changes - figures only.
- No version bump or CHANGELOG entry.
