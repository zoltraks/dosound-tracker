# Hoist the simulation lookup maps

**Type:** Enhancement

**Source:** 1.4.4 self-healing optimization survey

## Summary

| Field         | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Intent        | Replace per-tick instrument finds and per-line pattern finds with prebuilt lookup maps       |
| Key decisions | `Map<normalizedId, Instrument>` and `Map<patternId, Pattern>` built once per `simulateSong`  |
| Open risks    | Duplicate normalized ids need the recorded first-wins semantics, not the raw `map.set` order |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`src/utils/playback/playbackSimulation.ts` calls `normalizeInstrumentId` inside `song.instrument.find(...)` on every tick for every channel with an active note (~line 233) and at every note-on (~line 204) - roughly 9,000 tick-channel iterations each scanning the instrument array per export. It also runs three linear `song.pattern.find` calls per playlist entry (~lines 99-103). All five export formats funnel through `simulateSong`, making this the largest single CPU item in every export.

Build a normalized instrument map and a pattern map once per simulation, keyed with the same first-wins rule `useSequencerIntegration` uses, and look up per tick in O(1). The duplicate normalization at the note-only comparison (~line 193) folds into the same fix.

## Hints

- Match the first-wins `if (!map.has(key))` insertion rule - the maps must not change resolution order for duplicate normalized ids.
- Export output must stay byte-identical for the fixtures - `test/exports/` is the guard.

## Out of Scope

- The `useSequencerIntegration`/`App.tsx` map merge - tracked by `merge-instrument-id-lookup-maps.md`.
