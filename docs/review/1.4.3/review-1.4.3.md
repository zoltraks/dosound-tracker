# Version 1.4.3 Review

## Document Information

|             |                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Version     | 1.4.3                                                                                                   |
| Review Date | 2026-11-09                                                                                              |
| Commands    | `git status`, `git diff --stat`, `git log`, `npm test`, `npx vitest run test/exports`, `wc -l`, `wc -c` |

## Scope

The window covers every active change record in `docs/change/1.4.3/` - six records - plus the window's refactoring cycle and four deferral records written into `docs/change/1.4.4/`. Out of scope: anything under earlier version directories and the deferred work itself.

## Recorded Work

| Document                                                 | Kind        | Status | Result                                                               |
| -------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------- |
| `docs/change/1.4.3/reduce-intake-context-cost.md`        | Chore       | Done   | `README.md` 43 lines/2.0 KB, `GUIDELINES.md` 315 lines/20.4 KB       |
| `docs/change/1.4.3/fix-vite-native-config-warnings.md`   | Chore       | Done   | Warning-free test and e2e runs                                       |
| `docs/change/1.4.3/expand-synth-test-coverage.md`        | Chore       | Done   | 13 new test files, 97 tests, `test/modals/` and `test/workers/` born |
| `docs/change/1.4.3/trim-song-metadata-on-load.md`        | Fix         | Done   | `title`/`author` load trimmed, contract recorded in `FORMAT.md`      |
| `docs/change/1.4.3/restore-file-operation-shortcuts.md`  | Fix         | Done   | CTRL+N/O/S/I bound to the button command paths                       |
| `docs/change/1.4.3/align-instrument-id-normalization.md` | Fix         | Done   | One contract; loose and raw sites routed; hex gate kept              |
| `docs/refactoring/1.4.3/`                                | Refactoring | Done   | Assessment: complete, all three steps landed                         |

## Repository Analysis

Reconciled against the uncommitted working tree at `HEAD` (`335f884`).

- **Confirmed** - every record's work is present in the tree: the slimmed intake docs and their relocation targets, the config warning fixes, the new test suites, the parser trim, the shortcut wiring (`keyboardShortcutUtils`, `useKeyboardShortcuts`, `App.tsx`), the normalization routing across all named files plus the raw-contract sites, and the refactoring moves.
- **Unconfirmed** - none.
- **Undocumented** - `docs/TESTING.md` gap-list update and `public/MANUAL.md` shortcut line ride the records that caused them; no undocumented code change found.
- **Deviations** - three, all recorded in the artifacts: the intake record additionally relocated `Repository Layout` and `Agent Operations` into `WORKFLOW.md` because the sanctioned moves left `GUIDELINES.md` over the byte tier; the normalization record found `number: "BASS"` never threw (`parseInt` truncates hex - pinned as real behavior, not the plan's claim); `playbackSimulation.ts` also normalized a note-vs-note id comparison as the consistent equivalent.

## Findings

| Severity | Finding                                                        | Evidence                                | Action                                                       |
| -------- | -------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Low      | Two normalized-id maps diverge on duplicate keys               | `useSequencerIntegration.ts`, `App.tsx` | `docs/change/1.4.4/merge-instrument-id-lookup-maps.md`       |
| Low      | Two modals remain untested                                     | `src/modals/`                           | `docs/change/1.4.4/cover-remaining-modals.md`                |
| Low      | Pattern-id idiom repeats unabstracted                          | `useSongManagement.ts`                  | `docs/change/1.4.4/extract-pattern-id-normalization.md`      |
| Low      | Transpose normalizer injection keeps a divergent stub contract | `transposeUtils.ts`                     | `docs/change/1.4.4/review-transpose-normalizer-injection.md` |

## Verification Evidence

- Baseline loop before first code change: clean (620 tests).
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`: clean at every record boundary and after refactoring.
- `npm test`: 96 files / 747 tests, zero failures, zero warnings.
- `npm run test:e2e`: 12 Playwright cases pass on chromium and webkit.
- `npm run test:coverage`: 90.8% statements, 91.2% lines - above the enforced 80% thresholds.
- `test/exports/`: byte-identical output for the supplied fixtures after the normalization routing.
- Intake tiers: `README.md` 43 lines / 2,010 bytes; `GUIDELINES.md` 315 lines / 20,441 bytes - both inside.

## Unable to Verify

- Manual audio playback listening: the normalization routing touches a lookup on the audio path; the exports suite and simulation tests cover byte-level equivalence, but no human listened to playback this window.
- `verify-set.py` is external to this repository - intake sizes were measured with `wc` equivalents against the recorded tiers.

## Decision

- **Decision:** go
- **Decided by:** the project owner - the named window request authorizing the autonomous run carries the closing bump
- **Conditions:** none
- **Accepted risks:** manual playback listening deferred; `$`-prefixed instrument numbers now load instead of throwing - recorded in `FORMAT.md`
