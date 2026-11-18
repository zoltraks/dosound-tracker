# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Settings dialog await times out only inside the full suite

Observed symptom: `npm test` failed `test/components/shell/App.test.tsx > opens and closes Settings from the tracker workspace` at the 5000 ms test timeout in four consecutive full-suite runs, while the file passed alone (7/7) and with its `test/components/shell/` directory (23/23).

Root cause: the test mounts the whole `App` shell and awaits the lazy-loaded Settings dialog - under full-suite worker contention the dynamic import and modal mount exceed the default timeout. The session's changeset was documentation-only and no suite test reads the edited files, so the failure is a suite-environment artifact rather than a product regression.

Preventing rule: see "Full-suite runs can starve the Settings dialog await" in `docs/TESTING.md` - reproduce a suite-only timeout in isolation before treating it as a regression.
