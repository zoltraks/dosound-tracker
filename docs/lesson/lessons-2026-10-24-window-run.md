# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Depth-Filtered File Enumeration Misses Moved Files

Observed symptom: after moving 73 test files into domain subdirectories, the
specifier rewrite reported complete while `test/exports/` files kept stale
`../../src/` prefixes, caught only by a manual re-grep.

Root cause: `find test/hooks test/utils test/exports -mindepth 2` counts depth
below each start directory, so files sitting directly under `test/exports/`
(depth 1) were excluded even though they were moved.

Preventing rule: see "Enumerate moved files explicitly, not by depth" in
`WORKFLOW.md`.

### vi.mock Specifiers Survived the Move Rewrite

Observed symptom: four tests failed after the test-tree move with "is not a spy
or a call to a spy" errors.

Root cause: the first rewrite pass covered `from` clauses and dynamic `import()`
but not `vi.mock(...)` specifiers, which resolve relative to the test file.

Preventing rule: see "Rewrite every specifier in a moved file, not only inbound
ones" in `WORKFLOW.md` (existing rule; this session is further evidence for it).

### Verbatim Code Warns in Its New File

Observed symptom: hook code moved unchanged out of `App.tsx` produced seven lint
errors and warnings (`exhaustive-deps`, `set-state-in-effect`,
`preserve-manual-memoization`) that never fired while it lived in `App.tsx`.

Root cause: `App.tsx` suppresses `react-hooks/exhaustive-deps` with a file-level
disable that does not travel, and React compiler rules evaluate a custom-hook
file differently from the component the code came from.

Preventing rule: see "Lint the destination file right after an extraction" in
`WORKFLOW.md`.

### Canonical Utilities Already Existed for the Moved Helpers

Observed symptom: the plan called to move `formatNoteKey` and
`parseBaseKeyString` verbatim into `src/utils/song/songFormat.ts`; inspection
showed they were exact duplicates of `formatBaseKey` and `parseBaseKey` already
exported there.

Root cause: the injected seams were fed duplicate local helpers while canonical
implementations existed under different names.

Preventing rule: see "Check for a canonical implementation before moving a
helper" in `WORKFLOW.md`.

### Vendored Standard Syncs Show Formatting-Only Drift

Observed symptom: comparing `docs/standard/` against the canonical library
reported hundreds of diff lines, almost all Prettier table separators and code
reflows, hiding the single real content gap.

Root cause: the repository-wide `npm run format` sweep restyles vendored files,
so byte-level diffing against canonical is permanently noisy.

Preventing rule: see the vendoring note in `docs/standard/README.md` - sync
checks compare content with `diff -w -B` or by section, never raw bytes.

### Stale vite preview Process Survived the Dev Server Stop

Observed symptom: killing the `npm run dev` tree left a `vite preview` process
running, matching the documented stale-server hazard.

Root cause: a separately launched preview process is not a child of the dev
server and survives its shutdown.

Preventing rule: see "Stopping the development server" in `WORKFLOW.md`
(existing rule; confirmed working this session).
