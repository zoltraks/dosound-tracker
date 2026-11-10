# Engineering Framework Improvement Implementation Megaplan

## Change Record Reference

This plan is the umbrella over the change records the work decomposes into.

Each record in `docs/change/1.3.6/` names its own execution.

This document fixes their order, dependencies, wave partition, and release gates.

The work originates from the ASE evaluation of 2026-11-03 and is documentation-only except for `scripts/clean.sh` - the verification loop runs once, at the end, for that artifact alone per `TESTING.md`.

## Iteration Map

| Order | Change record                     | Requirements                                      | Gate   |
| ----- | --------------------------------- | ------------------------------------------------- | ------ |
| 1     | `repair-documentation-drift.md`   | stale figures in README, REFACTORING, TESTING     | review |
| 2     | `anchor-deployment-document.md`   | DEPLOYMENT.md re-anchored to real deployment      | review |
| 3     | `sync-standard-library.md`        | three re-vendors + one adoption + index updates   | review |
| 4     | `consolidate-duplicated-rules.md` | single owners for loop and feature sequence       | review |
| 5     | `record-remaining-conventions.md` | profile, topology, readiness owner, defect rename | review |
| 6     | `adopt-extension-set.md`          | fifteen-extension adopted set + gated rules       | review |

## Dependencies

Records 1 through 5 are independent of one another and of record 6.

Record 6 depends on record 4: the extension rules are written into `TESTING.md`, `WORKFLOW.md`, and `GUIDELINES.md`, which record 4 restructures first.

## Wave Partition

**Wave 1** - records 1, 2, 3.

Disjoint write sets: record 1 touches `README.md`, `REFACTORING.md`, and one line of `TESTING.md` - record 2 touches `DEPLOYMENT.md` only - record 3 touches `docs/standard/` files plus index tables.

**Wave 2** - records 4, 5.

Shared seam: `GUIDELINES.md` - record 4 edits the Verify and Implementation Planning sections, record 5 edits the layout map's recorded conventions and renames `docs/refactoring/1.2.6/ASSESSMENT.md.md`. `TESTING.md` and `WORKFLOW.md` belong to record 4.

**Wave 3** - record 6.

Shared seam: `GUIDELINES.md`, `WORKFLOW.md`, `TESTING.md`, `docs/template/` - all final writes to the three owner files happen here, on top of the wave-2 structure.

## Documentation Updates

Under documentation-first, the updated documents are the deliverable itself.

- `GUIDELINES.md` - Sources of Truth rows, layout-map recorded conventions, Agent Behavior sections, consolidated rule references.
- `WORKFLOW.md` - consolidated references plus the `stage-gates`, `work-modes`, `specification-audit`, `artifact-summary`, and `preserve-before-reorganize` rules.
- `TESTING.md` - hook count, `verification-options` menu, `independent-verification` model, `runnable-artifact` entrypoints, `lessons-loop` record.
- `DEPLOYMENT.md` - full rewrite anchored to the real deployment.
- `README.md` - corrected figures, updated standards and template tables.
- `REFACTORING.md` - corrected `App.tsx` figure.
- `docs/standard/` - three re-vendored files, one adopted file, regenerated index.
- `docs/template/` - summary blocks in two templates, two vendored templates.

## Open-Point Routing

- The fate of generic hosting guidance in `DEPLOYMENT.md` - closed by record 2: dropped in favor of a static-SPA statement.
- `Project Conventions` wording after each re-vendor - closed inside record 3 by section review.
- The reviewer model for `independent-verification` - closed by record 6: the project owner is the reviewer, the agent the implementer.
- Historical `COMPARISATION` and `1.2.4-configuration` naming - deliberately open as accepted variance recorded by record 5.

## Gate Roll-Up

- **Records 1-3** - every replaced figure verified against its source, `DEPLOYMENT.md` claims only anchored content, `docs/standard/` matches canonical under `diff -w -B`.
- **Records 4-5** - each consolidated rule has exactly one owner, the layout map records the new conventions, the double-extension rename is applied.
- **Record 6** - `Adopted extensions:` lists all fifteen, every gated rule sits in its owner, templates carry the summary block and the two vendored skeletons, `scripts/clean.sh --dry-run` lists targets without deleting.

## Definition Of Done

- All six change records and this megaplan exist under the 1.3.6 groups.
- `diff -w -B` against the canonical standard library shows only format noise and `Project Conventions` sections.
- `npx prettier --check` passes on every touched Markdown file.
- The verification loop passes once, clean, covering the `scripts/clean.sh` addition.
- No commit is made - a commit message is proposed for the user.

## Verification

Each record is documentation-only except `scripts/clean.sh` in record 6.

The closing verification runs the full loop once: `npm run typecheck`, `npm run lint`, `npm run format` (or `npx prettier --check` on touched files), `npm run build`, `npm test`.

`scripts/clean.sh --dry-run` proves the shipped maintenance entrypoint against a live slice without deleting.

## Risks

- Re-vendored standards may invalidate `Project Conventions` wording that assumed the old canonical text - answered by the section review inside record 3.
- Consolidation may drop a normative line - answered by the single-owner check in record 4's gate.
- `purge` removing `work/` could delete in-flight scratch - answered by the script's `--dry-run` default listing and the locked-file skip rule.
