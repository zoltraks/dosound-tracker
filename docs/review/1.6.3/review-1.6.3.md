# Version 1.6.3 Review

## Document Information

|             |                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version     | 1.6.3                                                                                                                                                                                     |
| Review Date | 2026-11-17                                                                                                                                                                                |
| Commands    | `git log`, `git status --short`, `git diff`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm audit` |

## Scope

This review closes the second 1.6.3 window cycle. The window's change group
holds four records - envelope clipboard copy/paste, the Crockett's Theme
cover song, muted EQ bar hover color, and the MIDI output close-warning
label - all of which intake verified as already landed in `f8a517b` and
`7a71ef0` before this run began. The run's own delivered work is the
refactoring phase: twelve new test suites and two extended suites
characterising the residual thin coverage in dialog, song, instrument, UI,
and audio modules, recorded in `docs/refactoring/1.6.3/`.

The first cycle's review covered the window's empty opening phase - the
modal prop consolidation and the 1.6.2 extraction characterisation suites,
committed at `635e07b`. That work stands; this review evaluates the
window's full delivered set at close.

Out of scope: the deferred records in `docs/change/1.7.0/` (standard-library
drift, adaptive piano octave span, and the earlier MIDI output warning
record now landed) and `docs/change/1.8.0/` belong to later windows.

## Recorded Work

| Document                                                  | Kind        | Status | Result                                       |
| --------------------------------------------------------- | ----------- | ------ | -------------------------------------------- |
| `docs/change/1.6.3/envelope-clipboard-copy-paste.md`      | Change      | Done   | Landed in `f8a517b`, verified at intake      |
| `docs/change/1.6.3/crocketts-theme-cover.md`              | Change      | Done   | Landed in `f8a517b`, verified at intake      |
| `docs/change/1.6.3/eq-muted-bar-hover-color.md`           | Change      | Done   | Landed in `f8a517b`, verified at intake      |
| `docs/change/1.6.3/correct-midi-output-close-warning.md`  | Change      | Done   | Landed in `7a71ef0`, verified at intake      |
| `docs/refactoring/1.6.3/REFACTORING.md` + `ASSESSMENT.md` | Refactoring | Done   | Pass - loop clean, coverage up on every axis |
| `docs/change/1.7.0/sync-standard-library-drift.md`        | Change      | Filed  | Deferred to the 1.7.0 window by design       |

## Repository Analysis

- **Confirmed** - all four records map to landed commits: `f8a517b` carries
  the envelope clipboard, Crockett's Theme, and EQ hover work with its
  plans and audits; `7a71ef0` carries the MIDI output warning label fix.
  `docs/plan/1.6.3/` holds the matching implementation plans and
  specification audits. The refactoring pair and twelve new suites are
  present as working-tree changes matching the proposal.
- **Unconfirmed** - none.
- **Undocumented** - none; the on-screen piano octave work landed under its
  own `docs/change/1.7.0/` record (`5375d7e`), correctly routed out of this
  window.
- **Deviations** - the window's records were implemented ad hoc before the
  run rather than inside it; intake verified each against its plan instead
  of re-implementing. `useExportOperations` per-format handler depth stayed
  a recorded residual in the assessment. `useScrollSync`'s raw-index target
  offset is pinned by test as actual semantics, not changed.

## Findings

| Severity | Finding                                                                         | Evidence                         | Action                                          |
| -------- | ------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| Minor    | `useExportOperations` format handlers sit near half coverage                    | coverage report, ~49% statements | Recorded residual; candidate for a later window |
| Info     | `useScrollSync` targets the raw line index while clamping only the measured row | `useScrollSync.ts` rAF callback  | Documented by test; behaviour preserved         |

## Verification Evidence

- `npm run typecheck` - `tsc -b`, zero errors.
- `npm run lint` - zero errors and zero warnings.
- `npm run format` - applied.
- `npm run build` - production entry 595.80 kB, below the 600 kB limit.
- `npm test` - 186 files, 1699 tests, all passing.
- `npm run test:coverage` - 88.61 / 82.08 / 87.42 / 88.92 percent
  statements/branches/functions/lines, all above the 80 percent thresholds.
- `npm run test:e2e` - 30 smoke tests on chromium and webkit, all passing.

## Unable to Verify

None - every window artifact is either committed work verified against its
record or this run's tested working-tree changes.

## Decision

- **Decision:** bump - the window delivered four verified change records
  plus a full refactoring coverage cycle with the verification loop clean
  on every axis. Owner authorization recorded: the bump was explicitly
  requested for this run.
- **Decided by:** the project owner - confirmed by the run request.
- **Conditions:** none.
- **Accepted risks:** `useExportOperations` handler depth remains a
  documented coverage residual for a later window.
