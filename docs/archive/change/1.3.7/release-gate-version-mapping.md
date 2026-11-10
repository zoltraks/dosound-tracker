# Fix the Release Gate's Post-Bump Version Mapping

**Type:** Change

## Summary

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Intent        | The gate no longer fails after `npm run bump` while the window's    |
|               | records sit under the previous version directory                    |
| Key decisions | Window N's records produce release N+1 - the gate falls back to the |
|               | previous patch version's record directory                           |
| Open risks    | None                                                                |

## Description

`scripts/release-check.sh` required records under `docs/change/<version>/`
where `<version>` is the package version. After a bump, the uncommitted
delta's records live under the previous version - the window that produced
them - so the gate falsely failed between bump and commit. It now falls
back to the previous patch version's directory before failing.

## Outcome

- Gate passes post-bump: 9 records under `docs/change/1.3.7/` cover the
  delta after the 1.3.8 bump.
