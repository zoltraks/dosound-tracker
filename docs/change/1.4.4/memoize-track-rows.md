# Memoize the track rows during playback

**Type:** Enhancement

**Source:** 1.4.4 self-healing optimization survey

## Summary

| Field         | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Intent        | Cut reconciliation work so playback row changes re-render only the rows that changed         |
| Key decisions | `TrackLine` memoization with stable props; class and style derivation moves inside the row   |
| Open risks    | Visual regressions if style derivation shifts; props must be referentially stable to pay off |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

During playback the sequencer state changes once per row and re-renders three `TrackPanel`s - 192 `TrackLine` elements (`TrackPanel.tsx` ~lines 487-515) - each receiving fresh `lineClassName` strings and `lineStyle` object literals. No component in `src/` uses `React.memo`, so every row step reconciles all 192 rows for the two that changed. Memoizing `TrackLine` behind stable props (for example an `isPlayingRow` boolean) and moving class/style derivation inside the row would cut that to the changed rows.

## Hints

- The audio-critical principles apply: keep prop mirroring and timing patterns intact; measure before and after rather than assuming the memo pays.
- Style derivation must move verbatim - a visual diff is a regression.

## Out of Scope

- Panel-level state restructuring or a wider `App.tsx` decomposition.
