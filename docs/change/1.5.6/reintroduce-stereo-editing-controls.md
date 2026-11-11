# Reintroduce stereo editing controls

**Type:** Feature

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Return the song-file `stereo` and `chip` fields to editable UI surface   |
| Key decisions | Lands in the stereo window - pairs with `dual-chip-stereo-configuration` |
| Open risks    | The earlier removal established the panel shape the user wants restored  |
|               | from - re-adding controls must keep that shape                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The 1.5.3 window removed the EQ-panel pan buttons and the Song-panel
Chip and Stereo toggles as not-yet-supported UI surface - the underlying
file fields, engine routing, and export support stayed intact. When the
stereo work resumes, this record returns editing surface for them:

- Song-panel controls for the `stereo` layout (MONO/ABC/ACB or pan
  positions) and the `chip` variant, matching the panel shape the user
  restored in 1.5.3.
- Per-channel pan editing surface if the stereo feature calls for it -
  the earlier EQ button design was rejected, so a new control shape
  needs user sign-off before implementation.

Orders with `dual-chip-stereo-configuration` in the same window - run
this record after the stereo groundwork it needs and before the
dual-chip expansion builds on top.

## Verification

- The panel shape stays the one the user confirmed.
- File-declared `stereo`/`chip` remain valid inputs on load.
- `npm run test:e2e` passes on Chromium and WebKit.
