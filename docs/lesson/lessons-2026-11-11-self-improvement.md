# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Planning Stack Protocol

Observed symptom: mid-planning the user had to define the working protocol - report the stack on each addition, fold overlapping items, and treat 'apply' as the grouped creation of change-request documents.

Root cause: the Planning section of `docs/WORKFLOW.md` recorded collection mode but not the stack-report or grouped-apply conventions, so the agent improvised them from user instruction.

Preventing rule: see "Planning" in `docs/WORKFLOW.md` (rule added this session) and the dated record `docs/decision/2026-11-11-planning-stack-protocol.md`.

### Window Phases Are Not Optional

Observed symptom: after the implementation records passed verification the agent declared the SDLC window done and proposed a commit; the user had to point out the refactoring phase had not run.

Root cause: a missed rule - the Window Lifecycle bullet list already records Refactoring, Improvement, Window Review, and Window Close as mandatory phases; the agent treated implementation + verification as the window's end.

Preventing rule: see "Window Lifecycle" in `docs/WORKFLOW.md` - the phase bullets exist; no new rule needed, the wound is indexed so the miss is not repeated.

### Review Deviations Must Be Complete

Observed symptom: the filed `docs/review/1.5.5/review-1.5.5.md` recorded the Ctrl+Arrow deviation but not the octave keyup-guard deviation (implemented as `hasState()` gating rather than the plan's early return, to avoid stranding a sounding preview).

Root cause: the review's Deviations list was compiled from memory of the plan rather than a diff of plan-vs-implementation for every task step.

Preventing rule: see the review template's Deviations section in `docs/template/change-review-template.md` - the record exists; the repair (deviation added to the review) landed this session.
