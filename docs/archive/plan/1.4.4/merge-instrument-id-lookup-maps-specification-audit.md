# Specification Audit - Merge the Instrument-Id Lookup Maps

## Document Information

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| Change     | `docs/change/1.4.4/merge-instrument-id-lookup-maps.md`              |
| Plan       | `docs/plan/1.4.4/merge-instrument-id-lookup-maps-implementation.md` |
| Audit Date | 2026-11-10                                                          |

## Completeness

| Change-record requirement                                      | Covering plan step                                   |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| Characterize the duplicate-key case before choosing the winner | Analysis (first-wins vs last-wins divergence stated) |
| Decide the winner semantics for duplicate normalized keys      | Analysis (first-wins, `find` parity) + step 3        |
| Merge to one map                                               | Steps 1-3 (single `instrumentLookup` survives)       |
| Update the consumers                                           | Steps 2-3 (bridge option, sustain/MIDI read)         |
| Consult audio-critical principles before touching memoization  | Audio-Critical Requirements section                  |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Merge to one map" admits two readings: keep the App-side map and feed it
everywhere, or keep the integration-side map and drop the App-side one.
The record's own description resolves it - `instrumentLookup` is the
first-wins map the audio path already uses, and the App-side map is the
redundant last-wins copy, so the integration-side map survives.

## Implementability

| Step | Check                                                                         | Result |
| ---- | ----------------------------------------------------------------------------- | ------ |
| 1    | `App.tsx` builds `instrumentsById` and passes it to `usePlaybackBridge`       | Pass   |
| 2    | `usePlaybackBridge` forwards `instrumentsById` into `useSequencerIntegration` | Pass   |
| 3    | Sustain/MIDI read site calls `instrumentsById.get(instId)` inside the hook    | Pass   |

The `useInstrumentActions` injection keeps `normalizeInstrumentId` needed in
`App.tsx`, so the import survives step 1.

## Fidelity

- Enumeration fidelity - the record names exactly two maps; both are covered.
- Vocabulary freeze - the winning contract is the existing `instrumentLookup` first-wins semantics, unchanged.
- Cross-party parity - register writes and sustain/MIDI reads resolve through one map after the change, which is the parity the record demands.
- Constants completeness - no new constants introduced.
- Boundary decisions - `usePlaybackBridge`'s option surface shrinks by one field; the record's Out-of-Scope item (wider `useSequencerIntegration`/`App.tsx` decomposition) is respected.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
