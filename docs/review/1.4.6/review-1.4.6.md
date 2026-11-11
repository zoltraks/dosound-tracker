# Version 1.4.6 Review

## Document Information

|             |                                                                                     |
| ----------- | ----------------------------------------------------------------------------------- |
| Version     | 1.4.6 (window closing into 1.4.7)                                                   |
| Review Date | 2026-11-10                                                                          |
| Commands    | git status, npm run typecheck, lint, format, build, test, test:e2e, headless probes |

## Scope

All six active change records under `docs/change/1.4.6/` - the Ayumi sound
engine, the js output layout, the settings modal, the number-spinner theming
fix, the session-review rules landing, and the obvious-comments sweep - plus
the window's own refactoring cycle. Four records had landed before this run;
the run implemented the remaining two (Ayumi engine, comment sweep) and ran
the refactoring, review, improvement, and close stages.

## Recorded Work

| Document                                         | Kind        | Result                                                                          |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------- |
| change/1.4.6/ayumi-sound-engine.md               | Feature     | `SoundEngine` contract, vendored `ayumiCore` in an AudioWorklet, persisted id   |
| change/1.4.6/js-output-layout.md                 | Chore       | `dist/js`/`css`/`media` layout, `worker.js` rename - verified in tree and build |
| change/1.4.6/settings-modal.md                   | Feature     | Settings modal with draft commit model - verified landed (F-17, modal, storage) |
| change/1.4.6/number-spinner-theme.md             | Fix         | `--button-*` palette on spinner buttons - verified in `App.css`                 |
| change/1.4.6/session-review-rules.md             | Chore       | Intake standby, generated-doc Prettier gate, review gate modes - in WORKFLOW.md |
| change/1.4.6/remove-obvious-comments.md          | Refactor    | ~200 narration comments deleted across 45 files + `scripts/clean.sh`            |
| refactoring/1.4.6/REFACTORING.md + ASSESSMENT.md | Refactoring | Dead-code tidy in `PlaylistLine`/`MidiModal`; assessment pass                   |

## Repository Analysis

The window's work is uncommitted by rule - reconciliation is against the
working tree and the prior commits that wrote the window's records.

- **Confirmed** - all six records: four verified as already landed in the
  tree (js-output-layout, settings-modal, number-spinner-theme,
  session-review-rules), two implemented in this run (ayumi-sound-engine,
  remove-obvious-comments).
- **Unconfirmed** - none.
- **Undocumented** - the `.then(() => {})` collapse in
  `useAudioContextResume.ts` (comment-sweep artifact, absorbed by the
  refactoring assessment) and the duplicated-line fix in `DEPLOYMENT.md`
  (improvement-mode repair).
- **Deviations** - the plan's `?worker&url` worklet route was first wired
  through a dynamic `import()`, which rolldown emitted as a dangling chunk
  reference; the recorded primary route (static `?worker&url` import) emits
  `dist/js/ayumiWorklet.js` correctly and is what shipped. No fallback was
  needed. One keep-criteria marker was restored in `songParser.ts` where the
  deleted comment marked a deliberately empty fallback (`no-empty` gate).

## Findings

| Severity | Finding                                                                    | Evidence                   | Action                      |
| -------- | -------------------------------------------------------------------------- | -------------------------- | --------------------------- |
| Low      | `YM2149` initial `YMState` diverges from `deriveYmState` on zero registers | `src/synth/YM2149.ts` ctor | Deferred to a change record |

## Verification Evidence

- Baseline loop before changes: typecheck, lint, format, build, 824 tests clean.
- Post-change loop: typecheck, lint, format, build clean; 108 files, 842 tests pass.
- `npm run test:e2e`: 11/12 pass; the webkit song-file save/load case is
  timing-flaky under parallel workers and passed on isolated rerun.
- Headless Ayumi probe (Playwright, work scratch): engine selection, worklet
  load, register mirror, `getState`, invalid-id fallback, and real PCM
  rendered through an `AnalyserNode` - all checks passed.
- `dist/js/ayumiWorklet.js` emitted as a self-contained ES bundle; CSP
  `worker-src 'self'` satisfied by the same-origin file.

## Unable to Verify

Subjective listening checks (timbre comparison between engines) are not
producible headlessly; the worklet's rendered-PCM proof and the register
mirror stand in. Electron packaging was not exercised - the `electron/` tree
is untouched, so the substitution rule applies.

## Decision

The go or no-go record for the version bump.

- **Decision:** go
- **Decided by:** the project owner - the named window request is the recorded bump authorization
- **Conditions:** none
- **Accepted risks:** subjective audio comparison deferred to the owner's manual listening check
