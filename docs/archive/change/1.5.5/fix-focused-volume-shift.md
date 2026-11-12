# Fix Focused Volume Value Shifting Right

**Type:** Fix

## Summary

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Intent        | Keep the volume nibble on the focused track row at the same position as other rows |
| Key decisions | Move the compensation padding to the right side of the fixed-width volume cell     |
| Open risks    | none                                                                               |

## Description

When a track panel is the active section, its current row gains a one-pixel border while its negative left margin is removed, so all row content shifts one pixel to the right. The note cell compensates exactly - its left-aligned text loses one pixel of left padding. The volume cell removed only its left padding, but the glyph is centered inside a fixed-width box, so removing left padding recovers only half a pixel. The focused volume nibble rendered shifted right of its position on unfocused rows.

The volume nibble must render at the same horizontal position on the focused row as on every other row.

This record was written after the change landed, under the ad-hoc-implementation work mode - it describes the applied state, not a proposal.

## Use Cases

- When the user focuses a track row in the note or volume column, the volume nibble stays aligned with the nibbles on unfocused rows.
- When the track panel is not the active section, row rendering is unchanged.

## Hints

- The active row's content shift comes from the border and margin change on `.track-line.current` inside `.track-panel.active` - each cell compensates inside its own box.
- Centered content compensates half of a one-sided padding change - the padding must move to the opposite side to keep the glyph anchored.
