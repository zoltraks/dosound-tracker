# Reconcile documentation set with the implementation

**Type:** Chore

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | Align the documentation set and the user manual with verified code |
| Key decisions | docs are corrected to match implementation, never the reverse      |
| Open risks    | `none`                                                             |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

A deep analysis of the implementation against the active documentation set found factual drift: version numbers that moved, a constants module missing from the specification, a navigation order that diverges from `NAVIGATION_ORDER`, an undocumented persistence key, and stale or invented claims in the user manual. Each documented claim is corrected to reflect what the code actually does. `MAX.md` is externally managed and must not be edited.

**Documentation corrections**

- `ARCHITECTURE.md`: the MAX export description names "Max/MSP" and the "Max visual programming environment" - the format is Music Assembly eXchange per `FORMAT.md` and `MAX.md`. The same file and `README.md` say "Electron 42" while `package.json` pins Electron 45.
- `SPECIFICATION.md`: the Constants section lists five files but `src/constants/` has six - `modal.ts` (modal titles and confirm texts) is undocumented. The Session Persistence section omits the `INSTRUMENT_OCTAVES` storage key persisted by `useInstrumentOctaves`.
- `PROJECT.md`: the Navigation Block Order lists "Theme mode" (not a navigation section) and a sequence that does not match `NAVIGATION_ORDER` in `src/constants/navigation.ts` - the order is piano, octave, commands, tracks A-C, mode, volume, shift, pitch, noise, song information, playlist, instrument list.
- `README.md`: "Electron 42" corrected to Electron 45.

**User manual corrections** (`public/MANUAL.md`)

- "MAX specification v1.6" corrected to v1.7.
- "Buffer size: 256 samples, latency <10ms, CPU <5%" - invented metrics with no source in the implementation - removed or reworded qualitatively.
- "Per-instrument MIDI configuration with note range assignment" - the instrument MIDI model carries only `channel` and `program` - the claim is corrected.
- Versioned example filename in the quarantine workaround (`dosound-tracker-1.2.0-...`) kept as an example - acceptable, but may be generalized.

## Out of Scope

- `MAX.md` - externally managed document.
- Code changes of any kind - this record is documentation-only.
- Restricted directories' contents (`docs/change/`, `docs/plan/`, `docs/refactoring/` and others).
