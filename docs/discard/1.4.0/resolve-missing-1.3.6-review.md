# Resolve the missing 1.3.6 window review

**Type:** Chore

**Source:** AUDIT-1.4 REC-019 (FND-INF-008)

**Status:** Abandoned

**Abandonment reason:** Repairing a missing review for a released version makes no sense - the evidence belongs to the closed window. The recorded rule treats a forgotten review or audit report for a previous version as abandoned, not retroactively produced.

## Summary

| Field         | Value                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Intent        | Give the released 1.3.6 window its review evidence or a recorded waiver                         |
| Key decisions | the review is reconstructed from history and change records, or the waiver reason is documented |
| Open risks    | reconstruction depends on the quality of the 1.3.6 git and change-record history                |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`docs/review/` holds reviews for 1.2.9 and 1.3.0 through 1.3.5 plus 1.3.7, but `review-1.3.6.md` is absent despite eight change records in that released window. The release gate warns rather than fails on the missing review, so the gap passed silently.

The change writes `docs/review/1.3.6/review-1.3.6.md` using `docs/template/change-review-template.md`, reconstructed from the version-control log and that window's change records, or records an explicit waiver for the gap.

## Hints

- Verification is `scripts/release-check.sh` passing without the missing-review warning.
- A reconstructed review is marked as such so later readers know it was written after the window closed.

## Out of Scope

- Re-verifying 1.3.6 implementation work against the tree.
- Changes to the release-gate waiver behavior.
