# DOSOUND Tracker – Changelog

## Version 1.0.22

- Added **VGM file export** with loop support and proper noise envelope handling, alongside a new **binary export** path for DOSOUND XBIOS format, so songs can be used directly in external players and demos.
- Cleaned up song YAML export by omitting empty title/author fields and invalid year values, removing redundant pattern name fields, and keeping the saved format focused on data that actually matters.
- Enhanced the **instrument list workflow** with dynamic slot display, instrument reordering via up/down buttons and Ctrl+Arrow shortcuts that automatically remap instrument IDs in all patterns, and a deletion confirmation dialog that shows where an instrument is used before you remove it.
- Improved playlist editing and playback controls: playlist editing now has better focus switching between tracks, playback mode switching continues from the current position instead of restarting, and play buttons act as toggles so pressing them again stops playback.
- Refined the transport and command panel UI with accent-colored playback buttons, themed gradients and glows, idle-state styling, reordered dump/export buttons, and clearer labels (including renaming **EXPORT SOUND** to **EXPORT WAV** and simplifying instrument/playlist header text).
- Added a **download modal** that reads available files from `LIST.txt` in the download directory and shows them in a selectable list, making it easier to fetch exported assets or example content.
- Improved editor interaction and performance by fixing hexadecimal input handling in the envelope editor, optimizing pattern scrolling with `requestAnimationFrame`, correcting active cell borders and dump mode button states, and removing React StrictMode while fixing a sequencer playback race.
- Strengthened audio and error handling by extracting AudioContext initialization into a dedicated hook, complying with browser autoplay policies using explicit user interactions, adding robust error handling for `resume()` calls, and introducing an `ErrorBoundary` around the app.
- Expanded test coverage and documentation with new unit tests for instrument/register-dump exports (including noise envelope validation) and several refactoring / code-review documents that outline future cleanup work.

## Version 1.0.21

- Added full **envelope sustain** and **key-release** support: instruments can define a sustain point in the volume envelope, notes now hold at sustain until you release the key, '===' key‑release steps are editable in the pattern editor (including '-' shortcut), and sustain / release metadata is serialized through YAML, clipboard and export paths.
- Enhanced the volume envelope editor and piano preview: sustain points are shown as black dot markers with right‑click / `S` shortcuts to toggle sustain, piano keyboard preview is now strictly monophonic with robust key‑up handling, and preview automatically stops when a released note reaches zero volume.
- Improved song and playlist playback behavior so notes can **sustain cleanly across pattern boundaries** in song mode instead of being forcibly cleared, empty playlist tracks keep sustaining instead of muting, and playback stop/position handling now preserves the current cursor while clamping playlist indices to valid bounds.
- Refined assembly export and envelope timing by replacing the fixed 20ms envelope timer with a `performance.now`‑based catch‑up loop to reduce drift, aligning register‑dump envelope stepping with instrument export, capping exported envelope steps to the actual pattern duration, and adding volume column support to the assembly register dump.
- Streamlined playlist editing with move up/down buttons and Ctrl+Arrow keyboard shortcuts to reorder playlist lines, removing legacy **GOTO** commands from the playlist, and letting track header clicks jump the playlist cursor to the selected track.
- Simplified YAML song structure and instrument naming by removing pattern names and unassigned playlist entries from saved YAML, and stopping automatic placeholder naming so unnamed instruments stay empty in the file.
- Introduced a **Notes** panel with rotating demoscene / tracker philosophy messages, click‑to‑advance behavior and many new messages, and adjusted the window layout and minimum size so Notes and editor panels fit cleanly alongside the changelog.
- Reworked information/confirmation/export modals to use reusable dialog components, normalized escaped `\n` sequences to real newlines so multi‑line messages render correctly, and overhauled the README / internal docs with expanded usage and refactoring guidance.

## Version 1.0.20

- Added a per-row hexadecimal **volume column** to the pattern editor that attenuates instrument volume envelopes and is fully integrated with playback, WAV export and assembly export.
- Added real-time volume display to track headers, showing the currently effective volume in hexadecimal based on instrument envelopes and the new volume column.
- Improved keyboard and mouse navigation in the pattern editor so left/right arrows move between note and volume columns across tracks and clicking a cell selects its column with clear visual highlighting.
- Extended the YAML song format and compression logic to support the new volume column while keeping backward compatibility with existing songs and space-run encoding.
- Updated the dark mode palette to a blue‑purple scheme with better contrast and refreshed the theme toggle icon.
- Added a new example song `Arp_Loop_2.yaml`, extended the `Warmball.yaml` playlist and refined instrument ordering and naming in example songs.
- Improved the **CHANGES** modal with better spacing and added global keyboard shortcuts (ESC / ENTER) for closing or confirming dialogs.

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
