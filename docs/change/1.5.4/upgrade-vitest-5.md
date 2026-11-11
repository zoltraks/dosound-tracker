# Upgrade Vitest to 5

**Type:** Chore

## Summary

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Intent        | Move the test toolchain to the `vitest` 5 line across the related    |
|               | packages once the runner stabilizes on this stack                    |
| Key decisions | `vitest`, `@vitest/ui`, and `@vitest/coverage-v8` upgrade together - |
|               | the chain shares the runner; the localStorage setup installs the     |
|               | plain-object mock unconditionally                                    |
| Open risks    | `none` - landed at 5.1.0 on the Vite 8 stack                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`vitest` 5 was evaluated at 5.1.0 on the rolldown-vite 7 stack and
reverted: the full suite failed under the new runner. The failure was
toolchain-level, not test-quality - the suite itself is healthy on 4.x.

The 1.5.4 window re-ran the evaluation at 5.1.0 under Vite 8. The peer
range `^6.4.0 || ^7.0.0 || ^8.0.0` admits the stack, and the suite's two
drift surfaces resolved with a single infrastructure fix:

- Newer jsdom exposes `localStorage` as a getter-only accessor on the
  window, so the setup file's mirror assignment threw for every jsdom
  test - `assignLocalStorage` now falls back to `Object.defineProperty`.
- jsdom's own `Storage` is a WebIDL legacy platform object whose
  named-property semantics swallow `vi.spyOn` method mocks, so the
  setup now installs the plain-object mock unconditionally - the
  spyable contract `TESTING.md` already documents.

## Implementation

- `package.json` and `package-lock.json`: `vitest`, `@vitest/ui`, and
  `@vitest/coverage-v8` move `^4.1.12` to `5.1.0`.
- `test/setup-localstorage.ts`: `assignLocalStorage` helper with a
  defineProperty fallback, and unconditional mock installation.

## Verification

- `npm test` - 133 files, 1198 tests, zero failures under 5.1.0.
- `npm run test:coverage` - 90.8% statements, thresholds hold unchanged.
- Full verification loop clean: typecheck, lint, format, build, test.

## Out of Scope

- Switching test runners - the record upgrades vitest, it does not
  replace it.
- Playwright upgrades - the e2e toolchain is independent.
