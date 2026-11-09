# Adopt the Suggested Extension Set

**Type:** Chore

**Source:** ASE evaluation findings, 2026-11-03 (extension coverage advisory)

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Adopt all twelve suggested extensions plus `standards-synchronization`  |
| Key decisions | Each extension's gated requirements land in its recorded owner document |
| Open risks    | Larger agent-behavior surface in `GUIDELINES.md`; keep it grouped       |

## Description

The evaluation surfaced twelve catalog-suggested extensions as unadopted, plus the promoted `standards-synchronization` extension whose adoption this change set also records. The adopted set becomes:

- Already adopted: `version-window`, `run-resume`.
- Newly adopted: `stage-gates`, `specification-audit`, `verification-options`, `preserve-before-reorganize`, `artifact-summary`, `work-modes`, `session-reporting`, `runnable-artifact`, `independent-verification`, `lessons-loop`, `clean`, `purge`, `standards-synchronization`.

Each extension's gated requirements are written into its owner:

- `WORKFLOW.md`: `stage-gates` (stage boundaries as checkpoints, with the window `autonomous` mode as the recorded skip convention), `work-modes` (three-mode scheme), `specification-audit` (plan audit before implementation), `artifact-summary` (summary block on records and plans), `preserve-before-reorganize` (snapshot before structural change).
- `TESTING.md`: `verification-options` (named menu feeding the completion record), `independent-verification` (review-class options run by the project owner), `runnable-artifact` (shipped entrypoints and their live slice), `lessons-loop` (lessons record location and consultation rule).
- `GUIDELINES.md`: `session-reporting` (usage report, armed operation timing, heartbeat, verbose report), `clean` and `purge` (request shapes and safety rules).
- `docs/template/`: summary block added to the change-request and implementation-plan templates - `specification-audit-template.md` and `verification-report-template.md` vendored from the canonical library.
- `scripts/clean.sh`: deterministic script backing the `clean` and `purge` requests with `--dry-run` and `--purge`.

## Execution

- Update the `Adopted extensions:` line in `GUIDELINES.md`.
- Write each extension's gated rules into the owner sections listed above.
- Update the two existing templates and vendor the two new ones.
- Add `scripts/clean.sh` and reference it from the `clean`/`purge` rules.
- Update the `README.md` and `GUIDELINES.md` tables for the two new templates.

## Out of Scope

- No behavioral change to the verification loop itself - `verification-options` selects depth per change, the canonical loop stays.
- The `clean`/`purge` rules delete only verified-ignored and untracked paths.
