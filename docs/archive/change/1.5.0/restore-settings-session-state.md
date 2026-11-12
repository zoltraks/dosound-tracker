# Restore Settings Session State

**Type:** Fix

## Summary

| Field         | Value                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Intent        | Complete the settings modal's stateful restore: focused element, pane scroll, and reset-confirm    |
| Key decisions | `settingsView` gains `focus`, `paneScroll`, `confirmingReset`; `confirmingReset` lifts to the hook |
| Open risks    | none                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The settings modal's stateful rule requires the modal to re-open in
"exactly the same state" after a reload. Today `settingsView` records
only the active category and the uncommitted draft. Three pieces of view
state are lost:

- **Focused element** - nothing records which control inside the modal
  held focus. After a reload the DOM focus lands on a background element
  (the octave section) outside the `aria-modal` dialog.
- **Pane scroll** - the `.settings-pane` scroll offset is not persisted;
  the markdown modals already persist `markdownScroll`, settings does not.
- **Reset confirmation** - `confirmingReset` is component-internal
  `useState`, invisible to the view snapshot and to `useModalManager`.
  Beyond the restore gap, this is the component-internal-state violation
  the Modal Working State rule warns about: pressing ENTER while the
  reset confirmation is showing commits the draft through
  `handleConfirmSettings` instead of confirming the reset.

The session snapshot records the focused control's element id and the
pane scroll offset alongside the existing category and draft, and the
reset-confirmation state lifts from the component into
`useSettingsDialog` so it participates in the session and in the global
key handling. On restore, the recorded element regains DOM focus inside
the dialog; when no element was recorded, the dialog itself takes focus
so `aria-modal` holds.

With the reset confirmation visible in the hook, ENTER while it is shown
confirms the reset and ESCAPE cancels the confirmation (returning to the
settings pane) instead of committing or closing the modal.

## Use Cases

- When the user reloads with the SOUND engine selector focused, the modal
  re-opens on SOUND with the selector focused.
- When the user scrolls the settings pane and reloads, the pane restores
  at the same scroll offset.
- When the user reloads with the reset confirmation showing, the modal
  re-opens showing the reset confirmation.
- When the user presses ENTER on the reset confirmation, the draft resets;
  ESCAPE returns to the settings pane without closing the modal.
- When the modal opens fresh (no recorded focus), the dialog itself holds
  DOM focus, not a background element.

## Hints

- `SettingsSession` in `src/types/settings.ts` is the snapshot shape;
  `loadUiState` in `src/utils/storage/uiState.ts` normalizes it - older
  snapshots without the new members must still load (default `focus:
null`, `paneScroll: 0`, `confirmingReset: false`).
- `useSettingsDialog` owns the seed and mirror already; the new members
  ride the same session. Focus and scroll write through a merge helper
  (e.g. `patchSettingsView`) so scroll events do not churn React state.
- Every focusable control inside the modal needs a stable `id` - the
  setting controls already carry `settings-*` ids; category and action
  buttons need them.
- `DialogFrame` needs `tabIndex={-1}` and a ref handle so the dialog can
  take programmatic focus; keep the change opt-in so other modals are
  untouched.
- `useModalManager` routes ENTER/ESCAPE to `handleConfirmSettings` /
  `handleCancelSettings` - gate them on `confirmingReset` in `App.tsx` to
  fix the confirm-state key routing.
- Scroll writes throttle like `markdownScroll` (150 ms debounce).

## Out of Scope

- Focus or scroll restore for other modals - the requirement names the
  settings modal.
- Persisting the file-load input or OS-level file picker state.
