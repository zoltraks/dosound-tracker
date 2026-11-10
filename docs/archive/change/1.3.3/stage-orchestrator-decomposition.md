# Stage the orchestrator decomposition

**Type:** Refactor

**Source:** AUDIT-1.2 REC-007 / FND-ARC-001

## Summary

`src/App.tsx` concentrates 2640 lines of orchestration and keeps absorbing every feature.

## Description

Extract playback, instrument, modal, and file concerns into bounded containers and hooks in staged slices, preserving the documented audio-critical constraints (prop mirroring, sparse deps, direct setState).

## Use Cases

- When a slice lands, the full verification loop plus manual audio playback must pass.
- When a slice would alter render timing, it must be re-scoped rather than forced.

## Hints

Run last: the CI, coverage, and e2e gates from the earlier windows are the safety net this refactor needs.

## Out of Scope

Do not decompose for purity alone - each slice must name its blast-radius win.
