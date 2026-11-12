# Version 1.5.9 Review

## Document Information

|             |                                                            |
| ----------- | ---------------------------------------------------------- |
| Version     | 1.5.9                                                      |
| Review Date | 2026-11-12                                                 |
| Commands    | git log, git show --stat, git status, vitest run, prettier |

## Scope

The 1.5.9 window envelope: two audit-derived change records implemented
this session, one record discarded at its plan gate, and the window's
refactoring pair - proposal, executed assessment, and the window-close
second pass. Deferred work stays outside the envelope: the future-window
records (1.6.0 through 1.8.0), the oversized-chunk warning owned by
REC-08, and the deferred stereo records in 1.7.0.

## Recorded Work

| Document                                                     | Kind        | Status    | Result                                            |
| ------------------------------------------------------------ | ----------- | --------- | ------------------------------------------------- |
| docs/change/1.5.9/transactional-reset-and-mirror-clearing.md | Change      | Done      | transaction-bound clears, epoch-gated saves       |
| docs/change/1.5.9/distribute-mit-license-notice.md           | Change      | Done      | project LICENSE ships in `dist/` and the app ASAR |
| docs/discard/1.5.9/consolidate-asm-export-strategies.md      | Change      | Discarded | dropped at the plan gate, reason recorded         |
| docs/refactoring/1.5.9/                                      | Refactoring | Done      | layout compliance landed; second pass no findings |

## Repository Analysis

**Confirmed**

- `eeb2025` - the source reorganization, directory-purity guard, layout
  rules, and this window's refactoring proposal plus assessment; matches
  `docs/refactoring/1.5.9/`.
- `8291ce2` - fourteen audit-derived change records and plans across
  1.5.9 through 1.8.0, the deferred stereo records moved to 1.7.0, and
  the engineering audit report; all present in the tree.
- `26e7d3a` - trailing 1.5.7 refactoring-phase work (instrument filename
  strip) documented by its own pair; inside this window's period but
  outside its envelope.
- REC-01 and REC-02 implementations verified in the working tree and
  carried into the 1.6.0 bump - the owner commits the bumped tree per
  `VERSIONING.md`.

**Unconfirmed**

- None.

**Undocumented**

- `WORKFLOW.md`/`GUIDELINES.md` session edit recording the
  question-mechanics convention for window-stage continuation -
  user-requested agent-instruction fix, recorded here.
- `docs/report/1.5.9/COMPARISATION.md` - user-added report, untracked.
- Format-loop side effects on `docs/report/1.5.9/AUDIT-1.6.md` -
  restricted-directory formatting accepted per `TESTING.md`.

**Deviations**

- `consolidate-asm-export-strategies` discarded at the plan gate instead
  of implemented - rationale recorded in the record per convention.
- REC-01 plan refinements: mirror writes serialize through a queue, a
  reset epoch invalidates stale saves, and the reload seam is injected
  for testability - recorded in the plan.
- REC-02 plan refinement: the packaged ASAR carries the notice at both
  `/LICENSE` and `/dist/LICENSE` - recorded in the plan.
- The 600 kB chunk-size build warning persists by design - owned by
  REC-08 in the 1.6.1 window.

## Findings

| Severity | Finding                                    | Evidence      | Action                         |
| -------- | ------------------------------------------ | ------------- | ------------------------------ |
| Info     | Bumped changeset awaits the owner's commit | git status    | Owner commits the bumped tree  |
| Info     | Chunk-size build warning remains           | npm run build | Scheduled under REC-08 (1.6.1) |

Severity classes follow the repository's refactoring rules document where
one exists.

## Verification Evidence

- Post-implementation loops after each record: typecheck, lint, format,
  build, test all clean; final suite 1345 tests across 146 files.
- `npm run build` completes; the 600 kB chunk-size advisory is unchanged
  and tracked under REC-08.
- Electron package inspection: unpacked macOS ASAR lists `/LICENSE` and
  `/dist/LICENSE` beside dependency notices.
- Guard suite green: directory purity plus license-notice parity.

## Unable to Verify

- Manual reset-and-reload smoke across browser engines - deterministic
  coverage landed instead; run before release if desired.
- `npm run test:e2e` not run this window - specifier-only and config
  changes are covered by build plus suite; run before the bump.
- Atari DOSOUND hardware replay - owned by REC-12 in the 1.8.0 window.

## Bump Decision

The window review fed the version bump per `VERSIONING.md`: every 1.5.9
record is landed or discarded, the tree verified clean, and the 1.6.0
bump ran - the owner commits the bumped tree as the close commit.
