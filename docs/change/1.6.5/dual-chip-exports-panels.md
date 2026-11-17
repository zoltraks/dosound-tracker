# Export dual-chip songs with a selectable stream and update the DUMP and EQ panels

**Type:** Feature

**Blocked by:** `docs/change/1.6.4/dual-chip-song-data.md` (six-channel model and per-chip simulation) and `docs/change/1.6.5/dual-engine-audio-panning.md` (dual engines) - exports consume both.

## Summary

| Field         | Value                                                                                                                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Every export path handles two-chip songs correctly. ASM and BIN emit a single AY/YM register stream, so the export modal gains a chip selector; other formats follow their own capability (mixed WAV, per-chip or combined streams elsewhere). The DUMP and EQ panels present both chips. |
| Key decisions | The export modal stays a single modal and gains the required chip-stream field only where a format emits one stream. DUMP shows per-chip registers; EQ shows all six channels from both engines.                                                                                          |
| Open risks    | Eight export modules consume `playbackSimulation` output shaped for one stream; VGM, MOD, MIDI, MAX, DATA, and DUMP each need an explicit dual-chip decision recorded in the implementation plan.                                                                                         |

## Description

The export modal keeps its current single-dialog layout (What / Strategy / Format) and adds the fields two-chip songs require:

- A chip-stream selector for formats that emit exactly one AY/YM stream - ASM and BIN. The user picks chip 1 (channels A-C) or chip 2 (channels D-F); the emitted file contains only that chip's register stream. Single-chip songs hide or fix the selector to chip 1.
- Any additional per-format options the implementation analysis requires, kept inside the same modal.

Per-format behaviour for two-chip songs:

- ASM and BIN: single stream as selected above.
- DUMP export and the on-screen DUMP panel: present both chips' register state, with a way to view each chip.
- EQ panel: six channel meters fed by both engines, mute toggles per channel.
- WAV: both chips mixed into the rendered audio.
- VGM, MOD, MIDI, MAX, DATA: each format's dual-chip capability is decided during planning - where the format cannot carry two chips, the record documents the chosen behaviour (single selected stream, merged channels, or explicit limitation) rather than silently dropping channels.

The export summary strings and file naming reflect the selected stream where relevant.

## Use Cases

- When a two-chip song is exported as ASM or BIN, the modal requires a chip choice and the file contains only that chip's stream.
- When a two-chip song is exported as WAV, both chips are audible in the rendered file.
- When the DUMP panel or EQ panel is open during two-chip playback, both chips' state is visible.
- When a single-chip song is exported, no chip selector appears and output is unchanged.

## Hints

- `src/modals/export/ExportModal.tsx` renders the single dialog; `src/hooks/modal/useExportModal.ts` and `src/hooks/file/useExportOperations.ts` own the pending selection and dispatch.
- `src/exports/` holds the eight format modules; `src/utils/playback/playbackSimulation.ts` produces the per-chip register streams.
- `src/components/song/DumpPanel.tsx` reads `getRegistersArray()` and `EQPanel.tsx` reads `getState().channels` - both need the second engine's data.
- `src/utils/export/exportSummary.ts` and `exportFileNaming.ts` own summary text and filenames.

## Out of Scope

- New export formats or changes to single-chip output bytes.
- The settings and track-view records that precede this one.
- Per-chip instrument tables.
