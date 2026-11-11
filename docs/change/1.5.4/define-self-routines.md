# Define self routines

## Summary

- **Status**: shipped
- **Type**: Chore
- **Owner**: user
- **Scope**: `docs/WORKFLOW.md`, `docs/GUIDELINES.md`

## Request

Referring to the compass skill's model, the user asked that the project's
agent instructions clearly define what `improvement` mode is and how the
self-improvement, self-healing, and self-optimization routines look.

## Implementation

- `WORKFLOW.md`'s Work Modes gains an explicit `improvement` definition -
  a named working mode that applies small corrections and optimizations
  inside the described operation's own change set, distinct from the
  Session Review operation.
- `WORKFLOW.md` gains a Self-Routines section naming the three routines:
  - **Self-improvement** - the existing Session Review loop
    (`improve dosound-tracker`): gather wounds, verify real state, route
    each lesson to its owning document, index it in `docs/lesson/`.
  - **Self-healing** - an evidence-gated repair loop for a named defect
    in the project's own agent instructions, tooling, or gates:
    diagnose the failure with a structured tag, produce a minimal patch,
    replay it against the external verifier (verification loop, tests,
    release gate), and promote only what measurably improves - never a
    wholesale rewrite, never reflection alone.
  - **Self-optimization** - the lean-keeping routine: the per-window
    refactoring cycle under `docs/refactoring/`, documentation
    distillation, and deduplication - it removes weight without changing
    observable behavior.
- `GUIDELINES.md` references the section so the agent entry point names
  the routines.

## Verification

- Documentation-only change; Prettier clean on the touched files.
