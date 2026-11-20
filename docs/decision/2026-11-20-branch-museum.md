# 2026-11-20 - Branch Museum Posture

## Context

AUDIT-1.7 (FND-DLV-001, TDR-003, REC-006) counted 27 local branches -
including stale `broken/*` and `repair/*` repair branches - mirrored to
both remotes: `origin` on GitHub and `scene` on GitLab. The audit marked
the keep-everything posture deliberate and left prune-or-document as the
open decision. The `.gitattributes` half of REC-006 already landed; this
record settles the branch half.

## Alternatives

- Prune the stale classes now - rejected for this change: remote deletion
  is irreversible on two remotes and the audit itself recorded the
  posture as deliberate, so pruning stays an explicit owner decision per
  branch or class rather than a bulk sweep.
- Document the museum without naming the classes or topology - rejected:
  a future reviewer could not tell deliberate keeps from accidental
  leftovers.
- Remove `scripts/sync-branches.sh` instead of guarding it - deferred:
  the script now ships dry-run-by-default behind `--apply`/`--push`
  gates, and removal remains an owner option recorded in the
  implementation plan.

## Decision

Every branch stays on both remotes - the museum is the recorded posture.
The verified classes are `main`; the `broken/*` repair snapshots (5) and
`repair/*` branches (2); the `refactoring/*` set (12) plus the
`reafactoring/` typo variant (1); and six unprefixed experiment branches
(`local/try`, `merge-of-volume+sustain-and-sustain+fresh`,
`sustain+fresh`, `test/zoom`, `testing-worklet`, `volume+sustain`).
`local/try` and `test/zoom` exist only locally and were never pushed.
Pruning, if ever wanted, is an explicit owner decision per branch or
class - never automated.

## Rationale

The project is single-maintainer by recorded decision, and the museum
branches are session archaeology - repair attempts, refactoring
snapshots, and experiments - whose ongoing cost is status noise only.
The two-remote mirror is deliberate infrastructure, so any pruning would
rewrite remote state twice. `WORKFLOW.md` Continuity already carries the
escalation path: the owner reviews the remote and may remove everything
except `main`.

## Consequences

- Clone and mirror fidelity is preserved - every experiment state stays
  recoverable from either remote.
- Remote topology stays noisy: 25 heads per remote plus two local-only
  branches, revisited only when the owner chooses.
- `scripts/sync-branches.sh` keeps its mirror function behind the
  dry-run/`--apply`/`--push`/`--remote` guard recorded in
  `docs/plan/1.6.8/repository-hygiene-branches-implementation.md`.
