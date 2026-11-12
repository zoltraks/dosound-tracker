# Theme the number-spinner up/down buttons

**Type:** Fix

## Summary

| Field         | Value                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Intent        | NumberSpinner arrow buttons render with theme colors in both day and night mode |
| Key decisions | Use the `--button-*` palette convention, matching `.octave-button`              |
| Open risks    | `none`                                                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The up/down arrow buttons rendered by `NumberSpinner` next to the Year, Speed,
Length, and Loop fields in the Song information panel carry no themed colors.
The `.number-spinner-button` rule in `src/App.css` sets geometry only, so the
buttons fall back to the browser's native button face. Safari keeps that native
face light regardless of theme, which makes the buttons look correct in day
mode but wrong in night mode.

The buttons must use the theme-aware button palette so they read as dark
controls in night mode and remain visually consistent with the current day-mode
appearance. Hover and focus-visible states follow the same themed convention.

The same component is used inside `TransposeModal` and `InstrumentMidiModal`.
One shared class fix themes every instance.

## Use Cases

- When the app runs in night mode (default), the spinner arrow buttons render
  with dark background, border, and glyph colors.
- When the app runs in day mode, the spinner arrow buttons keep a light
  appearance consistent with sibling controls.
- When the user hovers or keyboard-focuses a spinner button, the state
  indication uses theme variables, not browser defaults.

## Hints

- `.octave-button` is the reference convention: `--button-bg`,
  `--button-border`, `--button-text`, `--button-hover`.
- `.toggle-value-button` in the same panel uses `--bg-tertiary` and
  `--border-color` instead. The `--button-*` family is chosen because it is the
  dedicated button palette and preserves the day-mode appearance most closely.

## Out of Scope

- The `.number-spinner-input` text field styling.
- Any other button or control.
- Behavior changes: increments, clamping, and keyboard handling stay identical.
