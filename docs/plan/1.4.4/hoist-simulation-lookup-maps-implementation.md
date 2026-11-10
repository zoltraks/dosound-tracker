# Hoist the Simulation Lookup Maps Implementation Plan

## Summary

| Field         | Value                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Intent        | Replace per-tick instrument finds and per-line pattern finds in `simulateSong` with prebuilt lookup maps |
| Key decisions | First-wins insertion without an empty-key guard so the maps reproduce `Array.find` semantics exactly     |
| Open risks    | none - `test/exports/` holds the byte-identity guard                                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/hoist-simulation-lookup-maps.md`.

## Analysis

`simulateSong` runs three linear `song.pattern.find` calls per playlist entry (raw `===` on `p.id`), a `song.instrument.find` with `normalizeInstrumentId` at every note-on and at every tick for every channel holding an active note - roughly 9,000 tick-channel iterations scanning the instrument array per export, funnelled through all five export formats.

`Array.find` returns the first match, so the hoisted maps must insert first-wins (`if (!map.has(key))`). The instrument map deliberately skips the `if (key)` empty-key guard the sequencer's `instrumentLookup` uses: the simulation's `find` does not skip empty-normalizing instruments, so an instrument whose id normalizes to `''` must stay reachable through the `''` key for exact parity on degenerate input. The guard `if (!inst) continue` alone mirrors what `find` tolerates.

The duplicate normalization in the `new_note_only` comparison folds in through a parallel `channelInstrumentIds` cache: the active note's normalized id is computed once at note-on and reused both for the comparison and for the per-tick `map.get`, eliminating the per-tick `normalizeInstrumentId` calls entirely. The cache is maintained at exactly the three sites that assign `channelState.note` (playlist-entry reset, hard mute, note-on).

The comparison cannot route through the map itself: two unresolved ids with different normalized forms must still register as new, but `map.get` returns `undefined` for both, which would wrongly compare equal.

## Documentation Updates

None of `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` requires changes: this is an internal lookup-strategy change with byte-identical output, not a contract or behaviour surface. The first-wins and empty-key semantics are recorded here.

## Step by Step Implementation

**Build the maps once per simulation**

At the top of `simulateSong`, build `instrumentsByNormId` (`Map<string, Instrument>`, first-wins on `normalizeInstrumentId(inst.id)`, guarding only `!inst`) and `patternsByIdMap` (`Map<string, Pattern>`, first-wins on `p.id`, guarding only `!p`). Add `Pattern` to the type imports.

File to modify: `src/utils/playback/playbackSimulation.ts`.

**Route the per-entry pattern finds**

Replace the three `song.pattern.find` calls with `patternsByIdMap.get(playlistEntry.A/B/C)` - `find` and `get` both yield `undefined` on a miss, and first-wins insertion preserves the duplicate-id first-match.

File to modify: `src/utils/playback/playbackSimulation.ts`.

**Cache the normalized instrument id per channel**

Add `channelInstrumentIds: (InstrumentId | '')[]` parallel to `channels`, set to `noteInstrumentId` at note-on and `''` at the two note-clearing sites. In the `new_note_only` comparison replace `normalizeInstrumentId(channelState.note.instrument)` with the cached id; the row side still normalizes `noteOnRow.instrument` once.

File to modify: `src/utils/playback/playbackSimulation.ts`.

**Route the two instrument finds**

At note-on, reuse the already-computed `noteInstrumentId` for `instrumentsByNormId.get(noteInstrumentId)` and store it in the cache. In the per-tick block, resolve `instrumentsByNormId.get(channelInstrumentIds[ch] ?? '')` - the `?? ''` keeps the degenerate empty-id lookup identical to `find` while a held note's cached id is always non-empty.

File to modify: `src/utils/playback/playbackSimulation.ts`.

## Implementation Order

1. Update documentation (none required - recorded above)
2. Build the maps
3. Route the pattern finds
4. Add the id cache and route the instrument finds
5. Extend the simulation test for first-wins resolution
6. Run verification loop

## Testing Strategy

**Unit tests**

Extend `test/utils/playback/playbackSimulation.test.ts` with a duplicate-normalized-id case: a song carrying instruments `'0a'` and `'0A'` with distinguishable volume envelopes - the emitted frames must resolve the first instrument, pinning the first-wins contract the map shares with `find`.

**Integration tests**

The `test/exports/` suites are the byte-identity guard: `exportDump.test.ts` compares the full register-dump string, and `exportMax.test.ts`/`exportVgm.test.ts` pin the register stream through `simulateSong`. Any resolution-order change fails there.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Confirm export fixture output is byte-identical through `test/exports/`
