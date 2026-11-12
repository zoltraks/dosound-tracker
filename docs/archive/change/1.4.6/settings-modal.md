# Settings Modal

**Type:** Feature

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Settings dialog opened from a header gear button, modelled on pet-lab's settings modal |
| Key decisions | GENERAL and EDITOR categories - draft commits on OK - footer OK, RESET, SAVE, LOAD     |
| Open risks    | Draft persistence adds a second settings copy that must stay consistent                |

## Description

Add a settings modal to the application, modelled on the settings dialog in the pet-lab project (`pet-lab/src/modals/common/SettingsModal.tsx`). The dialog groups application preferences into named categories, shows the active category's settings in a property pane, and carries a footer action bar.

**Trigger**

A gear button in the header, placed directly after the light and dark theme toggle. The button uses the `⚙` emoji glyph and the same icon-button treatment as the theme toggle. It stays out of the section navigation order, like the theme toggle and the logo.

**Layout**

The modal follows the pet-lab three-region layout adapted to the application's modal conventions.

- A left sidebar lists the categories as uppercase buttons. The active category is highlighted.
- A right pane shows the active category's settings as label and control rows, scrolled vertically when needed.
- A footer action bar holds the action buttons.

**Categories and settings**

- GENERAL
  - Theme: dark or light. Mirrors the header theme toggle.
  - Track background: per-track row backgrounds on or off.
  - Startup test tone: plays or skips the startup tone.
- EDITOR
  - Restore editor cursor: restore the persisted editor cursor on reload.
  - Restore open view: restore the persisted view snapshot on reload.
  - Default paste mode: the default paste-track mode offered by the paste dialog.

**Commit model**

The modal edits a draft copy of the settings. OK commits the draft to the application and closes. Cancel and ESC discard the draft and close. ENTER confirms like OK. RESET replaces the draft with the default values behind a confirmation. SAVE writes the current draft to a `settings.yaml` file. LOAD reads a `settings.yaml` file into the draft. Both SAVE and LOAD still leave the draft uncommitted until OK.

**Stateful restore**

The application restores its state on page reload. This is a stateful rule that applies to every view, and the settings modal follows it. When the page reloads with the modal open, the modal re-opens in exactly the same state: the open flag, the active category, and the uncommitted draft contents. The rule is to be recorded explicitly in the project documentation as an application-wide convention, not left implicit.

**Persistence**

Committed settings keep the existing per-key `dosound-tracker-*` storage where keys already exist (theme, track background, paste mode). New options get their own keys with defaults preserving current behaviour: startup tone on, cursor restore on, view restore on. The full RESET clears the new keys with the rest of the application storage.

## Use Cases

- The user clicks the gear button, switches the theme inside GENERAL, and presses OK. The theme applies and the modal closes.
- The user opens EDITOR, disables cursor restore, and reloads without pressing OK. The modal re-opens on EDITOR with the option still disabled in the draft, uncommitted.
- The user presses ESC inside the modal. The draft discards and the modal closes.
- The user presses SAVE, then edits settings, then presses OK. The file holds the draft as it was at SAVE time.

## Hints

- pet-lab keeps `settings` and `activeCategory` in a persisted Zustand store and does not restore the open flag. This project restores the open modal through the existing `UI_STATE` view snapshot and additionally restores the active category and the draft.
- pet-lab applies settings live. The draft commit model chosen here matches `MidiModal` instead.
- The modal belongs in the standard modal pipeline: open flag in `useModalState`, render through `ModalManager`, ESC and ENTER through `useModalManager`, navigation suspension through `useNavigationSuspension`, restore through `useStartupRestore`.

## Out of Scope

- EXPORT and ADVANCED categories. Candidate settings for them stay in their existing surfaces.
- A colors category like pet-lab's. The application's palette is fixed CSS variables.
- MIDI settings. The existing MIDI modal keeps its own surface.
- A mobile hamburger category menu. The two-column layout simply narrows.
