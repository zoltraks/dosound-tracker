# 2026-10-24 - No window-run state files

## Context

During the 1.3.1 SDLC window, a `docs/plan/1.3.1/window-run.md` run-state record was created and maintained across the window. The project owner directed that such run-state plans must not be written for SDLC window runs.

## Alternatives

- Keep creating `window-run.md` for every window - rejected, the owner finds it unwanted bookkeeping.
- Keep the `run-resume` extension for interrupted windows but suppress the file for ordinary runs - chosen, it preserves the documented extension while honoring the correction.
- Remove the extension from `WORKFLOW.md` entirely - rejected, the convention may still be needed when a window is genuinely interrupted and resumed across sessions.

## Decision

`docs/plan/<version>/window-run.md` is never created for ordinary SDLC window runs; it exists only for the run-resume extension when resuming is explicitly needed.

## Rationale

The owner reviewed the artifact and rejected it. The run-state record adds an extra document the agent must maintain without producing user-visible value in an uninterrupted window.

## Consequences

- Future window runs skip the run-state file while keeping the per-request implementation plans that `WORKFLOW.md` requires.
- A window that is interrupted mid-run loses the formal resume record; progress is reconstructed from the plan files, change records, and the working tree instead.

## Status

Accepted
