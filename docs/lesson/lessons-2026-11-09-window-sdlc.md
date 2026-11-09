# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Expansion Tests Can Pass Without Expanding

Observed symptom: a bounded-expansion test left the sibling `instrument` key inside the step node, so the node was never a run, never expanded, and the bounds assertion passed vacuously.

Root cause: run detection requires every key to be `wait`/`space`/`off`/`volume` - a leftover sibling key turns the node into an ordinary pass-through while the assertion still sees a bounded result.

Preventing rule: see "Component test hygiene" in `TESTING.md` - assertions on expansion or truncation must prove the code path ran, not only its output shape.

### Unversioned SDLC Proceed Requests Were Undefined

Observed symptom: "proceed automated SDLC" was not a recorded trigger phrase and its window and gate mode had to be inferred.

Root cause: trigger phrases are recorded, never implied, and no phrase covered the unversioned in-progress case.

Preventing rule: see "Intake" under Version Window SDLC in `WORKFLOW.md` - an unversioned proceed request resolves to the window matching `package.json`, and `automated` selects the autonomous gate mode.

### A Verified Audit Claim Was Already Inaccurate

Observed symptom: the audit marked three `ARCHITECTURE.md` claims stale, but the channel-mute persistence claim verified accurate in the tree - only two of three needed correcting.

Root cause: audit evidence ages between the report and the window - tree state can outrun a verified claim.

Preventing rule: see "Audit-Driven Ring" in `WORKFLOW.md` - every adopted finding is re-verified against the tree before correction, and deviations are recorded in the window review.

### Window-Close Commit Format

Observed symptom: the proposed bump commit put a dot after the version number - the convention is `Version X.Y.Z <sentence ending with a dot>`.

Root cause: the format existed in the user's head, not in the written rules.

Preventing rule: see "Commit Messages" in `GUIDELINES.md` - recorded during this session.

### Format Sweep Broke an Exact-Match Edit

Observed symptom: a planned replacement in `songParser.ts` failed because `npx prettier --write` had reflowed the target lines after they were read.

Root cause: edits staged against pre-format content go stale across a format run.

Preventing rule: existing - see "Re-read files after a format sweep" in `WORKFLOW.md`.
