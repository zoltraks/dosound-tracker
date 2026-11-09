# Specification Audit - Add a Mechanical Toolchain Floor

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Change     | `docs/change/1.4.0/add-toolchain-floor.md`              |
| Plan       | `docs/plan/1.4.0/add-toolchain-floor-implementation.md` |
| Audit Date | 2026-11-09                                              |

## Verdict

The plan is ready for implementation. The declared floor versions match the
running toolchain, no mechanical declaration exists yet, and every mechanism
in the plan maps to the record's requirements.

## Completeness

- `engines` or `packageManager` declares the floor: the plan selects
  `engines` for both Node and npm.
- `.nvmrc` pins it: covered by the `.nvmrc` step.
- Enforceable at install time: covered by the conditional `.npmrc`
  `engine-strict` step.
- README and `DEPLOYMENT.md` stay consistent: covered by the documentation
  step.

No requirement lacks a step.

## Ambiguity

The record offered "`engines` or `packageManager`". The plan resolves it to
`engines`: `packageManager` pins an exact npm through corepack, which
contradicts the floor semantics (`>=`) the record asks for. `engines` covers
both Node and npm in one declaration.

The `.npmrc` step is conditional in the plan: if strict engine checking fails
on a transitive range, the floor stays declared but non-strict and the
summary block records the decision. That fallback is the only open branch.

## Implementability

- `package.json` has no `engines` or `packageManager` field today; adding
  `engines` is a plain manifest edit.
- No `.nvmrc` or `.npmrc` exists at the root; both creations are clean.
- README lines 129-130 declare Node v26.13.0 and npm 11.20.0; the running
  environment is exactly those versions, so the floor admits it.
- `npm install` is available and the lockfile version already drifts
  (1.3.9 vs 1.4.0); the refresh will also write the current version into the
  lockfile, which is normal tooling behaviour, not manual repair.

## Fidelity

- Constants completeness: the floor values are enumerated exactly -
  Node `>=26.13.0`, npm `>=11.20.0`, `.nvmrc` pin `26.13.0`.
- Boundary decisions: strict-mode failure handling is decided in the plan
  (omit `.npmrc`, record in summary), not left open.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
