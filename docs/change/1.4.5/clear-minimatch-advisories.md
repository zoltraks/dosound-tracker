# Clear the minimatch dependency advisories

**Type:** Chore

**Source:** AUDIT-1.5 REC-003 (FND-INF-001)

## Summary

| Field         | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Intent        | Return `npm audit` to a clean exit by clearing the moderate `minimatch` chain  |
| Key decisions | Upgrade the affected dev toolchain chains; a residual stays documented if none |
| Open risks    | Upstream may publish no fixed release inside the declared ranges               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`npm audit` exits 1 with 15 moderate-severity advisories for `minimatch`
(GHSA-g3hv-75wg-m249). Every instance sits in devDependency chains for eslint,
typescript-eslint, and electron-builder - nothing ships to the runtime bundle.
The finding was re-verified on 2026-11-10 against the working tree: the audit
still exits 1 with the same advisory count.

The affected toolchain chains are upgraded until `npm audit` exits 0. The
upgrade follows the recorded peer-pinned-chain note in `WORKFLOW.md`: when a
declared range already admits the fixed version, every member of the chain is
upgraded explicitly and the audit re-run. If no fixed release exists inside the
declared ranges, the residual advisory is recorded under the documented
procedure in `VERSIONING.md` instead of forcing breaking upgrades.

## Use Cases

- When `npm audit` runs after the upgrades, then it exits 0 or the residual is
  documented under the security-review procedure.
- When the version-bump release gate runs `npm audit`, then the result is clean
  or carries the updated residual note.

## Hints

- Dev-only scope means the verification loop, not the audit, guards build
  correctness - upgrades must still pass typecheck, lint, format, build, and
  test.
- A lockfile regeneration is a legitimate migration step per the recorded
  stale-lockfile note in `WORKFLOW.md`.
- `@playwright/test` upgrades inside a regenerated tree may require
  `npx playwright install` before e2e runs - see `TESTING.md`.
