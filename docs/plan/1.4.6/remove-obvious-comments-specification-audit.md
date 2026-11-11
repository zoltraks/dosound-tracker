# Specification Audit - Remove Obvious Comments

## Document Information

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Change     | `docs/change/1.4.6/remove-obvious-comments.md`              |
| Plan       | `docs/plan/1.4.6/remove-obvious-comments-implementation.md` |
| Audit Date | 2026-11-10                                                  |

## Completeness

Requirement-to-step mapping from the change record.

| Requirement                                                             | Plan step                               |
| ----------------------------------------------------------------------- | --------------------------------------- |
| Remove catalogued comments in `src/App.tsx` and `workers/sequencer.ts`  | Sweep src root and workers              |
| Remove catalogued comments in `src/components` (12 files)               | Sweep src/components                    |
| Remove catalogued comments in `src/hooks` (19 files)                    | Sweep src/hooks                         |
| Remove catalogued comments in `src/exports`, `src/synth`, `src/utils`   | Sweep src/exports, src/synth, src/utils |
| Remove catalogued comments in `test/` files and `scripts/clean.sh`      | Sweep tests and scripts                 |
| Keep-criteria honoured: rationale, hardware semantics, pragmas stay     | Every sweep step re-checks each site    |
| `(b)` borderline entries resolved during implementation                 | Resolve borderline entries              |
| Stale comments named in the record removed first                        | Resolve borderline entries              |
| Deletion only - no rewording, no code refactoring                       | Best Practices                          |
| `ModalManager`/`useAppModals` group labels kept or dropped consistently | Sweep src/components (drop chosen)      |

Requirements with no covering step: none.

Steps with no stated requirement: none.

## Ambiguity

- **Drifted line numbers**: the record warns its line numbers come from the
  audit tree state. This window's ayumi record already rewrote the helper
  block in `src/synth/YM2149.ts` - that file's catalogue entries resolve by
  comment text, and entries whose code moved to `channelInstrument.ts` stay
  in place (the comments travelled with the moved code).
- **Group-label consistency**: the record leaves `ModalManager.tsx` and
  `useAppModals.tsx` prop-group labels as a style call. Resolution: drop
  them - the labels restate the destructured names they group, matching the
  removal criteria, and consistency favors deletion in both files.
- **`(b)` borderline entries**: resolved site by site - kept only when the
  context token survives the keep criteria.

## Implementability

- Every catalogued file exists at its recorded path - verified during
  intake by spot-checking live sites (`App.tsx` L133, `logger.ts` L39,
  `sequencer.ts` L59-98 narration).
- `src/modals/` is recorded clean - verified empty of narration candidates.
- Deletion-only edits carry no type or behaviour surface - the existing
  verification loop is the complete regression net.

## Fidelity

- The sweep covers every file named in the record - 45 source files plus
  `scripts/clean.sh`, matching the ~320-comment catalogue.
- Keep-list pragmas (`eslint-disable`, `// @vitest-environment`, `// REASON:`,
  `// ignore`, license headers, file docblocks) are never touched.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  |         |                  |
