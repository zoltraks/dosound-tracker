# Match settings category buttons to command-button metrics

**Type:** Fix

## Summary

| Field         | Value                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Intent        | Give the settings modal's category buttons the same height and label top padding as the main view's command buttons |
| Key decisions | Align the category button padding to the command-button padding rather than introducing shared metrics variables    |
| Open risks    | None - a single padding declaration changes                                                                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The settings modal's left category rail uses `.settings-category-button`,
which pads its labels `4px` vertically. The command buttons in the main view
and the settings action row share `.command-button` with `3.5px` vertical
padding, so the category buttons render one pixel taller with their labels
sitting lower. The category buttons must share the command-button box
metrics: the same computed height and the same label top padding.

## Use Cases

- When the settings modal is open, each category button's height and label offset match a command button's.

## Hints

`.settings-category-button` in `src/App.css` declares `padding: 4px 8px`;
`.command-button` declares `padding: 3.5px 8px`. The action-row buttons in
`SettingsModal.tsx` already carry `command-button` and measure identically.

## Out of Scope

- Sharing the padding through a custom property or shared class.
- Restyling the category buttons' colors, borders, or typography.
