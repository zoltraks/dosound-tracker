# 2026-11-20 - Autonomous SDLC as the Usual Gate Mode

## Context

The `version-window` extension records `human-in-the-loop` as the default
gate mode with `autonomous` selectable per request (`GUIDELINES.md`
execution policy, `WORKFLOW.md` gate-mode paragraph). On 2026-11-20 the
project owner instructed that the autonomous SDLC - full analysis,
planning, implementation, verification, self-improvement, review, and
version bump per window - is the usual way from now on, starting with
the 1.6.8 window's eight audit-remediation records.

## Alternatives

- Keep `human-in-the-loop` as default and require the mode word per
  request - rejected: the owner's instruction makes autonomous the
  standing convention, not an opt-in.
- Remove `human-in-the-loop` entirely - rejected: it remains the correct
  mode for windows where the owner wants per-stage approval, and stays
  selectable per request.
- Record the change only in session lessons - rejected: a gate-mode
  default is durable workflow policy, which is what decision records
  exist for.

## Decision

`autonomous` is the recorded default gate mode for version-window
requests. Every stage runs without pausing, each decision point takes
the recommended option and is reported inline, and `human-in-the-loop`
remains selectable per request. Stage work may be delegated to subagents
where file ownership stays disjoint. All other execution-policy terms
are unchanged: the user commits manually, reserved decisions stay
flagged for owner confirmation in the window review, and the cycle
never commits under any mode.

## Rationale

The owner judged the per-stage pause cost to exceed its review value for
this project's window shape: records arrive pre-analyzed (audit
remediations, seeded plans), the verification loop and release gate
provide the real safety net, and every autonomous decision is still
reported inline and flagged for owner confirmation in the review -
nothing becomes invisible, only uninterrupted.

## Consequences

- Window runs no longer pause at stage transitions unless the request
  selects `human-in-the-loop`.
- Decision points inside a window resolve to recommended options; the
  window review must keep flagging them for owner confirmation.
- Commits, release tags, and destructive operations remain
  manual/owner-gated exactly as before - the mode changes pacing, not
  authority.
