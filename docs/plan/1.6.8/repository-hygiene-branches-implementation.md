# Guard Branch Sync and Record the Branch Museum Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Land the remaining REC-006 work: guard `scripts/sync-branches.sh` behind the retention sweep's dry-run posture and record the deliberate branch museum as a dated decision.                                |
| Key decisions | Dry-run by default with `--apply` gating local sync and `--push` plus a `--remote` allowlist gating remote writes; the museum is documented rather than pruned; `.gitattributes` verified already correct. |
| Open risks    | The guarded script was verified by `bash -n` and review only - the change forbids executing it, so the first live dry-run is the owner's smoke test.                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/repository-hygiene-branches.md` (REC-006 / FND-DLV-001,
AUDIT-1.7 evidence EVD-031, EVD-033, TDR-003).

## Best Practices

- Mirror the `scripts/retention-sweep.mjs` safety posture: dry-run is the
  default, an explicit flag gates mutation, the plan prints before anything
  changes, and the script never commits.
- Preserve the script's core function - fetch, tracking-branch creation,
  pull-all, and force-push-all remain reachable behind the gates.
- No test layer exists for shell scripts in this suite (`test/scripts/`
  covers the Node retention sweep only), so `bash -n` is the recorded
  verification for the script.

## Documentation Updates

- `docs/decision/2026-11-20-branch-museum.md` - new dated decision record
  for the keep-everything posture, the verified branch classes, and the
  two-remote mirror topology.
- `docs/WORKFLOW.md` - the Continuity "Stale remote branches" bullet gains
  a reference to the decision record; no restructuring.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` - no
  update required; the change is tooling hygiene and a durable decision
  record only.

## Type and State Updates

None.

## Step by Step Implementation

**Verify `.gitattributes`**

The file already landed and is committed at HEAD (`57c090b Version
1.6.8`). It declares `* text=auto eol=lf` plus explicit `binary` marks for
`*.png`, `*.woff2`, and `*.ico` - a census of `git ls-files` shows those
three are the only binary types in the tree, and every other tracked type
is text. `eol=lf` overrides the host's `core.autocrlf=true`, so checkouts
and prettier's LF output agree and the ~1,242-file CRLF churn recorded in
EVD-031 cannot recur; `git status` shows no phantom-EOL flood. No fix was
needed.

**Guard `scripts/sync-branches.sh`**

Rewrite the unguarded force-push-all tool so dry-run is the default and
every mutation sits behind an explicit flag, matching the retention
sweep's posture. The new interface:

- No flags - print the full plan (fetch, tracking-branch creations in
  remote order, the pull set, and a per-remote push preview classifying
  each local branch as new, update, or unchanged, plus remote-only heads
  that `push --all` never deletes) and stop. Remote heads come from
  `git ls-remote` with a cached `refs/remotes/` fallback so the plan still
  prints offline.
- `--apply` - run the local sync only: `git fetch --all`, create missing
  local tracking branches, pull every branch with upstream config.
- `--push` - implies `--apply`, then prints a WARNING plus a fresh
  per-remote push preview and runs `git push --all --force-with-lease`
  per target. `--remote <name>[,<name>...]` restricts push targets to a
  validated allowlist; without it every configured remote is a target.
- `--remote` without `--push`, unknown options, and unconfigured remote
  names all exit with usage errors. The original branch-restore trap is
  kept and hardened for detached HEAD.

File to modify: `scripts/sync-branches.sh` (full rewrite, 38 -> ~310
lines).

**Record the branch museum**

Create `docs/decision/2026-11-20-branch-museum.md` per
`docs/template/decision-record.md`, recording the verified census - 27
local branches in the classes `main`, `broken/*` (5), `repair/*` (2),
`refactoring/*` (12) plus the `reafactoring/` typo variant (1), and six
unprefixed experiment branches - the two-remote mirror (`origin` GitHub,
`scene` GitLab), the local-only `local/try` and `test/zoom`, and that
pruning remains an explicit owner decision per branch or class.

**Reference the record**

Append one reference sentence to the existing "Stale remote branches"
bullet under Continuity in `docs/WORKFLOW.md` - the only natural anchor;
no tables or sections are restructured.

**Verify**

`bash -n scripts/sync-branches.sh` for syntax (execution is prohibited by
the change scope), `npx prettier --write` on the touched documents, and a
`git status` review confirming only the intended files changed. No
references to `sync-branches.sh` exist in `docs/`, `scripts/`, or
`package.json` outside audit reports and the change record, so the new
invocation interface needs no reference updates.

## Implementation Order

1. Verify `.gitattributes` - done, no change required.
2. Rewrite `scripts/sync-branches.sh` with the guarded interface.
3. Run `bash -n scripts/sync-branches.sh`.
4. Create `docs/decision/2026-11-20-branch-museum.md`.
5. Add the reference sentence in `docs/WORKFLOW.md`.
6. Record refinements in this plan and run `npx prettier --write` on the
   touched documents.

## Testing Strategy

**Unit tests**

None - no test coverage exists for repository shell scripts; the Node
sweep under `test/scripts/` is unaffected.

**Integration tests**

None required - no DOM structure, class names, or runtime behaviour
change; the change touches one shell script and documentation only.

## Verification

The project verification loop (`typecheck`, `lint`, `format`, `build`,
`test`) does not apply - no TypeScript, React, or packaged-configuration
surface changed, and the change record forbids running the sync script
itself. The recorded checks are:

- `bash -n scripts/sync-branches.sh` - syntax clean.
- `npx prettier --write` on `docs/decision/2026-11-20-branch-museum.md`,
  `docs/WORKFLOW.md`, and this plan - formatting clean.
- `git status --short` - confirms the changeset contains only the
  intended files and that no git write commands were run.
- Manual smoke of the script's dry-run remains the owner's first real
  invocation, since executing it was out of scope for this change.

## Refinements

Adjustments made during implementation, recorded per the workflow rule.

- `.gitattributes` needed no fix - it was verified correct (`text=auto
eol=lf` plus binary marks covering every binary type in the tree) and
  already committed, so the anticipated repair step collapsed to
  verification.
- The guard mechanism is flag-gating, not interactive confirmation: an
  interactive per-remote prompt would hang agent-driven runs, while
  `--apply`/`--push`/`--remote` mirrors the retention sweep's recorded
  non-interactive posture and still forces two deliberate flags before
  any remote write.
- `--push` implies `--apply` so the `git fetch --all` that makes
  `--force-with-lease` expectations current always precedes remote
  writes; the push preview re-queries remote heads live immediately
  before pushing so the warning reflects the freshest state.
- Deferred owner decisions: (1) branch pruning - per class or
  wholesale, with `WORKFLOW.md` Continuity already recommending
  remove-all-but-`main` on the next remote review; (2) removing
  `scripts/sync-branches.sh` entirely remains an owner alternative to
  the guard now applied - the change record listed remove-or-guard as
  owner decisions and this plan implements guard while keeping removal
  open; (3) the local-only `local/try` and `test/zoom` branches -
  pushing or deleting them is likewise owner scope.
