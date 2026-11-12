# Specification Audit - Clear the minimatch dependency advisories

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.5/clear-minimatch-advisories.md`              |
| Plan       | `docs/plan/1.4.5/clear-minimatch-advisories-implementation.md` |
| Audit Date | 2026-11-10                                                     |

## Completeness

| Requirement (record)                       | Plan step                                         |
| ------------------------------------------ | ------------------------------------------------- |
| `npm audit` exits 0 or residual documented | Scoped overrides + regenerated lockfile - exits 0 |
| Upgrades pass the verification loop        | Verification section runs the full loop           |

## Ambiguity

- "Upgrade the affected chains" is resolved as scoped `overrides`: direct
  parent upgrades cannot reach the fix (parents cap at `^10.2.2`, fix is
  11.0.1+) and `audit fix --force` is a breaking eslint downgrade.

## Implementability

- Advisory re-verified: `npm audit` exited 1 with 15 moderates on
  `@electron/universal`, `app-builder-lib`, `eslint`, `@eslint/config-array`,
  `@typescript-eslint/typescript-estree` chains - the same five the overrides
  target, confirmed by `npm ls minimatch`.
- `npm view minimatch` shows 11.0.5 published; all five parents resolve
  `minimatch@11.0.5` after install.
- Result verified: `found 0 vulnerabilities`; lint, typecheck, build, and the
  792-test suite all pass under the forced 11.x line.

## Fidelity

- Only the flagged parents are overridden - `minimatch@3.1.5`/`5.1.9` under
  `glob`, `dir-compare`, and `filelist` keep their declared versions.
- Boundary: a future parent release declaring `^11` makes the override a
  no-op; the lockfile records the pin explicitly.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
