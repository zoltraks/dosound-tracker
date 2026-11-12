# Version 1.4.4 Review

## Document Information

|             |                                                                      |
| ----------- | -------------------------------------------------------------------- |
| Version     | 1.4.4 (window closing into 1.4.5)                                    |
| Review Date | 2026-11-10                                                           |
| Commands    | git status, git diff, npm run typecheck, lint, build, test, test:e2e |

## Scope

All nine active change records under `docs/change/1.4.4/` - the 1.4.3
refactoring-survey follow-ups (instrument-id map merge, pattern-id
normalization, transpose injection, modal coverage) and the 1.4.4
self-healing optimization survey (simulation lookup maps, allocation trims,
lazy export pipelines, row memoization, node-environment tests) - plus the
window's own refactoring cycle. Nothing outside the window was touched.

## Recorded Work

| Document                                              | Kind        | Result                                                |
| ----------------------------------------------------- | ----------- | ----------------------------------------------------- |
| change/1.4.4/merge-instrument-id-lookup-maps.md       | Fix         | Single first-wins map; sustain/MIDI aligned to `find` |
| change/1.4.4/extract-pattern-id-normalization.md      | Enhancement | `normalizePatternId`; five sites routed               |
| change/1.4.4/hoist-simulation-lookup-maps.md          | Enhancement | Per-tick finds replaced by first-wins maps            |
| change/1.4.4/trim-audio-path-allocations.md           | Enhancement | Single-loop noise gain; `pow2` tables in `music.ts`   |
| change/1.4.4/review-transpose-normalizer-injection.md | Chore       | Injection removed; canonical contract adopted         |
| change/1.4.4/lazy-load-export-pipelines.md            | Enhancement | Dynamic imports; entry chunk 565 -> 550 kB            |
| change/1.4.4/memoize-track-rows.md                    | Enhancement | `React.memo` row; ~2/64 rows reconcile per tick       |
| change/1.4.4/cover-remaining-modals.md                | Chore       | MidiModal 14 tests, MarkdownModal 10 tests            |
| change/1.4.4/run-pure-tests-in-node-env.md            | Chore       | 60 files stamped; environment 48 -> 15 s              |
| refactoring/1.4.4/REFACTORING.md + ASSESSMENT.md      | Refactoring | Shared AudioContext stub; `asm.ts` pow routing        |

## Repository Analysis

The window's work is uncommitted by rule - reconciliation is against the
working tree and the verification evidence below, not the commit log.

- **Confirmed** - every record's diff is present in the tree: nine plans and nine specification audits in `docs/plan/1.4.4/`, source changes in `App.tsx`, `usePlaybackBridge.ts`, `useSequencerIntegration.ts`, `playbackSimulation.ts`, `YM2149.ts`, `music.ts`, `asm.ts`, `patternUtils.ts`, `useSongManagement.ts`, `songParser.ts`, `transposeUtils.ts`, `useTransposeDialog.ts`, `useFileOperations.ts`, `TrackLine.tsx`, `TrackPanel.tsx`, `trackRendering.ts`, plus test changes and two new modal suites.
- **Unconfirmed** - none.
- **Undocumented** - the `vi`-import cleanup in the four `test/synth/` files, a test-only consequence of the stub extraction.
- **Deviations** - `cover-remaining-modals` records the jsdom scroll-restore boundary as partial verification, accepted by the record; the sustain/MIDI path now resolves duplicate normalized ids first-wins, a deliberate behavior change the record is typed for (Fix).

## Findings

| Severity | Finding | Evidence | Action |
| -------- | ------- | -------- | ------ |
| none     | -       | -        | -      |

## Verification Evidence

- `npm run typecheck` - clean (`tsc -b`).
- `npm run lint` - zero errors, zero warnings.
- `npm run format` - applied tree-wide.
- `npm run build` - clean; `index.js` 549.93 kB entry, six deferred export chunks emitted.
- `npm test` - 99 files, 786 tests pass; environment total 15.4 s (baseline ~48 s).
- `npm run test:e2e` - 12/12 pass on chromium and webkit, including the DOSOUND assembly export through the lazy chunk path.
- Release gate - `scripts/release-check.sh` run at window close.

## Decision

- **Decision:** go with conditions - the bump proceeds on the project owner's authority as recorded by the named window request.
- **Decided by:** the project owner
- **Conditions:** none beyond the release gate.
- **Accepted risks:** a first-export-per-session chunk fetch; the jsdom scroll-restore boundary in `MarkdownModal` tests; sustain/MIDI first-wins resolution for colliding instrument ids.
