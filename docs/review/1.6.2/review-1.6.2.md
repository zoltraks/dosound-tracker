# Version 1.6.2 Review

## Document Information

|             |                                                                                    |
| ----------- | ---------------------------------------------------------------------------------- |
| Version     | 1.6.2                                                                              |
| Review Date | 2026-11-13                                                                         |
| Commands    | `git status`, `git diff --stat`, `git log`, `ls docs/change/1.6.2 docs/plan/1.6.2` |

## Scope

The 1.6.2 window: four audit-derived change records and the window's
refactoring pair. The window's work sits in the working tree
uncommitted - the cycle never commits, so the reconciliation below reads
the working-tree diff as the delivered work. Deferred: `App.tsx`
decomposition and `src/exports/asm.ts` restructuring, both explicitly
held for later windows by the extraction record.

## Recorded Work

| Document                                                              | Kind        | Status | Result                                                                      |
| --------------------------------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------- |
| `docs/change/1.6.2/resync-format-and-state-documentation.md`          | Fix         | Done   | Settings contract shows `contrast` + `textScale`; state-domain text fixed   |
| `docs/change/1.6.2/base-aware-offline-urls.md`                        | Fix         | Done   | Worker registration, precache, and fallback resolve under the deployed base |
| `docs/change/1.6.2/decide-persisted-history-depth.md`                 | Chore       | Done   | Bound of 20 kept as a measured choice; measurement + decision recorded      |
| `docs/change/1.6.2/extract-bounded-orchestration-responsibilities.md` | Refactor    | Done   | Seven bounded extractions across three hotspots                             |
| `docs/refactoring/1.6.2/`                                             | Refactoring | Done   | Proposal executed in full; assessment records three minor deviations        |

## Repository Analysis

The working-tree diff reconciles against the records one for one.

- **Confirmed** - `FORMAT.md` and `SPECIFICATION.md` corrections
  (resync record); `src/main.tsx` + `public/worker.js` base-aware URLs
  (offline record); the measurement table, decision, `SPECIFICATION.md`
  rationale, and two new history-depth tests (depth record); seven new
  modules plus the shrunken `useMidiMessageProcessing.ts`,
  `useSongManagement.ts`, `useDataManagement.ts`, and
  `src/utils/midi/midiUtils.ts` (extraction record).
- **Unconfirmed** - none. Every recorded change is present in the tree.
- **Undocumented** - none. Every changed file belongs to a record, a
  plan, or the refactoring pair.
- **Deviations** - the persisted-history bound was chosen under the
  window's autonomous gate mode (the record's wording named the bound
  as the user's call; the autonomous run selected the recommended option
  and recorded it inline). Dependency arrays gained stable ref/setter
  entries at the new parameter boundaries, and
  `songManagement.test.ts` was repointed to the new modules - all three
  recorded in the assessment.

## Findings

| Severity | Finding                                                   | Evidence                               | Action                                     |
| -------- | --------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| Low      | Persisted bound chosen by the agent under autonomous mode | Record's Decision section, measurement | Owner confirms 20 or revisits the bound    |
| Low      | `midiDebugFlag` module state is process-global            | `src/hooks/midi/midiDebugFlag.ts`      | Accepted - identical to the pre-move shape |

## Verification Evidence

- Pre-change baseline: full loop clean before the first code edit -
  165 files, 1,527 tests.
- Targeted loop clean after each of the seven extractions.
- Full loop at close: typecheck, lint (zero warnings), Prettier, build
  (entry chunk 598.84 kB, under the 600 kB limit), `npm test` - 165
  files, 1,529 tests passing.
- `npm run test:e2e` - 30/30 smoke tests on chromium and webkit,
  covering undo/redo, persistence, exports, and settings flows.
- Service-worker probe (`work/2026-11/2026-11-13/sw-base-probe.mjs`):
  offline navigation and asset fetch verified at `/` and `/sub/` - the
  nested worker registers at the nested scope.
- History measurement (`work/2026-11/2026-11-13/measure-history-depth.mjs`):
  serialized payloads at bounds 20/50/100 recorded in the change record.
- Release gate `scripts/release-check.sh` - run at window close, result
  recorded with the bump evidence.

## Unable to Verify

- The packaged Electron launch was not run - no `electron/`,
  packaging, or build-configuration change shipped, and the recorded
  substitution covers the omission.
- Manual hand-driven smoke of the MIDI monitor and the optimize and
  renumber dialogs was substituted by the unit, integration, and e2e
  suites per `TESTING.md`'s recorded substitution for routine changes.
- The nested-path probe ran against a local static server, not the
  production host - the mechanism is origin-agnostic, but a
  same-shaped check on the real host remains a live-deployment check.

## Decision

- **Decision:** go
- **Decided by:** the project owner - through the named 1.6.2 window
  request run under the autonomous gate mode, which authorizes the
  closing version bump; recommended by the agent and reported inline
- **Conditions:** none
- **Accepted risks:** the persisted-history bound stays at the smallest
  measured option pending owner confirmation; nested-path hosting is
  probe-verified, not host-verified
