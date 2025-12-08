# DOSOUND Tracker – Changelog

## Version 1.1.7

MAX format refinements for more accurate playback plus internal modal/message state refactors and tests.

- Updated **MAX export** to track additional stream metadata (including YM2149 clock speed and frame size) and align the stream definition chunk size and register maps with the written specification, improving compatibility with MAX players.
- Implemented a MAX **REG7 timing optimization** following the updated spec so delay behavior in exported MAX streams better matches the tracker’s internal sequencing.
- Extracted modal and instrument warning state into dedicated hooks and pulled the message system into its own `useMessageSystem` hook to simplify `App.tsx` and make UI state easier to reason about.
- Expanded test coverage with new suites for modal state and instrument warning hooks, and tightened ESLint React Hooks rules to catch dependency issues earlier during development.

## Version 1.1.6

MAX file export support aligned with the documented format, integrated into the export pipeline with spec-compliant timing metadata.

- Added **MAX file export** based on the new MAX format specification and wired it into the context-aware export flow so MAX files can be generated alongside existing DATA/BIN/VGM/WAV outputs using the same export options.
- Fixed MAX header encoding to write chip speed in big-endian byte order and removed stereo panning fields to better match real-world MAX players and avoid incorrect playback.

## Version 1.1.5

Export options window with context-aware song/pattern/instrument exports, optimized assembly/VGM timing, reorganized command panel controls, and richer export feedback dialogs.

- Introduced an **Export options modal** that moves DUMP/DATA/BIN/VGM/WAV buttons out of the main window into a dedicated dialog, groups settings into What/Strategy/Format sections, and remembers the chosen export type and strategy when closed with OK.
- Made DATA, BIN and VGM exports **context-aware**, so each format respects the selected scope (Song, Pattern at the current playlist position, or Instrument) and generates appropriately named files for each case instead of always exporting the full song.
- Added an **OPTIMIZED dump strategy** for assembly and binary exports that merges consecutive delay lines into combined waits while keeping register writes and comments intact, reducing file size without changing playback behavior.
- Optimized VGM output by merging runs of frame waits into sample-based delay commands while preserving the loop point offset, and added instrument-only VGM/WAV exports by building a one-pattern preview song from the instrument base note and rendering just that instrument.
- Reorganized the command panel into three clearer rows that match the tracker workflow, renamed several buttons (for example ADD TRACK / ADD INST and BUG), and introduced a **DELETE TRACK** action that clears the pattern assignment for the selected track on the current playlist line without deleting the underlying pattern.
- Improved export feedback by showing information dialogs after DATA/BIN/VGM/WAV exports (matching existing DUMP/WAV behavior) with details such as filename, scope and byte/sample counts, and fixed dialog z-ordering so these messages now appear above the Export window.
- Polished UI styling and internals by adjusting export modal layout and radio-button alignment, refining MIDI/debug button colors, tightening debug logging and React effect dependencies, and replacing remaining `any` types and console ESLint overrides with stronger TypeScript definitions.

## Version 1.1.4

Keyboard note entry and sustain refinements, smoother audio switching, and safer MIDI behavior on macOS, plus UX and cleanup improvements.

- Refined track keyboard note entry with **piano-like preview playback** that honors sustain and added keyboard repeat prevention so held keys no longer flood patterns with duplicate notes.
- Added a hard stop mechanism when switching between MIDI and PC keyboard input to prevent lingering notes and audio glitches during live playback.
- Fixed sustain envelope progression so notes jump immediately to the post-sustain section on note-off, aligning playback and exports with instrument envelope settings.
- Improved numeric input controls by initializing empty values to the minimum when incrementing and reversing NumberSpinner button order so increment appears before decrement for more intuitive editing.
- Relaxed unsaved-changes protection by removing quit/reload confirmation dialogs in Electron and browser builds, so closing the app or refreshing no longer shows a warning when edits are pending.
- Adjusted MIDI behavior on Electron by skipping automatic System Reset on output activation to avoid freezes on macOS while preserving Web MIDI functionality.
- Trimmed verbose audio initialization logging and removed obsolete lint disables and unused code to keep console output and the codebase cleaner.

## Version 1.1.3

MIDI output and monitoring upgrades, live recording, YAML format cleanup, richer VGM metadata, and refactoring-focused layout and type-safety improvements.

- Added **per‑instrument MIDI output** with configurable channel/program settings, keyboard shortcuts, and explicit port open/close lifecycle management so instruments can route to multiple external devices without locking MIDI ports.
- Added track‑focused live MIDI recording that writes note‑on/note‑off events directly into the current pattern, keeping playback and recording in sync with the tracker grid.
- Improved the MIDI monitor and modal behavior with auto‑scroll to latest messages, buffered history preserved while the modal is closed, optional debug logging to avoid overhead during normal playback, and better focus and keyboard navigation.
- Introduced **YAML‑based MIDI configuration import/export** with error‑handling dialogs, plus a dedicated MIDI System Reset button and automatic System Reset on output activation to keep external devices in a known state.
- Standardized YAML song and clipboard formats by renaming `steps` to `step`, replacing legacy `off: true` flags with explicit `note: OFF` entries, omitting empty pattern step arrays, and updating example songs to follow the canonical schema (note: new track clipboard exports are not backward‑compatible with older `off`/`steps` formats).
- Enhanced exports by fixing sustain envelope handling and sequencer worker tick ordering for VGM/WAV output, and adding GD3 tags (including game name and song metadata encoded in UTF-16LE) to VGM files.
- Refactored the application layout, modals and core hooks (state, keyboard shortcuts, scroll sync, audio setup, playlist/track/file operations, playback controls and MIDI handling) into dedicated modules and tightened TypeScript types to reduce App.tsx complexity and improve long‑term maintainability without changing workflows.

## Version 1.1.2

Playback performance and Electron stability improvements, faster instrument resolution, and instant MIDI configuration updates.

- Improved Electron playback timing by disabling `backgroundThrottling` for the renderer process and tightening the sequencer worker tick loop to reduce drift and jitter, especially on Electron builds and macOS.
- Optimized pattern and instrument lookup by using precomputed maps instead of repeated linear searches so large songs scroll and play back more smoothly during heavy editing.
- Made MIDI configuration changes (input/output device selection and ignore-volume toggles) apply instantly when changed in the MIDI modal, instead of only on save, so routing tweaks take effect immediately.
- Added automatic approval for `midi` and `midiSysex` permissions in the Electron app to avoid repeated prompts and make MIDI devices connect more reliably.
- Expanded internal tests and refactoring documentation for MIDI, data management and UI state handling to improve long-term stability without changing existing workflows.

## Version 1.1.1

Experimental MIDI support, improved track navigation, and safer exports and unsaved‑changes handling.

- Introduced experimental **MIDI support** with configurable input/output devices, device selection and real-time monitoring so external keyboards and synths can drive DOSOUND Tracker.
- Added live MIDI playback features including enable/disable toggle, debug console logging of MIDI input/output events, note transposition based on instrument base pitch, and improved disabled‑state styling on MIDI controls.
- Implemented MIDI‑driven envelope visualization with 20ms tick updates, sustain support and release handling so instrument volume envelopes animate in real time while playing from MIDI.
- Improved track editing and navigation by adding step editing wrap‑around from the last to the first position, persistent current‑step highlighting even when the Track panel loses focus, and click‑to‑jump behavior in the position numbers panel.
- Allowed scroll synchronization to keep following playback while the song is running by removing the playback‑state restriction from the scroll sync effect.
- Hardened **SAVE INST** handling with an explicit `dosound` instrument type identifier and version field, and refined the Instrument Format Warning modal title capitalization and dialog width for clarity.
- Enhanced Windows packaging and icons with a dedicated Electron/NSIS configuration, multi‑resolution icon support, an updated 256×256 PNG icon, and documentation covering ICO creation requirements and tool limitations.
- Added unsaved‑changes protection with dirty‑state tracking so both Electron and browser builds show a confirmation dialog when quitting or reloading with pending edits.

## Version 1.1.0

- Added a centralized **UI state store** using Zustand for octave, current line and channel mute flags so navigation and playback controls stay in sync across panels without prop drilling or duplicated local state.
- Simplified instrument envelope property names from `volumeEnvelope` / `arpeggioEnvelope` / `pitchEnvelope` / `modeEnvelope` to shorter `volume` / `arpeggio` / `pitch` / `mode`, and introduced a one‑time localStorage migration to clear legacy keys so saved instruments remain compatible.
- Extended the **tone/noise mode** selector to support three states (tone, noise, both) with a purple highlight for combined mode, added `T` / `N` / `B` keyboard shortcuts for quick mode selection, and refined envelope panel padding for a more compact layout.
- Improved **track keyboard navigation** by adding pattern line wrapping for arrow‑key navigation and data entry in the Track panel, so moving past the top or bottom of a pattern wraps instead of getting stuck.
- Tweaked playback controls and shortcuts by changing the default theme to **dark mode**, simplifying the theme toggle via a dedicated `useTheme` hook with safer localStorage handling, refining playback button borders in dark theme, and removing F1/F3 playback shortcuts so F2 is the single shortcut for pattern playback.
- Polished the envelope editor and mixer output by removing the active border from the current envelope bar, tightening value padding, and updating mixer register comments to emit `B` when both tone and noise are enabled, better reflecting the actual mixer state.
- Made editor interactions more robust by forcing scrollbar visibility in the instrument list to avoid layout shifts, enabling vertical scrolling in the playlist content area, adding padding around song info, and stopping event propagation from INSERT STEP / DELETE STEP buttons to prevent unintended parent interactions.
- Refreshed overall **UI and documentation** with updated logo/icon styling and interaction polish, a dedicated debug mode information modal with clearer dump panel copy, a comprehensive data format reference for all save/export formats, and a full operational manual aimed at composers and assembly coders.

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
