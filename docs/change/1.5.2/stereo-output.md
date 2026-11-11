# Add Per-Channel Stereo Output

**Type:** Feature

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Give each of the three channels a pan position instead of the fixed mono  |
|               | mix                                                                       |
| Key decisions | Mono remains the default and the faithful Atari ST behaviour - stereo is  |
|               | opt-in; the song carries a `stereo` node (named layout plus per-channel   |
|               | pans) resolved to `setChannelPans` on the `SoundEngine` contract; letter- |
|               | addressed channel keys leave room for a second compatible chip            |
| Open risks    | None open - the internal engine enters the panner chain only while a pan  |
|               | sits off centre, so default mono is bit-identical; Ayumi emits the folded |
|               | mono sample on both outputs at centre; exports carry the same bytes       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Both sound engines mix the three channels to a single mono path, matching
the Atari ST hardware convention. This record adds an optional per-track
pan control: each channel can be placed in a stereo field, rendered
through stereo gain nodes in the Web Audio path.

Mono stays the default - a song without pan settings renders exactly as
today. When panning is active, the internal engine routes channel output
through stereo gains; the Ayumi engine applies the equivalent pan inside
its worklet output.

Hardware layouts matter. The three AY/YM channels are wired to stereo
positions differently across machines - a common layout puts A left, B
centre, C right (ABC), while others swap B and C (ACB) or run true mono.
The model captures these canonical layouts as named configurations so a
song can declare a machine's wiring rather than forcing the composer to
set three free pans - free per-channel pan remains the general case.

The pan model is designed with headroom: compatible hardware exists that
pairs two AY-family chips in a stereo configuration (for example the
PETAY sound board on the Commodore PET and the TurboSound dual-AY
configuration on the ZX Spectrum), and each chip in such a pair may wire
its A/B/C layout differently.
Nothing in this change should preclude a future song model with six
channels across two chips - pan positions, channel addressing, and the
layout catalog are specified so that extension lands without a redesign.

Pan is a live-render property only. The register-stream exports
(assembly, binary, dump, VGM, MAX) carry the same YM2149 register data
regardless of pan, and the WAV export keeps its mono mixdown - no export
format changes.

## Use Cases

- When a song has no pan settings, both engines render mono as today.
- When the user pans a track left or right, live playback and engine
  preview reflect the position.
- When a song file carries pan settings, they persist and reload.

## Hints

- `AyumiEngine` pans all three channels centre in the worklet today;
  `YM2149` sums to one output path - the stereo routing joins both at
  the same `SoundEngine` contract boundary.
- Whether pan lives on the song or the instrument is a plan decision -
  keep the file-format extension documented in `FORMAT.md` first.
- Named hardware layouts (mono, ABC, ACB at minimum) cover the canonical
  channel wirings - the layout catalog should be data-driven so new
  machine wirings add entries, not code.

## Out of Scope

- Dual-chip or six-channel song models - the extension point is designed
  in, the feature itself is later work.
- Pan automation or envelope-driven panning.
