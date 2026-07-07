# Testing Strategy

## Clean Build Definition

A clean build means **zero errors and zero warnings** across all verification steps:

- **TypeScript compilation** (`npm run typecheck`) must pass with no errors.
- **Linting** (`npm run lint`) must produce no errors and no warnings.
- **Formatting** (`npm run format`) must be applied to all source files.
- **Build** (`npm run build`) must complete successfully with no errors.
- **Tests** (`npm test`) must all pass.

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

Run only the tests that cover the code being modified. Use a test file path or pattern to limit scope (for example `npm test src/utils/songParser` or `npm test -- test/utils/`).

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

**Test failures are not optional.**

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

Exercise critical user flows in a real browser.

- First launch shows empty song with default instrument.
- Enter notes in track A and play the song.
- Create a new instrument, edit envelope, and preview.
- Export song to DOSOUND assembly format.
- Save and load a song file.
- Switch theme between dark and light.

## Test Configuration

**Vitest**

See `vitest.config.ts` for the Vitest configuration. The configuration includes:

- jsdom environment for DOM testing.
- Setup files for localStorage and test utilities.
- Coverage provider v8 with 80% thresholds for lines, functions, branches, and statements.
- Path alias `@/` resolving to `src/`.

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
- `test/hooks/` — custom hook tests
- `test/stores/` — Zustand store tests
- `test/synth/` — audio synthesis engine tests
- `test/utils/` — utility function tests
- `test/fixtures/` — committed test fixtures (song YAML files, VGM files)

## Coverage Targets

The project targets 80% coverage for lines, functions, branches, and statements. Coverage thresholds are enforced in `vitest.config.ts`.

Current coverage gaps that must be addressed in future work:

- `src/synth/` — YM2149 emulator and SoundDriver need comprehensive tests
- `src/exports/` — all export formatters need tests
- `src/components/` — most components lack tests
- `src/modals/` — no modal tests
- `src/hooks/` — only 1 of 30 hooks has tests
- `src/workers/` — no Web Worker tests

The `npm run test:coverage` command will fail until coverage reaches the 80% thresholds. This is expected and documented as a known gap. Regular `npm test` (without coverage) will pass.
