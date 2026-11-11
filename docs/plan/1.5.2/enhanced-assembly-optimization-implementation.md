# Enhance Assembly Export Optimization Implementation Plan

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Add a fourth export strategy `compact` that shrinks the DOSOUND byte  |
|               | stream further than `optimized` while staying replay-equivalent       |
| Key decisions | `compact` dedups tone writes at byte level, keys mixer writes on      |
|               | audible-channel bits, drops the forced tone rewrite after playlist    |
|               | markers, splits merged delays at the 256-frame command maximum, and   |
|               | skips redundant END silences; simple/complex/optimized keep           |
|               | byte-identical output                                                 |
| Open risks    | The `compact` stream must drive the stock DOSOUND routine to the same |
|               | audible result - equivalence is proven by per-frame register-state    |
|               | assertions in unit tests                                              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/enhanced-assembly-optimization.md`.

## Analysis

`exportToAssembly` in `src/exports/asm.ts` simulates the song into frames
and emits `dc.b` commands: register-value pairs, `$FF,N` delays (N = frames
minus one, the DOSOUND off-by-one), and `$FF,0` stop. The DOSOUND command
vocabulary carries no loop, subroutine, or pointer command, so the record's
pattern-referencing and instrument-sharing candidates are declined - no
encoding exists for them without a player-side change, which is out of
scope.

What the format does admit is tighter packing of the same write stream.

- Tone writes always cost four bytes (`dc.b $01,$hh,$00,$ll`) even when
  only one half of the period changes. Fine-only changes dominate
  vibrato, slides, and pitch envelopes.
- The mixer byte is re-emitted on every change, including changes that
  only touch the enable bits of channels whose volume is zero - writes
  the replay routine performs but the listener cannot hear.
- Playlist-position markers (`; ---`) clear the tone-register cache and
  force four-byte rewrites per channel at every boundary, including
  boundaries where nothing changed.
- `combineDelayLines` merges delays with no upper bound; a merged run
  beyond 256 frames emits a delay count that no longer fits the single
  command byte.
- The END block silences all three channels unconditionally, repeating
  zero writes for channels already at zero.

The `ExportStrategy` union in `src/constants/export.ts` is shared by the
asm, binary, VGM, and MAX paths. VGM and MAX already read `optimized` as
their maximum-reduction level; `compact` maps to that same level there,
so those formats gain no new encoding.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- No abbreviations in identifiers (use full words)
- Keep functions focused on single responsibility
- Prefer pure functions for stream transformations
- Preserve existing style and conventions

## Audio-Critical Requirements

- The change is confined to the export pipeline. No React render timing,
  `useCallback`/`useMemo` dependency, or state pattern in the audio path
  is touched.
- The YM2149 emulator, SoundDriver, and playback simulation are
  unchanged - `simulateSong` output is consumed read-only.
- Determinism is the safety property: identical input songs produce
  byte-identical output, and the emitted command stream must be
  replay-equivalent to the `optimized` stream. Equivalence is verified
  by unit tests that simulate the emitted commands per frame.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `FORMAT.md` - the EXPORT DATA section gains the `compact` strategy
  contract: byte-level tone dedup, audible-keyed mixer dedup, no forced
  tone rewrite after markers, chunked merged delays, conditional END
  silences.
- `SPECIFICATION.md` - the DOSOUND Assembly paragraph and the
  `ExportStrategy` union description gain `compact`, and the MAX and VGM
  paragraphs record that `compact` selects their existing optimized
  paths.
- `public/MANUAL.md` - the strategy lists and the strategy comparison
  section gain `COMPACT DUMP`.
- `PROJECT.md` - F-07 gains the fourth strategy as a stated requirement.

## Type and State Updates

**Type definitions**

File to modify: `src/constants/export.ts`.

```typescript
export type ExportStrategy = 'simple' | 'complex' | 'optimized' | 'compact';
```

**State store modifications**

File to modify: `src/hooks/app/useAppState.ts`.

The persisted-strategy reader accepts `compact` alongside the existing
values; unknown stored values still fall back to `complex`.

## Step by Step Implementation

**Add the compact strategy to the assembly exporter**

Extend the diff loop in `formatFramesToAssembly` so `compact` joins the
`complex`/`optimized` branch with tighter emission.

File to modify: `src/exports/asm.ts`.

```typescript
const compact = strategy === 'compact';
if (strategy === 'complex' || strategy === 'optimized' || compact) {
  // ... diff loop with compact-aware emission below
}
```

Inside the loop, four behaviours activate only for `compact`.

- Mixer dedup keys on audible bits. Emit the mixer when it differs from
  the last written value in the I/O bits (`0xC0`) or in the enable bits
  (`0x09 << ch`) of any channel whose volume nibble is non-zero this
  frame. Channels at volume zero cannot sound, so stale enable bits on
  them are inaudible; when such a channel's volume returns, its bits are
  compared again and the mixer emits if they differ from the last
  written value.
- Tone dedup works per byte. Build the write pair from the halves that
  actually changed - both bytes at frame zero and after a marker only
  when their cached value is unknown, otherwise just the changed byte.
  Order stays coarse-then-fine, matching existing output.
- Playlist markers still print but no longer clear the tone-register
  cache, so unchanged periods are not re-emitted at boundaries.
- Volume and noise dedup are unchanged.

**Chunk merged delays**

`combineDelayLines` gains a chunk ceiling: `compact` splits a merged run
into commands of at most 256 frames each, keeping every delay count
inside the single command byte. `optimized` keeps its current unchunked
merging so its bytes stay identical.

File to modify: `src/exports/asm.ts`.

```typescript
asm = combineDelayLines(asm, { maxFramesPerCommand: compact ? 256 : Infinity });
```

**Skip redundant END silences**

Under `compact`, the END block emits `VA/VB/VC 0` only for channels whose
last written volume is non-zero, read from the final simulated frame's
register snapshot - the last written value always equals the last frame's
value because every change is emitted. A channel that never wrote a
volume still receives its silence write, since player state is unknown
at stream start.

File to modify: `src/exports/asm.ts`.

**Map compact onto the optimized paths of VGM and MAX**

`exportSongToVgm` applies `optimizeVgmDelays` when the strategy is
`optimized` or `compact`; `buildMaxStream` applies `optimizeReg7Delays`
on the same condition. Neither format gains a new encoding - `compact`
selects their most reduced existing stream.

Files to modify: `src/exports/vgm.ts`, `src/exports/max.ts`.

```typescript
const reduce = strategy === 'optimized' || strategy === 'compact';
```

`exportToBinary` needs no change - it forwards the strategy to
`exportToAssembly`.

**Expose compact in the export modal**

Add a fourth strategy radio labelled `COMPACT DUMP` after `OPTIMIZED
DUMP`.

File to modify: `src/modals/ExportModal.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update the `ExportStrategy` union and the persisted-strategy reader
3. Implement the compact emission path in `asm.ts`
4. Map `compact` in `vgm.ts` and `max.ts`
5. Add the modal radio
6. Add or update tests
7. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/exports/exportAssemblyCompact.test.ts`.

- Fine-only tone change emits `dc.b $00,$ll` (2 bytes) under `compact`
  versus 4 bytes under `optimized`.
- Coarse-only tone change emits `dc.b $01,$hh`.
- Replay equivalence: simulating the emitted command stream frame by
  frame yields the same effective register state as `complex` for every
  audible channel - decode both outputs into per-frame register maps and
  compare the audible subset (volume, tone period while audible, mixer
  bits of audible channels, noise).
- Mixer writes that only touch silent-channel bits are dropped; a later
  unmute re-emits the mixer.
- A silence run beyond 256 frames splits into multiple `DL` commands,
  each with a single-byte count, summing to the same total delay.
- The END block omits zero writes for channels already at volume zero
  and keeps them for channels that never wrote.
- `simple`, `complex`, and `optimized` outputs are byte-identical before
  and after the change on the fixture song.

Update `test/modals/ExportModal.test.tsx`: four strategy radios, the
fourth dispatching `compact`.

**Integration tests**

None required - the modal dispatch test covers the new surface, and the
export flows are unchanged.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Measure `optimized` vs `compact` byte counts on the bundled demo song
  (`test/fixtures/bundled-song.yaml`) and record the win in the record
