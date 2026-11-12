# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### CLI Scripts Are Invisible to v8 Subprocess Coverage

Observed symptom: a full end-to-end suite driving `retention-sweep.mjs`
through `spawnSync(process.execPath, ...)` raised the file's measured
branch coverage by almost nothing - the child process is never
instrumented.

Root cause: vitest's v8 provider instruments modules loaded inside the
test process; a spawned `node` run is a separate process and writes no
coverage into the parent report.

Preventing rule: see "Test Configuration" in docs/TESTING.md - run the
script's `main()` in-process by spoofing `process.argv`, resetting the
module cache, and re-importing the file, restoring `process.argv` and
`process.exitCode` afterward.

### Repository Fixtures Must Live Outside the Repository

Observed symptom: a "not a git repository" fixture placed under the
project's `work/` directory silently passed git discovery, and a
version-glob pathspec matched a nested seed directory, skewing the
fixture's family-start resolution.

Root cause: `git -C` discovers `.git` by walking ancestors, so any
fixture inside the repository resolves the real history; and git
pathspec `*` spans `/`, so `docs/*/1.6.*` matches nested paths.

Preventing rule: see "Test Configuration" in docs/TESTING.md - build
repo-tool fixtures under `os.tmpdir()` and keep unrelated `X.Y.Z`
directories out of commits that version globs scan.

### The Coverage Denominator Shifts with Test Imports

Observed symptom: the enforced branch aggregate moved roughly a point
mid-window when a foreign session's `test/scripts/` suite began
importing `scripts/retention-sweep.mjs`, turning a green-looking
project-side ratio into a red gate.

Root cause: the threshold applies to every file the suite loads, not a
fixed `src/` set - additions to `test/` change both the numerator and
the denominator independently of project work.

Preventing rule: see "Coverage Targets" in docs/TESTING.md - evaluate
the gate per-source before planning coverage work.
