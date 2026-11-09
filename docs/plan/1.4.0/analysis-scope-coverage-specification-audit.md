# Specification Audit - Bring Configs, e2e, and Electron Inside Analysis Scope

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Change     | `docs/change/1.4.0/analysis-scope-coverage.md`              |
| Plan       | `docs/plan/1.4.0/analysis-scope-coverage-implementation.md` |
| Audit Date | 2026-11-09                                                  |

## Verdict

The plan is ready for implementation. Every claim in the record was verified
against the tree, the `.cjs` typecheck boundary is a reasoned decision rather
than an omission, and the e2e surface compiles under the node tsconfig's
existing lib set.

## Completeness

- Lint scope to configs, `e2e/`, `electron/`: covered by the ESLint step,
  which also pulls `scripts/` and `eslint.config.js` into scope - the same
  unchecked surface class.
- Typecheck scope to configs and `e2e/`: covered by the tsconfig and script
  steps. The `.cjs` boundary is decided in the plan: TypeScript cannot check
  CommonJS under this setup, so those files take the lint gate. No file is
  left outside both gates.
- Build precondition for e2e: covered by `pretest:e2e`.
- `TESTING.md` updated to match the chosen gate: covered by the
  documentation step.

## Ambiguity

The record left the typecheck decision open ("whether `typecheck` becomes a
real gate or the build stays the effective type check is decided in the
plan"). The plan resolves it: `typecheck` becomes `tsc -b`, identical to the
build's own type gate, so the script stops being a no-op while adding no
second mechanism.

## Implementability

- `tsconfig.node.json` currently includes only `vite.config.ts` - adding the
  two sibling configs and `e2e/` is a one-line edit.
- `e2e/helpers.ts` and `e2e/smoke.spec.ts` import `@playwright/test` and
  `node:fs/promises` only - no DOM usage, so `lib: ["ES2023"]` and
  `types: ["node"]` already suffice.
- `tsc -b` already runs inside `npm run build` and passes, so the script
  change is proven before it is made.
- The `.cjs` and `.mjs` sources (`electron/*.cjs`, `scripts/*.cjs`,
  `scripts/bump-version.mjs`, `eslint.config.js`) are small and clean - the
  risk of new lint findings exists but is bounded, and the plan absorbs
  resolving them.

## Fidelity

- Enumeration fidelity: every file class outside the gates is enumerated -
  `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `e2e/**/*.ts`,
  `electron/**/*.cjs`, `scripts/**/*.cjs`, `scripts/**/*.mjs`,
  `eslint.config.js`. Shell scripts (`*.sh`) are named as the remaining
  ungated surface and excluded because ESLint does not parse them.
- Boundary decisions: `.cjs` typecheck exclusion is recorded with its
  rationale - react plugins stay out of non-React blocks.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
