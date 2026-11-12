# Script the Document Retention Sweep

**Type:** Feature

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | Automate the recorded Document Retention sweep as a repository script           |
| Key decisions | `npm run retention` entry point, dry-run default, judgment stays with the agent |
| Open risks    | Boundary-day flat files stay by the date rule and are surfaced for review       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Document Retention sweep in `WORKFLOW.md` is a deterministic procedure that
the agent currently executes by hand - boundary computation, family-start
resolution, candidate classification, archive provisioning, link checking,
`git mv` moves, `.gitkeep` reconciliation, and the moved/stayed report. Every
run re-derives the same steps and re-decides the same edge cases, which invites
per-session drift.

This change adds a repository script that encodes the sweep exactly as recorded.

- `scripts/retention-sweep.mjs` runs through `npm run retention`.
- Dry-run is the default: the script prints the boundary reasoning, the classified candidates, the link-check hits, the archive provisioning, and the `.gitkeep` actions without moving anything.
- `--apply` executes the plan: provision archive targets, `git mv` each candidate, reconcile `.gitkeep` markers, and print the moved/stayed report per role.
- `--repoint` additionally rewrites references to moved paths inside files that stay. Without it, those references are reported for agent judgment - narrative references describe where a file lived at the time and are not rewritten silently.
- `--json` emits the plan as machine-readable output for agent consumption.

The script encodes the recorded rules literally.

- The boundary is the current minor version family read from `package.json` - every version below `X.Y.0` is a candidate, and the current family and in-flight window always stay.
- The current family's start is the earlier of the `X.Y.0` bump commit date and the earliest committed `X.Y.*` artifact date.
- Versioned role directories retire whole - a directory name carrying a version token plus a suffix resolves its family from the leading token.
- Flat files in `docs/decision/` and `docs/lesson/` retire by embedded version token first - including compact three-digit tokens such as `146` for `1.4.6` - and otherwise by date before the family start.
- The link check scans the active document set for references to candidate paths and repoints or reports each one before moving.
- `.gitkeep` markers reconcile in both directions - removed from directories that hold other content, placed into swept role directories left empty.
- The result lands as uncommitted working-tree changes; the script never commits.

Judgment stays with the agent. The script surfaces the cases it must not decide.

- A flat file dated on the family-start boundary stays by the date rule but is listed with its embedded version references so the agent can override.
- Narrative references to moved paths are reported, not rewritten, unless `--repoint` is passed.

## Use Cases

- When the user runs `npm run retention`, the script prints a dry-run plan and moves nothing.
- When the user runs `npm run retention -- --apply`, the sweep executes and the working tree holds the uncommitted moves.
- When a staying file references a moved path, the run reports the reference; with `--repoint` the reference is rewritten to the archive location.
- When a flat file's date equals the family start, the run lists it as kept-by-date with its embedded version references.

## Hints

- Follow the `bump-version.mjs` conventions - Node ESM, `__dirname` via `fileURLToPath`, plain console output.
- Keep classification pure and exported so tests can exercise it without a repository fixture.
- No top-level await - the module must stay loadable through `createRequire` for tests.
- Isolate `git` calls behind one exec seam so the dry-run plan needs no repository writes.

## Out of Scope

- Auto-repointing narrative references without `--repoint`.
- Sweeping `docs/archive/` itself or any directory outside the recorded retention roles.
- Other workflow operations - window runs, session review, and document distillation keep their current execution.
