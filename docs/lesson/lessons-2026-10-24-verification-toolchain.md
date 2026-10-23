# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Drifted node_modules Breaks the Baseline Loop

Observed symptom: the pre-change baseline loop failed at the format step with `prettier: command not found` even though Prettier is a declared devDependency.

Root cause: `node_modules` had drifted from the lockfile - `npm ls prettier` reported `(empty)` and `npm install` added 125 missing packages before the loop could run.

Preventing rule: see "Install the toolchain before the baseline loop" in `WORKFLOW.md`.

### npm audit fix No-ops on Peer-Pinned Chains

Observed symptom: `npm audit fix` reported the vitest advisories as fixable yet left `vitest@4.1.10` and its `@vitest/*` siblings installed; a second `npm audit` still listed four moderate advisories.

Root cause: the `@vitest/*` packages pin `vitest` at an exact version, so npm could not apply the fix through the lockfile alone. Explicit `npm install -D vitest@^4.1.12 @vitest/coverage-v8@^4.1.12 @vitest/ui@^4.1.12` moved the whole chain inside the declared `^4.1.5` range.

Preventing rule: see "npm audit fix can no-op on peer-pinned chains" in `WORKFLOW.md`.

### Format Sweep Rewrites Files Mid-Edit

Observed symptom: an exact-match edit to `docs/plan/1.3.0/window-run.md` failed because the file no longer matched the earlier read.

Root cause: `npm run format` ran between the read and the edit and re-aligned the table padding.

Preventing rule: see "Re-read files after a format sweep" in `WORKFLOW.md`.

### Electron Main Process Is Not Importable Under Vitest

Observed symptom: the scoped MIDI-permission logic could not be unit tested in place - importing `electron/main.cjs` executes `require('electron')`, which does not exist under the test runtime.

Root cause: the main-process entry point mixes runtime wiring with policy logic; the testable policy had to be extracted into `electron/permissions.cjs`, a standalone CommonJS module loaded in tests through `createRequire` with an explicit interface assertion.

Preventing rule: see "Electron module tests" in `TESTING.md`.
