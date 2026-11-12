# Align the Instrument-Id Normalization Implementation Plan

## Summary

| Field         | Value                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Intent        | Give instrument-id parsing one accepted-input contract through `normalizeInstrumentId`                 |
| Key decisions | The color map and its lookup route as a pair; the `{1,2}` hex gate stays on top of the shared contract |
| Open risks    | `$`-prefixed instrument numbers now load instead of throwing - a deliberate, recorded loosening        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.3/align-instrument-id-normalization.md`.

## Analysis

Three contracts exist, not two. The canonical `normalizeInstrumentId` in `src/utils/playback/playbackUtils.ts` trims, strips one leading `$`, uppercases, pads one-char hex to two digits, and passes non-hex through uppercased. A loose `trim().toUpperCase()` contract covers about ten sites, and a raw-equality contract keys `instrumentsById` in `App.tsx` and the finds in `playbackSimulation.ts` - a song carrying `instrument: "5"` resolves in the playback path but misses the raw lookups, a live divergence.

`getInstrumentColorForNote` does not pad because `buildInstrumentColorMap` keys the map unpadded - the divergence is incidental but coupled, safe to unify only as a pair. Its `{1,2}` hex gate is semantic: non-hex ids never color, and the gate stays on top of the shared normalizer.

`note.instrument` and `inst.id` are plain `string` while `normalizeInstrumentId` returns the branded `InstrumentId`, which is assignable to `string` - routing introduces no type errors.

## Documentation Updates

- `FORMAT.md` — the instrument `number` loader rule records the accepted-input contract: trimmed, optional leading `$`, one-character hex padded to two digits, non-hex still rejected.

## Step by Step Implementation

**Record the loader contract**

Extend the instrument `number` bullet so it states string values load trimmed, an optional leading `$` is stripped, and a one-character hex id pads to two digits - the same contract `normalizeInstrumentId` defines.

File to modify: `docs/FORMAT.md`.

**Route the song parser**

In the pattern-step parse block, store `normalizeInstrumentId(ln.instrument)` under the existing `typeof === 'string'` guard (non-string still defaults to `'00'`). In the instrument `number` block, normalize before the slot-index check so `'5'` stores as `'05'` and `'$05'` loads; non-hex values still throw `Invalid instrument number`.

File to modify: `src/utils/song/songParser.ts`.

**Route the track clipboard paste**

In the clipboard step parse, keep the `typeof === 'string'` guard (the numeric `7` -> `'00'` pin stands) and store `normalizeInstrumentId(ln.instrument)` for string values.

File to modify: `src/utils/track/trackClipboard.ts`.

**Route the color map pair**

Key `buildInstrumentColorMap` by `normalizeInstrumentId(inst.id)` and make `getInstrumentColorForNote` normalize through the same function before applying its `^[0-9A-F]{1,2}$` gate - the gate stays, documented as the deliberate divergence, so non-hex ids still never color.

File to modify: `src/utils/track/trackRendering.ts`.

**Route the optimize and renumber paths**

In `useSongManagement.ts` route every instrument-id normalization through `normalizeInstrumentId`: the used-ids set keys and membership checks in `optimizeSongData` (including the numeric-legacy branch, routed as `normalizeInstrumentId(Math.floor(note.instrument))`), and the `instrumentIdMap` keys, lookups, sort key, and summary ids in `renumberSongData`. Pattern-id and chip normalizations stay as they are - different domains.

File to modify: `src/hooks/song/useSongManagement.ts`.

**Route the instrument move remap**

Route the `instrumentIdMap` key and note lookups in `moveInstrumentAndRemapPatterns` through `normalizeInstrumentId`, and the matching lookup in `useInstrumentActions.ts` - the same key space must move together.

Files to modify: `src/utils/instrument/instrumentOperations.ts`, `src/hooks/instrument/useInstrumentActions.ts`.

**Replace the inline copy and heal the raw contract**

Delete the verbatim inline copy of `normalizeInstrumentId` inside `useSequencerIntegration.ts` and call the imported function. Key `instrumentsById` in `App.tsx` by `normalizeInstrumentId(inst.id)` and normalize the lookup at `useSequencerIntegration.ts` - the sustain and MIDI resolution then matches the playback path. In `playbackSimulation.ts` compare against `normalizeInstrumentId` on both sides of the instrument finds so exports resolve the same ids playback does.

Files to modify: `src/hooks/sequencer/useSequencerIntegration.ts`, `src/App.tsx`, `src/utils/playback/playbackSimulation.ts`.

**Add characterization tests**

Pin the loose inputs `'5'`, `'$0F'`, `'0f'`, `'0F '` at the song parser (note instrument and instrument `number`), the clipboard paste, the color-map pair, the optimize and renumber remaps, and a `playbackSimulation` case proving a non-canonical id resolves to its instrument.

Files to modify: `test/utils/song/songParser.test.ts` or `songParserGaps.test.ts`, `test/utils/track/trackClipboard.test.ts`, `test/utils/track/trackRendering.test.ts` (new if absent), plus a `useSongManagement` test file and `test/utils/playback/playbackSimulation.test.ts` as conventions place them.

## Implementation Order

1. Update `FORMAT.md`
2. Route `songParser.ts` and `trackClipboard.ts`
3. Route the `trackRendering.ts` pair
4. Route `useSongManagement.ts`
5. Route `instrumentOperations.ts` and `useInstrumentActions.ts`
6. Route `useSequencerIntegration.ts`, `App.tsx`, and `playbackSimulation.ts`
7. Add the characterization tests
8. Run the verification loop

## Audio-Critical Requirements

- The touched paths feed playback-time lookups (`useSequencerIntegration`, `playbackSimulation`) but change only id-string normalization - no render timing, `useCallback`/`useMemo` dependency, or state pattern changes.
- `useSequencerIntegration` and `App.tsx` sit on the audio path - the edits are map-key and lookup normalization only; no hook dependencies move.
- Export fixtures must stay byte-identical for canonical songs - `test/exports/` is the guard.

## Testing Strategy

Characterization tests for the loose-input contract at every routed site, plus the existing suites as regression guard. No behavior changes for canonical ids - the exports suite proves it.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test` targeted at the touched suites, then the full suite
- Exports suite passes unchanged - byte-identical output for canonical songs
