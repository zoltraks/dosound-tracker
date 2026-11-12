# Record a Continuity Plan Implementation Plan

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | Record an escalation path covering repository access, the site, and signing  |
| Key decisions | continuity section in `WORKFLOW.md`; remote branch pruning reported, not run |
| Open risks    | `none`                                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/record-continuity-plan.md`.

## Analysis

The single-author posture is already accepted in `WORKFLOW.md` under
Continuity. No succession path exists. Stale remote branches exist
(`origin/broken/*`, `origin/refactoring/*`, `origin/repair/*` and similar).
their deletion is a remote-side irreversible operation, so the plan records
the inventory and leaves pruning to the owner.

## Documentation Updates

- `WORKFLOW.md` — the Continuity section gains the escalation path: repository
  access through the GitHub account of record, the published site at
  dosound.alyx.pl through its hosting account, no signing materials today
  (unsigned binaries per `DEPLOYMENT.md`), and the stale-branch inventory.

No code change. The verification loop is not required - documentation only.

## Verification

- `npx prettier --check` on `docs/WORKFLOW.md`
