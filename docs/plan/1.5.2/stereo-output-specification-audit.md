# Specification Audit - Add Per-Channel Stereo Output

## Document Information

|            |                                                   |
| ---------- | ------------------------------------------------- |
| Change     | `docs/change/1.5.2/stereo-output.md`              |
| Plan       | `docs/plan/1.5.2/stereo-output-implementation.md` |
| Audit Date | 2026-11-11                                        |

## Completeness

- No pan settings renders mono as today - covered by the mono-graph
  preservation in both engine steps and the folded worklet path.
- Per-channel pan on live playback and preview - covered by the
  `setChannelPans` contract step, the two engine steps, and the
  `useAudioSetup` application step; previews write through the same
  engine instance.
- Pan settings persist and reload - covered by the YAML read/write step
  and the schema-migration normalization.
- Named hardware layouts (mono, ABC, ACB) in a data-driven catalog -
  covered by the constants step; new wirings add entries, not code.
- Free per-channel pan as the general case - covered by channel
  overrides in the `stereo` node and the EQ pan buttons.
- Dual-chip headroom - the `stereo` node keys channels by letter, so a
  future six-channel model can add D/E/F or per-chip nodes without
  redesigning the format.
- Engine-level join at one contract boundary - both engines implement
  the same `setChannelPans` member.

## Ambiguity

- "Free per-channel pan" - resolved as channel override keys `A`, `B`,
  `C` inside the `stereo` node on the 0..1 scale, not a second schema.
- "Stereo gain nodes in the Web Audio path" - resolved as
  `StereoPannerNode`s inserted only while stereo is active; an always-
  connected panner at centre would attenuate the mono path by the
  equal-power law and break bit-identical mono.
- Layout canonical pans - resolved as full positions 0, 0.5, 1; partial
  wirings remain expressible through channel overrides.

## Implementability

- `YM2149` builds per-channel gains and a summed noise gain at
  `src/synth/YM2149.ts` - verified; the rewire targets exist.
- `AyumiEngine.create` sets `outputChannelCount: [1]` and the worklet
  folds `core.left`/`core.right` at `src/workers/ayumiWorklet.ts` -
  verified; `AyumiCore.setPan(index, pan, isEqp)` is already exposed.
- `useAudioSetup` already mirrors `chipClock` into a ref and applies it
  on engine land and change - the pans step follows the same shape.
- `InformationPanel` already renders `ToggleValueButton` rows driven by
  `updateSong` - the layout toggle requires no new plumbing.
- `EQPanel` already renders per-channel interactive controls and is
  reached through `SongSection` props - the pan buttons follow the mute
  wiring.
- The `SoundEngine` contract at `src/synth/soundEngine.ts` is the single
  interface both engines implement - one added member covers both.

## Fidelity

- Layout vocabulary stated once: `mono`, `abc`, `acb` in
  `src/constants/song.ts`; the YAML `layout` key, the UI cycle, and the
  catalog all read the same table.
- Pan domain stated once: 0..1 with 0.5 centre; the file format, the
  engine contract, and the formatters share it. The internal engine maps
  to the `StereoPannerNode` -1..1 domain at its own boundary.
- Cross-party parity: the `pans` worklet message carries the same three
  values the contract hands the engine; the worklet clamps the same way
  the internal engine does.
- Constants enumerated: default pan `0.5`, pan steps 0/0.25/0.5/0.75/1,
  layout triples, `CSTM` display label, `MONO`/`ABC`/`ACB` labels.
- Boundary decisions recorded: exports keep the mono register stream and
  WAV mixdown; the MAX chip-panning byte stays `0x00`; restore and
  autosave pass `stereo` through normalization.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
