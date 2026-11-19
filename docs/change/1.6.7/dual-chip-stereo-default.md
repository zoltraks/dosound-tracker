# Split stereo by chip for two-chip songs

**Type:** Change

## Summary

| Field         | Value                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Route chip 1 hard left and chip 2 hard right by default whenever a two-chip song plays in dual-chip mode                                                |
| Key decisions | The `dual` layout becomes the hard chip split and the fallback wiring for two-chip songs without a stereo node; explicit song stereo settings still win |
| Open risks    | Songs authored against the previous gradual `dual` spread change character                                                                              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Two-chip playback currently resolves an omitted `stereo` node to centred
pans, so both chips mix into the middle of the stereo field and the listener
cannot tell which chip is sounding. The `dual` layout exists but spreads the
six channels gradually and is never selected implicitly.

Two-chip songs without stereo settings must default to chip-separated
output: channels A-C (chip 1) hard left, channels D-F (chip 2) hard right.
The `dual` layout is redefined to that hard split `[0, 0, 0, 1, 1, 1]` so
the named wiring and the new default agree. A song that carries any `stereo`
node - a named layout or per-channel overrides - keeps its authored
resolution; `mono` remains available as the explicit all-centre choice.

## Use Cases

- When the user enables dual-chip mode and plays a two-chip song with no stereo node, chip 1 is audible only on the left and chip 2 only on the right.
- When a song declares `stereo: { layout: 'dual' }`, it resolves to the same hard chip split.
- When a song declares any other stereo layout or channel overrides, those settings resolve exactly as before.
- When a single-chip song has no stereo node, pans stay centred.

## Hints

`resolveChannelPans` in `src/utils/song/songStereo.ts` gains a chip-count
parameter whose default keeps single-chip callers unchanged; the fallback
layout becomes `dual` for two chips. `useChannelPans` forwards the effective
chip count, and `App.tsx` computes `dualChipEnabled ? songChipCount(song) : 1`
once for both the pan resolution and `useAudioSetup`. The `dual` entry in
`STEREO_LAYOUTS` (`src/constants/song.ts`) changes from the gradual spread
to `[0, 0, 0, 1, 1, 1]`.

## Out of Scope

- Per-channel pan controls in the UI; the stereo node remains song data.
- Export formats, which never read the stereo node.
- The gradual spread wiring, which remains expressible through per-channel overrides.
