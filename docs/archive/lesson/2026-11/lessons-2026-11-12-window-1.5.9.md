# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Stage Continuation Went Out as Prose

Observed symptom: the records-to-refactoring transition was offered as a
closing sentence in a report instead of a question through the host's
question mechanics.

Root cause: the recorded conventions covered mode selection, plan
confirmation, and stage-gate checkpoints, but nothing named window-stage
transitions - the prose offer slipped through the gap.

Preventing rule: `docs/WORKFLOW.md` now records that `human-in-the-loop`
stops at each stage transition and that every pending question or option
surface goes through the host's interactive question mechanics, never
appended to a reply in prose; `docs/GUIDELINES.md` carries the matching
bullet.

### jsdom's location.reload Refuses Spying

Observed symptom: the reset-handler test could not observe the reload -
`window.location.reload` is non-configurable under jsdom, so neither
spies nor property redefinition reach it.

Root cause: the hook called the platform API directly, leaving no seam a
test could substitute.

Preventing rule: environment APIs that jsdom cannot substitute are
injected as optional hook parameters with the platform call as the
default - the seam is used by the reset handler's reload and keeps the
test honest without DOM gymnastics.

### Request Success Is Not Transaction Commit

Observed symptom: a mirror clear resolved as done while its IndexedDB
transaction could still abort, letting queued writes revive cleared
state.

Root cause: persistence code awaited `request.onsuccess`, which fires
per-request before the surrounding transaction commits.

Preventing rule: persistence operations resolve on `IDBTransaction`
completion (`oncomplete`, with `onerror`/`onabort` as failure) - recorded
in `docs/SPECIFICATION.md` and enforced by the mirror's transaction-bound
result and reset epoch.

### Review Ordered the Close Backwards

Observed symptom: the window review's findings and bump decision phrased
the close as "owner commits before bump" - the user corrected the order
and the bump ran first, with the bumped tree committed after.

Root cause: the close-gate phrasing was composed from the prior review's
wording instead of the recorded rule.

Preventing rule: `docs/VERSIONING.md` already records "the user commits
the bump manually after reviewing the changes" - the release gate runs
the bump on the verified tree and the owner's commit lands the bumped
result, never the other way around.
