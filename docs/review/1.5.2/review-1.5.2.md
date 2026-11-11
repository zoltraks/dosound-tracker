# Version 1.5.2 Review

## Document Information

|             |                                                                     |
| ----------- | ------------------------------------------------------------------- |
| Version     | 1.5.2                                                               |
| Review Date | 2026-11-11                                                          |
| Commands    | git log, git status, git diff, npm test, npm run test:e2e, grep, ls |

## Scope

The fourteen change records under `change/1.5.2/` plus the window's
refactoring pair under `refactoring/1.5.2/`.

Re-enumeration at review time matches the intake set - no late record
appeared under the group after intake. The `change/1.5.3/` through
`change/1.5.6/` groups hold next-window records filed at intake and are
outside this review.

## Recorded Work

| Document                                         | Kind        | Result                                                                        |
| ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------- |
| change/1.5.2/accessibility-support.md            | Feature     | contrast theme, three-step text scale, live-region row announcements          |
| change/1.5.2/additional-chip-variants.md         | Feature     | `SUPPORTED_SONG_CHIPS` admits AY; `setChip` on the `SoundEngine` contract     |
| change/1.5.2/additional-export-formats.md        | Feature     | MOD and MIDI exporters ship with warnings; IT deferred by recorded evaluation |
| change/1.5.2/align-ayumi-output-gain.md          | Fix         | `AYUMI_OUTPUT_GAIN` 1.2 plus soft-knee limiter; amended on measurement        |
| change/1.5.2/audioworklet-sequencer-timing.md    | Feature     | `sequencerWorklet.ts` replaces the `sequencer.ts` worker                      |
| change/1.5.2/continue-app-decomposition.md       | Refactor    | `useAppUiState`, `useChannelPans`, `useSettingsSession` extracted             |
| change/1.5.2/cover-remaining-test-surfaces.md    | Chore       | AboutModal, DownloadModal, barRendering, NumberSpinner suites                 |
| change/1.5.2/enhanced-assembly-optimization.md   | Feature     | `compact` strategy added; other strategies byte-identical                     |
| change/1.5.2/evaluate-store-splitting.md         | Refactor    | evaluation confirmed the single store; no migration                           |
| change/1.5.2/expand-e2e-coverage.md              | Chore       | smoke suite grew from six flows to seventeen                                  |
| change/1.5.2/stabilize-e2e-file-flows.md         | Fix         | id selectors and staged-state waits; flake note rewritten                     |
| change/1.5.2/stereo-output.md                    | Feature     | song `stereo` node and `setChannelPans`; mono stays bit-identical             |
| change/1.5.2/undo-redo-history.md                | Feature     | `editHistory.ts` snapshots at the `useDataManagement` boundary                |
| change/1.5.2/wasm-audio-core.md                  | Feature     | evaluation declined migration; measured fractions of each budget              |
| refactoring/1.5.2/REFACTORING.md + ASSESSMENT.md | Refactoring | implemented as proposed; exports proven byte-identical                        |

## Repository Analysis

The window's work sits uncommitted in the working tree - one intake commit
(`b0e682e`) carries the record batch and early plans, and `git status`
holds the implementation change set. Confirmation is therefore by
artifact verification against the tree rather than commit matching.

- **Confirmed** - all fourteen records and the refactoring pair. Spot
  evidence: `sequencerWorklet.ts` exists and `sequencer.ts` is deleted;
  `SUPPORTED_SONG_CHIPS` and `setChip` land in `constants/song.ts` and the
  `SoundEngine` contract; `exports/midi.ts` and `exports/mod.ts` are new;
  `AYUMI_OUTPUT_GAIN` reads 1.2 with the soft-knee limiter in
  `workers/ayumiWorklet.ts`; `songStereo.ts`, `editHistory.ts`, and the
  three extraction hooks exist and are wired from `App.tsx`; `compact`
  dispatches in `exports/asm.ts`; the e2e spec holds seventeen tests
  across two projects.
- **Unconfirmed** - none.
- **Undocumented** - none. Every `git status` entry attributes to a
  record, the refactoring pair, or this window's lessons file.
- **Deviations** - four records were amended in place on verification:
  Ayumi gain shipped as `1.2` plus a limiter rather than a linear `1.2`
  (the recorded headroom arithmetic was wrong); chip variants resolved
  to the DAC amplitude curve only (the described timing differences do
  not exist in the engines); stereo corrected its dual-chip example from
  PokeyMax to TurboSound; the WASM record's hot-path premises were
  corrected before the evaluation declined migration. Separately, the
  export-formats record narrowed its scope - MOD and MIDI shipped while
  IT is deferred per the record's own evaluation - and the
  assembly-optimization record left a latent delay-count overflow in
  `optimized` byte-identical by decision, deferred to
  `change/1.5.3/chunk-optimized-delay-runs.md`.

## Findings

| Severity | Finding                                                                   | Evidence                                 | Action                                       |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------- |
| Low      | `optimized` asm emits a delay count above the single-byte maximum on runs | `src/exports/asm.ts` `combineDelayLines` | fix filed at                                 |
|          | beyond 256 frames - kept byte-identical inside the window                 | call site (`Infinity` bound)             | `change/1.5.3/chunk-optimized-delay-runs.md` |

## Verification Evidence

- `npm test` - 130 files, 1171 tests, all passing (run for this review).
- `npm run test:e2e` - 34 of 34 flows passing across the chromium and
  webkit projects, including the `pretest:e2e` production build.
- `refactoring/1.5.2/ASSESSMENT.md` - recorded full loop clean:
  typecheck, lint, format, build, and the suite.
- All fourteen `plan/1.5.2/*-specification-audit.md` documents return
  zero findings to planning.

## Unable to Verify

- Perceived loudness parity between the Ayumi and internal engines is a
  perceptual acceptance - the record assigns the final check to the
  owner's listening pass.
- Replay equivalence of the `compact` assembly stream is proven by
  per-frame register-state tests only - real-hardware replay stays
  outstanding per the record's open risk.
- Screen-reader support is verified at the attribute level - no
  assistive-technology session has been run, per the accessibility
  record's open risk.

## Decision

- **Decision:** go
- **Decided by:** the project owner - the named window request is the
  recorded bump authorization
- **Conditions:** none
- **Accepted risks:** the `optimized` delay-overflow fix lands next
  window; Ayumi parity awaits the owner's listening check; `compact`
  replay equivalence and screen-reader behaviour lack hardware and AT
  confirmation
