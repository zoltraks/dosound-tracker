# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### A Recorded Tooling Note Outlived Its Own Fix

Observed symptom: the mass-move tooling note still claimed `npm run typecheck` "checks nothing on its own" even though the script had been changed to `tsc -b` - the very gate the note recommended.

Root cause: the note was written when `typecheck` ran a vacuous invocation - when the script was corrected the note's tail was not revisited, and the stale claim survived a version window.

Preventing rule: see "Housekeeping checklist" in `WORKFLOW.md` - the stale-figure sweep covers documented command behaviour, and the note now reads that `npm run typecheck` runs `tsc -b`.

### Packaging Verification Leaves release/ Residue

Observed symptom: `electron-builder --dir` verification output joined years of stale installers in `release/`, and `scripts/clean.sh` does not remove any of it.

Root cause: `clean.sh` targets `dist/`, `coverage/`, `playwright-report/`, and `test-results/` only - `release/` accumulates every packaging run, verification or release, with no recorded owner.

Preventing rule: see "Verify packaging metadata through an unpacked build" in `WORKFLOW.md` - `release/` accumulates electron-builder output and `clean.sh` does not sweep it - prune by hand when a fresh packaging check matters.

### The Index Moved Without an Explicit git add

Observed symptom: `git status` showed files staged that no session command had staged, shifting the boundary picture mid-report.

Root cause: nothing in the repository stages files - no hooks, no script, no lint-staged config - so the staging came from the host environment rather than any recorded mechanism.

Preventing rule: see "The git index can move under the session" in `WORKFLOW.md` - read `git status` fresh when reporting boundary state.

### Host-Runtime Warnings Looked Like Suite Noise

Observed symptom: every `vitest` run prints `ExperimentalWarning: localStorage is not available` lines that read like suite failures at first glance.

Root cause: Node 26's built-in localStorage module warns inside vitest worker threads - the project's own jsdom mock is installed separately and unaffected.

Preventing rule: see "Test Configuration" in `TESTING.md` - the warning is host-runtime noise, not a suite failure.
