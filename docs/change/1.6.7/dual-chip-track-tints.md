# Tint second-chip track panels

**Type:** Feature

## Summary

| Field         | Value                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Intent        | Give tracks D, E, F the same panel tinting tracks A, B, C already have, with hues distinct per chip |
| Key decisions | Second-chip channels use a dedicated amber/violet/teal hue triad in every theme                     |
| Open risks    | The exact hues are a design choice and may be adjusted after visual review                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The tracker renders up to six track panels - A through F - when the dual-chip
sound setting is enabled. The track background option tints each panel with a
per-channel color, but only channels A, B, and C have assigned colors. Channels
D, E, and F render without any tint in the six-track layout and in the sliding
three-track window that reaches them.

Every channel A through F must receive a panel tint when the track background
option is enabled. The second-chip channels use a hue family distinct from the
first-chip channels so the two chips read apart at a glance. Each theme - dark,
light, and contrast - carries its own values for all six channels, matching the
existing per-theme treatment of channels A through C.

The tint behavior is unchanged in every other respect: the option still gates
the tint, the active and selection states keep their existing styling, and
single-chip sessions keep showing only channels A through C.

## Use Cases

- When the user enables dual chip and the six-track layout, tracks D, E, and F show tinted panels like A, B, and C.
- When the user slides the three-track window onto D, E, F, the visible panels keep their per-channel tints.
- When the user switches theme, all six tints switch to that theme's values.
- When the user disables the track background option, no panel shows a tint on either chip.

## Hints

Track panels already emit a per-channel class for every channel A through F.
The tint is a CSS custom property per channel consumed by a per-channel
pseudo-element gradient, so the change stays inside the stylesheet's theme
blocks and panel rules.

## Out of Scope

- Recoloring channels A, B, C or any other palette entry.
- Tinting the playlist channel headers, which share a generic header style.
- Per-line instrument tints, which already color individual track lines.
