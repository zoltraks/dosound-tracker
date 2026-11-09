# Remove dead dependency and unreferenced fixtures

**Type:** Chore

**Source:** AUDIT-1.4 REC-012 (FND-INF-006)

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | Make the declared inventory match what the suite actually uses     |
| Key decisions | unused declaration uninstalled; eight unreferenced fixtures pruned |
| Open risks    | `none`                                                             |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`@testing-library/jest-dom` is declared and installed but never imported anywhere, and eight of ten files in `test/fixtures/` are unreferenced remnants of the 1.2.7 refactoring verification.

The change uninstalls the unused dependency and prunes the dead fixtures so `test/fixtures/` holds only referenced files.

## Hints

- Verification is `npm test` still green after removal.
- `align-tests-documented-rules` moves a fixture dependency inside `test/`; the two records must not prune what the other one introduces - land this first or reconcile in the plan.

## Out of Scope

- Referenced fixtures and committed test data still in use.
- DevDependencies with real import sites.
