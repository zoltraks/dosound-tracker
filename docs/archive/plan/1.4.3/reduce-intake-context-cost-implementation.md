# Reduce the Intake Document Context Cost Implementation Plan

## Summary

| Field         | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Intent        | Bring `README.md` and `GUIDELINES.md` back inside their intake tiers by relocation and deduplication |
| Key decisions | Audio-critical principles relocate to `SPECIFICATION.md`; routing detail relocates to `WORKFLOW.md`  |
| Open risks    | Ownership flips for the audio-critical principles require pointer updates in five files              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.3/reduce-intake-context-cost.md`.

## Analysis

Measurements confirm the record: `README.md` runs 296 lines / 15.8 KB over a 200-line / 8 KB tier and `GUIDELINES.md` runs 613 lines / 41.9 KB over a 500-line / 20.5 KB tier. Both load on every request.

`README.md` duplicates material owned elsewhere: four documentation tables that mirror the Sources of Truth and Repository Layout tables, feature lists owned by `public/MANUAL.md`, a technology stack owned by `package.json`/`SPECIFICATION.md`, and a 68-line assembly example that `MANUAL.md` already points at as its illustration.

`GUIDELINES.md` carries load-on-demand reference material that other documents can own: the Audio-Critical Development Principles (`SPECIFICATION.md` already holds a delegation stub for them), Session Review and the triggered working modes (`WORKFLOW.md` already describes the session-improvement loop), the directory read-access gates (`WORKFLOW.md` owns the cycle directories), and the date/naming conventions (`SPECIFICATION.md` owns project conventions). It also duplicates rules owned by `TESTING.md` and `WORKFLOW.md`.

## Documentation Updates

This change is itself a documentation change - the edits below are the documentation updates. No project pillar (`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md`) describes behavior that changes; `SPECIFICATION.md` and `WORKFLOW.md` gain relocated rules and their Sources of Truth purpose cells stay accurate.

## Step by Step Implementation

**Slim `README.md` to its entry-point role**

Rebuild `README.md` to about 80 lines: title, condensed `Quick Overview` with the feature one-liner and `MANUAL.md` link, `Downloads` reduced to the URL plus an unsigned-binaries pointer, the unique `Makers & Takers` credit line, the `Development Environment` floors (README is the recorded environment-readiness owner), a one-sentence assembly-format pointer to `MANUAL.md`, the `Documentation` agent-routing paragraph, the closing tagline, and `License`. Delete the feature subsections, the technology stack and implementation details, the export feature lists, and the four documentation tables - all owned by `MANUAL.md`, `SPECIFICATION.md`, or the `GUIDELINES.md` rosters.

File to modify: `README.md`.

**Move the assembly example into `MANUAL.md`**

Insert the relocated `dc.b` fenced example inside `### DOSOUND Command Stream` immediately before the line that currently says "The example in `README.md` illustrates this", and rewrite that sentence to reference the in-document example.

File to modify: `public/MANUAL.md`.

**Move the audio-critical principles into `SPECIFICATION.md`**

Replace the delegation stub under `## Audio-Critical Development` with the full Audio-Critical Development Principles body moved verbatim from `GUIDELINES.md`, keeping every bold sub-header, and rewrite the section intro to state ownership.

File to modify: `docs/SPECIFICATION.md`.

**Move the conventions into `SPECIFICATION.md`**

Add `### Naming Conventions` under `## Project-Specific Conventions` carrying only the project deltas (CSS classes, config/data `snake_case`, bare version numbers, the component-vs-other file casing rule) with a pointer to `standard/typescript-react-development.md`. Add `### Date and Time Format` carrying the moved format section.

File to modify: `docs/SPECIFICATION.md`.

**Move the workflow conventions into `WORKFLOW.md`**

Relocate the Change Request and Plan Directory Access rules into a new `## Document Directory Access` section beside the cycle Directory Summary. Merge Session Review into the existing `## Session Improvement` section, retitled `## Session Review`, with the routing table moved in. Add `## Memorisation Convention` and `## Documentation Distillation` sections carrying the moved bodies.

File to modify: `docs/WORKFLOW.md`.

**Slim `GUIDELINES.md` and repair its pointers**

Remove the relocated sections, delete the two bullets duplicated by their owners (`Documentation-Only Changes Bypass the Verification Loop`, owned by `TESTING.md`; the abandoned-records and agent-entry bullets duplicated elsewhere), collapse the `standard/` and `template/` roster rows into directory rows, compress the duplicated plan-location rules, and repoint every remaining reference (`Session Review` to `WORKFLOW.md`, directory-access rule to `WORKFLOW.md`, the stale Documentation Style pointer to `STYLE.md`, the verification-bypass pointer to `TESTING.md`).

File to modify: `docs/GUIDELINES.md`.

**Repoint inbound references**

Update the references that named `GUIDELINES.md` as owner of the moved rules: `TESTING.md` audio-critical and Session Review mentions, `REFACTORING.md` audio-critical consults, `WORKFLOW.md` self-references resolved by the moves, and the `SPECIFICATION.md` stub intro. References inside restricted or historical directories stay untouched.

Files to modify: `docs/TESTING.md`, `docs/REFACTORING.md`.

## Implementation Order

Execute the steps above in this sequence.

1. Slim `README.md`
2. Move the assembly example into `MANUAL.md`
3. Move the audio-critical principles into `SPECIFICATION.md`
4. Move the conventions into `SPECIFICATION.md`
5. Move the workflow conventions into `WORKFLOW.md`
6. Slim `GUIDELINES.md` and repair its pointers
7. Repoint inbound references
8. Measure the result and run the format check

## Testing Strategy

Documentation-only change - no unit or integration tests apply. Verification is structural: the intake tiers, the style rules, and the format check below.

## Verification

- Measure `wc -l` and byte counts on `README.md` and `GUIDELINES.md` - both must land inside their tiers (200 lines / 8 KB and 500 lines / 20.5 KB).
- Confirm no rule was dropped: every removed section lands in its named destination or is verified owned elsewhere.
- Run `npx prettier --check` on every touched Markdown file - the format gate must pass clean.
