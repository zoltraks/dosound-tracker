# Version 1.5.5 Review

## Document Information

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| Version     | 1.5.5                                                                         |
| Review Date | 2026-11-11                                                                    |
| Commands    | `git log --oneline`, `git status --short`, `git diff`, verification loop runs |

## Scope

This review covers the seven change records under `docs/change/1.5.5/` and the
refactoring pair under `docs/refactoring/1.5.5/`. Records relocated out of this
window - `upgrade-typescript-7` to 1.5.8 and the two stereo records to 1.6.0 -
are excluded. The window ran in human-in-the-loop mode: every implementation
plan passed an explicit gate before code changed.

## Recorded Work

| Document                                        | Kind        | Status | Result                                                                          |
| ----------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------- |
| docs/change/1.5.5/alt-modifier-bindings         | Change      | Done   | Alt+1/2/3/5/6/8 + Alt+Enter bindings, Ctrl+digit envelope entry, section guards |
| docs/change/1.5.5/section-state-backgrounds     | Change      | Done   | Active darker, hover lighter, combined state on all eight rules, three themes   |
| docs/change/1.5.5/envelope-sustain-dot-contrast | Change      | Done   | `idle` dot class below 50% bar height, per-theme idle color                     |
| docs/change/1.5.5/manual-refresh                | Change      | Done   | Manual covers shortcuts, settings, stereo, Warmball; reconciled to Alt          |
| docs/change/1.5.5/section-focus-shortcuts       | Change      | Done   | Verified landed; Ctrl+digits deliberately superseded by the Alt rebind          |
| docs/change/1.5.5/enter-playback-bindings       | Change      | Done   | Verified landed - bindings, toggle-stop, position restore in tree               |
| docs/change/1.5.5/warmball-instrument-export    | Change      | Done   | Verified landed - seven instruments plus `LIST.txt`                             |
| docs/refactoring/1.5.5                          | Refactoring | Done   | Complete - `isModifierChord` extracted, EnvelopePanel hex entry merged          |

## Repository Analysis

Read the version-control log for the version period and reconcile it
against the recorded work above.

- **Confirmed** - `ee74817` delivers the Warmball set, the section-focus
  bindings, the Enter playback family with position restore, and the first
  manual refresh. `6be5dfd` lands the change records, the second manual
  refresh, the window moves, and supporting lessons.
- **Unconfirmed** - none against recorded work; the implementation for the
  three implemented records is delivered in the working tree and awaits the
  owner's commit, which this review does not perform.
- **Undocumented** - `6be5dfd` also carries `docs/TESTING.md`,
  `docs/WORKFLOW.md`, `docs/lesson/lessons-2026-11-11-shortcuts-and-playback.md`,
  and two `docs/standard/` amendments without a record - owner-side rule
  updates, not window work. A one-line `padding-right` on
  `.track-panel.active .track-line.current .volume-data` sits uncommitted
  with no record - an owner tweak outside the window's records.
- **Deviations** - `section-focus-shortcuts` bound Ctrl+1/2/3; the window
  deliberately rebinds track focus to Alt under `alt-modifier-bindings`, so
  the earlier record's digit bindings are superseded rather than current.
  `manual-refresh` documented the Ctrl bindings at intake and was reconciled
  to the Alt wording after the rebind. The modifier guard makes Ctrl+Arrow
  cursor movement inert inside envelope panels - inside the record's
  bare-keys rule, recorded here for visibility. The `alt-modifier-bindings`
  plan specified an early return on modifier chords in the octave `keyup`
  handler; the implementation gates octave keyup on `preview.hasState()`
  instead, so a keyup arriving while a preview sounds still releases the
  note rather than stranding it.

## Findings

| Severity | Finding                                                               | Evidence                         | Action                              |
| -------- | --------------------------------------------------------------------- | -------------------------------- | ----------------------------------- |
| Minor    | Ctrl+Arrow cursor movement inside envelope panels is now inert        | `EnvelopePanel.tsx` early return | None - inside the bare-keys rule    |
| Minor    | Owner-side rule edits and a CSS padding tweak carry no change records | `6be5dfd` stat, working tree     | None - outside the window's records |

Severity classes follow the repository's refactoring rules document where
one exists.

## Verification Evidence

- Baseline loop before any change: typecheck, lint, format, build, 1213 tests - clean.
- Post-implementation loops after each record and after refactoring: the same five steps clean; final suite 1235 tests across 136 files.
- Headless computed-style probe on the dev server (`work/section-bg-probe.cjs`): dark theme shows normal 38.3, hover 44.8, active 28.7, combined 40.8 luminance - all four semantics asserted; the command-panel combined gradient verified distinct.
- New regression coverage: matcher re-pin, navigation hook Alt bindings and Cmd rejection, EnvelopePanel modifier discipline and Ctrl+digit entry, PlaylistPanel chord guard and Alt+Enter commit, PianoKeyboard chord guard, HeaderPanel propagation, ToneNoisePanel chord guard, `isModifierChord` truth table.

## Unable to Verify

- Audible playback behavior - the window touched key handling and styling only, and the Enter family was already landed; no timing or synthesis code changed, so manual audio verification was judged not required.
- Light and contrast theme rendered output - the same inversion is defined per theme and the dark theme was probe-verified; the other two themes rest on the shared variable formulas and were not rendered.

## Decision

- **Decision:** go
- **Decided by:** the project owner, 2026-11-11, in answer to the bump gate
- **Conditions:** none
- **Accepted risks:** none
