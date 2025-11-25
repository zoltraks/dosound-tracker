# DOSOUND Tracker – Changelog

## Version 1.0.19

- Added a **CHANGES** button in the About dialog that opens this changelog in a modal window.
- Added a scrollable changelog viewer with its own vertical scrollbar and no horizontal scrollbar.
- Tweaked layout in the Instrument list so the selected instrument ID aligns better with the text.
- Tweaked layout in the Playlist so line numbers align better with the playlist rows.
- Reworked **EXPORT SOUND** so WAV export uses the same YM2149-based synthesis path as PLAY SONG / PLAY PATTERN (tone, noise, envelopes and timing now match runtime playback).
- Changed pitch envelope semantics to treat values as integer deltas on the YM divider (period) instead of semitones, and updated assembly export comments to show the closest note plus pitch delta.
- Unified envelope progression timing so instrument preview, piano preview and track editing all advance envelopes at the same 40ms step rate as the sequencer.
- Fixed WAV export and register dump handling so explicit notes on a row always retrigger envelopes, matching live playback (no more missing repeated notes such as G-3 in pattern 03).
- Improved the pitch envelope editor: pressing Space on a pitch envelope step copies the value from the previously selected step for faster editing.
- Centralized YM2149 constants so `YM_CLOCK` and `YM_LOG_VOLUME_TABLE` are defined once in `YM2149.ts` and reused from `assemblyExport.ts`.
