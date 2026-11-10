# Specification Audit - Hoist the Simulation Lookup Maps

## Document Information

|            |                                                                  |
| ---------- | ---------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/hoist-simulation-lookup-maps.md`              |
| Plan       | `docs/plan/1.4.4/hoist-simulation-lookup-maps-implementation.md` |
| Audit Date | 2026-11-10                                                       |

## Completeness

| Change-record requirement                                                 | Covering plan step                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `Map<normalizedId, Instrument>` built once per `simulateSong`             | Step 1                                               |
| `Map<patternId, Pattern>` built once per `simulateSong`                   | Step 1                                               |
| First-wins `if (!map.has(key))` insertion - no resolution-order change    | Steps 1-2 + Analysis (find parity)                   |
| Fold the note-only comparison's duplicate normalization into the same fix | Step 3                                               |
| Export output byte-identical for the fixtures                             | Testing Strategy (`test/exports/` guard)             |
| Out of Scope: `useSequencerIntegration`/`App.tsx` map merge               | Respected - `merge-instrument-id-lookup-maps` record |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Keyed with the same first-wins rule `useSequencerIntegration` uses" admits
copying its `if (key)` empty-key guard verbatim or reproducing `find`
semantics. The record's own framing - "the maps must not change resolution
order" - resolves it toward `find` parity: the simulation's `find` never
skipped empty-normalizing instruments, so the map must not either. The
deviation from the sequencer guard is recorded as deliberate.

## Implementability

| Step | Check                                                                             | Result |
| ---- | --------------------------------------------------------------------------------- | ------ |
| 1    | `normalizeInstrumentId`, `Instrument`, `Song` already imported; `Pattern` addable | Pass   |
| 2    | Three `song.pattern.find` sites verified at the playlist-entry head               | Pass   |
| 3    | `channelState.note` assigned at exactly three sites; all covered by the cache     | Pass   |
| 4    | Both `song.instrument.find` sites verified; `noteInstrumentId` already computed   | Pass   |

`Map.get` and `Array.find` both yield `undefined` on a miss, so the
`patterns[0]?.step` optional chains and `instrument?.sustain` reads are
unchanged.

## Fidelity

- Enumeration fidelity - all five lookup sites named in the record map to steps; the note-only comparison fold is covered.
- Vocabulary freeze - instrument keys are `normalizeInstrumentId` output; pattern keys are raw `p.id`, matching the raw `===` the finds used.
- Cross-party parity - every `simulateSong` consumer (`asm`, `vgm`, `wav`, `max`, `bin` via `asm`) gets identical frames; no caller-side change needed.
- Constants completeness - no new constants; map sizing is implicit.
- Boundary decisions - `channelInstrumentIds` stays function-local, never exposed on `ChannelState` or `SimulationFrame`, so the exported interfaces are unchanged.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
