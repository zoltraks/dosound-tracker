# Refactoring Proposal - 1.5.2

## Problem

The 1.5.2 window added `src/exports/midi.ts` and `src/exports/mod.ts`.
Both reimplement song-traversal idioms that `playbackSimulation.ts`
already carries, and every binary exporter repeats the same timing
prologue. The survey also checked `songStereo.ts`, `editHistory.ts`,
`sequencerWorklet.ts`, the new hooks, the aria additions, the
chip-variant paths, `App.tsx`, and `ModalManager.tsx` - none of those
cross the extraction threshold.

**F-01 - first-wins pattern lookup built three times**

`Map<string, Pattern>` construction with skip-falsy and first-wins
insertion is verbatim at three sites.

- `src/utils/playback/playbackSimulation.ts` (`patternsByIdMap`).
- `src/exports/midi.ts` (`patternsById` in `buildTrackEvents`).
- `src/exports/mod.ts` (`patternsById` in `exportSongToMod`).

```typescript
const patternsById = new Map<string, Pattern>();
for (const pattern of song.pattern) {
  if (!pattern) continue;
  if (!patternsById.has(pattern.id)) {
    patternsById.set(pattern.id, pattern);
  }
}
```

Two lookalikes stay untouched. `usePlaybackBridge.ts` builds a
last-wins map (`map.set` unconditionally), and `renumberSongData` in
`useSongManagement.ts` keys on `normalizePatternId`. Sharing the
helper with either would change winner semantics.

**F-02 - track-id predicate written three times**

The "is this playlist slot a real pattern" check is verbatim at three
sites - `playbackSimulation.ts`, `midi.ts`, and `mod.ts`:

```typescript
const hasPattern = typeof trackId === 'string' && trackId.trim() !== '' && trackId !== '--';
```

`useSongManagement.ts` has a near-match (`trimmed && trimmed !== '--'`)
on a pre-trimmed variable - a different check, kept as is.

**F-03 - export timing prologue repeated five times**

Every exporter that simulates the song resolves the same three values:
`frame ?? DEFAULT_SONG_FRAME`, `clock ?? DEFAULT_SONG_CLOCK`, and
`speed || 6`. `midi.ts` uses frame and speed, `mod.ts` uses all three,
and `vgm.ts`, `wav.ts`, `max.ts` use frame and clock. `asm.ts` uses
`YM_CLOCK` and stays - it resolves the clock only.

**Below threshold, recorded and skipped**

- `instrumentsByNormId` first-wins map: identical at
  `playbackSimulation.ts` and `midi.ts` (two sites). The third
  candidate in `useSequencerIntegration.ts` deliberately skips empty
  normalized keys - a '' lookup feeds `channelSustainRef`, so merging
  it is a behaviour change.
- `{ buffer, warnings }` result shape plus `Set<string>` accumulation:
  `midi.ts` and `mod.ts` only.
- Loop-index clamp (`Number.isFinite` then `min(length - 1, loop)`):
  `vgm.ts` and `mod.ts` only; the hooks compute loop indexes with
  different surrounding logic.
- Fixture loaders `readFileSync(...) + parseSongFromYaml` repeat
  across `test/exports/` and `songParser.test.ts`, but the export
  suites must pass unmodified - deferred to a later cycle.
- `sequencerWorklet.ts` is self-contained; chip-variant paths map the
  same `'AY'` check onto format-specific byte ids and do not share a
  shape; aria helpers are already per-component local; `App.tsx` and
  `ModalManager.tsx` show no repeated wiring at three sites.

## Goal

`src/utils/song/songLookup.ts` holds `isPatternTrackId` and
`buildPatternLookup`, covered by a new unit test. The simulation and
the two new exporters call the helpers. `src/exports/core.ts` gains
`resolveExportTiming(song)` returning `{ frameRate, chipClock, speed }`,
and the five timing prologues destructure it. Public APIs, map
semantics, and output bytes are unchanged.

## Plan

**Baseline snapshot**

Dump every fixture through every exporter into `work/` and record
SHA-256 hashes before any edit. This is the byte-identity reference.

**Add `src/utils/song/songLookup.ts`**

Export `isPatternTrackId(id: unknown): id is string` implementing the
exact F-02 predicate, and
`buildPatternLookup(patterns): Map<string, Pattern>` implementing the
exact F-01 block. Add `test/utils/song/songLookup.test.ts` covering
`--`, empty and whitespace ids, falsy entries, missing ids, and
first-wins on duplicate ids. No call site changes yet.

**Migrate `playbackSimulation.ts`**

Replace the map block with `buildPatternLookup(song.pattern)` and the
inline predicate with `isPatternTrackId(id)`. Run the simulation suite.

**Migrate `midi.ts`**

Same two replacements inside `buildTrackEvents`. Run `exportMidi`.

**Migrate `mod.ts`**

Same two replacements inside `exportSongToMod`. Run `exportMod`.

**Add `resolveExportTiming` and migrate five prologues**

Add the helper to `src/exports/core.ts`, then update `midi.ts`,
`mod.ts`, `vgm.ts`, `wav.ts`, and `max.ts` to destructure only the
fields they use. `asm.ts` is untouched. Run `test/exports/`.

**Verify byte identity and the full loop**

Re-run the snapshot script into a second `work/` directory, diff the
manifests, then run `typecheck`, `lint`, `format`, `build`, `test`.

## Risk

Low. The touched code sits on the export path and on the simulation
frame walk - both are pinned by `test/exports/` and
`test/utils/playback/` without modification. The winner semantics are
the one sharp edge: `buildPatternLookup` is first-wins, matching the
three migrated sites, and the last-wins hook map is deliberately not
migrated. No audio-path, synth, or worklet code changes.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`,
  `npm run build`, and `npm test` pass with zero errors and zero
  warnings.
- Byte-identical export output for every `test/fixtures/` input
  across asm, bin, vgm, wav, max, mod, and midi - proven by matching
  SHA-256 manifests before and after.
- Existing test suites pass unmodified; the only test change is the
  new `songLookup` suite.
- Coverage stays at or above the `vitest.config.ts` thresholds.
