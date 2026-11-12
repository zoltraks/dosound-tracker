# Tier the mandatory guideline reads and repair instruction-set drift

**Type:** Chore

**Source:** Compass context-efficiency audit 2026-11-11 - finding classes `unconditional-read`, `guidelines-overrun`, `archive-in-intake`

## Summary

| Field         | Value                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Cut session-start context cost by making most Sources-of-Truth reads task-conditional, slim the heaviest owner document, and repair verified instruction drift |
| Key decisions | Session start reads `GUIDELINES.md` and `WORKFLOW.md` only; every other Sources-of-Truth document loads when the task touches its domain                       |
| Open risks    | A rule consulted less often is enforced less often - mitigated by the Work Intake Table, which still reports what each request actually read                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The mandatory read set costs about 284 KB (~71k estimated tokens) before any
change is described. The audit measured the full Sources-of-Truth set as the
mandated intake and classified the blanket mandate `unconditional-read`.

This change restructures the read mandate into tiers, extracts the Tooling
Notes block, and repairs the drift findings the audit verified.

**Tiered read mandate**

- Every request reads `GUIDELINES.md` and `WORKFLOW.md` - mode selection,
  intake rules, and directory access live there.
- `STYLE.md` loads before any documentation or generated-record edit.
- `PROJECT.md`, `ARCHITECTURE.md`, and `SPECIFICATION.md` load when a change
  is described, through the owning pillar of that change.
- `TESTING.md` loads when verification is planned or run.
- `FORMAT.md` loads for save, load, or export-format work.
- `COPYRIGHTS.md` loads for dependency or licensing work.
- `VERSIONING.md` and `DEPLOYMENT.md` load for bump, release, and
  deployment work.
- `REFACTORING.md` loads for refactoring proposals and assessments.
- `standard/README.md` and the matching standard load for implementation
  work, as the existing per-task rule already requires.
- The Work Intake Table keeps its current semantics - it reports what each
  request actually inspected.

**Tooling Notes extraction**

- The `## Tooling Notes` block moves out of `WORKFLOW.md` into a new
  `docs/TOOLING.md` owner, registered in Sources of Truth and the layout map.
- The notes load when the task touches the tool, path, or environment a note
  covers - the extraction records that condition.

**Drift repairs**

- `Adopted extensions:` records `scout-delegation` - the practice already
  lives in the Context Management rules.
- The restricted-directory rules record the changelog-analysis exception -
  the bump procedure already reads the closed window's change, plan, and
  review groups.
- The recorded-conventions example drops its `docs/archive/` path.
- The session-review lesson example stops citing the vitest 5 and js-yaml 5
  reverts - both landed in 1.5.4 and FUTURE.md holds no such records.
- `REFACTORING.md` refreshes the stale `App.tsx` line figure.
- The `validate-document.py` note names its home - the borrowed panther-skill
  Markdown battery, not a repository script.

**Upstream feed**

- The project-side deltas carried by the vendored standards outside their
  `## Project Conventions` sections feed back into the compass canonical
  library, and the vendored copies re-sync so the sets stay diffable.

## Use Cases

- When a bare work request arrives, the session loads `GUIDELINES.md` and
  `WORKFLOW.md`, selects the mode, and waits - no other document loads until
  a change is described.
- When a save-format change is described, `FORMAT.md` loads before the
  format document is touched, and `SPECIFICATION.md` before implementation.

## Hints

- Estimates: session start ~78 KB (~19k tokens) instead of ~284 KB.
- Every moved line keeps exactly one owner - a relocation that drops a rule
  is a defect, not a diet.

## Out of Scope

- Source-code changes - this is a documentation-only change.
- Session-review lesson routing - that runs on the `improve dosound-tracker`
  trigger, which this work does not invoke.
- Content rewrites beyond relocation and the listed repairs.
