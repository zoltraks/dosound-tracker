# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Parameter-Boundary Dependency Arrays

Observed symptom: three `react-hooks/exhaustive-deps` warnings appeared
in `useMidiOutput.ts` and `useMidiDeviceAttachments.ts` the moment the
senders and attach effects crossed a hook-parameter boundary.

Root cause: the lint rule proves locally declared refs and setters
stable but treats the same objects arriving as parameters as unproven -
the moved arrays had to list them.

Preventing rule: see "Hooks" in `docs/standard/typescript-react-development.md`.

### Call-Site Surveys Cover Test Imports

Observed symptom: the extraction proposal named `useDataManagement.ts`
as the single call site of `optimizeSongData`/`renumberSongData` and
missed `test/hooks/cross/songManagement.test.ts`, which surfaced as a
typecheck failure at repoint time.

Root cause: the survey ran over `src/` only; the test suite imports the
moved symbols directly.

Preventing rule: see "Analyse the current implementation" in `REFACTORING.md`.

### Record-Reserved Decisions Under the Autonomous Gate

Observed symptom: the persisted-history record named the bound "the
user's call" while the window ran under `autonomous`, leaving the mode
contract and the record wording apparently at odds.

Root cause: no rule said how a record-reserved decision resolves when
the gate mode forbids pausing - the run picked the recommended option
and flagged it in the review, and that resolution is now recorded.

Preventing rule: see "Version Window SDLC" in `WORKFLOW.md`.

### Offline Worker Verification Under a Nested Base

Observed symptom: the base-aware worker record needed offline proof at
a nested deployment path, which no committed suite covers.

Root cause: a `work/` probe serving `dist/` under a path prefix plus
Playwright's `setOffline` produced the verification without touching
the production host - a reusable technique.

Preventing rule: see the offline service-worker note in `TOOLING.md`.
