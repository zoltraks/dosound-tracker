# Specification Audit - Reconcile the MPL-2.0 license policy

## Document Information

|            |                                                                  |
| ---------- | ---------------------------------------------------------------- |
| Change     | `docs/change/1.4.5/reconcile-mpl-license-policy.md`              |
| Plan       | `docs/plan/1.4.5/reconcile-mpl-license-policy-implementation.md` |
| Audit Date | 2026-11-10                                                       |

## Completeness

| Requirement (record)                                   | Plan step                             |
| ------------------------------------------------------ | ------------------------------------- |
| Declared policy covers every license class in the tree | Permit MPL-2.0 for dev tooling        |
| Scope limitation written down explicitly               | Dev-only build tooling clause in step |
| Choice between extension and swap decided              | Extension chosen; swap rejected       |

No uncovered requirements; no orphan steps.

## Ambiguity

The record left the resolution open. The plan resolves it as policy
extension: the `lightningcss` packages arrive through the Vite rolldown
toolchain, so removal requires upstream changes outside this repository.
MPL-2.0 is file-level weak copyleft and the packages are build tooling, so
the scoped permission closes the gap without a linking conflict.

## Implementability

- `docs/COPYRIGHTS.md` exists; the Dependency Licensing section holds the
  permitted-license list at the location the step names.
- Lockfile census confirms the evidence: 12 MPL-2.0 entries, all
  `lightningcss` platform packages, all `dev: true`.
- `vite@8.3.7` (dev dependency) declares `lightningcss@^1.33.0` and
  `rolldown` - the upstream path is outside this repository's control.

## Fidelity

- Vocabulary: the license is named `MPL-2.0`, matching the SPDX string in
  `package-lock.json`.
- Boundary: MPL-2.0 stays out of shipped application code - the clause
  records that limit rather than implying it.
- Constants: none introduced.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
