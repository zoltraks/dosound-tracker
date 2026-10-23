# Refresh documentation figures and add a per-release doc pass

**Type:** Chore

**Source:** AUDIT-1.2 REC-004 / FND-CQY-003

## Summary

Version-pinned figures in `docs/ARCHITECTURE.md` have drifted from the manifest (Electron 39 vs resolved 42).

## Description

Correct the stale stack figures and add a documentation refresh step to the version-bump procedure so pinned values are re-checked at every release.

## Use Cases

- When a version bump runs, declared stack versions in `docs/` must match `package.json`.

## Out of Scope

Structural doc changes are out of scope - only figure accuracy.
