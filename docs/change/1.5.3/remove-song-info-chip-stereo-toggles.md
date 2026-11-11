# Remove the Chip and Stereo Toggles from the Song Panel

**Type:** Fix

## Summary

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Intent        | Remove the `Chip` and `Stereo` toggles the 1.5.2 window added to the |
|               | Song information panel - the block returns to its pre-window shape   |
| Key decisions | Chip variants and stereo routing stay file-declared: `chip` and      |
|               | `stereo` nodes in song YAML keep loading, resolving, and applying on |
|               | both engines - only the editing controls and their dead code go      |
| Open risks    | none                                                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The 1.5.2 window placed two toggle buttons in the Song information grid:
`Chip` cycling `YM2149`/`AY8910` and `Stereo` cycling `MONO`/`ABC`/`ACB`.
The owner does not want chip-type or stereo selection exposed in the
interface yet - the Song block returns to its previous fields (Title,
Author, Year, Speed, Length, Loop, plus the Rate and Clock toggles). The
same pass drops the trailing colon from the field labels - `Title`, not
`Title:` - matching the panel's plain-label style.

As with the EQ pan removal, this is a surface revert: the `chip` and
`stereo` fields stay in the song model and file format, songs loaded with
either keep their value and the engines keep applying it (DAC curve for
the chip, pan routing for stereo). What goes away is the two button
fields, their handlers in `InformationPanel`, the now-unused
`resolveStereoLayoutId` helper, the `.stereo-toggle-button` styles, the
two e2e specs, and the UI claims in `PROJECT.md`, `MANUAL.md`, and the
pending changelog entry.

## Use Cases

- When the Song information panel renders, it shows exactly the fields it
  carried before the 1.5.2 window.
- When a song file declares `chip` or `stereo`, loading, playback, and
  chip-aware exports honour them unchanged.

## Hints

- `STEREO_LAYOUT_ORDER` stays in `src/constants/song.ts` as part of the
  documented stereo vocabulary; its comment records that the cycle order
  returns with the planned control.
- `useChannelPans` still feeds `useAudioSetup` - only the
  InformationPanel edits are removed.

## Out of Scope

- The `chip` and `stereo` format fields, engine wiring, and export bytes.
- The Rate and Clock toggles, which predate the removed controls.
