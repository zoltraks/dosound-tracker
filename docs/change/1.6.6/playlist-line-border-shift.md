# Stop playlist and track geometry shifting on selection changes

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Column and panel widths must stay constant whether the playlist section, a track section, playback position, or cursor line is active.              |
| Key decisions | Reserve state-dependent space at rest (`.playlist-line` side borders, `.track-line.current` margin) and let state rules recolor only, never resize. |
| Open risks    | None - CSS-only change; resting geometry stays pixel-identical through padding and margin compensation.                                             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`.playlist-line` declares only top and bottom borders at rest. The
`.current`, `.playback-position`, and `.playback-position.current` rules
apply `border: 1px solid <color>`, which adds one pixel of left and right
border that the layout never reserved. Under `box-sizing: border-box` the
content box shrinks by two pixels, and the `flex: 1` `.track-pattern`
cells share the loss - roughly a third of a pixel per column at six
tracks, which rounds into visible one-pixel jumps on the right-hand
columns.

The shift toggles with section focus: selecting a track channel moves
`activeSection` off the playlist, dropping the `.current` class and
restoring the borders' space; returning to the playlist header re-adds
them. The `.playlist-line.playback-position.current` rule carries a
`padding-left: 0px` declaration that compensates the added left border for
that one state combination only - a partial fix for the same defect.

The fix reserves the side borders permanently as transparent and lets the
state rules recolor them, so geometry is identical in every state. The
horizontal padding is adjusted by the reserved pixels so the resting
content box - and therefore every column's position and width - matches
the current resting layout exactly.

A second instance of the same defect class lives in the track panels.
`.track-line.current` reserves its border at rest (`1px solid
transparent`) but also carries `margin-left: -1px`, and
`.track-panel.active .track-line.current` overrides that to `margin-left:
0`. Activating a track section therefore moves the cursor line's box one
pixel right. The negative margin also lowers the line's min-content
contribution, so removing it raises `.left-column`'s automatic minimum
size by one pixel; the column is a `flex` item without `min-width: 0`, so
it claims the extra pixel and every `.track-panel` (`flex: 1`) grows by
roughly a sixth of a pixel - the visible one-pixel drift on the
right-hand tracks. A companion rule,
`.track-panel.active .track-line.current .note-text`, drops
`padding-left` from `4px` to `3px` to compensate the moved box, which
keeps the glyph position roughly stable but leaves the line's
background and border misaligned with the text grid by one pixel.

Live measurement at 1590x914 in the six-track layout confirms the chain:
`.main-content` scrollWidth grows 1611 to 1612, `.left-column` 725 to
726, `.tracks-row` 688 to 689, and each panel 113 to 113.17 while the
right column stays fixed.

The fix keeps `margin-left: -1px` in both states - the active rule drops
its `margin-left: 0` override - and removes the `.note-text`
`padding-left` compensation so the cursor line's box, its text, and the
column geometry are identical whether its panel is active or not. Only
`background-color` and `border-color` change on activation, exactly like
the playlist fix.

## Use Cases

- When the user clicks a playlist channel button and then the Playlist
  header, the track columns keep identical widths in both states.
- When playback advances the playback-position line, that line's cells
  stay aligned with the header row and sibling lines.
- When a track section is activated from the playlist, the track panels
  and the cursor line inside the active panel keep identical geometry.

## Hints

- `.track-line.current` reserves its border but not its margin: the
  active-panel override flips `margin-left` and a `.note-text`
  `padding-left` compensation papers over the moved text. Both must go.
- `.track-pattern.current-track` uses `box-shadow` for the same
  reserve-space reason.
- The header row cells never carry borders, so they are the stable
  reference the line cells must match.

## Out of Scope

- Any change to which line is current, the playback position marker, or
  the playlist's data model.
- Visual redesign of the current-line or playback-position frames.
