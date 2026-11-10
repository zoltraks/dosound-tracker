# Land Session-Review Rules Implementation Plan

## Summary

| Field         | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| Intent        | Land three session-review rules in `WORKFLOW.md`             |
| Key decisions | Documentation-only change - no code, no tests, loop bypassed |
| Open risks    | `none`                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.6/session-review-rules.md`.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

`WORKFLOW.md` is the change itself - the two rule landings below are the whole
implementation. No other pillar document is affected.

## Step by Step Implementation

**Record the intake-standby mode**

Add a new bold-headed entry at the end of the Work Modes section, after the
Improvement paragraph and before the Memorisation Convention heading.

File to modify: `docs/WORKFLOW.md`.

```markdown
**Intake Standby**

A work request that names modes but describes no operation is intake standby - the agent reads the guidelines set, reports the boundary state, and waits for the described change rather than editing on assumption.
```

**Extend the Prettier tooling note**

Append a sentence to the "Table formatting and Prettier" tooling note covering
newly generated documents.

File to modify: `docs/WORKFLOW.md`.

```markdown
Generated documents are checked before presentation - a newly authored record, plan, or report that fails `npx prettier --check` costs a rewrite cycle, so the check runs before the file is presented as a stage product, not only on swept files.
```

**Record the session-review gate mode**

Extend the Trigger list in the Session Review section with the gate-mode
selection, mirroring the version-window phrasing.

File to modify: `docs/WORKFLOW.md`.

```markdown
The request may select a gate mode: `autonomous` applies the routed lessons directly - the improvements land without an acceptance step. `human-in-the-loop` proposes the improvements for acceptance first. An unspecified mode follows the recorded default `human-in-the-loop`.
```

**Write the lesson record**

Create `docs/lesson/lessons-2026-11-10-intake-and-format.md` from
`docs/template/session-findings.md` with three titled entries indexing the
three rules above.

## Implementation Order

Execute the steps above in this sequence.

1. Apply all three `WORKFLOW.md` rule landings.
2. Write the lesson record.
3. Run `npx prettier --check` on every touched file.

## Testing Strategy

Documentation-only change - the verification loop is bypassed per
`TESTING.md`. Format correctness is checked with `npx prettier --check` on the
touched files.
