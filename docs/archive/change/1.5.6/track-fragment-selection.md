# Add Track Fragment Selection and Clipboard Operations

**Type:** Feature

## Summary

| Field         | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Intent        | Select a row range inside a track and copy, cut, and paste fragments through the clipboard   |
| Key decisions | Single selection per session, cut semantics on Ctrl+X, silent paste with opt-in confirmation |
| Open risks    | none                                                                                         |

## Description

A track gains a keyboard-driven row selection. While a track section is the active section, SHIFT+UP and SHIFT+DOWN extend the selection range and move the cursor with it - the selection anchors at the row where extending began and grows toward the moving edge. The selection spans whole rows, covering the note, instrument, and volume cells.

The selection is session state. It survives cursor moves, playlist position changes, and page reloads - persisted to local storage like the editor cursor and clamped to the current pattern on restore. It is bound to the track where it was created; a single selection exists at a time, and a new selection on another track replaces it.

While a track section is active:

- CTRL+C copies the selected fragment to the system clipboard in the existing `step:` YAML format shared with COPY TRACK. With no selection it copies the whole track, identical to COPY TRACK.
- CTRL+X cuts the selected fragment: it copies the range to the clipboard, clears the selected notes and volume values, and drops the selection.
- CTRL+V pastes the clipboard fragment starting at the cursor row, clipped at the pattern length. The paste applies the stored paste-track mode silently - a new settings toggle enables the paste-mode confirmation modal for fragment pastes over existing data.

Copy, cut, and paste go through `updateSong`, so they record in the edit history like every other composition edit.

## Use Cases

- The user presses SHIFT+DOWN from row 4 three times - rows 4 through 7 are selected and the cursor sits on row 7.
- The user presses CTRL+C with a selection - only the selected range lands on the clipboard.
- The user presses CTRL+C without a selection - the whole track copies, matching COPY TRACK.
- The user presses CTRL+X with a selection - the fragment copies, the covered rows empty, and the selection clears.
- The user presses CTRL+V - the clipboard fragment writes at the cursor row; with the confirmation setting enabled and existing data underneath, the paste-mode modal asks first.
- The user reloads the page - the selection reappears on its track, clamped to the restored pattern.

## Hints

- `generateClipboardData` in `src/utils/track/trackClipboard.ts` needs a row-range parameter; `applyClipboardToLines` needs a start offset so fragments anchor at the cursor row instead of row 0.
- `KEYBOARD_SHORTCUTS` in `src/constants/navigation.ts` gains `CTRL+C`, `CTRL+X`, and `CTRL+V` routed to track clipboard actions; SHIFT+ARROWUP and SHIFT+ARROWDOWN are handled inside the track panel's key handling.
- The selection state shape is `{ trackId, start, end }` - persisted under a new `StorageKeys` member and restored clamped like `EDITOR_CURSOR`.
- The confirmation toggle joins the settings draft and commit machinery as a new EDITOR option and a new `StorageKeys` member - the `settings.yaml` `editor` section gains the field, so `FORMAT.md` updates in the same change set.
- Selected rows render with a dedicated highlight style in `src/App.css`.

## Out of Scope

- Multi-track or cross-pattern selection - the range stays inside one track's current pattern.
- Column-fragment selection - a selected row covers all of its cells.
- Changes to the clipboard `step:` YAML format itself.
- A visible selection control or command-button - interaction is keyboard-only.
