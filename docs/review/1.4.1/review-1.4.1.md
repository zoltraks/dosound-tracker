# Version 1.4.1 Review

**Status:** Complete

**Verdict:** Ready

## Document Information

| Field       | Value                                                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version     | 1.4.1                                                                                                                                                            |
| Review Date | 2026-11-09                                                                                                                                                       |
| Commands    | `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:e2e`, `npx electron-builder --dir`, `scripts/release-check.sh` |

## Verdict

Ready. All four active records in the window are implemented and verified, the refactoring cycle is proposed, executed, and assessed, and the tree is clean and production-ready against the full verification loop. The bump decision itself belongs to the project owner.

## Scope

The 1.4.1 window carried four records: three audit-derived chores (`remove-dead-dependency-fixtures`, `align-tests-documented-rules`, `align-copyright-attribution`) and one fix (`expand-bare-volume-clipboard-nodes`). Ordering followed the recorded dependency hint: the pruning landed before the record that introduces a fixture.

## Recorded Work

| Document                                             | Kind                   | Status | Result                                                                                         |
| ---------------------------------------------------- | ---------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `change/1.4.1/remove-dead-dependency-fixtures.md`    | change record          | done   | dependency uninstalled, 8 fixtures pruned                                                      |
| `change/1.4.1/align-tests-documented-rules.md`       | change record          | done   | spy, fixture, and key centralized                                                              |
| `change/1.4.1/align-copyright-attribution.md`        | change record          | done   | `build.copyright` mirrors `LICENSE`                                                            |
| `change/1.4.1/expand-bare-volume-clipboard-nodes.md` | change record          | done   | bare `{volume}` expands to a wait row                                                          |
| `plan/1.4.1/*-implementation.md` (4 files)           | implementation plan    | done   | all plans satisfied                                                                            |
| `plan/1.4.1/*-specification-audit.md` (4 files)      | specification audit    | done   | all verdicts Ready for Implementation                                                          |
| `refactoring/1.4.1/REFACTORING.md`                   | refactoring proposal   | done   | 3 items proposed                                                                               |
| `refactoring/1.4.1/ASSESSMENT.md`                    | refactoring assessment | done   | all items completed, no deviations                                                             |
| commit `fdf9862`                                     | committed work         | landed | MIDI debug-flag cache, `usePlaybackBridge` extraction, this window's clipboard record authored |

## Repository Analysis

**Confirmed**

- `package.json` and `package-lock.json`: `@testing-library/jest-dom` removed; `build.copyright` reads `Copyright (c) 2025 Zoltar X / New Generation`, byte-identical to `LICENSE:3` and verified inside a real packaged `Info.plist` (`release/mac-arm64`).
- `test/fixtures/` holds only the two referenced fixtures plus the `bundled-song.yaml` this window added.
- `useLocalStorageState.test.tsx` spies the `localStorage` object; `useDataManagement.test.ts` reads inside `test/`; `StorageKeys.MIDI_CONFIGURATION` is the single source of the MIDI key.
- `runLength.ts` expands a bare `{volume}` node through `makeWait`; `FORMAT.md` records the rule in both loader blocks.
- Refactoring: ~35 lines of stale comments removed, shared YAML quoter reused, MIDI clamps extracted to `midiUtils.ts`, and 16 characterization tests added.

**Unconfirmed**

- none

**Undocumented**

- Commit `fdf9862` landed improvement-mode work (debug-flag cache, playback bridge hook) without a change record - recorded session improvements under the `improvement` working mode; the clipboard record it authored was then implemented inside this window.

**Deviations**

- `branchGaps.test.ts` carried a third instance of the `Storage.prototype` violation the audit finding did not name; folded into `align-tests-documented-rules` as an in-kind repair and strengthened to prove the warn path runs.
- `COPYRIGHTS.md` gained one line recording the `build.copyright`-mirrors-`LICENSE` convention - documentation-first work that prevents recurrence.
- `songIO.ts` writes untrimmed `title`/`author` while guarding on the trimmed value - a behaviour question deferred to `change/1.4.2/trim-song-metadata-on-save.md`, not silently fixed.
- The `trackClipboard.ts`/`songIO.ts` compression duplication stays: two sites fail the Rule of Three; recorded as a gap in `refactoring/1.4.1/ASSESSMENT.md`.

## Findings

| Severity | Finding                                                                        | Evidence                                   | Action                                                                     |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------- |
| Minor    | `songIO.ts` untrimmed metadata write                                           | `songIO.ts` lines ~261-269                 | deferred: `change/1.4.2/trim-song-metadata-on-save.md`                     |
| Minor    | implementation-plan template cites `ts-react-development.md` and `src/stores/` | `template/implementation-plan-template.md` | stale paths; authored plans used the real ones - template refresh deferred |
| Info     | run-length compression duplication at two sites                                | `trackClipboard.ts`, `songIO.ts`           | deferred by Rule of Three                                                  |

## Verification Evidence

- Pre-change baseline: full loop clean (typecheck, lint, format, build, 604 tests).
- Per-record loops after each change: all green.
- Post-refactoring full loop: `tsc -b` clean, eslint zero warnings, prettier applied, `vite build` clean, `vitest` 78 files / 620 tests passing.
- `npx electron-builder --dir` produced the unsigned `release/mac-arm64` bundle; `Info.plist` carries the aligned copyright string.
- Runnable artifact: `npm run test:e2e` executes during window close against the freshly rebuilt `dist/`.

## Decision

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Decision       | Ready - the window's work is delivered and verified; proceed to the closing bump |
| Decided by     | project owner (the named window request authorizes the closing bump)             |
| Conditions     | none                                                                             |
| Accepted risks | `npm audit` residual advisories documented at bump time per `VERSIONING.md`      |
