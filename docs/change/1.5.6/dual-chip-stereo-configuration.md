# Support Dual-Chip Stereo Configurations

**Type:** Feature

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Extend the song model to two compatible AY-family chips in a stereo   |
|               | configuration - six channels total                                    |
| Key decisions | Exploratory record: the stereo record designs the pan extension point |
|               | in advance; this record lands when that groundwork exists             |
| Open risks    | Channel addressing, the file format, exports, and the tracker UI all  |
|               | assume three channels - the change is deep, not a flag on the engine  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Compatible hardware pairs two AY-family chips in a stereo configuration:
the PETAY sound board on the Commodore PET and PokeyMax in the Atari
XL/XE both place two YM-compatible chips across the stereo field. A
tracker targeting such hardware composes six channels - three per chip -
rather than today's three.

This record covers the evaluation and design of that model: how a song
declares a dual-chip configuration, how six channels map onto the
tracker UI (six track panels or a chip-switching view), how the pattern
and playlist model scales, how each chip's registers route to its stereo
side, and how exports encode the second chip.

The stereo panning work under `stereo-output` designs the extension
point for this - pan positions and channel addressing admit more than
three channels. This record builds on it and stays a separate window:
the single-chip stereo model must land and prove itself first.

## Use Cases

- When a song declares a dual-chip configuration, the UI exposes six
  channels and playback routes each chip's registers to its stereo
  side.
- When a three-channel song loads in a dual-chip build, it plays
  unchanged as mono or mapped stereo per the song's settings.

## Hints

- Both engines would need a second core instance with independent
  register files - the `SoundEngine` contract is per-chip already.
- `FORMAT.md` and every export format gain a second register stream or
  an interleaved one - decide per format, documented first.
- The tracker UI's three-panel layout and the navigation order are the
  largest visible surfaces - a chip-pair presentation needs design, not
  a literal doubling.
- Each chip in a pair may wire its A/B/C stereo layout differently (ABC
  vs ACB vs mono wiring) - channel mapping is per-chip, matching the
  named-layout catalog the `stereo-output` record defines.

## Out of Scope

- Three or more chips, or mixed-chip configurations.
- Shipping before `stereo-output` and `additional-chip-variants` have
  landed - this record depends on both.
