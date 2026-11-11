# Specification Audit - Support Additional Chip Variants

## Document Information

|            |                                                         |
| ---------- | ------------------------------------------------------- |
| Change     | `change/1.5.2/additional-chip-variants.md`              |
| Plan       | `plan/1.5.2/additional-chip-variants-implementation.md` |
| Audit Date | 2026-11-11                                              |

## Completeness

- Song declares a supported variant and loads with it - covered by the
  `SUPPORTED_SONG_CHIPS` extension; the parser's `isChipSupported` check
  reads the same list and the unsupported warning widens automatically.
- Chip selector admits the variant - covered by the `Chip:` toggle step
  in `InformationPanel`.
- Playback uses the variant - covered by the `setChip` contract step,
  the internal-engine table step, the Ayumi worklet `isYm` step, and the
  `useAudioSetup` application step; previews write through the same
  engine instance.
- Chip-aware formats carry the variant - covered by the export step:
  MAX chip id, VGM chip-type byte, WAV volume curve. The DOSOUND
  assembly, binary, and dump formats carry no chip declaration and are
  explicitly unchanged.
- `PROJECT.md` non-goal revision - covered by the documentation step.
- Dual-chip headroom - the chip stays a scalar song field; a later
  dual-chip model adds entries rather than redesigning the schema.

## Ambiguity

- "Hardware-accurate variant" - resolved as the amplitude-curve
  difference the codebase can express: upstream Ayumi models AY vs YM
  through the DAC table alone, and the internal engine models no
  hardware envelope for either chip. Claiming more would be partial
  emulation, which the record rejects.
- "The loader's existing default rules" for unsupported chips -
  resolved as the existing behavior: the value persists on the song,
  the import warning fires, and engines treat any non-`AY` id as YM.
- Chip toggle placement - resolved as a `Chip:` row in the Song
  information grid's left column after Speed, following the Stereo row
  pattern rather than extending the Rate/Clock rows.
- AY table provenance - resolved as the 16 odd-index entries of the
  vendored `AY_DAC_TABLE` (`out = volume * 2 + 1`), not an independent
  approximation.

## Implementability

- `SUPPORTED_SONG_CHIPS` lives at `src/constants/song.ts` - verified;
  the list extension is local.
- `SoundEngine` is the single contract both engines implement at
  `src/synth/soundEngine.ts` - verified; `setChannelPans` is the
  precedent member.
- `YM2149` applies `YM_LOG_VOLUME_TABLE` in `updateAudioNodes` for tone
  and noise gains - verified; a stored `volumeTable` swaps in place.
- `AyumiCore.configure(isYm, clock, sr)` already selects the DAC table
  at `src/synth/ayumiCore.ts` - verified; the worklet hardcodes `true`
  today and holds the pans-reapply precedent inside `configure`.
- `useAudioSetup` mirrors `chipClock` and `channelPans` into refs and
  applies them on engine land and change - the chip step follows the
  same shape without touching existing dependency arrays.
- `InformationPanel` already renders `ToggleValueButton` rows and a
  stereo cycle button driven by `updateSong` - the chip toggle requires
  no new plumbing.
- VGM 0x78 and MAX 0xA9 write sites verified at `src/exports/vgm.ts`
  and `src/exports/max.ts`; the MAX chip-id table in `MAX.md` defines
  `0xA0` for AY-8910. VGM chip-type byte semantics: 0x00 AY8910,
  0x10 YM2149.

## Fidelity

- Chip vocabulary stated once: `YM` and `AY` in
  `SUPPORTED_SONG_CHIPS`; the YAML `chip` field, the UI cycle, the
  engine mapping, and the export mapping all read the same ids.
- Variant mapping stated once per boundary: engines resolve
  `chip === 'AY'` to the AY curve and every other value to YM -
  identical fallback semantics on the internal engine, the worklet's
  `isYm` flag, the WAV table selection, and the MAX/VGM byte writes.
- Constants enumerated: `SONG_CHIP_LABELS` (`YM2149`, `AY8910`), the
  sixteen `AY_LOG_VOLUME_TABLE` entries, VGM chip-type bytes `0x00` and
  `0x10`, MAX chip ids `0xA0` and `0xA9`.
- Cross-party parity: the `chip` worklet message carries the same song
  `chip` value the contract hands the engine; the worklet maps it to
  `isYm` the same way `AyumiEngine` documents it.
- Boundary decisions recorded: unsupported file values keep the loader
  warning and YM fallback; asm/bin/dump exports stay chip-agnostic;
  the chip model is scalar and does not preclude a later dual-chip
  extension; VGM output bytes change for YM songs (0x78: 0x00 to 0x10)
  as the recorded correction of the implicit AY8910 declaration.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
