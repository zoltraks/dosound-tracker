# Add Export Formats

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Widen the export pipeline with tracker-native and interchange formats - |
|               | ProTracker MOD, Impulse Tracker IT, and MIDI are the candidates         |
| Key decisions | One format per module in `src/exports/`, each with its own fixtures -   |
|               | formats are evaluated and land individually                             |
| Open risks    | The three-channel YM2149 model maps imperfectly onto wider tracker      |
|               | formats - mapping losses must be explicit, never silent                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The export pipeline covers assembly, binary, register dump, VGM, WAV, and
MAX. Three further formats are candidates for composers who need the song
inside other toolchains.

- **ProTracker MOD** - a tracker-native module format; the three-channel
  song maps onto a four-channel module with mapping rules recorded.
- **Impulse Tracker IT** - a richer module format admitting more
  channels and instrument features; mapping losses are documented.
- **MIDI** - a note-level interchange file capturing the composition for
  DAW import; channel and instrument mapping rules are defined per
  format capability.

Each format is a self-contained module under `src/exports/` joining the
existing lazy export chunk, with fixtures in `test/fixtures/` and
coverage in `test/exports/`. Formats land individually - the window may
deliver a subset when evaluation finds one format's mapping too lossy to
ship honestly.

## Use Cases

- When the user exports to a delivered format, the modal offers it with
  the same strategy/scope conventions as the existing formats.
- When a mapping loss is unavoidable (for example noise channels to
  MIDI), the export reports what was dropped rather than guessing.
- When a format's evaluation fails fidelity, it is recorded as declined
  instead of shipped degraded.

## Hints

- `normalizeSongForExport` in `src/exports/core.ts` is the shared entry
  - new formats consume the same normalized song.
- Per-instrument and pattern-scope exports follow the existing
  `ExportType` surface where the format supports them.
- Licensing and spec provenance go to `COPYRIGHTS.md` - format specs
  are public documents, code stays original.

## Out of Scope

- Import paths for these formats - this record is export only.
- Formats outside the three candidates (sid, sap, etc.) - new formats
  get their own records.
