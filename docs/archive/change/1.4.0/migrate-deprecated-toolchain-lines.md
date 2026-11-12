# Migrate off deprecated toolchain lines

**Type:** Chore

**Source:** AUDIT-1.4 REC-008 (FND-INF-002)

## Summary

| Field         | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| Intent        | Move lint and build onto supported release lines                            |
| Key decisions | eslint 10 and Vite 8 are adopted when those lines are stable for this stack |
| Open risks    | plugin compatibility on eslint 10 and rolldown-vite alias retirement        |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`eslint@9.39.5` carries a deprecation flag (EOL line, eslint 10 exists) and `rolldown-vite@7.3.1` is a deprecated migration shim pointing at Vite 8. Both function today but sit on unsupported release lines.

The change migrates eslint to the 10.x line and the vite alias to Vite 8 when each target is stable and compatible with the project plugins, keeping lint, build, and test green on the new lines.

## Hints

- The `typescript-eslint` chain upgrade interacts with `clear-minimatch-advisory-chain` - landing this migration may clear residual advisories recorded there.
- Configuration files under eslint scope (`eslint.config.js`, `vite.config.ts`) move with the migration.

## Out of Scope

- Functional application changes driven by the toolchain bump.
- Toolchains other than eslint and vite.
