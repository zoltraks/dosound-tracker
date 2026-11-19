# Theme the settings selection lists

**Type:** Fix

## Summary

| Field         | Value                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Intent        | Render the settings modal's selection lists with the active theme instead of the native light appearance    |
| Key decisions | Style the select boxes and their option lists through the theme custom properties so all three themes apply |
| Open risks    | Native dropdown chrome differs per platform; the option list styling covers Chromium and Firefox            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The settings modal's selection lists - theme, text size, visible tracks,
paste track mode, and sound engine - are bare `select` elements with no
stylesheet rules. In the dark theme they render with the platform's light
appearance: a white box, black text, and a light option list, which clashes
with the surrounding dark UI. The same gap affects any other unstyled
`select` in the application.

Selection lists must follow the active theme. The closed select box takes
the theme's surface, border, text, and monospace font treatments, and the
opened option list takes the theme's background and text colors so the
dropdown reads as part of the application in dark, light, and contrast
themes alike.

## Use Cases

- When the user opens the theme selector in the dark theme, the closed box and the opened option list are dark.
- When the user switches to the light or contrast theme, the selection lists follow that theme's colors.
- When the user opens any other select in the application, its option list is themed the same way.

## Hints

The settings selects live in `src/modals/settings/SettingsModal.tsx` inside
`.settings-pane`; the MIDI device select already carries `.midi-select`.
Theme colors are custom properties on `.app`, so plain element selectors
on `select` and `option` pick up every theme without per-theme rules.

## Out of Scope

- Restyling checkboxes, radio buttons, or other native form controls.
- Replacing the native select widget with a custom dropdown component.
