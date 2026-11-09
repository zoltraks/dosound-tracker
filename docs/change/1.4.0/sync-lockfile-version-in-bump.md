# Sync the lockfile version inside the bump script

**Type:** Fix

**Source:** AUDIT-1.4 REC-009 (FND-INF-003)

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Keep `package-lock.json` version equal to `package.json` after every bump |
| Key decisions | the bump script performs the lockfile write itself                        |
| Open risks    | `none`                                                                    |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`scripts/bump-version.mjs` writes only `package.json` and never runs `npm install`, so the lockfile root `version` has drifted to 1.3.6 while the manifest sits at 1.3.8.

The change makes the bump script sync the lockfile version inside the same operation - through `npm install` or an equivalent version write - so release metadata stays coherent after every bump.

## Hints

- Verification is `package-lock.json` version equal to `package.json` version after the next bump.
- `VERSIONING.md` is updated if the procedure description needs to reflect the new automatic step.

## Out of Scope

- Changes to the version-increment rules.
- Manual lockfile repair outside the bump path.
