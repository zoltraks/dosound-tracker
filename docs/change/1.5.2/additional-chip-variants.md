# Support Additional Chip Variants

**Type:** Feature

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Admit PSG variants beyond the YM2149 so songs can target the AY-3-8910 |
|               | family the Ayumi core already models                                   |
| Key decisions | Chip support becomes a per-song choice through `SUPPORTED_SONG_CHIPS`; |
|               | the `PROJECT.md` non-goal against multi-chip support is revised; the   |
|               | modeled variant difference is the DAC amplitude curve, delivered       |
|               | through `setChip` on the `SoundEngine` contract                        |
| Open risks    | Export bytes change for chip-aware formats - the VGM chip-type byte    |
|               | moves from the implicit AY8910 to the declared variant, and the        |
|               | internal engine still models no hardware envelope for either chip      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The supported-chip list in `src/constants/song.ts` is a single-element
array holding only `YM`, so a song can declare no chip other than the
YM2149. `PROJECT.md` records multi-chip support as a non-goal; this
record revises that non-goal for closely related PSG variants.

The first variant is the AY-3-8910: it shares the YM2149 register model
and the Ayumi core already emulates it, but it differs in the DAC
amplitude curve. Verified against the tree: the `chip` field is
validated and persisted but never reaches either engine - no chip
control exists in the Song information panel and `useAudioSetup`
receives only the clock and channel pans. The Ayumi worklet hardcodes
`configure(true, ...)` (the YM DAC table), the internal engine applies
`YM_LOG_VOLUME_TABLE` unconditionally, and the internal engine does not
model the hardware envelope generator, so the amplitude curve is the
only per-variant behavior the engines can express.

Adding a variant touches the chip constant list, a chip toggle in the
Song information panel, a `setChip` member on the `SoundEngine`
contract, per-engine variant selection, and the chip-aware export paths.
The VGM exporter already writes the AY-family clock at 0x74 but leaves
the chip-type byte at 0x78 zero (implicitly declaring AY8910 for YM
songs), and the MAX exporter hardcodes chip id `0xA9` while `MAX.md`
defines `0xA0` for the AY-8910 - both must follow the song chip.

Scope is bounded to AY/YM-family variants that share the existing
register model - entirely different chips are out of scope.

## Use Cases

- When a composer creates a song for AY-3-8910 hardware, the chip
  selector admits it and playback uses the variant's amplitude curve.
- When a song file declares a supported variant, it loads with that
  chip; an unsupported value falls back per the loader's existing
  warning path.
- When a variant song exports, chip-aware formats carry the variant
  consistently: MAX writes its chip id, VGM writes its chip-type byte,
  and WAV renders with the variant's amplitude curve.

## Hints

- `AYUMI` core models both AY-3-8910 and YM2149 - the variant difference
  concentrates in the DAC amplitude table selected by `configure(isYm)`,
  not a second DSP.
- The `chip` field already round-trips through the song YAML; the
  loader normalizes it to uppercase - extend validation, not the format
  shape.
- The unsupported-chip import warning in `useSongImportWarning` reads
  `SUPPORTED_SONG_CHIPS` and widens automatically.
- `FORMAT.md` and `PROJECT.md` (non-goals, F-14 chip references) update
  before code per the documentation-first rule.

## Out of Scope

- Chips outside the AY/YM register family (SID, POKEY, etc.).
- Dual-chip or six-channel configurations - two compatible AY chips in
  stereo (for example PETAY or PokeyMax boards) are recorded future work.
  A song declares one chip in this record, but the chip model must not
  preclude the later extension.
- Hardware behaviors the engines do not model at all today, such as the
  hardware envelope generator in the internal engine or AY I/O ports.
