# Merge the normalized instrument-id lookup maps

**Type:** Fix

**Source:** 1.4.3 window refactoring survey

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | Unify `instrumentLookup` and `instrumentsById`, the two normalized-id maps over the same song |
| Key decisions | The maps diverge on duplicate normalized keys - first-wins versus last-wins                   |
| Open risks    | Choosing a winner changes behavior for songs with colliding normalized ids                    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`useSequencerIntegration.ts` builds a memoized `instrumentLookup` keyed by `normalizeInstrumentId` with first-wins semantics, while `App.tsx` builds `instrumentsById` with last-wins `map.set` semantics and passes it down as a prop. After the 1.4.3 normalization alignment both maps key the same contract over the same `currentSong.instrument` list. Decide the winner semantics for duplicate normalized keys, merge to one map, and update the consumers.

## Hints

- The maps sit on the audio path - consult the audio-critical development principles before touching memoization.
- Characterize the duplicate-key case before choosing the winner.

## Out of Scope

- The `useSequencerIntegration` and `App.tsx` decomposition tracked elsewhere.
