# 2026-11-11 - Confirmed Plans Land Before Code

## Context

The track-fragment-selection implementation wrote its implementation plan to `docs/plan/1.5.6/` after the code landed. The `docs/plan/` access gate in `WORKFLOW.md` conditioned writes on an explicit request, so the confirmed plan stayed session-level through the whole implementation. Decisions taken while implementing - the selection's track owning copy and cut, the paste-confirmation gate's scope, cursor wrap at the pattern end - had no recorded home until the user asked for them.

## Alternatives

- Keep plans session-level and write them only on an explicit per-request basis - rejected: the plan is then authored after implementation and reads as a post-hoc description instead of the approved contract.
- Write the confirmed plan to `docs/plan/<version>/` before the first code edit - chosen.

## Decision

A confirmed implementation plan is written to `docs/plan/<version>/` before the first code edit, and decisions that deviate from it during implementation are recorded in the plan under a Refinements section.

## Rationale

The plan on disk is the reviewable contract between approval and implementation. A plan written after code exists can only describe the landed state, which hides what diverged from approval and makes reviews reconstruct intent from the diff.

## Consequences

- Plans are reviewable artifacts before implementation begins, not retrospectives.
- Implementation-time decisions stay visible for review instead of being silently folded into the approved wording.
- One additional artifact write per change; `WORKFLOW.md` carries the rule in the lifecycle steps and the `docs/plan/` access gate.
