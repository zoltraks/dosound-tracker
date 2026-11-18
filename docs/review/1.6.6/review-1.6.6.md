# Version 1.6.6 Review

## Document Information

|             |                                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version     | 1.6.6                                                                                                                                                                                                                  |
| Review Date | 2026-11-18                                                                                                                                                                                                             |
| Commands    | `git log`, `git status --short`, `git show --stat`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `scripts/release-check.sh`, `npm run retention`, headless geometry measurement |

## Scope

This review covers the open 1.6.6 window: five change records and one
refactoring pair accumulated after the 1.6.6 bump closed the previous
window. The window delivers the completed dual-chip interface, interface
usability polish, an About-dialog viewport readout, Dump chip-switcher
styling, and a playlist/track column-geometry fix. It leaves out the
`docs/change|plan/1.7.0/` group (adaptive piano octave span, dual-chip
stereo configuration, stereo editing controls, standard-library drift),
which is next-window work per the late-record rule.

## Recorded Work

| Document                                                  | Kind        | Status | Result                                                                           |
| --------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------- |
| `docs/change/1.6.6/dual-chip-ui-completion.md`            | Change      | Done   | Six-track gate, sliding window, and playlist channel navigation implemented      |
| `docs/change/1.6.6/interface-usability-polish.md`         | Change      | Done   | Focus persistence, playlist editing, density, and MIDI lazy-load implemented     |
| `docs/change/1.6.6/about-view-size-readout.md`            | Change      | Done   | `View: WxH @ zoom` readout live in the About dialog                              |
| `docs/change/1.6.6/dump-chip-switcher-active-colors.md`   | Change      | Done   | Selected chip button uses the command-button hover palette                       |
| `docs/change/1.6.6/playlist-line-border-shift.md`         | Change      | Done   | Column geometry frozen across selection states; commit pending at review time    |
| `docs/plan/1.6.6/*-implementation.md`                     | Plan        | Done   | Five plans present; Refinements sections record landed divergences               |
| `docs/refactoring/1.6.6/REFACTORING.md` + `ASSESSMENT.md` | Refactoring | Done   | Pass - modal pass-through split into ten domain groups, `ModalContainer` removed |

## Repository Analysis

- **Confirmed - dual-chip UI completion**: commits `7a9a959` and `ccc3077`
  gate six-track view on `sound.dualChip` alone, replace the fixed
  A-C/D-F switcher with a focus-following sliding window, and add playlist
  channel navigation; retroactive records and plans filed in `f3f495b`.
- **Confirmed - usability polish**: `ccc3077` adds
  `useFocusedElementPersistence` with the shared restore gate, fixes
  playlist cell editing, stabilizes settings-modal height, and lazy-loads
  the MIDI modal; `f3f495b` reduces command-button padding to 3.5px.
- **Confirmed - About readout**: `2bb7993` adds `useViewportSize`, the
  `View:` line, and zoom suffix; `d902f06` threads the text-scale factor
  and compacts formatting.
- **Confirmed - Dump chip colors**: `2bb7993` restyles
  `.chip-switcher-button.active` with the theme-aware command-button
  hover palette.
- **Confirmed - modal narrowing**: `2bb7993` lands the ten
  `src/components/modal/*Group.tsx` components, the grouped
  `UseAppModalsParams`, the `ModalManager` composer, and removes
  `ModalContainer`; the assessment records the group-composition
  refinement.
- **Unconfirmed - playlist geometry**: `playlist-line-border-shift` is
  implemented and verified (live headless measurement at 1590x914 shows
  identical geometry across selection states) but its `src/App.css` delta
  and records are uncommitted at review time - the user's manual commit
  is pending.
- **Undocumented**: none. Every src-touching commit in the window period
  maps to a record; the uncommitted delta is covered by the playlist
  record; the standard-library sync changes belong to the 1.7.0 record
  group and are correctly filed there.
- **Deviated**: the modal narrowing landed with a refined group
  composition versus its proposal (`InstrumentTypeWarningModal` inside
  `ConfirmationModalGroup`, `DownloadModal` inside `FileModalGroup`) -
  recorded in the refactoring assessment, not silent. The dual-chip UI
  records were filed retroactively after implementation (`f3f495b`) -
  recorded variance.

## Deviations and Residuals

- **Playlist geometry commit pending** - the fix is verified but
  uncommitted; the window cannot close with a dirty `src/` tree.
- **Standard-library sync ran ahead of its window** - the 1.7.0 record's
  documentation changes are uncommitted and will land with the user's
  next commit set; the record itself is correctly grouped under 1.7.0.
- **Specification audits absent** - the adopted `specification-audit`
  extension expects a `<change>-specification-audit.md` beside each plan;
  none exist for this window's five plans, matching recent windows. The
  extension's practiced status needs an owner decision (reinstate or
  record as dormant).
- **Entry chunk** - the modal narrowing preserved all four lazy
  boundaries; the build holds at 588.18 kB, under the 600 kB budget.

## Findings

| Severity | Finding                                                     | Evidence                                              | Action                                     |
| -------- | ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| Minor    | Playlist geometry delta uncommitted                         | `git status` shows `src/App.css` + record/plan/lesson | Owner commits the changeset                |
| Minor    | `specification-audit` extension adopted but unaudited plans | `docs/plan/1.6.6/` holds no audit artifacts           | Owner decides: reinstate or record dormant |
| Info     | Session-review rules landed in `TESTING.md`/`TOOLING.md`    | uncommitted doc delta                                 | Rides the owner's commit set               |

## Verification Evidence

- `npm run typecheck`, `npm run lint`, `npm run format`: clean.
- `npm run build`: pass, entry chunk 588.18 kB.
- `npm test`: 192 files / 1774 tests pass.
- `npm run test:e2e`: 30/30 on chromium and webkit (run during the About
  readout change).
- Headless geometry measurement (Playwright, 1590x914, six-track localStorage
  seed): panel widths, positions, and ancestor scroll widths identical
  across track-active and playlist-active states after the fix.
- `scripts/release-check.sh`: gate clear; the review warning resolves with
  this file.
- `npm run retention`: dry-run reports no moves.

## Unable to Verify

- `npm audit` was not rerun for this review; dependency state is unchanged
  since the last window's clean audit.
- Physical-device playback of dual-chip audio was not re-tested in this
  window; coverage is unit, integration, and e2e level per TESTING.md.

## Decision

**Pending owner decision.** All five records' acceptance surfaces are
implemented and verified; the only blocking residual is the uncommitted
playlist changeset. Recommendation: commit the pending changesets, then
bump per `VERSIONING.md` - a patch bump to 1.6.7, or fold the window into
the planned 1.7.0 group if the owner prefers the minor boundary given the
existing `docs/change|plan/1.7.0/` records.

- **Decision:** pending
- **Decided by:** the project owner
- **Conditions:** playlist changeset committed; tree clean
- **Accepted risks:** none recorded
