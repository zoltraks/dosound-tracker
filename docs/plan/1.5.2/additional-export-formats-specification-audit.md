# Specification Audit - Add Export Formats

## Document Information

|            |                                                               |
| ---------- | ------------------------------------------------------------- |
| Change     | `docs/change/1.5.2/additional-export-formats.md`              |
| Plan       | `docs/plan/1.5.2/additional-export-formats-implementation.md` |
| Audit Date | 2026-11-11                                                    |

## Completeness

- Three candidates evaluated individually - covered by the record's
  Evaluation section and the plan's Analysis: MOD and MIDI ship, IT is
  deferred with the reason recorded.
- One format per module in `src/exports/` joining the lazy chunk -
  covered by the two module steps plus the barrel step; all handlers
  import through `exports/export.ts`.
- Modal offers the formats with the same strategy/scope conventions -
  covered by the context-handler steps reusing `ExportContext` and
  `getScopedSongForPattern`/`exportInstrumentWith` for song, pattern,
  and instrument scopes.
- Mapping losses reported, never silent - covered by the `warnings`
  result member surfaced in the export summary in both module steps
  and the file-operations step.
- Fixtures and coverage in `test/fixtures/` and `test/exports/` -
  covered by the testing strategy; the new suites reuse the committed
  `song-vgm-tone.yaml` fixture rather than adding files.
- Import paths out of scope - neither module reads module files back;
  no parser is added.

## Ambiguity

- "The same strategy/scope conventions as the existing formats" -
  resolved as scope support (song, pattern, instrument) matching every
  format; the strategy selector does not apply to MOD or MIDI since
  neither format defines strategies, matching WAV's strategy-free
  handling.
- "Tracker-native MOD" - resolved as the ProTracker 31-sample variant
  (`M.K.` tag, four channels), the reference implementation of the
  format family.
- "Note-level interchange" for MIDI - resolved as SMF type 1 with a
  conductor track plus one track per tracker channel, not the
  single-track type 0.
- "Reports what was dropped" - resolved as strings on the export
  result printed into the export summary, not thrown errors or silent
  omission.

## Implementability

- `normalizeSongForExport` and `exportInstrumentWith` exist in
  `src/exports/core.ts` - verified; both modules consume them.
- `simulateSong` exposes `tick`, `lineIndex`, `playlistIndex`,
  `patternLineIndex`, `registers`, and `channels` on each frame -
  verified in `src/utils/playback/playbackSimulation.ts`; the MOD
  step's `tick === 0` filter selects exactly one snapshot per row.
- `instrument.midi` carries optional `channel` and `program` on the
  `Instrument` interface in `src/synth/SoundDriver.ts` - verified.
- The handler chain `ExportModal` -> `ModalManager` -> `useAppModals`
  -> `useExportModal` -> `useFileOperations` -> `App.tsx` is verified
  end to end; the new handlers replicate the VGM path at each hop.
- The e2e helpers `openExportModal` and `clickAndDownload` exist in
  `e2e/helpers.ts` - verified; the new flows mirror the VGM/MAX specs.
- No new dependencies are introduced; both encoders are hand-rolled
  byte writers like `vgm.ts` and `max.ts`.

## Fidelity

- MOD constants enumerated: `M.K.` at 1080, 31 sample records of 30
  bytes, 20-byte title, order list 128 entries, restart `0x7F`,
  64 rows per pattern, period table 36 entries 856..113, Amiga clock
  7093789.2, speed clamp 31, BPM cap 255, volume scale `v * 64 / 15`.
- MIDI constants enumerated: `MThd`/`MTrk`, format 1, division 96,
  24 ticks per tracker row, tempo `4 * speed * 1e6 / frame` clamped
  to `0xFFFFFF`, note `(octave + 1) * 12 + index` clamped 0..127,
  velocity `max(1, v * 127 / 15)`, CC7 for volume-column changes.
- Boundary decisions recorded: MOD rows pack contiguously (no
  position padding), the fourth channel holds only the speed/BPM
  `F` effects, restart lands on the containing pattern,
  `instrument.midi` overrides channel and program, `--` slots
  sustain and real slots cut held notes.
- Deterministic export invariant: both encoders derive every byte
  from the song - the noise sample uses a fixed-seed LFSR, no wall
  clock or random source enters either path.
- Vocabulary freeze: `.mid`/`MIDI` and `.mod`/`MOD` naming stated once
  across the modal, filename helpers, documentation, and tests.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
