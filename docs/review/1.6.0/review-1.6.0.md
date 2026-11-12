# Version 1.6.0 Review

## Document Information

|             |                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Version     | 1.6.0                                                                                            |
| Review Date | 2026-11-13                                                                                       |
| Commands    | `git log`, `git diff`, `git status --short`, `npm run test:coverage`, `scripts/release-check.sh` |

## Scope

This review covers the three change records catalogued at intake for the
1.6.0 window plus the window's refactoring cycle.

A fourth record, `retention-sweep-script`, appeared in the group after
intake from a concurrent session. Per the run-state rule it is
re-enumerated here and treated as next-window work - it was not
absorbed into this run.

## Recorded Work

| Document                                                            | Kind        | Status    | Result                                                         |
| ------------------------------------------------------------------- | ----------- | --------- | -------------------------------------------------------------- |
| docs/change/1.6.0/decide-license-policy-for-shipped-dependencies.md | Change      | Done      | `COPYRIGHTS.md` gained PSF-2.0 and 0BSD; lockfile census guard |
| docs/change/1.6.0/reconcile-note-off-keyboard-contract.md           | Change      | Done      | `F-10` corrected to Shift+Space; docs-only reconciliation      |
| docs/change/1.6.0/separate-packaged-and-development-origins.md      | Change      | Done      | `isPackaged` threaded through permission and navigation checks |
| docs/change/1.6.0/retention-sweep-script.md                         | Change      | In flight | Foreign session's active record; deferred per run-state rule   |
| docs/refactoring/1.6.0/                                             | Refactoring | Done      | Assessment complete; branch gate restored at 80.08%            |

## Repository Analysis

The window's delivered work is uncommitted working-tree state - the
cycle never commits on its own, so the reconciliation reads the tree
against the log and the records.

**Confirmed**

- `docs/COPYRIGHTS.md` carries `PSF-2.0` and `0BSD`, and
  `test/guard/licenseAllowlist.test.ts` enforces the allowlist from the
  document - eight census assertions green.
- `docs/PROJECT.md` `F-10` names Shift+Space for note-off; the
  specification, manual, navigation constants, and shortcut tests all
  agree with the implemented binding.
- `electron/permissions.cjs` receives a packaged-state argument and
  `electron/main.cjs` passes `app.isPackaged` at the permission
  handlers and the `will-navigate` guard; the packaged artifact's
  shipped `main.cjs` was probed and denies the development origin while
  packaged.
- `docs/refactoring/1.6.0/REFACTORING.md` and `ASSESSMENT.md` exist;
  `src/utils/instrument/instrumentNavigation.ts` carries the extracted
  resolver and `src/App.tsx` delegates to it.

**Unconfirmed**

- None. Every catalogued record's claimed outcome is present in the
  tree with matching tests.

**Undocumented**

- Commit `ad0fe8e` (archive of 1.4.x/1.5.x families) landed during the
  window without a change record of this run; it predates the foreign
  session's retention record and is consistent with the retention
  procedure.
- `docs/archive/docs/1.6.0/` holds copies of `ARCHITECTURE.md`,
  `PROJECT.md`, and `SPECIFICATION.md` - residue matching a mis-rooted
  sweep output, attributed to the foreign session's in-flight work.

**Deviations**

- The license plan applied the verdicts before the census test landed
  (verdicts resolved at intake); recorded in the plan's Refinements.
- The keyboard plan reduced to a documentation-only fix once Shift+Space
  was confirmed canonical; recorded in the plan's Refinements.
- The origin plan's manual probe was performed against the extracted
  packaged `main.cjs` with an asar-relative index path; recorded in the
  plan's Refinements.
- The refactoring skipped `PlaylistHeader`, `PianoKeyboard`, and
  `useTrackOperations` after the threshold was restored without them,
  and covered the foreign script per an explicit user decision;
  recorded in `ASSESSMENT.md`.

## Findings

| Severity      | Finding                                                           | Evidence                                                  | Action                                       |
| ------------- | ----------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Minor         | Foreign `retention-sweep-script` record remains in flight         | `docs/change/1.6.0/retention-sweep-script.md` (untracked) | Next-window work; do not absorb              |
| Minor         | Stray `docs/archive/docs/1.6.0/` residue                          | `git status` untracked entry                              | Foreign session cleans or records it         |
| Minor         | `PianoKeyboard` and `useTrackOperations` keep low branch coverage | coverage-final.json                                       | Dedicated characterization cycle recommended |
| Informational | Branch deficit predated the window; the gate failed at intake     | `npm run test:coverage` baseline                          | Restored at 80.08% this cycle                |

## Verification Evidence

- `npm run typecheck` - clean.
- `npm run lint` - clean, no warnings.
- Prettier check over the window's touched files - clean.
- `npm run build` - clean; the pre-existing 600 kB chunk warning
  remains, tracked by a later-window record.
- `npm test` - 154 files, 1415 tests, all passing (baseline was 147
  files, 1354 tests).
- `npm run test:coverage` - statements 86.5%, branches 80.08%,
  functions 87.46%, lines 86.82%; all four thresholds pass.
- `npm run test:e2e` - 30/30 smoke tests across chromium and webkit.
- `scripts/clean.sh` plus a fresh `npm run build` - clean rebuild.
- `scripts/release-check.sh` - gate clear; record coverage, served
  changelog, and refactoring assessment all OK.
- Packaged `--dir` build inspected: shipped runtime graph limited to
  allowlisted licenses; the packaged `main.cjs` probe denies the
  development origin and foreign `file:` pages while packaged.

## Unable to Verify

Nothing deferred. The packaged probes exercised the shipped artifact
rather than a store-signed distribution, which matches the record's
audit finding shape.

## Decision

- **Decision:** go
- **Decided by:** the project owner, 2026-11-13
- **Conditions:** none
- **Accepted risks:** the foreign in-flight record and its tree changes
  remain uncommitted alongside this window's work; the bump commit will
  need a deliberate change-set selection at commit time
