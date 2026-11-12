# Version 1.5.7 Review

## Document Information

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| Version     | 1.5.7                                                                         |
| Review Date | 2026-11-12                                                                    |
| Commands    | `git log --oneline`, `git status --short`, `git diff`, verification loop runs |

## Scope

This review covers the six change records under `docs/change/1.5.7/`, the
refactoring pair under `docs/refactoring/1.5.7/`, and the ad-hoc change set
delivered during the session. The window ran mixed: every record was proposed,
accepted, and implemented inside Immediate mode, then committed by the owner
in `9489638` together with the ad-hoc content work; the refactoring phase
landed after the commit and awaits the owner's close commit.

## Recorded Work

| Document                                               | Kind        | Status | Result                                                                                         |
| ------------------------------------------------------ | ----------- | ------ | ---------------------------------------------------------------------------------------------- |
| docs/change/1.5.7/clone-track                          | Change      | Done   | Whole-track clipboard-free clone, single history entry - committed in `9489638`                |
| docs/change/1.5.7/copy-track-whole                     | Change      | Done   | COPY TRACK button always copies the whole track; CTRL+C stays selection-aware - in `9489638`   |
| docs/change/1.5.7/paste-tail-preserve                  | Change      | Done   | CTRL+V fragment paste preserves trailing rows; PASTE TRACK keeps tail-clearing - in `9489638`  |
| docs/change/1.5.7/playlist-song-line-navigation        | Change      | Done   | SHIFT+PAGEUP/PAGEDOWN navigate song lines from any focused section - in `9489638`              |
| docs/change/1.5.7/export-modal-strategy-marker-removal | Change      | Done   | `*` markers, caption, and `exportStrategy.ts` helper removed - in `9489638`                    |
| docs/change/1.5.7/export-summary-line-height           | Change      | Done   | `export-summary-modal` class plumbs to `DialogFrame`; `1.2rem` body height - in `9489638`      |
| docs/refactoring/1.5.7                                 | Refactoring | Done   | Complete - clipboard and pattern guards consolidated, step literals extracted, branches merged |

## Repository Analysis

Read the version-control log for the version period and reconcile it
against the recorded work above.

- **Confirmed** - `9489638` delivers all six change records with their plans,
  specification and manual updates, and test coverage.
- **Unconfirmed** - none against recorded work; the refactoring output and the
  formatter's YAML normalisation sit uncommitted in the tree and await the
  owner's close commit, which this review does not perform.
- **Undocumented** - the ad-hoc session requests delivered without change
  records: the Overload demo song copied into `public/repository/song/` and
  listed in `LIST.txt`, its eight instruments extracted through the app's own
  exporter into the instrument repository, the `Nice_Song` and `Arp_Loop`
  demo-song renames, and the Immediate-mode memorisation in `WORKFLOW.md`.
  All are committed in `9489638`; the repository content is verified served
  over the dev server.
- **Deviations** - `playlist-song-line-navigation` iterated twice: the record
  first scoped the chord to the playlist, a request broadened it to any
  focused section, and the final rebind moved it from Ctrl to Shift when the
  browser reserved Ctrl+PageUp/PageDown for tab switching - the record was
  amended in place. `clone-track` started selection-aware mirroring the old
  COPY TRACK semantics, then corrected to whole-track when the owner reported
  a stale selection hijacking the source - the record was amended in place.

## Findings

| Severity | Finding                                                               | Evidence                                | Action                                               |
| -------- | --------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Minor    | Five ad-hoc requests carry no change records                          | `9489638` stat, session log             | None - ad-hoc mode, reconciled in this review        |
| Minor    | Two records deviated mid-window before landing                        | Change records, `useTrackOperations.ts` | None - final semantics recorded in the specification |
| Info     | `Ctrl+PageUp/PageDown` is browser-reserved and never reaches the page | Owner report, matcher tests             | Lesson routed in the Improvement phase               |

Severity classes follow the repository's refactoring rules document where
one exists.

## Verification Evidence

- Post-implementation loops after each change and after refactoring:
  typecheck, lint, format, build, test all clean; final suite 1331 tests
  across 142 files.
- New regression coverage this window: CLONE TRACK whole-track semantics and
  single undo entry, COPY TRACK whole-track versus CTRL+C fragment, CTRL+V
  tail preservation, SHIFT+PAGEUP/PAGEDOWN dispatch while the playlist is
  active, the TrackPanel modified-key skip, the removed export markers, and
  the summary-modal className forwarding.
- Refactoring acceptance: the three clipboard guards and four missing-pattern
  guards consolidated, nine pattern-length fallbacks, two step-copy and three
  empty-step literals extracted, the page-key branches merged - all under an
  unchanged 1331-test suite.
- Export correctness evidence: the three Overload DATA streams (tight,
  complex, and the version 1.2.8 optimised export) expand to identical
  3,456-frame audible states - zero audible differences, confirmed by the
  stream comparison kept under `work/`.

## Unable to Verify

- Real-browser clipboard behaviour - paste paths are exercised against a
  stubbed `navigator.clipboard`; the system-clipboard read itself is untested
  outside the browser.
- SHIFT+PAGEUP/PAGEDOWN in a live browser - the chord avoids the
  browser-reserved Ctrl variant by design and the dispatch path is pinned by
  tests, but a manual in-browser press was not exercised in this run.
- Audible playback behaviour - no audio-path code changed, so manual audio
  verification was judged not required.

## Decision

- **Decision:** pending - referred to the project owner at the bump gate
- **Decided by:** the project owner
- **Conditions:** none recorded
- **Accepted risks:** none recorded
