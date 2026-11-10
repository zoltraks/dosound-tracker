# Specification Audit - Reduce the Intake Document Context Cost

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | `docs/change/1.4.3/reduce-intake-context-cost.md`              |
| Plan       | `docs/plan/1.4.3/reduce-intake-context-cost-implementation.md` |
| Audit Date | 2026-11-09                                                     |

## Completeness

| Requirement                                                               | Covering step                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `README.md` inside the 200-line / 8 KB tier                               | Slim `README.md` to its entry-point role             |
| `GUIDELINES.md` inside the 500-line / 20.5 KB tier                        | Slim `GUIDELINES.md` and repair its pointers         |
| Distill content that restates the implementation                          | `README.md` table/stack/feature deletions            |
| Relocate reference material to load-on-demand documents                   | `MANUAL.md`, `SPECIFICATION.md`, `WORKFLOW.md` moves |
| No rule removed - semantics identical, only placement and redundancy move | All relocation steps plus the verification step      |
| Re-run measurement equivalents after each reduction                       | Verification: `wc` line and byte counts              |

No requirement lacks a covering step. The only step without a stated
requirement is the inbound-reference repair, which the semantics-identical
constraint implies.

## Ambiguity

- "Re-run `python3 scripts/verify-set.py` equivalents" - `scripts/verify-set.py` does not exist in this repository; the record names equivalents explicitly, resolved as `wc -l` and byte counts against the recorded tiers.
- "`GUIDELINES.md` duplicates routing detail that `WORKFLOW.md` already owns" - resolved to the directory read-access gates and the Session Review procedure, both moved into `WORKFLOW.md`.

## Implementability

- `SPECIFICATION.md` carries the `## Audio-Critical Development` delegation stub at lines 11-13 - verified; the moved body replaces it.
- `public/MANUAL.md` line 942 says "The example in `README.md` illustrates this" inside `### DOSOUND Command Stream` - verified; the fenced example inserts there.
- `WORKFLOW.md` `## Session Improvement` exists at line 348 and already defers to the Session Review routing table - verified; the merge target is real.
- `TESTING.md` owns the documentation-only bypass rule and `WORKFLOW.md` owns the abandoned-records rule - verified by read; both deletions are true deduplication.
- No new files, dependencies, or interfaces are required.

No step fails the check.

## Fidelity

- Enumeration fidelity - every section leaving `README.md` or `GUIDELINES.md` is named in the plan with its destination or its owning document.
- Vocabulary freeze - no interchange vocabulary is touched.
- Cross-party parity - pointers flip in both directions: outbound references in the slimmed files and inbound references in `TESTING.md`, `REFACTORING.md`, `WORKFLOW.md`, `SPECIFICATION.md`, and `MANUAL.md`.
- Constants completeness - the tiers are stated verbatim in the Verification section (200 lines / 8 KB; 500 lines / 20.5 KB).
- Boundary decisions - references inside restricted and historical directories (`docs/change/`, `docs/lesson/`) are decided: left untouched.

## Findings Returned to Planning

none
