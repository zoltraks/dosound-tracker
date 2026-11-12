# Reconcile the MPL-2.0 license policy

**Type:** Chore

**Source:** AUDIT-1.5 REC-007 (FND-CPR-001)

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Make the declared license policy describe the real dependency set          |
| Key decisions | none - the choice between policy extension and dependency swap stays open  |
| Open risks    | Replacing the `lightningcss` path may not be possible inside the toolchain |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The lockfile carries 12 MPL-2.0 packages from the `lightningcss` family, all
dev-scoped build tooling pulled in by the Vite toolchain. `COPYRIGHTS.md` lists
the permitted open-source licenses and MPL-2.0 is not among them, so the
declared policy does not describe the real dependency set. The finding was
re-verified on 2026-11-10: 12 MPL-2.0 entries remain in `package-lock.json`.

The gap closes in one of two ways, decided during planning:

- Extend the permitted-license list in `COPYRIGHTS.md` with MPL-2.0, scoped to
  dev-only build tooling so the record stays precise about where the license
  class is allowed.
- Replace the dependency path that pulls MPL-2.0 packages into the tree.

There is no linking conflict today - the packages are build tooling and never
ship inside the application bundle.

## Use Cases

- When `COPYRIGHTS.md` is compared against the lockfile license census, then
  every license class present in the tree is covered by the declared policy.

## Hints

- MPL-2.0 is a file-level weak copyleft license - acceptable for dev tooling in
  many policies, but the scope limitation must be written down explicitly.
- The `lightningcss` packages arrive through the bundled Vite rolldown
  toolchain, so removal may require upstream changes outside this repository.
