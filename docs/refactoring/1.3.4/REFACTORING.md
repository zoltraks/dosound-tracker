# Refactoring Proposal - 1.3.4

## Problem

The window delivered a large structure reorganization (domain subfolders, barrel removal, stores dissolution) and a standard-library adoption. The remaining structural debt is recorded known limitation territory: `App.tsx` still concentrates hook wiring (~1390 lines), business logic spans hooks and utils with implicit cross-hook dependencies, and synth/exports test coverage is thin.

## Goal

Hold the verified state - no further structural moves this window. Deferred items are recorded as change records for the next window rather than executed on top of an uncommitted change set.

## Plan

- Defer `App.tsx` orchestrator decomposition continuation to a dedicated change.
- Defer test-mirror alignment (`test/stores/` naming vs the new `src/hooks/ui/` home).
- Defer synth and exports coverage expansion (already a recorded known limitation).
- No execution this window - the pending commit of ~90 renames is the refactor.

## Risk

None added: the window closes on a verified-clean tree. Executing more refactoring inside the uncommitted set would blur the commit boundary and the audit trail.

## Acceptance Criteria

- The tree passes the full verification loop with zero errors and zero warnings.
- Deferred items exist as change records under `docs/change/1.3.5/`.
