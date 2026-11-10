# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Scout-surveyed guidelines need their own intake marker

Observed symptom: the work intake table had no honest marker for guideline files surveyed through a delegated scout digest - `read` overstates and omitting hides the coverage.

Root cause: the intake convention named `read`, `re-read`, `carried over`, and `scanned` only, and predates delegated guideline surveys.

Preventing rule: see "Work Intake Table" in `GUIDELINES.md`.

### Window-scoped briefs must name the resolved version

Observed symptom: a documentation scout briefed without an explicit window reported the session as a "1.4.5 window" - the bump target - instead of the active 1.4.4 window.

Root cause: the scout inferred the version from `package.json` semantics alone; nothing in the brief pinned the resolved window.

Preventing rule: see "Context Management" in `WORKFLOW.md`.
