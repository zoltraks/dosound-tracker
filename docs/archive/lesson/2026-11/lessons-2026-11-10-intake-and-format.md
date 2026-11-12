# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Mode-Only Work Requests Had No Resolution

Observed symptom: a work request naming `development`, `verbose`, and
`improvement` modes described no operation, and no recorded mode resolved
what the agent should do - intake ended in a targeting question the user
skipped.

Root cause: the Work Modes section covers Standard Workflow, Ad-Hoc,
Planning, and Improvement, each of which presumes a described change. A
request carrying only mode flags fit none of them.

Preventing rule: see "Intake Standby" in WORKFLOW.md.

### Generated Documents Reached the Gate Unformatted

Observed symptom: three freshly authored lifecycle documents - the change
record, implementation plan, and specification audit - all failed
`prettier --check` on first delivery over table column widths, costing a
rewrite cycle before presentation.

Root cause: the "Table formatting and Prettier" tooling note gated files
touched by a format sweep but said nothing about newly generated documents,
so authoring produced non-canonical column widths unchecked until the gate
ran.

Preventing rule: see "Table formatting and Prettier" in WORKFLOW.md.

### Session Review Had No Gate Mode

Observed symptom: the session review presented routed lessons for acceptance
because the recorded procedure only offered proposal-before-writing - the
user interrupted to state that autonomous work should apply improvements
directly.

Root cause: the Trigger rule fixed `improve dosound-tracker` to a single
behaviour with no mode selection, while the version-window SDLC already
records `autonomous` versus `human-in-the-loop` gate modes.

Preventing rule: see "Trigger" in WORKFLOW.md.
