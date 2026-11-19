# Song-driven dual-chip playback

**Type:** Change

## Summary

| Field         | Value                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Intent        | Let a two-chip song run both engines and sound stereo regardless of the dualChip setting                           |
| Key decisions | `songChipCount` selects playback engines; `dualChip` OR a two-chip song selects the six-track editing surface      |
| Open risks    | A two-chip song can no longer be monitored through chip 1 alone by disabling the setting; channel mutes cover that |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The `dualChip` sound setting gated the entire second-chip runtime: with
it off, a song declaring `chipCount: 2` ran a single centred engine, so
chip 2's D/E/F content stayed silent and the output collapsed to mono
no matter which stereo modes the song carried. Playback now follows the
song's resolved chip count - `effectiveChipCount` is `songChipCount`
directly, so a two-chip song always instantiates both engines, applies
the `one`/`two` stereo modes, and splits chip 1 left / chip 2 right by
default. The `dualChip` setting keeps its authoring role: on its own it
exposes the six-track editing surface for songs that do not yet
reference D/E/F, and the effective dual-chip flag feeding the track UI
is the setting OR a song that already resolves to two chips, so a
two-chip song always shows its channels even with the setting off.

## Use Cases

- When a two-chip song plays with the dual-chip setting off, both chips
  still sound - chip 1 on the left, chip 2 on the right - instead of a
  silent second chip and a mono mix.
- When the user authors D/E/F content on a single-chip song with the
  setting on, the song's chip count rises to two and the second engine
  spins up live.
- When the user wants only chip 1 audible on a two-chip song, the
  per-channel mutes cover it without disabling the second engine.

## Hints

`effectiveChipCount` in `App.tsx` is `songChipCount(currentSong)`; the
playback bridge's channel count and `useChannelPans`' chip-count
fallback both consume it. `effectiveDualChip` is `liveDualChip ||
songChipTotal === 2` and feeds `trackChannelCount`,
`navigableTrackSections`, and the sliding track window. The raw
`dualChipEnabled` state remains the settings draft/commit source only.

## Out of Scope

- Per-song dual-chip opt-out; the song's chip count is authoritative.
- Export paths, which already key off the song's chip count.
- The settings draft semantics - `dualChip` still commits and previews
  like the other sound controls.
