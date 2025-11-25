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

## Version 1.0.18

- Updated `Nice_Song.yaml` example: adjusted song speed from 6 to 4 and switched certain bass notes from instrument `01` to `04` in patterns 01–04.
- Added a new **Nice Bass Long** instrument (04) with an extended envelope for sustained bass lines.
- Tweaked the original **Nice Bass** (01) volume envelope (third step reduced from 15 to 13) to better balance levels.
- Increased the Electron window default and minimum dimensions to 1250×850 for a roomier editing layout.
- Replaced the sequencer `setInterval` loop with a high‑precision `setTimeout` loop that tracks `lastTickTime` / `nextTickTime` to reduce timer drift.

## Version 1.0.17

- Added a **loop** field to the song structure with full UI support in `SongInfoPanel`.
- Implemented playlist looping so reaching the end of the playlist jumps back to the configured loop position instead of stopping.
- Removed playlist line move up/down buttons and footer controls from `PlaylistPanel` to simplify the UI.
- Reorganized `SongInfoPanel` into a two‑column grid: Year/Speed on the left, Length/Loop on the right.
- Adjusted the main layout so the right column uses a slightly smaller flex ratio for better overall balance.
- Added null/empty handling for the loop field so cleared values are treated safely throughout the app.

## Version 1.0.16

- Added a **description** field so songs can carry a short textual description alongside title/author.
- Split the build script into separate `build` and `build:core` targets.
- Updated the Electron build to use `build:core`, avoiding unintended version bumps during Electron packaging.

## Version 1.0.15

- Corrected sequencer timing to use song speed directly as VBLANK frames per row (removed the earlier DOSOUND cycle conversion that divided by 2).
- Updated `useSequencer` tick calculations to use integer-safe bitwise operations in initial state and `updateSpeed`.
- Adjusted the demo song speed (from 6 to 5) to compensate for the corrected timing so playback still "feels" right.

## Version 1.0.14

- Initial version bump for the DOSOUND Tracker 1.0.x line (see git history for detailed changes leading up to this release).
