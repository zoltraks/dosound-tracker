# Enforce the AI-assisted commit convention

**Type:** Chore

**Source:** AUDIT-1.4 REC-021 (FND-AIP-001)

**Status:** Abandoned

**Abandonment reason:** The project owner does not want an `AI-assisted` marker in commits. The convention this record would enforce is rescinded, so the record has no work to land. `WORKFLOW.md` now records that commits carry no AI-assisted markers.

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Make per-commit AI provenance reconstructable from history       |
| Key decisions | the recorded `AI-assisted: <tool>` marker applies to new commits |
| Open risks    | `none`                                                           |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

AI-assisted authorship is documented - the README names Windsurf and GPT 5.1, and `docs/WORKFLOW.md` defines the `AI-assisted: <tool>` marker for commit descriptions or change records - but git authorship is a single identity for one hundred percent of commits, so per-commit provenance cannot be reconstructed. One agent prompt also leaked as a commit subject in history.

The change applies the recorded convention going forward: new commits carry the `AI-assisted:` marker where the change was agent-assisted, and the convention wording in `WORKFLOW.md` is tightened if the current text allows it to be skipped. History is not rewritten.

## Hints

- Verification is a trailer census on new commits.
- The leaked prompt subject is historical and stays as-is; rewriting history is out of bounds.

## Out of Scope

- Retroactive annotation of existing commits.
- Commit authorship or committer-identity changes.
