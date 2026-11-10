# Land session-review rules in the workflow document

**Type:** Chore

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Record three workflow rules produced by the 2026-11-10 session review |
| Key decisions | One shared record covers all `WORKFLOW.md` rule landings              |
| Open risks    | `none`                                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The 2026-11-10 session review identified three workflow gaps worth recording
as durable rules in `WORKFLOW.md`.

The first gap is intake: a work request that names modes but describes no
operation has no recorded resolution. The session inferred standby and asked a
targeting question the user skipped. The new rule names the behaviour
explicitly - intake standby means reading the guidelines set, reporting the
boundary state, and waiting for the described change.

The second gap is document formatting: lifecycle documents generated during
the session failed `prettier --check` on first delivery over table column
widths. The existing "Table formatting and Prettier" tooling note gates swept
files but does not speak to newly generated documents. The extension requires
`npx prettier --check` on generated documents before they are presented as
stage products.

The third gap is gate modes: the session-review procedure requires proposing
each routed lesson for acceptance, but records no way to run the review
autonomously. The new rule gives the improve request the same gate-mode
selection the version window has - `autonomous` applies the improvements
directly, `human-in-the-loop` proposes them for acceptance first, and an
unspecified mode follows the recorded default.

## Use Cases

- When a request carries mode flags but no described change, the agent
  completes intake, reports the boundary state, and waits.
- When the agent finishes writing a change record, plan, or report, Prettier
  verifies the file before it is presented.

## Out of Scope

- Source code changes - this record touches `WORKFLOW.md` prose only.
- The lesson file indexing these rules - it lands directly per the
  session-review procedure.
