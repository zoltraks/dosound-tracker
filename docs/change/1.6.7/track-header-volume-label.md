# Show the bare volume value centered over the track volume column

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Remove the `VOL` prefix from each track panel header and center the bare volume value over the per-row volume column so the readout sits where the volume data actually is                  |
| Key decisions | Header keeps showing the effective volume at the current line; only the label text and its horizontal placement change; screen readers keep a "Volume" context via a visually-hidden prefix |
| Open risks    | `none` — geometry verified by live measurement across themes, track counts, and text scaling                                                                                                |

## Description

Each track panel header currently renders `VOL <hex>` right-aligned at the panel's right edge, far from the volume column it describes. The volume column itself is a 14px-wide `.volume-data` cell that sits immediately after the `.note-text` cell (minimum 10ch wide plus an 8px gap) near the left of every track row.

The header must instead show only the current volume value — the same effective-volume nibble already computed for the cursor line, formatted as a bare uppercase hex digit (for example `F`) — with no `VOL` prefix. The value must be horizontally centered over the volume column so it reads as the column's header.

The value continues to update as the cursor line changes, exactly as it does today; only its text content and horizontal position change. Assistive technology keeps the "Volume" context through a visually-hidden prefix, so the accessible name remains meaningful while the visible label is the bare value.

## Use Cases

- When a track panel renders, its header shows the effective volume digit (for example `F`) centered over the volume column, with no `VOL` text.
- When the cursor moves to a different line with a different volume, the header value updates to that line's effective volume and stays centered over the column.
- When the layout shows three tracks, six tracks, any theme, or a larger text scale, the header value remains centered over the volume column.

## Hints

- The header and the rows share the same left origin inside `.track-panel`, so the column position is derivable from the row geometry: `.track-line` padding 2px, `.note-data` padding-left 1rem, `.note-text` min-width 10ch, `gap` 8px, `.volume-data` width 14px.
- `.note-text` is `min-width: 10ch` but can grow if a note/instrument display string is abnormally long; a row whose note cell exceeds 10ch already shifts its own volume cell, and the header can only track the nominal column. This is pre-existing row behavior, not a new defect.
- The value's font stays `--fs-sm` inside the 14px box; centering mirrors `.volume-data`'s own box model (14px wide, 1px left padding, centered content) so the glyph lands on the same center as the row cells.
- `--app-zoom` uses the CSS `zoom` property, so `ch` and `px` lengths scale together and the alignment survives text scaling.
- CSS geometry is not observable from jsdom tests; the change requires live bounding-box measurement per `docs/TOOLING.md`.

## Out of Scope

- Volume calculation semantics, the effective-volume helper, and what value is shown.
- Audio engines, playback, song format, settings, and save files.
- The playlist header and any other panel headers.
- Pinning `.note-text` to a fixed width (rejected: would change row rendering for long note strings).
- Version bump and commit creation.
