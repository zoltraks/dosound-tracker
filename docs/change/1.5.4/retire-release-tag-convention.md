# Retire release tag convention

## Summary

- **Status**: shipped
- **Type**: Chore
- **Owner**: user
- **Scope**: `docs/VERSIONING.md`

## Request

The user stated the project uses no git tags, contradicting the Release
Tags convention recorded in `VERSIONING.md`.

## Implementation

- The convention came from `change/1.4.5/tag-releases-at-version-bump.md`
  and was never practiced - roughly 25 releases and `git tag` still
  lists nothing. `VERSIONING.md` now records the actual convention: no
  tags, a release anchors to its version-bump commit and CHANGELOG
  entry, and agents do not suggest tagging.
- The 1.4.5 record stays as the historical decision it documents - the
  supersession is visible from `VERSIONING.md`'s current text.

## Verification

- Documentation-only change; Prettier clean.
