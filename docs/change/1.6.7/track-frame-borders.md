# Give unselected track panels per-channel frame borders

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Tint each unselected track panel's frame border to match its channel when track backgrounds are on                                                    |
| Key decisions | The border is a per-channel color derived from the channel tint, gated by the track background option and suppressed on the active and hovered panels |
| Open risks    | The exact hues are a design choice and may be adjusted after visual review                                                                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Track panels already tint their background per channel when the track
background option is enabled, but every unselected panel shares the same
neutral frame border. The frame should carry the channel's identity: each
unselected track panel gets a border color that suits its own tint, the way
the current neutral border already reads as blueish against track C's indigo
tint.

The per-channel border applies only while the track background option is on
and only to panels that are not the active section. The active panel keeps
its accent border, the hovered panel keeps its hover border, and panels
without the track background option keep the neutral border in every theme.

Every channel A through F receives a border color in every theme - dark,
light, and contrast - each value chosen as a lighter or deeper variant of
that channel's tint so the frame reads as part of the same color family.

## Use Cases

- When the user enables the track background option, each unselected track panel shows a frame border matching its channel tint.
- When the user activates a track panel, it keeps the accent border while the remaining panels keep their per-channel borders.
- When the user hovers an unselected panel, the hover border still applies until the pointer leaves.
- When the user disables the track background option, all panels return to the neutral border.
- When the user switches theme, every channel's frame border switches to that theme's value.

## Hints

The panel already emits a per-channel class for every channel A through F
and a shared `track-colored` class while the option is on, so the change
stays inside the stylesheet's theme blocks and panel rules.

## Out of Scope

- Recoloring the active panel's accent border or the hover border.
- Tinting playlist channel headers or track lines, which have their own styles.
- Changing the panel background tints introduced with the channel colors.
