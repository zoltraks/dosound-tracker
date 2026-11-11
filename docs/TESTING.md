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

The `SPECIFICATION.md` document identifies specific linting warnings that are intentional and must not be fixed because they preserve audio timing stability. These warnings are accepted as part of the clean build:

- React Hook dependency warnings in audio-critical paths
- `setState` in effect warnings in audio-critical paths
- `useCallback` wrapping warnings in audio-critical paths

These exceptions apply only to code paths documented in `SPECIFICATION.md`. All other linting warnings must be resolved.

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
- Before version bumping — followed by `scripts/release-check.sh`, the release gate that enforces the documentation-state preconditions recorded in `VERSIONING.md`.
- When explicitly asked for a production-ready build.

**Test failures are not optional**

All test failures must be fixed before the work is considered complete. This includes:

- Failures caused by the current change — fix the code or update the test.
- Failures that existed before the current change — fix them now. Do not leave broken tests in the suite.
- Flaky or timing-dependent failures — make the test deterministic or remove it.

The phrase "pre-existing failure" is not a valid reason to skip fixing. A test suite with failing tests is not clean.

## Verification Options

Under the `verification-options` extension, verification depth is selected per change from a named menu rather than implied:

| Option               | What it covers                                                               | Select when                                         |
| -------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| Completeness check   | Plan coverage, standards compliance, and documentation completeness          | Always available - the default for routine changes  |
| Test-suite run       | The repository's recorded suite and failure classification                   | Code changed and a suite exists                     |
| Code review          | Correctness-focused review of the diff                                       | Behavior-critical or externally visible changes     |
| Pragmatic review     | Over-engineering, scale fit, and unnecessary complexity                      | Substantial additions or restructuring              |
| Production readiness | Deployment blockers, configuration, error handling, and operational concerns | Changes that reach production or release candidates |
| Reality check        | Claimed-versus-actual completion: error paths and end-to-end behavior        | Ambiguous scope or prior verification disputes      |

The selected options are recorded with their outcomes and evidence in the change's completion record - the window review under `version-window` work, the session report for ad-hoc work. `template/verification-report-template.md` is the report skeleton when a durable report is recorded.

**Independent verification**

Under the `independent-verification` extension, each review-class option - code review, pragmatic review, production readiness, and reality check - is executed by a reviewer other than the implementer. The recorded model: the project owner (the user) is the reviewer and the AI agent is the implementer. The mechanical options - completeness check and test-suite run - may stay with the implementer.

## Runnable Artifact

Under the `runnable-artifact` extension, a change may not be called verified until the shipped entrypoints run a live slice:

- Web bundle `dist/` - served by `npm run preview` on port 8008 - the recorded live slice is the Playwright smoke suite `npm run test:e2e`.
- Electron bundle - `npm run electron:preview` launches the packaged app - production-ready builds prove the `release/` artifacts exist and postdate the sources.

Recorded substitutions: the smoke suite substitutes a manual launch for routine changes - the Electron launch is required only when `electron/`, the build configuration, or packaging changes.

## Lessons Loop

Under the `lessons-loop` extension, the lessons record is `docs/lesson/` plus the rules institutionalized into the owning documents per the Session Review convention in `WORKFLOW.md`. The record is consulted before implementation and before verification planning - a wound that produced a rule is honored by following that rule.

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

`npm run test:e2e` runs the suite against `vite preview` on port 8008, which serves `dist/` - the `pretest:e2e` script builds first, so the preview always serves the current code. The suite runs on the chromium and webkit projects - the firefox project is excluded because headless launch fails under the current macOS sandbox.

The `saves and loads a song file` webkit case can flake under parallel workers - the file-input assertion observes a pre-upload value under load. It is timing-dependent, not a regression: rerun it in isolation (`npx playwright test --project=webkit e2e/smoke.spec.ts`) before treating it as a failure, and prefer making the test deterministic over accepting repeats.

**Audio-path verification requires the webkit project**

Chromium auto-resumes the `AudioContext` on the first gesture, so chromium-only runs always observe a `running` context and cannot reproduce suspended-context behavior - playback starting before `resume()` resolves, writes piling at a frozen `currentTime`, view/audio desync. Any change touching the audio path (play/stop, sequencer sync, engine startup) must also be verified under `--project=webkit`, which preserves the suspended startup state.

**Assert the audible outcome, not call timing**

Timestamps on `writeRegister` or parameter-setter calls prove a call happened, not that anything rendered. Audio-path assertions check the audible result: gain-node values after stop, the `AudioContext` state timeline, `currentTime` progression during writes, and position/view agreement - a probe that counts calls can pass while the user hears silence.

## Test Configuration

**Vitest**

See `vitest.config.ts` for the Vitest configuration. The configuration includes:

- jsdom environment for DOM testing.
- Setup files for localStorage and test utilities.
- Coverage provider v8 with 80% thresholds for lines, functions, branches, and statements.
- Path alias `@/` resolving to `src/`.

DOM-free suites opt into the node environment through a `// @vitest-environment node` docblock as the file's first line. This covers `test/electron/`, `test/exports/`, `test/synth/`, `test/constants/`, `test/hooks/song/loadInitialSong.test.ts`, and the `test/utils/` files that touch no DOM API - a new pure-logic test should carry the pragma. Anything using `document`, `window.*`, `self`, DOM events, or a testing-library `render` stays on the global jsdom environment.

Node 26 prints `ExperimentalWarning: localStorage is not available` lines during `vitest` runs. This is host-runtime noise from the built-in localStorage module in worker threads, not a suite failure - the jsdom localStorage mock in `test/setup-localstorage.ts` is unaffected.

**Type checking**

- `npm run typecheck` runs `tsc -b` across the project graph: `tsconfig.app.json` covers `src/` and `test/`, and `tsconfig.node.json` covers the Vite, Vitest, and Playwright config files and `e2e/`. The same gate runs inside `npm run build` and `npm run bump`.
- `tsconfig.app.json` includes both `src/` and `test/`, so every test file must be type-clean even though `vitest` does not typecheck.
- CommonJS sources (`electron/`, `scripts/`) sit outside TypeScript's emit-free scope - ESLint is their static gate.

**Component test hygiene**

- `@testing-library/react` does not auto-cleanup in this setup. Every component test file must register `afterEach(() => cleanup())` or queries will match elements from earlier tests in the same file.
- The localStorage mock in `test/setup-localstorage.ts` reinstalls a fresh store in a `beforeEach` hook. Tests cannot rely on values persisting between test cases in the same file.
- Spies and stubs for `localStorage` must target the `localStorage` object itself (for example `vi.spyOn(localStorage, 'setItem')`), never `Storage.prototype` - the installed mock is a plain object outside the prototype chain, so a prototype spy silently never intercepts.
- `localStorage` enumeration in both source and tests must use `length` and `key(index)`, never `Object.keys(localStorage)` - the installed mock is a plain object whose own enumerable keys are method names, so `Object.keys` yields `getItem`, `setItem`, and friends instead of stored data keys.
- `fetch` stubs must return the full Response surface the code under test reads - `ok`, `headers.get()`, and `text()` - not only the fields an older consumer used. A stub that omits `headers` turns a new header read into a TypeError that only surfaces as an empty-state test failure.
- Assertions on rendered or generated HTML must distinguish escaped entities from raw markup - `&quot;` inside an attribute value is safe text, not an attribute breakout. Assert on the unescaped pattern (a real quote followed by an attribute name), not on substring scans that match entity bodies.
- Synthetic keyboard and DOM events must carry `bubbles: true` and be dispatched on a real element such as `document.body` - a `new KeyboardEvent` defaults to non-bubbling, so a `window` listener never fires, and dispatching on `window` makes `event.target` an object without `closest` or `tagName`, which breaks handlers that inspect the target.
- Assertions on expansion, truncation, or filtering must prove the code path actually ran - assert the expanded output's content, not only its bounded shape. Input that never triggers the mechanism can satisfy a bounds assertion vacuously: a step node carrying a sibling `instrument` key is not a run and never expands, so asserting "at most N steps" proves nothing.
- Assertions on serialized YAML must account for scalar normalization on round-trip - `yaml.load` strips plain-scalar surrounding whitespace, so a parse-back assertion can pass while the emitted text is still wrong. Assert on the raw output text for unquoted scalars (for example `toContain('author: Writer')`), and use the parsed document only for values the emitter guarantees to quote.

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
- `test/constants/` — constants tests
- `test/electron/` — main-process module tests
- `test/exports/` — export format module tests, mirroring `src/exports/`
- `test/hooks/` — custom hook tests
- `test/modals/` — modal dialog tests, mirroring `src/modals/`
- `test/synth/` — audio synthesis engine tests
- `test/utils/` — utility function tests
- `test/workers/` — Web Worker protocol tests
- `test/fixtures/` — committed test fixtures (song YAML files, VGM files)

`test/hooks/` and `test/utils/` mirror the domain subdirectories of `src/hooks/` and `src/utils/`: a test whose subject is one source file lives in the matching domain subdirectory, while a test covering several subjects keeps a flat name in the directory root.

**Electron module tests**

Main-process helpers live in standalone `.cjs` modules (for example `electron/permissions.cjs`) so tests can import them without loading Electron - `electron/main.cjs` requires the `electron` runtime and cannot be imported under Vitest. Tests load `.cjs` modules through `createRequire` and assert the module shape with an explicit interface, never `any`.

## Coverage Targets

The project targets 80% coverage for lines, functions, branches, and statements. Coverage thresholds are enforced in `vitest.config.ts`.

Remaining coverage gaps that may be addressed in future work:

- `src/components/` — several components still lack dedicated tests
- `src/hooks/` — a number of hooks have thin branch coverage
- `src/modals/` — `AboutModal` and `DownloadModal` lack dedicated tests

`npm run test:coverage` passes the configured 80% thresholds and is an enforceable gate.

**Fake timers quantize performance.now on fractional intervals**

Under `vi.useFakeTimers()`, `performance.now()` does not advance in lockstep with fractional `setInterval` delays - a callback scheduled at 16.67 ms can observe `now` a fraction early, so boundary assertions on `1000 / 60`-style intervals are flaky. Use integer intervals in timer tests - a non-20 ms integer still proves an offset derives from the configured interval.

**Reinstall Playwright browsers after regenerating the dependency tree**

`rm -rf node_modules` or a lockfile regeneration can bump `@playwright/test` within its declared range, and the new version requires fresh browser binaries - `npm run test:e2e` then fails with `Executable doesn't exist`, not a code error. Run `npx playwright install` (or the project browsers) after any tree regeneration before judging e2e results.

**Scratch vitest probes must live under `test/`**

The vitest include glob is `test/**/*.{test,spec}.{ts,tsx}`, so a throwaway probe placed in `work/` is silently skipped. Put probe files under `test/` temporarily and delete them in the same session.
