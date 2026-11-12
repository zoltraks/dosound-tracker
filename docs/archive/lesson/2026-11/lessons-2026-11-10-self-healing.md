# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Delegated tasks that miss their target return to the orchestrator

Observed symptom: the intake-slimming delegate moved two extra sections (`Repository Layout`, `Agent Operations`) beyond the approved plan to reach the byte tier - correct work, but scope widened outside the audited plan.

Root cause: the delegate treated the tier as binding and the plan as advisory; the plan's named moves were not sufficient, and the gap was resolved downstream instead of back at planning.

Preventing rule: see "Context Management" in `WORKFLOW.md`.

### Repoint sweeps must cover every document role, including templates

Observed symptom: the audio-critical ownership move repointed `TESTING.md`, `REFACTORING.md`, and `WORKFLOW.md` but missed `docs/template/implementation-plan-template.md`, which still cited `GUIDELINES.md`.

Root cause: the repoint sweep enumerated active documents only; templates generate future documents and carry the same references.

Preventing rule: already covered - the housekeeping checklist's stale-figure sweep checks `docs/template/` path references against the real tree; healed in place this session.

### Sister documents drift when a claim lives in more than one place

Observed symptom: `SPECIFICATION.md` kept the "test/synth holds a single file" claim after `ARCHITECTURE.md` and `FUTURE.md` were updated in the same window; `TESTING.md` kept a stale modal-coverage enumeration.

Root cause: the same fact was recorded in three documents and only two were updated - documentation duplication, not a process gap.

Preventing rule: already covered - the housekeeping checklist's stale-figure sweep; healed in place this session.
