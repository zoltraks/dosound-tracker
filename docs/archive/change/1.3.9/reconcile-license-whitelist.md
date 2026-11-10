# Reconcile the license whitelist with the resolved set

**Type:** Chore

**Source:** AUDIT-1.4 REC-016 (FND-CPR-001)

## Summary

| Field         | Value                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Intent        | Bring the single off-whitelist production-chain license inside declared policy          |
| Key decisions | `Python-2.0` is reviewed and the whitelist extended, or the dependency path is replaced |
| Open risks    | none until the license review outcome is known                                          |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`argparse@2.0.1`, a production dependency of `js-yaml`, carries the `Python-2.0` license, which is absent from the permitted-license whitelist in `docs/COPYRIGHTS.md`. It is the only production-chain license outside the declared set.

The change performs the per-package license review the policy already prescribes for undeclared licenses: `Python-2.0` is evaluated and, if acceptable, added to the permitted list in `docs/COPYRIGHTS.md` - otherwise the `js-yaml` dependency path is replaced so every production-chain license sits inside the declared classes.

## Hints

- `Python-2.0` is permissive-class, so whitelist extension is the expected outcome.
- Verification is a whitelist-to-lockfile diff showing zero uncovered production licenses.

## Out of Scope

- DevDependency license changes.
- SPDX or CycloneDX SBOM tooling.
