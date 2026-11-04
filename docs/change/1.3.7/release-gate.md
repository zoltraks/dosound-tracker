# Add a Release Gate Check

**Type:** Enhancement

## Summary

| Field         | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| Intent        | Enforce the recorded SDLC preconditions mechanically before a version bump  |
| Key decisions | A local `scripts/release-check.sh` gate - no CI; the bump decision stays    |
|               | human per the recorded policy                                               |
| Open risks    | Record coverage is presence-level, not per-file - records do not name their |
|               | changed files                                                               |

## Description

The framework records correct lifecycle rules but has no enforcement layer:
a change can ship without a change record and an ad-hoc bump can run without
a refactoring assessment or window review. A release gate closes that hole.

## Implementation

- `scripts/release-check.sh` - reports and enforces: change records present
  for the current version when `src/` carries a delta, every open
  `docs/refactoring/<version>/REFACTORING.md` has an `ASSESSMENT.md`, and
  window-review presence is reported. `--warn` reports without failing.
- `docs/VERSIONING.md` - records the documentation-state bump preconditions
  and the waiver path.
- `docs/TESTING.md` - references the release check as the pre-bump entry.
- `docs/WORKFLOW.md` - notes the ad-hoc bump path flows through the gate.

## Outcome

- The gate runs clean on the current tree; verification loop passes.
