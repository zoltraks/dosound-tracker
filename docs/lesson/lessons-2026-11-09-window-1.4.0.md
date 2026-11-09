# Session Findings - 1.4.0 Window

## Lessons

- **Clean production-ready build closes the window** - user correction during
  the run; rule added to `WORKFLOW.md`.
- **Fake timers quantize performance.now on fractional intervals** - test
  flake discovered while verifying the 60 Hz tick fix; rule added to
  `TESTING.md`.
- **Stale lockfiles block manifest edits** - the `rolldown-vite` alias left
  the lockfile pinning the old resolution; regeneration, not `--force`, is
  the fix. Rule added to `WORKFLOW.md`.
- **Audit findings age** - two record findings cited sites already moved by
  the 1.3.9 consolidation; evidence-gated repair fixed the defect where it
  actually lives. Rule added to `WORKFLOW.md`.
- **Unreachable defensive branch** - `quoteNoteValues` single-quote strip is
  unexercisable through the generator path; deferred to `FUTURE.md`.
- **vitest 5 deferral honoured** - the recorded revert held; migration
  stayed on vitest 4.x while vite moved to 8.
