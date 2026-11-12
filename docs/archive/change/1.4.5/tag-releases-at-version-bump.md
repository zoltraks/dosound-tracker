# Tag releases at version bump

**Type:** Chore

**Source:** AUDIT-1.5 REC-004 (FND-INF-002)

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Give every released version an immutable VCS anchor                    |
| Key decisions | Tagging joins the documented bump procedure rather than staying manual |
| Open risks    | Whether historical versions get backfilled tags                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The repository carries zero git tags across roughly 25 released versions, so no
immutable anchor marks a released state. Reverting or bisecting a release
requires reconstructing it from version-bump commits and the CHANGELOG. The
finding was re-verified on 2026-11-10: `git tag` lists nothing.

Every version bump produces a git tag on the release commit naming the released
version. The bump procedure in `VERSIONING.md` records the tagging step and the
tag naming convention so each future release is anchored automatically by
process. Whether the tag is created by the bump script or as a documented
manual step is decided during planning - commits and pushes stay manual either
way.

## Use Cases

- When a version bump completes, then the release commit carries a tag naming
  the version.
- When `git tag` runs after the change lands, then it lists released versions.

## Hints

- The project naming convention uses plain version numbers without a `v`
  prefix - tags follow the same convention.
- Historical releases can be reconstructed from bump commits; whether to
  backfill tags for them is a scoping question for the plan, not a requirement.
- `scripts/release-check.sh` is the release gate - the tag step belongs to the
  same documented procedure it enforces.
