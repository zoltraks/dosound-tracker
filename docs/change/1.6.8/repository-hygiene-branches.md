# Finish repository hygiene: branch museum and sync script

**Type:** Chore

**Source:** AUDIT-1.7 REC-006 — FND-DLV-001 (partially landed)

## Summary

| Field         | Value                                                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | REC-006's `.gitattributes` half already landed in the working tree; what remains is the 27-branch museum (including stale `broken/*` and `repair/*` branches on both remotes) and the unguarded `sync-branches.sh` force-push tool |
| Key decisions | Open: prune the stale branches or document the keep-everything posture; remove `sync-branches.sh` or add a guard - both are owner decisions                                                                                        |
| Open risks    | Branch pruning rewrites remote state on two remotes and is destructive; documenting keeps the noise at zero risk                                                                                                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The audit's repository-hygiene finding has three parts. The first is
already resolved in the working tree: `.gitattributes` was added during
the audit window and the index renormalized, ending the ~1,242-file CRLF
churn (the phantom-EOL status flood recorded in the session lessons).

What remains:

- **Branch museum** - 27 local branches including stale `broken/*` and
  `repair/*` repair branches are pushed to both remotes (`origin` on
  GitHub, `scene` on GitLab). The keep-everything posture is documented
  as deliberate, but the museum still costs status noise and clone
  weight. The decision is prune-or-document per branch class.
- **`scripts/sync-branches.sh`** - an unreferenced script that
  force-pushes all branches to every remote. Unreferenced by docs and
  tests, it is a footgun: one accidental run rewrites both remotes'
  branch topology. Remove it or add a guard (confirmation prompt,
  remote allowlist, or dry-run default) consistent with the retention
  sweep's safety posture.

## Use Cases

- When the owner reviews branch topology, stale `broken/*`/`repair/*`
  branches are either gone or carry a documented reason to stay.
- When anyone runs repository scripts, no unguarded path force-pushes
  every branch to every remote.

## Hints

- Check docs references before removing `sync-branches.sh` - the audit
  found it unreferenced, but verify against the current tree.
- Branch deletion is a destructive remote operation - it needs explicit
  owner confirmation per branch or class, never a bulk sweep.
- The two-remote mirror topology itself is deliberate and stays.

## Out of Scope

- `.gitattributes` and EOL normalization - already landed.
- The remote topology (GitHub origin plus GitLab mirror) - deliberate.
- History rewriting of any kind.
