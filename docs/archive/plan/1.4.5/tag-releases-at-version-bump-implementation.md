# Tag releases at version bump Implementation Plan

## Summary

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Intent        | Record the release-tagging step in `VERSIONING.md`                  |
| Key decisions | Manual annotated tag after the manual commit; plain-number tag name |
| Open risks    | none                                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/tag-releases-at-version-bump.md`.

## Best Practices

No source code changes. The TypeScript and React standards do not apply.
Documentation edits follow `STYLE.md`.

## Documentation Updates

- `VERSIONING.md` - tag step in the bump procedure plus a new Release Tags section.

`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` need no
changes: the tagging convention lives in the versioning document alone.

## Type and State Updates

None - documentation-only change.

## Step by Step Implementation

**Record the tag step in the bump procedure**

Extend the manual close-out paragraph at the end of the Version Bump
Procedure: the user commits the bump manually, then creates the annotated tag
on the release commit. The AI assistant neither commits nor tags.

File to modify: `docs/VERSIONING.md`.

**Add the Release Tags section**

New `## Release Tags` section between Version Bump Procedure and CHANGELOG
Conventions. It records:

- Naming: plain version number with no `v` prefix - `git tag -a X.Y.Z -m "Version X.Y.Z"`.
- Timing: on the release commit, after the user's manual commit, in the same
  close-out. `scripts/bump-version.mjs` does not create tags.
- Gate note: `scripts/release-check.sh` does not check tag presence. The gate
  runs before the commit the tag anchors to, so a tag check can never pass at
  gate time. Historical releases are untagged and would fail enforcement.
- Historical releases: untagged versions stay reconstructible from their
  version-bump commits. Backfill is out of scope.

File to modify: `docs/VERSIONING.md`.

## Implementation Order

1. Update `VERSIONING.md`
2. Run the prettier check on touched files

## Testing Strategy

No tests - documentation-only change.

## Verification

- Run `npx prettier --check` on `docs/VERSIONING.md` and both `docs/plan/1.4.5/tag-releases-at-version-bump-*` files
- Confirm `git tag` output is unchanged - this change creates no tags
- Confirm the recorded convention matches the change record's hints: no `v`
  prefix, documented manual step, backfill scoped out
