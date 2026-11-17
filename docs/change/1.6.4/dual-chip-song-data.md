# Extend the song data model and file format to six channels across two chips

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Foundation for dual AY/YM chip support: songs can declare and carry six tracker channels (A-F) split across two chips, persisted through the song file format, clipboard, history, and every pure song utility. Later records add the audio engines, track UI, and export handling on top of this model. |
| Key decisions | Channel letters extend A/B/C to A-F; channels A-C belong to chip 1, D-F to chip 2. Chip count is a song-level declaration; absent means one chip. Instruments stay a single shared table referenced by id from any channel.                                                                              |
| Open risks    | `playbackSimulation` currently emits a single 3-channel register stream; it must model two independent chip register files so later export work can select a stream. Several persisted shapes (playlist entries, track selection, stereo pans) assume three channels and need migration-safe extension.  |

## Description

The tracker today models exactly three channels: `Line` entries carry `A`, `B`, `C` pattern ids, `SongStereo` carries three pan overrides, `STEREO_LAYOUTS` maps names to three pans, `TrackSelectionTrackId` is `'A' | 'B' | 'C'`, and the playback simulation builds three `ChannelState` entries writing one register file.

This change extends the data layer to six channels without breaking existing songs or files:

- A song declares how many chips it uses (one or two). A single-chip song is the default and must remain byte-compatible on save where the format allows.
- Playlist line entries gain optional `D`, `E`, `F` slots alongside `A`, `B`, `C`, each holding a pattern id or `--`. Channels A-C address chip 1, D-F address chip 2.
- The stereo model extends to six channel pans. Existing three-channel songs keep their current pan resolution; two-chip songs resolve a six-channel layout whose default places chip 1 toward the left and chip 2 toward the right, with per-channel overrides preserved.
- The YAML song parser accepts the new fields and the serializer emits them only when present, so single-chip files keep their current shape. Legacy `trackA`/`trackB`/`trackC` aliases keep working.
- `playbackSimulation` models six channel states and two independent register files (one per chip) so downstream consumers can select either stream. Single-chip songs produce identical output to today on the chip-1 stream.
- Every pure song utility that iterates channels - lookup, transpose, optimize, renumber, clipboard, pattern utilities, edit history, persistence and storage keys - handles six channels. Track selection persistence accepts `D`-`F` ids while remaining valid for stored `A`-`C` values.
- Validation accepts the new fields and rejects malformed ones consistently with existing rules.

## Use Cases

- When a two-chip song file is loaded, its D/E/F playlist entries and patterns survive a save/load round-trip unchanged.
- When a single-chip song is loaded and saved, the emitted file carries no six-channel fields it did not have.
- When the playback simulation runs a two-chip song, it produces two independent register streams - one per chip - that later export work can select between.
- When older persisted state (track selection, UI state, history snapshots) is restored, missing D/E/F data resolves to the single-chip defaults.

## Hints

- `src/synth/SoundDriver.ts` holds the `Line`, `SongStereo`, and `Song` interfaces; `src/types/playlist.ts` mirrors the playlist entry shape with branded ids.
- `src/utils/song/songParser.ts` and `src/utils/song/songIO.ts` own the YAML boundary; `src/utils/song/songStereo.ts` and `src/constants/song.ts` own pan resolution.
- `src/utils/playback/playbackSimulation.ts` hardcodes three `ChannelState` entries and one register file around lines 76-133.
- Roughly forty files reference the `A`/`B`/`C` channel vocabulary; `src/utils/track/trackSelection.ts` persists the selected track id.
- Keep `D`/`E`/`F` optional on the line-entry type so existing fixtures and stored JSON stay valid; normalize absent slots to `--` at the boundaries that need them.

## Out of Scope

- Audio engine changes (second `SoundEngine` instance, per-chip routing, panning to the output) - a later record.
- Settings UI for enabling two chips or choosing the visible track count - a later record.
- Track panel, playlist, keyboard, and focus UI for six channels or the A-F switcher - a later record.
- Export modal fields, per-format dual-chip output, and the DUMP/EQ panels - a later record.
- Per-chip instrument tables; instruments remain shared across both chips.
