# Testing Strategy

## Clean Build Definition

A clean build means **zero errors and zero warnings** across all verification steps:

- **TypeScript compilation** (`npm run typecheck`) must pass with no errors.
- **Linting** (`npm run lint`) must produce no errors and no warnings.
- **Formatting** (`npm run format`) must be applied to all source files.
- **Build** (`npm run build`) must complete successfully with no errors.
- **Tests** (`npm test`) must all pass.

`npm run format` rewrites every file Prettier recognises across the whole tree, including restricted directories such as `docs/report/` and `docs/refactoring/`. Formatting changes it makes in restricted directories are an accepted side effect of the loop and must not be reverted. When a restricted file must stay byte-identical, run `npx prettier --write` on explicit paths instead of `npm run format`.

Any warning from linting, including React Hook dependency warnings, must be resolved before the build is considered clean.

**Audio-Critical Linting Exception**

The `GUIDELINES.md` document identifies specific linting warnings that are intentional and must not be fixed because they preserve audio timing stability. These warnings are accepted as part of the clean build:

- React Hook dependency warnings in audio-critical paths
- `setState` in effect warnings in audio-critical paths
- `useCallback` wrapping warnings in audio-critical paths

These exceptions apply only to code paths documented in `GUIDELINES.md`. All other linting warnings must be resolved.

## Security Audit

The verification loop covers **code correctness and build quality**: typecheck, lint, build, and test. It does **not** include `npm audit`.

`npm audit` checks for known security vulnerabilities in external dependencies. It is a separate security review step, not a code quality check. It is not part of the standard verification loop because:

- It evaluates third-party packages, not project code.
- Some vulnerabilities are in devDependencies that do not ship to end users.
- Transitive dependency vulnerabilities may not have immediate fixes.
- Forcing `npm audit fix` can introduce breaking changes in unrelated packages.

`npm audit` **must** be run before version bumps. See `VERSIONING.md` for the security review procedure.

## Pre-Change Baseline

Before any code change — whether a new feature, bug fix, or refactoring — run the full verification loop to establish a known-good baseline. Do not begin modifying source code until the baseline passes with zero errors and zero warnings. This ensures that any failures discovered later are caused by the current change and not by pre-existing issues.

## Post-Change Workflow

The verification loop has two modes: **targeted** (during active implementation) and **full** (at milestones).

**Targeted verification loop**

Run during implementation iterations after each code change. This is the canonical order.

```
1. Typecheck -> npm run typecheck
2. Lint      -> npm run lint
3. Format    -> npm run format
4. Build     -> npm run build
5. Test      -> npm test <targeted test pattern>
6. Fix       -> address every error and warning
```

Run only the tests that cover the code being modified. Use a test file path or pattern to limit scope (for example `npm test src/utils/song/songParser` or `npm test -- test/utils/`).

**Full verification loop**

Run the complete suite with `npm test` (no pattern) at these milestones:

- Before the first code modification of any task (pre-change baseline).
- When finishing an implementation.
- After any refactoring.
- Before bumping the version.
- When asked for a production ready build or clean build.

**Repeat until clean**

- If any step produces errors or warnings, fix them immediately.
- Re-run all steps after each fix.
- Work is only finished when steps 1 to 5 pass with zero errors and zero warnings.

**When the verification loop is required**

Run the verification loop only when source code, configuration, or test files are modified. Do not run it for documentation-only changes (for example creating or updating change request documents, implementation plans, refactoring proposals, refactoring assessments, or guideline files). The loop is required:

- Before the first code modification, to establish a known-good baseline.
- After each code change iteration.
- After finishing implementation or refactoring.
- Before version bumping.
- When explicitly asked for a production-ready build.

**Test failures are not optional**

All test failures must be fixed before the work is considered complete. This includes:

- Failures caused by the current change — fix the code or update the test.
- Failures that existed before the current change — fix them now. Do not leave broken tests in the suite.
- Flaky or timing-dependent failures — make the test deterministic or remove it.

The phrase "pre-existing failure" is not a valid reason to skip fixing. A test suite with failing tests is not clean.

## Test Data Locations

All test data, fixtures, and scratch files live under `work/` at the repository root. Never place temporary files in `src/`, in uncommitted `test/fixtures/` subdirectories, or in the repository root.

Committed fixtures live in `test/fixtures/`. Personal scratch files live in `work/`, which is git-ignored.

**Production Build Test Constraints**

For production-ready builds, unit tests must not reference files outside the `test/` directory. Tests must be self-contained and cannot depend on the `work/` directory or any other external paths that may not exist in production environments. If a test needs to write temporary files for debugging purposes, it must clean them up using try/finally blocks and should be removed or converted to a pure in-memory test before production builds.

## Test Output

Minimize console output when tests pass. Debugging output such as `console.log` must only appear when tests fail to keep the test run clean and readable.

All console.log statements in tests must be wrapped in try-catch blocks around assertions to ensure they execute only on failure. This is a mandatory rule for all test files.

Example:

```typescript
try {
  expect(actual).toEqual(expected);
} catch (error) {
  console.log('Debug info:', data);
  throw error;
}
```

This preserves valuable diagnostic information for debugging while keeping successful test runs quiet.

## Test Types

**Unit Tests**

Cover pure functions and isolated classes.

- Song YAML parsing and serialisation round-trip.
- YM2149 register calculation and frequency conversion.
- Export format generation (assembly, binary, VGM, WAV, MAX).
- Instrument utility functions.
- Keyboard note mapping.
- MIDI configuration parsing.
- Formatters and hex formatting.
- Envelope panel utilities.
- Track panel utilities.
- File picker utilities.

**Component Tests**

Verify React components in isolation.

- Track panel note editing and rendering.
- Piano keyboard interaction.
- Color picker selection.
- File picker modal interaction.
- Command panel navigation.

**Integration Tests**

Verify hook and engine interactions.

- Data management hook: song and instrument CRUD with localStorage persistence.
- MIDI hook: device selection and message processing.
- Modal state hook: open and close transitions.
- Message system: user feedback flow.

**End-to-end Tests**

Exercise critical user flows in a real browser. The specs live in `e2e/smoke.spec.ts` with shared interactions in `e2e/helpers.ts`. Each of the six documented flows is one independent `test`.

- First launch shows the bundled song with the default instrument selected.
- Enter notes in track A and play the song.
- Create a new instrument, edit envelope, and preview.
- Export song to DOSOUND assembly format.
- Save and load a song file.
- Switch theme between dark and light.

`npm run test:e2e` runs the suite against `vite preview` on port 8008, which serves `dist/`; run `npm run build` first so the preview serves the current code. The suite runs on the chromium and webkit projects; the firefox project is excluded because headless launch fails under the current macOS sandbox.

## Test Configuration

**Vitest**

See `vitest.config.ts` for the Vitest configuration. The configuration includes:

- jsdom environment for DOM testing.
- Setup files for localStorage and test utilities.
- Coverage provider v8 with 80% thresholds for lines, functions, branches, and statements.
- Path alias `@/` resolving to `src/`.

**Type checking**

- `tsconfig.app.json` includes both `src/` and `test/`, so every test file must be type-clean: `tsc -b` (inside `npm run build` and `npm run bump`) typechecks tests even though `vitest` does not.
- `npm run typecheck` runs `tsc --noEmit` against the solution-style root `tsconfig.json` (`files: []`) and checks nothing on its own. The effective type gate for test code is the build step, not the typecheck script.

**Component test hygiene**

- `@testing-library/react` does not auto-cleanup in this setup. Every component test file must register `afterEach(() => cleanup())` or queries will match elements from earlier tests in the same file.
- The localStorage mock in `test/setup-localstorage.ts` reinstalls a fresh store in a `beforeEach` hook. Tests cannot rely on values persisting between test cases in the same file.
- Spies and stubs for `localStorage` must target the `localStorage` object itself (for example `vi.spyOn(localStorage, 'setItem')`), never `Storage.prototype` - the installed mock is a plain object outside the prototype chain, so a prototype spy silently never intercepts.
- `fetch` stubs must return the full Response surface the code under test reads - `ok`, `headers.get()`, and `text()` - not only the fields an older consumer used. A stub that omits `headers` turns a new header read into a TypeError that only surfaces as an empty-state test failure.
- Assertions on rendered or generated HTML must distinguish escaped entities from raw markup - `&quot;` inside an attribute value is safe text, not an attribute breakout. Assert on the unescaped pattern (a real quote followed by an attribute name), not on substring scans that match entity bodies.

**Playwright**

See `playwright.config.ts` for the Playwright configuration. E2E tests live in the `e2e/` directory.

## Running Tests

**Unit and Component**

```bash
npm test
npm run test:ui
npm run test:coverage
```

**End-to-end**

```bash
npm run build
npm run test:e2e
npx playwright test --project=chromium
npx playwright test --debug
```

## Test Directory

Tests are organised under `test/` by domain:

- `test/components/` — React component tests
- `test/electron/` — main-process module tests
- `test/exports/` — export format module tests, mirroring `src/exports/`
- `test/hooks/` — custom hook tests
- `test/synth/` — audio synthesis engine tests
- `test/utils/` — utility function tests
- `test/fixtures/` — committed test fixtures (song YAML files, VGM files)

`test/hooks/` and `test/utils/` mirror the domain subdirectories of `src/hooks/` and `src/utils/`: a test whose subject is one source file lives in the matching domain subdirectory, while a test covering several subjects keeps a flat name in the directory root.

**Electron module tests**

Main-process helpers live in standalone `.cjs` modules (for example `electron/permissions.cjs`) so tests can import them without loading Electron - `electron/main.cjs` requires the `electron` runtime and cannot be imported under Vitest. Tests load `.cjs` modules through `createRequire` and assert the module shape with an explicit interface, never `any`.

## Coverage Targets

The project targets 80% coverage for lines, functions, branches, and statements. Coverage thresholds are enforced in `vitest.config.ts`.

Current coverage gaps that must be addressed in future work:

- `src/synth/` — YM2149 emulator and SoundDriver need comprehensive tests
- `src/exports/` — all export formatters need tests
- `src/components/` — most components lack tests
- `src/hooks/` — many of the 44 hooks lack dedicated tests
- `src/workers/` — no Web Worker tests

The `npm run test:coverage` command will fail until coverage reaches the 80% thresholds. This is expected and documented as a known gap. Regular `npm test` (without coverage) will pass.
