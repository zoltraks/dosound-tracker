# Support Additional Chip Variants Implementation Plan

## Summary

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Intent        | Admit the AY-3-8910 variant through a per-song `chip` choice so     |
|               | playback, preview, and chip-aware exports honor the declared chip   |
| Key decisions | `SUPPORTED_SONG_CHIPS` gains `AY`; the `SoundEngine` contract gains |
|               | `setChip`; the internal engine selects between YM and AY volume     |
|               | tables, the Ayumi worklet selects its DAC table through `isYm`; MAX |
|               | writes its chip id and VGM its chip-type byte per song chip         |
| Open risks    | The modeled variant difference is the amplitude curve only - the    |
|               | internal engine models no hardware envelope for either chip; VGM    |
|               | output bytes change for YM songs (0x78 moves 0x00 to 0x10)          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `change/1.5.2/additional-chip-variants.md`.

## Analysis

The `chip` field already parses, normalizes to uppercase, warns on
unsupported values through `useSongImportWarning`, and saves - but it
reaches no engine. `useAudioSetup` receives only the clock and channel
pans, the `SoundEngine` contract has no chip member, the Ayumi worklet
hardcodes `configure(true, ...)` selecting the YM DAC table, and the
internal engine applies `YM_LOG_VOLUME_TABLE` unconditionally.

The variant difference implementable in this codebase is the amplitude
curve. The Ayumi core models exactly this through `configure(isYm)` -
upstream Ayumi shares the register model, tone, noise, and envelope
machinery between the chips and selects only the DAC table. The internal
engine models no hardware envelope generator, so an AY volume table is
its complete variant behavior. The AY table derives from the vendored
`AY_DAC_TABLE` in `ayumiCore.ts` - the 16 register levels index its odd
entries (`out = volume * 2 + 1`).

The Song information panel holds Rate and Clock toggles but no chip
control. The exports are partially chip-aware: VGM writes the AY-family
clock at 0x74 but leaves the chip-type byte at 0x78 zero - implicitly
declaring AY8910 for every song; MAX hardcodes chip id `0xA9` while
`MAX.md` defines `0xA0` for the AY-8910; WAV renders through the YM
volume table. The DOSOUND assembly, binary, and register-dump formats
carry no chip declaration and stay chip-agnostic.

## Best Practices

Follow TypeScript and React engineering standards from `standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- No abbreviations in identifiers (use full words)
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility

## Audio-Critical Requirements

- The change adds no dependencies to existing `useCallback`/`useMemo`
  arrays and changes no state-management pattern in the audio path.
- `useAudioSetup` gains one ref mirror plus one dedicated effect that
  applies the chip to the engine - the same shape as the existing
  `chipClock` and `channelPans` handling.
- Engine-side changes are a stored variant flag and a volume-table
  pointer, applied on configuration changes only - the per-tick render
  path is unchanged.
- Playback verification: the YM2149 table selection is proven by the
  stubbed audio-context suite, the Ayumi path by the engine messaging
  suite, and live playback by the e2e smoke suite.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `PROJECT.md` - the multi-chip non-goal is revised and a new
  requirement F-19 records the per-song chip variant.
- `ARCHITECTURE.md` - the audio synthesis pipeline records the variant
  selection on both engines.
- `SPECIFICATION.md` - the Sound Engines section, the volume-table
  description, and the song-field notes gain the chip vocabulary.
- `FORMAT.md` - the `chip` loader rule, the MAX chip id, the VGM
  chip-type byte, and the WAV amplitude curve.
- `TESTING.md` - the e2e flow list gains the chip toggle case.
- `public/MANUAL.md` - the `chip` field entry stops claiming only `YM`
  is supported.

## Type and State Updates

**Type definitions**

The `Song` interface already carries `chip?: string` - no type change.
The `SoundEngine` interface in `src/synth/soundEngine.ts` gains
`setChip(chip: string): void`.

**State store modifications**

None. Chip is song data and flows through `updateSong` like `frame`
and `clock` - no store changes.

## Step by Step Implementation

**Add the chip vocabulary**

Extend the supported-chip list and add display labels.

File to modify: `src/constants/song.ts`.

```typescript
export const SUPPORTED_SONG_CHIPS = ['YM', 'AY'];
export const SONG_CHIP_LABELS: Record<string, string> = {
  YM: 'YM2149',
  AY: 'AY8910',
};
```

**Add the AY volume table**

Add the AY amplitude curve derived from the Ayumi `AY_DAC_TABLE` and a
resolver that returns the table for a chip id - `AY` selects the AY
table, every other value the YM table.

File to modify: `src/synth/YM2149.ts`.

```typescript
export const AY_LOG_VOLUME_TABLE: number[] = [
  0.0, 0.00999465934234, 0.0144502937362, 0.0210574502174, 0.0307011520562, 0.0455481803616,
  0.0644998855573, 0.107362478065, 0.126588845655, 0.20498970016, 0.292210269322, 0.372838941024,
  0.492530708782, 0.635324635691, 0.805584802014, 1.0,
];

export const volumeTableForChip = (chip: string | undefined): number[] =>
  chip === 'AY' ? AY_LOG_VOLUME_TABLE : YM_LOG_VOLUME_TABLE;
```

The engine stores `volumeTable` and swaps it in `setChip`, then re-runs
`updateAudioNodes` so live gains pick up the curve. Tone and noise gain
paths read the stored table in place of the constant.

**Extend the SoundEngine contract**

Add `setChip(chip: string)` to the `SoundEngine` interface.

File to modify: `src/synth/soundEngine.ts`.

**Apply the variant in the internal engine**

`YM2149` gains `setChip`, storing the resolved table and re-applying
audio-node gains. `dispose`, `reset`, and `silenceAll` are unchanged.

File to modify: `src/synth/YM2149.ts`.

```typescript
setChip(chip: string): void {
  this.volumeTable = volumeTableForChip(chip);
  this.updateAudioNodes();
}
```

**Apply the variant in the Ayumi worklet**

Store `isYm` on the processor, use it in `configure`, and add a `chip`
message that flips the flag and reconfigures - the existing configure
path re-applies pans and replays the mirrored registers.

Files to modify: `src/workers/ayumiWorklet.ts`, `src/synth/AyumiEngine.ts`.

```typescript
// worklet message union gains
| { type: 'chip'; chip: string }

// processor
private isYm = true;
// configure uses this.isYm; the chip message sets
// this.isYm = message.chip !== 'AY' and reconfigures.

// AyumiEngine
setChip(chip: string): void {
  this.post({ type: 'chip', chip });
}
```

**Apply the song chip in the audio setup**

Add a `songChip` parameter with a ref mirror, apply it inside
`landEngine` after `setClock`, and add an effect that pushes the chip
to the live engine when it changes.

File to modify: `src/hooks/audio/useAudioSetup.ts`.

```typescript
export function useAudioSetup(
  chipClock: number = DEFAULT_SONG_CLOCK,
  engineId?: SoundEngineId,
  channelPans?: number[],
  songChip: string = DEFAULT_SONG_CHIP,
): UseAudioSetupResult;
```

**Wire the song chip through App**

Pass the song chip to `useAudioSetup`.

File to modify: `src/App.tsx`.

```typescript
useAudioSetup(
  currentSong.clock ?? DEFAULT_SONG_CLOCK,
  soundEngineId,
  channelPans,
  currentSong.chip ?? DEFAULT_SONG_CHIP,
);
```

**Add the chip toggle**

Add a `Chip:` field row to the left column of the Song information
grid, after Speed. The toggle cycles `SUPPORTED_SONG_CHIPS` and displays
the label from `SONG_CHIP_LABELS` - an unrecognized stored chip shows
its raw value and the next click resets to `YM`.

File to modify: `src/components/InformationPanel.tsx`.

**Normalize the chip for export**

Add `chip` to the export normalization defaults.

File to modify: `src/exports/core.ts`.

**Write the variant in chip-aware exports**

MAX writes `0xA0` for `AY` and keeps `0xA9` for `YM`. VGM writes the
chip-type byte at 0x78 - `0x00` (AY8910) for `AY` songs and `0x10`
(YM2149) for `YM` songs. WAV selects the volume table per chip. The
DOSOUND assembly, binary, and register-dump formats stay unchanged -
they carry no chip declaration.

Files to modify: `src/exports/max.ts`, `src/exports/vgm.ts`, `src/exports/wav.ts`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update constants and the AY volume table
3. Extend the SoundEngine contract and both engines
4. Wire `useAudioSetup` and `App.tsx`
5. Add the chip toggle
6. Update the exports
7. Add or update tests
8. Run verification loop

## Testing Strategy

**Unit tests**

- `test/synth/YM2149.test.ts` - `setChip('AY')` switches the gain to the
  AY table values and `setChip('YM')` restores them.
- `test/synth/AyumiEngine.test.ts` - `setChip` posts the `chip` message.
- `test/hooks/audio/useAudioSetup.test.tsx` - the engine mock gains
  `setChip`; chip reaches the landed engine and re-applies on change.
- `test/utils/song/songParserGaps.test.ts` and `songIO.test.ts` - `AY`
  parses as supported and round-trips through the saver.
- `test/exports/exportMax.test.ts` - the chip chunk id is `0xA0` for an
  `AY` song and stays `0xA9` for `YM`.
- `test/exports/exportVgm.test.ts` - byte 0x78 is `0x10` for `YM` and
  `0x00` for `AY`.
- `test/exports/exportWav.test.ts` - an `AY` song renders with the AY
  curve and produces differing samples from the `YM` render.

**Integration tests**

- `test/components/` - no new component test; the toggle follows the
  stereo row pattern verified end-to-end.

**End-to-end tests**

- `e2e/smoke.spec.ts` - one flow toggling the chip variant and asserting
  the control label updates.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` under the webkit project for the audio-path slice
- Manually verify playback timing and audio stability
