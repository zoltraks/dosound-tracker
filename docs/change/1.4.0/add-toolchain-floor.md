# Add a mechanical toolchain floor

**Type:** Chore

**Source:** AUDIT-1.4 REC-011 (FND-INF-005)

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Make the declared Node and npm floor enforceable at install time      |
| Key decisions | `engines` or `packageManager` declares the floor and `.nvmrc` pins it |
| Open risks    | `none`                                                                |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

The toolchain floor - Node 26.13.0 and npm 11.20.0 - lives only in README prose, while lockfile `engines` data implies a real floor near Node 22.22.2/24.15/26+. No `engines`, `.nvmrc`, or `packageManager` field exists, so toolchain drift between environments is silent.

The change encodes the floor mechanically: `engines` or `packageManager` in `package.json` plus an `.nvmrc` pin, aligned with the versions the README already declares.

## Hints

- Verification is `npm ci` succeeding under the declared floor.
- README and `DEPLOYMENT.md` stay consistent with the mechanical declaration.

## Out of Scope

- Raising or changing the declared versions themselves.
- Locking transitive toolchain behavior beyond the declared floor.
