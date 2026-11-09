# Version 1.3.9 Review

**Status:** Complete

**Verdict:** Ready

## Document Information

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| Version     | 1.3.9                                                                         |
| Review Date | 2026-11-09                                                                    |
| Commands    | `git status`, `git log`, `git diff`, `npm audit`, `npm run build`, `npm test` |

## Verdict

The 1.3.9 window is ready for the version bump: all five change records are fulfilled, the refactoring pair is closed, the verification loop is clean at 76 files / 555 tests, and the only unresolved item is a documented dependency advisory residual.

## Scope

This review covers the five active change records under `docs/change/1.3.9/` and the refactoring pair under `docs/refactoring/1.3.9/`. Deferred discoveries live in `docs/change/1.4.0/`; two requests were abandoned into `docs/discard/`.

## Recorded Work

| Document                                                   | Kind        | Status | Result                                                        |
| ---------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------- |
| `docs/change/1.3.9/close-modal-keyboard-dead-paths.md`     | Fix         | Done   | Modal Escape/Enter contract restored on both dead paths       |
| `docs/change/1.3.9/make-reset-durable-delete.md`           | Fix         | Done   | Mirror clear awaited before reload; scoped local storage wipe |
| `docs/change/1.3.9/reconcile-license-whitelist.md`         | Chore       | Done   | `Python-2.0` reviewed and added to the permitted set          |
| `docs/change/1.3.9/clear-minimatch-advisory-chain.md`      | Chore       | Done   | No compatible path; residual documented with reach analysis   |
| `docs/change/1.3.9/consolidate-preview-envelope-engine.md` | Refactor    | Done   | Five copies collapsed onto `usePreviewEnvelope`               |
| `docs/refactoring/1.3.9/`                                  | Refactoring | Done   | 6 findings, all 6 steps landed, ASSESSMENT written            |

## Repository Analysis

- **Confirmed** - every record's plan exists under `docs/plan/1.3.9/` beside its specification audit, and each lands in the working tree as recorded.
- **Unconfirmed** - none.
- **Undocumented** - none; every changed `src/` file traces to a record or the refactoring proposal.
- **Deviations** - (a) `PreviewEnvelopeOptions.ym2149` accepts a getter because `react-hooks/refs` forbids render-time ref reads; (b) `handleHardStopLivePreview` keeps its clamped register write alongside the engine's per-voice write to preserve an existing test contract; (c) `optionsRef` mirrors via `useEffect` rather than render-body assignment; (d) MIDI auto-stop still sends no noteOff - deferred to `docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`; (e) two change requests abandoned (`docs/discard/1.4.1/enforce-ai-assisted-commit-convention.md`, `docs/discard/1.4.0/resolve-missing-1.3.6-review.md`) with reasons recorded.

## Findings

| Severity | Finding                                          | Evidence                                              | Action                                     |
| -------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------ |
| Minor    | 12 moderate `minimatch` advisories remain        | `npm audit`; `docs/decision/2026-11-09-*.md`          | Accepted residual; re-verify at next audit |
| Minor    | `csstype` license field absent from the lockfile | `package-lock.json` vs installed `package.json` (MIT) | None - metadata gap, inside permitted set  |

## Verification Evidence

- Baseline loop clean before the first code change (typecheck, lint, format, build, 544 tests).
- Per-record targeted loops after each change iteration.
- Final loop: lint 0 errors/0 warnings, `npm run build` green, `npm test` 76 files / 555 tests.
- License diff: zero uncovered production-chain licenses after the whitelist extension.
- `npm audit`: 12 moderate advisories, all dev-only `minimatch` - residual accepted in `docs/decision/2026-11-09-minimatch-advisory-residual.md`.

## Unable to Verify

- Manual audio playback on the five migrated preview surfaces - the recorded human gate; the shared engine is unit-tested and the surfaces keep their per-call-site options.

## Decision

- **Decision:** go
- **Decided by:** the project owner (via the named window request)
- **Conditions:** none
- **Accepted risks:** the documented `minimatch` advisory residual and the deferred MIDI auto-stop noteOff
