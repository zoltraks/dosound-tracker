# Per-chip stereo modes with mono and crosstalk settings

**Type:** Change

## Summary

| Field         | Value                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Give each chip a named stereo mode stored in song data, plus app-level MONO and crosstalk controls                                                              |
| Key decisions | Crosstalk and MONO are application settings; per-chip panning lives in the song's `stereo` node as `one`/`two` mode tokens, replacing the layout/override model |
| Open risks    | Legacy `stereo` nodes normalize to absent; the crosstalk bus adds nodes to every engine's output path                                                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The song `stereo` node carried named layouts and free per-channel pan
overrides. It is replaced by a per-chip mode model: each chip's three
channels take one named wiring - `L` (all left), `R` (all right), `C`
(all centre), or a permutation of `ABC` naming which channel sits left,
centre, and right (`ABC` = first channel left, second centre, third right;
`BAC`, `CAB`, etc. cover the rest). The node serializes as `one` for chip
1 and `two` for chip 2.

Two application settings join the sound category: `mono`, which forces
every channel to centre so both chips play on both stereo channels, and
`crosstalk`, a 0-100 percent slider implementing symmetric additive
crossfeed (`L_out = L + c*R`, `R_out = R + c*L`) on a post-engine master
bus; at 100 percent both sides carry the full mix, i.e. monophonic. The
bus input is pinned to two channels so an all-centre (mono-folded) engine
signal stays dual-mono instead of playing left-only through the splitter.

## Use Cases

- When the user picks a stereo mode for chip 1 or chip 2 in settings, the song's `stereo` node records `one`/`two` tokens and playback reroutes immediately.
- When the user enables MONO, every channel centres regardless of the song's stereo modes.
- When the user raises crosstalk, the stereo image bleeds toward mono on the master bus for both engines.
- When a song carries no `stereo` node, a single-chip song plays centred and a two-chip song keeps the chip split (chip 1 left, chip 2 right).

## Hints

Mode tokens resolve to the existing six-channel pan tuple inside
`resolveChannelPans`; `useChannelPans` applies the MONO override. Engines
expose `routeOutput(node)` so `useAudioSetup` can insert the splitter /
merger crossfeed bus once per AudioContext. The Settings SOUND category
hosts the mono checkbox, the crosstalk range input, and the two song
stereo selects.

## Out of Scope

- Per-channel free pan overrides; the mode set is the whole vocabulary.
- Crosstalk inside the Ayumi worklet; the bus sits after both engines.
- Export formats, which still carry no pan data.
- Migrating legacy layout/override stereo nodes beyond treating them as absent.
