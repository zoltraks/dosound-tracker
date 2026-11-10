# Clear the minimatch advisory chain

**Type:** Chore

**Source:** AUDIT-1.4 REC-007 (FND-INF-001)

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Clear the 12 moderate `minimatch` advisories in dev-only transitive chains            |
| Key decisions | upgrade `electron-builder` and `typescript-eslint` chains on compatible versions only |
| Open risks    | a compatible upgrade path may not exist yet for every chain                           |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`npm audit` reports 12 moderate-severity `minimatch` advisories (GHSA-g3hv-75wg-m249, glob-pattern denial of service) reachable through `electron-builder` and `typescript-eslint` chains. The suggested `npm audit fix --force` would downgrade `electron-builder` to the 25.x line and is not an acceptable resolution.

The change upgrades the affected chains to compatible versions when they exist, removes the advisory set where possible, and documents any residual advisory with its reach analysis. All affected packages are devDependencies with no shipped-code reach.

## Hints

- Follow the recorded `WORKFLOW.md` note: `npm audit fix` can no-op on peer-pinned chains, so upgrade every member of a held chain explicitly.
- Verification is a clean `npm audit` or a documented residual.

## Out of Scope

- Forced downgrades or breaking toolchain changes beyond what each chain admits.
- Shipped dependency changes.
