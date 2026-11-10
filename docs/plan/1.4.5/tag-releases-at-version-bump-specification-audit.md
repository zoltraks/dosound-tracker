# Specification Audit - Tag releases at version bump

## Document Information

|            |                                                                  |
| ---------- | ---------------------------------------------------------------- |
| Change     | `docs/change/1.4.5/tag-releases-at-version-bump.md`              |
| Plan       | `docs/plan/1.4.5/tag-releases-at-version-bump-implementation.md` |
| Audit Date | 2026-11-10                                                       |

## Completeness

| Requirement (record)                            | Plan step                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Bump procedure records the tagging step         | Record the tag step in the bump procedure                        |
| Tag naming convention recorded                  | Add the Release Tags section - naming bullet                     |
| Release commit carries a tag naming the version | Release Tags section - timing bullet (tag on the release commit) |
| Backfill scoped, not required                   | Release Tags section - historical releases bullet                |
| Tagging decision: script vs manual step         | Record the tag step - documented manual step decided             |

No uncovered requirements; no orphan steps.

## Ambiguity

The record leaves "created by the bump script or as a documented manual step"
to planning. The plan resolves it as a documented manual step: commits and
pushes stay manual under the repository's execution policy, so the tag joins
the same manual close-out. `scripts/bump-version.mjs` stays unchanged.

The record's open risk - whether historical versions get backfilled tags - is
resolved as out of scope. Historical releases remain reconstructible from
version-bump commits.

## Implementability

- `docs/VERSIONING.md` exists and carries the Version Bump Procedure and
  CHANGELOG Conventions sections the plan anchors to.
- `scripts/release-check.sh` inspected: it enforces documentation-state
  preconditions and runs before the bump commit exists. A tag-presence check
  would always fail at gate time and would fail all historical releases, so
  the plan records a documentation note only - no script change.
- The tag command (`git tag -a X.Y.Z -m "Version X.Y.Z"`) is valid and the
  message matches the existing bump-commit convention (`Version 1.4.5 ...`).

## Fidelity

- Vocabulary: tag name is the plain `X.Y.Z` with no `v` prefix; tag message is
  `Version X.Y.Z`. Both stated once, matching the bump-commit naming.
- Boundary: tag applies to releases after the convention lands; pre-existing
  releases stay untagged.
- Cross-party parity: the AI/user split is stated - the AI neither commits nor
  tags; the user performs both.
- Constants: none introduced.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
