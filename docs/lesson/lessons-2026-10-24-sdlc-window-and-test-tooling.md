# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Typecheck Script Checks Nothing While Build Typechecks Tests

Observed symptom: `npm run bump` failed partway with ~19 type errors in the new test files even though `npm run typecheck` had passed the full verification loop twice.

Root cause: `npm run typecheck` runs `tsc --noEmit` against the solution-style root `tsconfig.json` whose `files` list is empty, so it typechecks nothing. `tsc -b` inside `npm run build` and `npm run bump` compiles `tsconfig.app.json`, which includes both `src/` and `test/` - the first real type gate for test code is the build step, which `vitest` itself never performs.

Preventing rule: see "Type checking" in `docs/TESTING.md`.

### Version Bump Leaves Skew When Build Fails Midway

Observed symptom: the first `npm run bump` wrote version 1.3.2 into `package.json` and then failed on test type errors; re-running bumped again to 1.3.3, skipping the intended release number until `package.json` was corrected manually.

Root cause: `scripts/bump-version.mjs` writes the new version before invoking the build, so a mid-run failure leaves the recorded version ahead of the delivered build.

Preventing rule: see the bump note in `docs/VERSIONING.md`.

### React Testing Library Does Not Auto-Cleanup

Observed symptom: `getByText('No files available.')` matched multiple elements because component renders from earlier tests in `FilePickerModal.test.tsx` were still mounted in the same jsdom document.

Root cause: `@testing-library/react` auto-cleanup is not active in this Vitest setup - `globals` and an explicit cleanup registration are absent - so every rendered tree persists across test cases within a file.

Preventing rule: see "Component test hygiene" in `docs/TESTING.md`.

### localStorage State Cannot Cross Test Cases

Observed symptom: a test asserting a value persisted by an earlier test in the same file read `null` instead.

Root cause: `test/setup-localstorage.ts` reinstalls a fresh in-memory localStorage mock in a `beforeEach` hook, so every test starts from an empty store regardless of what a sibling test wrote.

Preventing rule: see "Component test hygiene" in `docs/TESTING.md`.

### Window-Run State Files Are Not Wanted

Observed symptom: the user corrected the agent for writing `docs/plan/1.3.1/window-run.md` and maintaining it across the window.

Root cause: `WORKFLOW.md` documents the `run-resume` extension's run-state record without stating it is opt-in, so it was treated as mandatory bookkeeping for an uninterrupted run.

Preventing rule: see "Run State" in `docs/WORKFLOW.md` and `docs/decision/2026-10-24-no-window-run-state.md`.
