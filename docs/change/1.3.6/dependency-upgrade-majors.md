# Upgrade Dependencies, Evaluated Majors

**Type:** Chore

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Evaluate five major upgrades, keeping each that passes its gate |
| Key decisions | One package per step; a failure reverts that package only       |
| Open risks    | vitest 5 on rolldown-vite 7 is untested interop                 |

## Description

Five majors are feasible but need proof rather than assumption:

- `vitest` + `@vitest/ui` + `@vitest/coverage-v8` 5.1.0 - peer accepts vite ^7.
- `zustand` 5.0.16 - single store via `create`.
- `js-yaml` 5.5.0 - six YAML call sites; export round-trips must stay byte-identical.
- `lucide-react` 1.67.0 - about three icon imports.
- `eslint-plugin-react-refresh` 0.5.7 - lint gate.

## Execution

- Upgrade one package per step and run its gate (tests, coverage, typecheck, or lint).
- A failure reverts only that package to the prior version and records the deferral.
- Close with the full verification loop and an `npm audit` tail.

## Out of Scope

- typescript 7 (typescript-eslint requires `<6.1.0`), eslint 10 bundle, plugin-react 6 (requires vite ^8), vite 8 (no rolldown-vite 8.x) - recorded as deferrals.

## Outcome

- Kept: `zustand` 5.0.16, `lucide-react` 1.67.0, `eslint-plugin-react-refresh` 0.5.7 - all gates pass.
- Reverted: `vitest` 5.1.0 (suite failed under the new runner), `js-yaml` 5.5.0 (77 tests failed on serialization drift). Both recorded in `FUTURE.md`.
