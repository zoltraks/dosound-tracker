# Serve the Changelog Entry in the Release Build

**Type:** Change

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | The CHANGES modal must show the new version's entry after a bump   |
| Key decisions | The entry is written before `npm run bump`; the gate fails a stale |
|               | `dist/CHANGELOG.md`                                                |
| Open risks    | None                                                               |

## Description

The 1.3.8 entry was written after `npm run bump`, whose internal build had
already copied `public/CHANGELOG.md` into `dist/` - the served app showed
1.3.7 as the last entry. `VERSIONING.md` now records the entry-before-bump
ordering, and `scripts/release-check.sh` fails when `dist/CHANGELOG.md`
lacks the current version's heading.

## Outcome

- `npm run build` refreshed `dist/` - the modal now shows 1.3.8.
- The ordering rule and the mechanical check prevent recurrence.
