# Version 1.5.6 Review

## Document Information

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| Version     | 1.5.6                                                                         |
| Review Date | 2026-11-12                                                                    |
| Commands    | `git log --oneline`, `git status --short`, `git diff`, verification loop runs |

## Scope

This review covers the four change records under `docs/change/1.5.6/`, the
refactoring pair under `docs/refactoring/1.5.6/`, and the ad-hoc change set
delivered in the working tree during the session. The window ran mixed:
`fix-alt-digit-macos`, `documentation-intake-tiers`, and
`track-fragment-selection` landed through ordinary iteration and are committed;
`undo-redo` was implemented from its approved plan and then extended through
ad-hoc requests, all of which sit uncommitted awaiting the owner's commit.

## Recorded Work

| Document                                     | Kind        | Status | Result                                                                                            |
| -------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------- |
| docs/change/1.5.6/fix-alt-digit-macos        | Change      | Done   | `event.code` digit read under Alt at `useKeyboardNavigation.ts` - committed in `4704d57`          |
| docs/change/1.5.6/documentation-intake-tiers | Change      | Done   | Tiered read mandate, `docs/TOOLING.md` extraction, drift repairs - committed in `62c2f96`         |
| docs/change/1.5.6/track-fragment-selection   | Change      | Done   | Row selection, fragment clipboard, paste confirmation - committed in `62c2f96`                    |
| docs/change/1.5.6/undo-redo                  | Change      | Done   | Bounded persisted history, third-row buttons, position recall - delivered uncommitted in the tree |
| docs/refactoring/1.5.6                       | Refactoring | Done   | Complete - playback clamps and guards consolidated, Enter toggles merged, button props extracted  |

## Repository Analysis

Read the version-control log for the version period and reconcile it
against the recorded work above.

- **Confirmed** - `62c2f96` delivers `track-fragment-selection` and
  `documentation-intake-tiers`; `4704d57` carries `fix-alt-digit-macos`.
- **Unconfirmed** - none against recorded work; `undo-redo` and the ad-hoc
  set are delivered in the working tree and await the owner's commit, which
  this review does not perform.
- **Undocumented** - the ad-hoc session requests delivered without change
  records: ADD LINE inserts after the current line, DELETE LINE selects the
  previous line, Enter bindings switch playback modes seamlessly, playlist
  Enter chords fire outside editing, PlaylistLine double-commit fix, Ctrl+PgUp/PgDn
  song-line navigation, instrument selection surviving reload, playlist focus
  preservation after line commands, Enter bindings working on disabled tracks,
  PASTE TRACK first-row semantics, undo restoring the track cursor after
  pattern edits, and instrument clicks preserving the active track. All are
  covered by tests and documented in `SPECIFICATION.md`, `PROJECT.md`, and
  `MANUAL.md` in the same change set.
- **Deviations** - `undo-redo` declared cursor/session state out of scope at
  intake; an owner request extended snapshots with the editor position, and the
  record was amended in place. PASTE TRACK's anchor semantics iterated twice -
  first cursor-anchored to match CTRL+V, then rebound to the first track row
  with the cursor left on top; the spec records the final split between CTRL+V
  and PASTE TRACK. The Enter-mode work initially cleared the saved return
  position during line-to-song switches; a session test pinned ownership so the
  first binding keeps it.

## Findings

| Severity | Finding                                                  | Evidence                  | Action                                           |
| -------- | -------------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| Minor    | Twelve ad-hoc behavior changes carry no change records   | Working tree, session log | None - ad-hoc mode, reconciled in this review    |
| Minor    | `PASTE TRACK` semantics changed twice inside one session | `useTrackOperations.ts`   | None - final split recorded in the specification |

Severity classes follow the repository's refactoring rules document where
one exists.

## Verification Evidence

- Post-implementation loops after each ad-hoc change and after refactoring: typecheck, lint, format, build, test all clean; final suite 1319 tests across 143 files.
- New regression coverage this window: history position recall, persisted history storage, playlist refocusing, disabled-track Enter bindings, empty-line early return, instrument restore on reload, command-button focus swallowing, instrument-click section preservation, Ctrl+PgUp/PgDn navigation, paste cursor targets.
- Refactoring acceptance: all `usePlaybackHandlers` clamp literals and guard copies removed, Enter toggles merged behind shared cores, the four line buttons spreading `keepSectionButtonProps` - all under an unchanged 1319-test suite.

## Unable to Verify

- Audible playback behavior - the mode-switch and disabled-track work routes through the same sequencer calls the earlier Enter window landed; no audio-path code changed, so manual audio verification was judged not required.
- Real-browser clipboard behavior - paste paths are exercised against a stubbed `navigator.clipboard`; the system-clipboard read itself is untested outside the browser.

## Decision

- **Decision:** pending - referred to the project owner at the bump gate
- **Decided by:** the project owner
- **Conditions:** none recorded
- **Accepted risks:** none recorded
