# Polish interface persistence, playlist editing, and control density

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Restore the user's DOM focus across reloads, make playlist cell editing robust and visually stable, tighten control density, and lazy-load the MIDI modal to hold the entry bundle under budget.                                                  |
| Key decisions | Focus restore shares the editor-cursor setting gate and retries until the persisted view settles; the playlist edit input mirrors the cell's typography and box so editing never shifts the row; density reductions are symmetric padding halves. |
| Open risks    | None - CSS-only density changes plus one persistence hook and one lazy import; all paths unit- or build-covered.                                                                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

**Focused-element persistence.** Reloading the app restored the editor
cursor and panel focus but not the actual DOM element that held focus, so
keyboard input could land on the wrong control after reload. A new
`useFocusedElementPersistence` hook captures the focused element on page
hide (serialized as a scoped ref), restores it once the persisted view -
cursor section and any reopened modal - has settled, and shares the
restore-cursor setting gate. If the stored element no longer resolves, the
section panel focus from the cursor restore remains as fallback. The
editor cursor restore gate is shared so both mechanisms agree on when
restore is allowed.

**Playlist cell editing.** Two defects made cell editing unreliable or
visually unstable:

- `editingPattern` used the empty string for both "no edit open" and
  "editing an empty cell", so pressing Enter on a `--` playlist position
  never mounted the input. The state is now `string | null`: `null` means
  no edit, `''` means a live edit containing an empty value. Escape and
  'N' cancel with `null`; the playback-position clamp and Ctrl+Arrow line
  moves yield only when genuinely not editing.
- `.pattern-input` referenced undefined `--input-*` variables and did not
  inherit typography, so the editor rendered in the browser default font
  and metrics. It now uses `font: inherit`/`color: inherit`, the cell's
  padding and no border, `min-width: 0` so the input's intrinsic size
  cannot widen the flex row and shift sibling columns, and
  `var(--active-bg)` for the theme-aware fill. The global `*:focus`
  outline remains the single frame.

**Control density.** Command buttons drop from `4px` to `3.5px` vertical
padding (1px shorter, labels stay centered). The settings modal gets a
stable `height: min(80vh, 26rem)` with a flex body so toggling options no
longer resizes the dialog.

**Bundle budget.** The MIDI modal joins the picker, export, and
paste-track modals as a `React.lazy` boundary so it leaves the entry
chunk; the entry bundle stays under the 600 kB budget.

## Use Cases

- When the user reloads while a playlist cell, track panel, or modal
  control has focus, focus returns to that element after the persisted
  view settles.
- When the user presses Enter on an empty `--` playlist cell, an empty
  pattern-id editor opens in place; typing a hex id and confirming
  assigns it.
- When the user edits a playlist cell, the row's columns do not move and
  the editor matches the cell's font, size, and frame in both themes.
- When the user toggles settings options, the modal keeps its height.

## Hints

- Focus serialization lives in `src/utils/cursor/focusedElement.ts`;
  restore retries briefly (`RESTORE_RETRY_MS`/`RESTORE_MAX_ATTEMPTS`) to
  wait for lazily mounted content.
- Keep `*:focus:not(:focus-visible)` semantics in mind: mouse clicks
  should not leave focus rings on buttons.

## Out of Scope

- No changes to what the settings modal contains or how options persist.
- No new keyboard shortcuts or focus-order changes beyond restore.
- No bundle splits beyond the MIDI modal lazy boundary.
