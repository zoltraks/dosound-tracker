# Contrast the sustain dot against the envelope background

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The Volume envelope's sustain dot switches to a theme-aware idle color when the bar under it does not reach the dot, keeping the marker visible                      |
| Key decisions | The dot keeps its black while it overlaps the filled bar; the idle color is a per-theme variable - light gray on dark, dark gray on light, high-contrast on contrast |
| Open risks    | none                                                                                                                                                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Volume panel renders the instrument's sustain point - the note-off marker -
as a small dot vertically centered in the envelope graph. The dot is hard-coded
black. While the bar at the sustain index reaches the dot's height, the marker
reads clearly against the colored bar; on low values the black dot sits directly
on the section background and is nearly invisible in the dark theme.

- The dot keeps its current black while the bar at the sustain index reaches the dot's position - a bar height of 50% of the graph or more.
- When the bar falls below that line, the dot renders in an idle color that contrasts with the panel background.
- The idle color is defined per theme: light gray in the dark theme, dark gray in the light theme, and a high-contrast value in the contrast theme.

## Use Cases

- An instrument with sustain at step 8 and a volume of 3 shows the marker clearly on the dark theme's background.
- The same instrument at a volume of 12 keeps the black dot on the filled bar.
- A composer on the light theme sees a dark marker against the light background, not a light gray one.

## Hints

- `src/components/EnvelopePanel.tsx` renders `.envelope-sustain-dot` beside the bars; `getBarHeight` (`getEnvelopeBarHeight` for the volume type) supplies the comparison value.
- `src/App.css` holds `.envelope-sustain-dot` near the `.envelope-bar` rules and defines the `--envelope-*` variables inside the three theme blocks (`:root`, `.app.light`, `.app.contrast`).

## Out of Scope

- Other envelope types - the sustain marker exists only on the Volume panel.
- Changes to the dot's size, position, or the sustain-bar inset shadow.
