# Reduce the intake document context cost

**Type:** Chore

**Source:** 1.4.3 session verify-set audit

## Summary

| Field         | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Intent        | Bring the always-loaded intake documents back inside their recorded context budgets |
| Key decisions | `verify-set.py` reports README.md and GUIDELINES.md over the intake tier limits     |
| Open risks    | slimming the wrong section can strip rules agents depend on                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The compass `verify-set.py` audit measured the intake surface at 41.9 KB against a 32 KB budget: `README.md` runs 296 lines / 15.8 KB over a 200-line / 8 KB tier, and `GUIDELINES.md` runs 613 lines / 41.9 KB over a 500-line / 20.5 KB tier. Both files load on every request, so the overage is paid as context cost each session.

Reduce the intake cost by distilling content that restates the implementation (per the Distillation rules in `GUIDELINES.md`), relocating reference material to load-on-demand documents, or splitting oversized sections - without removing any rule the set depends on.

## Hints

- `README.md` repeats `docs/` tables, export feature lists, and a full assembly example that `public/MANUAL.md` or `SPECIFICATION.md` can own.
- `GUIDELINES.md` duplicates routing detail that `WORKFLOW.md` already owns.
- Re-run `python3 scripts/verify-set.py` equivalents after each reduction to measure the delta.

## Out of Scope

- Rule changes - the set's semantics stay identical; only placement and redundancy move.
- Historical directories - they are not intake surfaces.
