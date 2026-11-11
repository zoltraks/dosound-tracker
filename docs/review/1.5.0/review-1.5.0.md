# Version 1.5.0 Review

## Document Information

|             |                                                                           |
| ----------- | ------------------------------------------------------------------------- |
| Version     | 1.5.0 (window closing into 1.5.1)                                         |
| Review Date | 2026-11-10                                                                |
| Commands    | git status, npm run typecheck, lint, format, build, test, headless probes |

## Scope

The single active change record under `docs/change/1.5.0/` - completing
the settings modal's stateful restore with the focused control, the pane
scroll offset, and the reset-confirmation view - plus the window's own
refactoring assessment.

## Recorded Work

| Document                                         | Kind        | Result                                                                          |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------- |
| change/1.5.0/restore-settings-session-state.md   | Fix         | `settingsView` gains `focus`/`paneScroll`/`confirmingReset`; restore verified   |
| refactoring/1.5.0/REFACTORING.md + ASSESSMENT.md | Refactoring | Mirror effect replaced by per-setter patches inside the record; assessment pass |

## Repository Analysis

The window's work is uncommitted by rule - reconciliation is against the
working tree.

- **Confirmed** - the record and the refactoring pair are present in the
  tree.
- **Unconfirmed** - none.
- **Undocumented** - none.
- **Deviations** - none.

## Findings

| Severity | Finding | Evidence | Action |
| -------- | ------- | -------- | ------ |
| `none`   |         |          |        |

## Verification Evidence

- Full verification loop clean: typecheck, lint, format, build, 110 files /
  859 tests (3 new `uiState` cases covering snapshot defaults, merge
  patching, and null-session patching; the SettingsModal reset test
  updated for the controlled prop).
- Headless production probes on `vite preview`:
  - Reload with the SOUND selector focused re-opens the modal with
    `document.activeElement.id === 'settings-sound-engine'`, inside the
    `aria-modal` dialog.
  - Reload with the reset confirmation showing re-opens the confirm view.
  - ESC on the confirm cancels it (pane returns), ENTER confirms the
    reset - the draft resets to defaults and the modal stays open, the
    previously observed Enter-commits-the-draft defect is gone.
  - A fresh open leaves DOM focus on the dialog itself, not a background
    element.
- Pane scroll: the member records and restores through the same session
  path; with current content the pane does not overflow at any probed
  viewport, so scroll restore is verified at the mechanism level.

## Unable to Verify

Nothing blocked; the pane-scroll replay is dormant under current content
sizes (noted above, verified by member round-trip rather than overflow).

## Decision

The go or no-go record for the version bump.

- **Decision:** go
- **Decided by:** the project owner - the named window request is the recorded bump authorization
- **Conditions:** none
- **Accepted risks:** none
