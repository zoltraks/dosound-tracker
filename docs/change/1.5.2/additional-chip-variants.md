# Support Additional Chip Variants

**Type:** Feature

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Admit PSG variants beyond the YM2149 so songs can target the AY-3-8910 |
|               | family the Ayumi core already models                                   |
| Key decisions | Chip support becomes a per-song choice through `SUPPORTED_SONG_CHIPS`; |
|               | the `PROJECT.md` non-goal against multi-chip support is revised        |
| Open risks    | Variant differences (envelope timing, clock conventions) must stay     |
|               | hardware-accurate - partial emulation is worse than none               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The supported-chip list in `src/constants/song.ts` is a single-element
array holding only `YM`, so a song can declare no chip other than the
YM2149. `PROJECT.md` records multi-chip support as a non-goal; this
record revises that non-goal for closely related PSG variants.

The natural first variant is the AY-3-8910: it shares the YM2149 register
model and the Ayumi core already emulates it, but it differs in envelope
timing and hardware details. Adding a variant touches the chip constant
list, per-chip register and timing differences in the engines, the song
file's `chip` field handling, and any export path that is chip-aware.

Scope is bounded to AY/YM-family variants that share the existing
register model - entirely different chips are out of scope.

## Use Cases

- When a composer creates a song for AY-3-8910 hardware, the chip
  selector admits it and playback uses the variant's timing.
- When a song file declares a supported variant, it loads with that
  chip; an unsupported value falls back per the loader's existing
  default rules.
- When a variant song exports, chip-aware formats carry the variant
  consistently.

## Hints

- `AYUMI` core models both AY-3-8910 and YM2149 - the variant difference
  concentrates in envelope timing and chip configuration, not a second
  DSP.
- The `chip` field already round-trips through the song YAML; the
  loader normalizes it to uppercase - extend validation, not the format
  shape.
- `FORMAT.md` and `PROJECT.md` (non-goals, F-14 chip references) update
  before code per the documentation-first rule.

## Out of Scope

- Chips outside the AY/YM register family (SID, POKEY, etc.).
- Dual-chip or six-channel configurations - two compatible AY chips in
  stereo (for example PETAY or PokeyMax boards) are recorded future work.
  A song declares one chip in this record, but the chip model must not
  preclude the later extension.
