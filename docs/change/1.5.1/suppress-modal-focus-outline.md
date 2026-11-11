# Suppress Modal Focus Outline

**Type:** Fix

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Remove the browser focus ring the modal dialog shows since it became programmatically |
|               | focusable for session restore                                                         |
| Key decisions | `outline: none` on `.modal-dialog:focus`, matching the existing focused-chrome style  |
| Open risks    | none                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The `restore-settings-session-state` change made `.modal-dialog`
focusable (`tabIndex={-1}`) so the dialog itself holds DOM focus when no
control was recorded. The browser now draws its default focus ring around
the whole dialog - a frame that reads as a visual artifact rather than a
focus affordance, since the dialog is a container, not an interactive
control.

The project already suppresses focus outlines on focused chrome -
`.command-btn:focus`, `.track-panel:focus`, `.envelope-panel:focus`,
`.information-input:focus` all set `outline: none`. The modal dialog gets
the same treatment; focusable controls inside it keep their own
indicators.

## Use Cases

- When the settings modal opens or restores with dialog-level focus, no
  frame is drawn around it.
- Focus indicators on controls inside dialogs (buttons, selects,
  checkboxes) are unchanged.

## Hints

- One rule beside `.modal-dialog` in `src/App.css` covers every dialog
  that shares the frame.

## Out of Scope

- Focus styling for inner controls.
