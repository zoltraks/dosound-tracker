# Dual-Chip Song Data Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | Extend the song model, YAML format, playlist types, stereo resolution, playback simulation, and pure song utilities to six channels (A-F) across two chips, per `docs/change/1.6.4/dual-chip-song-data.md`.                                                                                                                          |
| Key decisions | `D`/`E`/`F` stay optional on line entries (absent resolves to `--`); `chipCount` is an optional song field emitted only for two-chip songs; effective chip count derives from declared `chipCount` else from D/E/F pattern references; `playbackSimulation` emits an additive `registers2` stream for chip 2 only on two-chip songs. |
| Open risks    | Stored JSON and test fixtures carry three-key line entries - optional fields keep them valid; `useTrackOperations` keyboard-section mapping (`trackA`-`trackC`) stays three-channel until the UI record.                                                                                                                             |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.4/dual-chip-song-data.md`.

## Documentation Updates

- `FORMAT.md` - document the `chipCount` field, `D`/`E`/`F` playlist keys, and six-member `stereo` overrides.
- `SPECIFICATION.md` - record the six-channel song model and the A-C/D-F chip split.
- `PROJECT.md` / `ARCHITECTURE.md` - update only if the channel vocabulary section exists there.

## Type and State Updates

**Type definitions**

File to modify: `src/synth/SoundDriver.ts`.

- `Line` gains optional `D?: string; E?: string; F?: string`.
- `SongStereo` gains optional `D?: number; E?: number; F?: number`.
- `Song` gains optional `chipCount?: 1 | 2`.
- Add `SongChannelId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'`.

File to modify: `src/constants/song.ts`.

- `SONG_CHANNEL_IDS`, `SONG_CHANNEL_COUNT = 6`, `SINGLE_CHIP_CHANNEL_COUNT = 3`.
- `chipIndexForChannelId`, `channelIdsForChip`, `channelCountForChipCount` helpers.
- `STEREO_LAYOUTS` values widen to six pans; add a `dual` layout placing chip 1 left and chip 2 right.

File to modify: `src/types/playlist.ts`.

- `PlaylistEntry` gains optional `D`/`E`/`F`; normalize/serialize pass them through.

File to modify: `src/utils/track/trackSelection.ts`.

- `TrackSelectionTrackId` widens to `SongChannelId`; `TRACK_IDS` lists all six.

## Step by Step Implementation

**Channel vocabulary and types**

Add the channel-id union, channel lists, chip mapping helpers, and widen `Line`, `SongStereo`, `Song`, `PlaylistEntry`, and the track-selection id.

Files: `src/synth/SoundDriver.ts`, `src/constants/song.ts`, `src/types/playlist.ts`, `src/utils/track/trackSelection.ts`, `src/utils/song/songStereo.ts`.

**Stereo resolution for six channels**

`normalizeSongStereo` accepts `D`/`E`/`F`; `resolveChannelPans` returns a six-tuple - indices 0-2 resolve exactly as today, 3-5 resolve from the same layout/override rules. Single-channel stereo input keeps current output on indices 0-2.

File: `src/utils/song/songStereo.ts` (+ `src/constants/song.ts` layouts, `src/hooks/song/useChannelPans.ts` return type).

**Parser: chipCount, D/E/F keys, stereo members**

`songParser` reads an optional `chipCount` (1 or 2, tolerant of string form), `D`/`E`/`F` line keys, and the widened stereo node. Effective chip count: declared value wins; otherwise 2 when any line entry references a pattern on D/E/F; otherwise 1.

File: `src/utils/song/songParser.ts`.

**Serializer: emit only what exists**

`songIO` emits `chipCount` only for two-chip songs, `D`/`E`/`F` row keys only when they hold a pattern id, stereo `D`/`E`/`F` members when set, and `quoteLineValues` covers `[ABCDEF]`. Single-chip output stays byte-identical.

File: `src/utils/song/songIO.ts`.

**Playback simulation: two register files**

`simulateSong` builds the channel list from the song's effective channel count (3 or 6), keeps per-channel state for all six, and writes chip-2 channels (index 3-5, local channel `ch - 3`) into a second register file. `SimulationFrame` gains optional `registers2`; `channels` and `toneMeta` cover all active channels. Single-chip songs emit identical frames.

File: `src/utils/playback/playbackSimulation.ts`.

**Pure song utilities**

`songRenumber` remaps D/E/F, `songOptimize` collects D/E/F pattern ids, `transposeUtils` accepts `SongChannelId` targets and iterates all six on `all` scope, `useTrackPattern`/`useTrackOperations` data-level signatures widen to `SongChannelId` (keyboard-section mapping stays three-channel), playlist entry construction sites stay valid through optional fields.

Files: `src/hooks/song/songRenumber.ts`, `src/hooks/song/songOptimize.ts`, `src/utils/transpose/transposeUtils.ts`, `src/hooks/song/useTrackPattern.ts`, `src/hooks/song/useTrackOperations.ts`, `src/hooks/song/usePlaylistOperations.ts`, `src/hooks/song/usePatternManagement.ts`.

**Tests**

New/updated suites under `test/utils/song/`, `test/utils/playback/`, `test/types/` (or nearest existing homes): parser round-trip for two-chip songs, serializer emission rules, stereo resolution, simulation dual-stream output, renumber/optimize/transpose over six channels, playlist mapping, track-selection ids.

## Implementation Order

1. Documentation (`FORMAT.md`, `SPECIFICATION.md`)
2. Type definitions and channel vocabulary
3. Stereo normalization and resolution
4. Parser and serializer
5. Playback simulation
6. Song utilities
7. Tests
8. Verification loop

## Testing Strategy

**Unit tests**

- `chipCount` parse/emit round-trips; absent field defaults; string form tolerated.
- `D`/`E`/`F` line keys parse and emit only when they hold pattern ids.
- Stereo `D`/`E`/`F` overrides resolve; old three-member stereo unchanged.
- Simulation on a two-chip song emits `registers2` with chip-2 writes and six `channels`; single-chip frames unchanged.
- Renumber/optimize/transpose cover D/E/F pattern ids.

**Integration tests**

- A two-chip YAML fixture loads, edits through the data utilities, and saves byte-stable.
- Existing three-channel fixtures and golden emission files remain unchanged.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm test`
- `npm run test:coverage`
- `npm run test:e2e`
