# Merge the Instrument-Id Lookup Maps Implementation Plan

## Summary

| Field         | Value                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Intent        | Unify `instrumentLookup` and `instrumentsById` into one normalized-id map on the sequencer path        |
| Key decisions | First-wins resolution for duplicate normalized ids - `Array.find` semantics the whole codebase uses    |
| Open risks    | Sustain and MIDI note-on resolve the first instrument instead of the last for colliding normalized ids |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/merge-instrument-id-lookup-maps.md`.

## Analysis

Two normalized-id maps over `currentSong.instrument` exist on the sequencer path. `useSequencerIntegration.ts` builds `instrumentLookup` with first-wins insertion (`if (!map.has(key))`), feeding every `updateChannelWithInstrument` register-write call. `App.tsx` builds `instrumentsById` with last-wins `map.set` semantics and forwards it through `usePlaybackBridge` into `useSequencerIntegration`, where a single read at the sustain-resolution site resolves the instrument for sustain handling and the MIDI note-on send.

For a song with colliding normalized ids (for example `'a'` and `'A'`, or `'$0F'` and `'0F'`) the two paths already resolve different instruments: the register writes play the first, while sustain and MIDI pick the last. That divergence is the defect the record fixes.

First-wins is the correct winner. Every other resolution surface - `Array.find` in `playbackSimulation.ts`, `playbackUtils.ts` fallback order, and the pre-merge `instrumentLookup` itself - resolves the first matching element. `Map` iteration order is insertion order, so first-wins reproduces `find` exactly; last-wins has no `find` analogue and was incidental to `map.set` overwrite order.

`instrumentsById` has exactly one consumer chain: `App.tsx` -> `usePlaybackBridge` options -> `useSequencerIntegration` parameter. Removing the App-side map and dropping the forwarded prop leaves the integration's own `instrumentLookup` as the single map, which then also serves the sustain/MIDI read. No other file reads `instrumentsById`.

## Documentation Updates

None of `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` requires changes: the merged map is internal wiring on a documented audio path, and the first-wins contract it adopts is already the de-facto semantics of every other instrument resolution surface. The decision is recorded here and reported in the window review.

## Audio-Critical Requirements

- The change does not alter React render timing, hook counts, or memoization structure - `useSequencerIntegration` keeps its existing `useMemo`, and `App.tsx` loses one.
- `useCallback`/`useMemo` dependency arrays are not modified except dropping the removed `instrumentsById` entry from the sequencer callback wiring.
- The resolved instrument for duplicate normalized ids changes on the sustain/MIDI path only - register writes already used first-wins, so playback output is unchanged for non-colliding songs and made self-consistent for colliding ones.
- Audio timing verification: the sequencer and synth suites plus a manual playback check of a song with an instrument sustain.

## Step by Step Implementation

**Drop the App-side map and prop**

Remove the `instrumentsById` `useMemo` block in `App.tsx` and its entry in the `usePlaybackBridge` call. Keep `normalizeInstrumentId` imported only if another App call site still needs it (the `useInstrumentActions` injection does).

File to modify: `src/App.tsx`.

**Drop the forwarded option**

Remove `instrumentsById` from the `usePlaybackBridge` options interface and from the object forwarded to `useSequencerIntegration`.

File to modify: `src/hooks/playback/usePlaybackBridge.ts`.

**Resolve through the single map**

Remove the `instrumentsById` parameter from `useSequencerIntegration` and read `instrumentLookup.get(instId)` at the sustain-resolution site so register writes, sustain, and MIDI note-on share the first-wins map. Remove the dead `instrumentsById` dependency entry from the callback wiring.

File to modify: `src/hooks/sequencer/useSequencerIntegration.ts`.

## Implementation Order

1. Update documentation (none required - recorded above)
2. `useSequencerIntegration.ts` single-map resolution
3. `usePlaybackBridge.ts` option removal
4. `App.tsx` map and prop removal
5. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions are introduced. Existing coverage stands: `test/utils/playback/playbackUtils.test.ts` exercises `updateChannelWithInstrument` map resolution; `test/utils/playback/playbackSimulation.test.ts` pins loose-vs-canonical id resolution equality.

**Integration tests**

`useSequencerIntegration` carries no dedicated suite - the duplicate-id resolution is a live-path edge case best guarded by the targeted loop plus the review record.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Verify playback of a song with an instrument sustain - register path unchanged for non-colliding ids
