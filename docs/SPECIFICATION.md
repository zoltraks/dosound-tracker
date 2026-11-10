# DOSOUND Tracker Specification

DOSOUND Tracker is a chiptune music creation tool targeting the AY/YM sound chip (YM2149 PSG) used in the Atari ST. The application provides a pattern-based sequencer, instrument editor, playlist arrangement, and multiple export formats including native DOSOUND assembly for Atari ST demos and games.

The project is built as a desktop application using Electron, with the audio engine running in the browser via the Web Audio API. Songs are authored in a tracker-style interface and can be exported to formats suitable for retro hardware playback.

## Technology Stack

See `package.json` for the dependency list and exact versions. The application is a React and TypeScript single-page app built with Vite 8 (rolldown), using Zustand for state and the Web Audio API for real-time YM2149 synthesis, packaged for the desktop with Electron. Tests run on Vitest and linting on ESLint. Song files are parsed with js-yaml, icons come from lucide-react, and desktop installers are produced by electron-builder.

## Audio-Critical Development

This section owns the audio-critical development principles for this real-time audio application. These principles override the general standards and standard React best practices on audio-critical code paths - consult them before applying any linting fixes or React optimisations to audio-related code.

**Critical: Audio Performance Trade-offs**

This is a real-time audio application where timing is critical. Some React "anti-patterns" are intentionally maintained for audio stability.

**Do Not Apply These Linting Fixes**

1. **Dependency Array Additions** — Adding missing dependencies to `useCallback` or `useMemo` can cause re-renders during audio processing.
   - Example: `currentInstrumentData?.id`, `onHardStopLivePreview` in dependency arrays.
   - Reason: Re-renders interrupt audio timing and cause glitches.

2. **useCallback Wrapping** — Wrapping functions in `useCallback` for dependency arrays can affect render timing.
   - Example: Wrapping `stopPreview` in `useCallback`.
   - Reason: Memoization changes render cycle timing.

3. **State Synchronization Removal** — Removing prop mirroring (local state syncing with props) can break audio timing.
   - Example: `EnvelopePanel` local `envelopeData` state, `TrackPanel` local `currentInstrument` state.
   - Reason: Local state provides stable timing vs prop-driven updates.

4. **setState-in-effect "Fixes"** — Using `setTimeout` to defer setState in effects causes race conditions.
   - Example: `setTimeout(() => setState(value), 0)`.
   - Reason: Async state updates cause stale data during audio rendering.

**Safe to Apply**

1. **Type Safety Fixes**
   - Replacing `any` types with proper TypeScript types.
   - Adding explicit type annotations.
   - Example: `Record<string, unknown>` instead of `any`.

2. **Unused Code Removal**
   - Removing unused imports.
   - Removing unused variables.
   - Removing dead code.

3. **Non-Functional Improvements**
   - Code formatting.
   - Comment improvements.
   - Test setup fixes.

**Development Workflow**

1. **Always Test Audio After Changes**
   - Any change to React hooks, state management, or component lifecycle must be audio-tested.
   - Use git stash to isolate changes and test incrementally.

2. **Prefer Manual Reverts Over Automated Fixes**
   - If audio glitches occur, revert changes manually rather than applying more "fixes".
   - The original codebase was carefully tuned for audio performance.

3. **Accept Linting Warnings**
   - React hooks dependency warnings are acceptable in audio-critical paths.
   - setState-in-effect warnings are acceptable in audio-critical paths.
   - These warnings indicate intentional performance optimizations.

4. **Focus on Audio-First Development**
   - Audio stability is the highest priority.
   - React best practices are secondary to performance.
   - Test with real audio playback, not just visual rendering.

**Red Flags for Audio Issues**

If these occur after applying linting fixes:

- Audio glitches, pops, or timing issues.
- Stuttering or delayed audio response.
- Inconsistent envelope or instrument behavior.

Immediate action: revert the changes using git stash or git checkout.

**Code Review Checklist**

When reviewing changes, ask:

- Does this affect React render timing?
- Does this change `useCallback` or `useMemo` dependencies?
- Does this modify state management patterns?
- Does this remove local state (prop mirroring)?
- Has this been audio-tested?

**Architecture Notes**

The codebase uses several patterns that may appear "wrong" from a React perspective but are essential for audio:

- **Prop mirroring**: local state synced with props for stable timing.
- **Sparse dependency arrays**: minimal dependencies to prevent unnecessary re-renders.
- **Direct setState calls**: synchronous state updates for predictable timing.
- **Manual memoization**: carefully controlled memoization vs React's automatic optimizations.

These patterns ensure that audio processing occurs at consistent intervals without interruption from React's render cycle.

In real-time audio applications, performance trumps purity. The "wrong" way that works is better than the "right" way that glitches.

## Source Directory Structure

Source is organised by responsibility under `src/`, with folders for components, modals, hooks, utilities, constants, types, workers, and assets, the `synth/` audio engine (YM2149 emulator and sound driver), and the `exports/` format modules. `src/hooks/` and `src/utils/` are fully grouped into domain subdirectories - a source directory that contains subdirectories does not hold files directly, and a directory name carries the domain of the files it holds, including single-file directories. The `src/` root itself keeps its entry files (`main.tsx`, `App.tsx`, `index.css`, `App.css`) as the recorded exception. See ARCHITECTURE.md for the module boundaries and the responsibility of each folder.

## Data Models

The core data models represent the musical content of a song. See src/synth/SoundDriver.ts for Song, Instrument, Pattern, Note, Step, and Line type definitions.

**Song** is the top-level container. It holds metadata (title, author, year, speed, length, loop point, chip type, frame rate, chip clock), an array of Pattern objects, an array of Line objects forming the playlist, and an array of Instrument objects.

**Instrument** defines a synthesized voice. Each instrument contains arrays for volume, shift, pitch, noise, and mode envelopes of length ENVELOPE_LENGTH (32 steps). Optional fields include a base key, default octave, sustain position, display color, and MIDI metadata. See src/synth/SoundDriver.ts for the Instrument interface.

**Pattern** is a 64-step sequence (PATTERN_LENGTH). Each pattern has an id, name, and an array of Step objects. See src/synth/SoundDriver.ts for the Pattern interface.

**Note** represents a single musical note with a note name, octave, and instrument reference. See src/synth/SoundDriver.ts for the Note interface.

**Step** is one row in a pattern. It contains an optional Note and an optional per-line volume modifier (0-15). When volume is undefined, the track retains the previous modifier (default 0xF, meaning no attenuation). See src/synth/SoundDriver.ts for the Step interface.

**Line** is one row in the playlist. It references pattern ids for channels A, B, and C. See src/synth/SoundDriver.ts for the Line interface.

**Playlist** entries are normalized versions of Line objects using branded PlaylistPatternId types or the literal "--" for empty slots. See src/types/playlist.ts for PlaylistEntry and conversion helpers.

Branded identifier types (InstrumentId, PatternId, TrackId, PlaylistPatternId) prevent accidental mixing of string IDs at compile time. See src/types/branded.ts for the brand definitions and constructor functions.

## YM2149 Register Mapping

The YM2149 PSG exposes 14 programmable registers (R0-R13). The chip runs at a configurable clock frequency (default 2 MHz, YM_CLOCK = 2000000, defined in src/synth/YM2149.ts). The clock is set per song via the `clock` field on the Song interface. Supported clocks are 2000000 (2 MHz) and 1000000 (1 MHz). At 1 MHz, tone period values are half of the 2 MHz values for the same note.

| Register | Function                                                               |
| -------- | ---------------------------------------------------------------------- |
| R0       | Channel A tone period, fine (8 bits)                                   |
| R1       | Channel A tone period, coarse (4 bits)                                 |
| R2       | Channel B tone period, fine (8 bits)                                   |
| R3       | Channel B tone period, coarse (4 bits)                                 |
| R4       | Channel C tone period, fine (8 bits)                                   |
| R5       | Channel C tone period, coarse (4 bits)                                 |
| R6       | Noise period (5 bits)                                                  |
| R7       | Mixer and envelope enable control (tone/noise on/off for all channels) |
| R8       | Channel A amplitude (4 bits volume, bit 4 envelope enable)             |
| R9       | Channel B amplitude (4 bits volume, bit 4 envelope enable)             |
| R10      | Channel C amplitude (4 bits volume, bit 4 envelope enable)             |
| R11      | Envelope period, fine (8 bits)                                         |
| R12      | Envelope period, coarse (8 bits)                                       |
| R13      | Envelope shape (4 bits) and envelope enable (bit 4)                    |

The tone period for each channel is a 12-bit value assembled from the coarse (high nibble) and fine (low byte) registers. The output frequency is calculated as:

```
f = YM_CLOCK / (16 * period)
```

where YM_CLOCK is the configured chip clock (2000000 Hz by default, 1000000 Hz at 1 MHz) and period is the 12-bit tone period value. For example, at 2 MHz a period of 284 produces approximately 440 Hz (A4) - at 1 MHz the same note uses a period of 142.

The mixer register (R7) uses active-low bits: a bit value of 0 means the corresponding tone or noise generator is enabled. Bits 0-2 control tone for channels A, B, C and bits 3-5 control noise for channels A, B, C.

Volume uses a 16-level logarithmic scale defined by YM_LOG_VOLUME_TABLE in src/synth/YM2149.ts, approximating -2 dB per step from silence (0) to full amplitude (15).

The register write path supports batch updates via beginBatch and endBatch to avoid redundant audio node recalculations when multiple registers change in a single frame.

## Sequencer Timing

Playback is driven by the song's frame rate (default 50 Hz, DEFAULT_SONG_FRAME = 50, defined in src/constants/song.ts). The frame rate is configurable per song via the `frame` field. Each tick corresponds to 1000 / frameRate milliseconds (20 ms at 50 Hz, 16.66 ms at 60 Hz).

Envelope progression advances every 2 ticks (40 ms at 50 Hz, 33.33 ms at 60 Hz). This means instrument envelope arrays (volume, shift, pitch, noise, mode) step forward at half the frame rate.

Pattern-based playback uses 64-step resolution (PATTERN_LENGTH = 64, defined in src/constants/music.ts). Each pattern contains 64 rows, and the playlist arranges patterns into a song sequence across three channels (A, B, C).

The playback speed parameter controls how many ticks elapse between sequencer steps. The minimum speed is 2 and only even values are used: an odd value is normalized down to the previous even value, and non-positive or non-numeric input falls back to 6. The normalization is implemented by `normalizeSongSpeed` in src/utils/song/songSpeed.ts and is applied on the song load and restore paths.

The song speed field on the Song object determines the global tempo. The frame rate field (default 50), chip field (default "YM"), and chip clock field (default 2000000) are defined in src/constants/song.ts. Supported frame rates are 50 and 60 Hz. Supported chip clocks are 2000000 (2 MHz) and 1000000 (1 MHz).

## Export Formats

DOSOUND Tracker supports six export formats. Each format produces a downloadable file from the browser environment. See FORMAT.md for detailed file layout specifications.

**DOSOUND Assembly** generates Motorola 68000 assembly source compatible with the DOSOUND XBIOS playback routine. The export simulates song playback, collects register states per frame, and emits optimized dc.b directives with register/value pairs and delay markers. Three strategies are available: simple, complex, and optimized. See src/exports/asm.ts.

**Binary** parses the generated assembly output and extracts raw byte data from dc.b directives, producing a compact binary file suitable for direct memory loading. See src/exports/bin.ts.

**Register Dump** writes the raw YM2149 register stream as a 68k assembly listing (typical extension `_dump.s`), produced by `exportSongRegisterDump` in src/exports/asm.ts. The dump is intended for debugging and analysis of the per-frame register data rather than for compact inclusion. See FORMAT.md for the dump layout.

**MAX** produces a MAX-format binary file (MAX specification v1.7) with chunk-based structure, including info chunks for song metadata, a chip setup chunk for the YM2149, a stream definition chunk specifying the stream format and compression, and a data chunk containing the compressed register stream. The chip setup chunk records the song's frame rate and chip clock. The export captures one register snapshot per tick and writes all 14 YM2149 registers (R0–R13). Three strategies map to stream formats: simple produces a RAW8 dump (14 bytes per frame), complex produces a REG7 differential stream with single-byte frame delimiters, and optimized produces a REG7 stream with coalesced multi-frame delays. All strategies apply ZX0 compression with a 1024-byte ring-buffer window (maxOffset 1023) and include the uncompressed stream size in the stream definition chunk. See src/exports/max.ts and src/utils/compression/zx0.ts.

**VGM** generates a VGM (Video Game Music) file, a standard chiptune logging format. The export converts register writes and delays into VGM command stream with delay optimization and loop point preservation. The VGM header records the song's frame rate (offset 0x24) and chip clock (offset 0x74). Wait commands use 0x63 for 50 Hz, 0x62 for 60 Hz, and 0x61 with explicit sample counts for other rates. See src/exports/vgm.ts.

**WAV** renders the song to a 16-bit PCM WAV file at 44100 Hz sample rate. The export uses a software YM2149 simulation including a noise LFSR to produce the final audio samples. The samples-per-tick is derived from the song's frame rate (882 at 50 Hz, 735 at 60 Hz) and the frequency calculation uses the song's chip clock. See src/exports/wav.ts.

Export scope can target the full song, a single pattern, or a single instrument. The `ExportType` and `ExportStrategy` (simple, complex, optimized) unions are typed in src/constants/export.ts - the six formats dispatch through the export modal's per-format handlers.

## Constants

Application constants live in `src/constants/`, one file per domain. See those files for the actual values.

- **music.ts** — note frequencies, octave bounds, default and maximum pattern length, instrument count, and envelope, volume, noise, pitch, and shift limits. Also holds the `POW2_OCTAVE_SCALE` and `POW2_SEMITONE_SCALE` lookup tables with their `pow2Octave`/`pow2Semitone` accessors - tables built from `Math.pow` itself so the frequency paths stay bit-identical, with a `Math.pow` fallback outside the integer domain.
- **keyboard.ts** — the KEYBOARD_TO_NOTE piano map.
- **song.ts** — chip, frame rate, and clock defaults and their supported values.
- **export.ts** — the ExportType and ExportStrategy union types.
- **navigation.ts** — NAVIGATION_ORDER and the KEYBOARD_SHORTCUTS map.
- **modal.ts** — modal dialog titles and confirmation texts (INFO_MODAL_TITLES, CONFIRM_MODAL_TEXT).
- **import.ts** — the MAX_IMPORT_BYTES byte cap applied to imported text content.

## Keyboard Shortcuts and Input Bindings

The computer keyboard doubles as a piano input device. The mapping is defined in src/constants/keyboard.ts and re-exported through src/constants/music.ts.

**Piano keyboard mapping**

The lower letter row maps to the base octave, and the upper letter and number rows map one or two octaves above. See `src/constants/keyboard.ts` for the exact key-to-note map.

**Column-specific input**

Piano note keys enter notes only when the note column of a track is focused. When the volume column is focused, only hexadecimal nibbles 0 to F are accepted, and note keys are inert.

**Navigation shortcuts** (defined in src/constants/navigation.ts):

- TAB cycles to the next UI section
- SHIFT+TAB cycles to the previous UI section
- ARROW keys move the cursor between lines and columns in the pattern editor

**Editing shortcuts:**

- SPACE clears the current cursor position
- BACKSPACE clears the current cursor position
- CTRL+SPACE inserts a note-off event
- CTRL+Minus selects the previous instrument
- CTRL+Plus selects the next instrument

**Playback shortcuts:**

- F2 plays the current line
- CTRL+5 plays the song from the start of the current line
- CTRL+6 plays the current line
- CTRL+8 stops playback
- ESC stops playback
- ENTER in a track plays the current line from the cursor row and toggles playback, restoring the cursor on stop
- CTRL+ENTER in a track plays the current line from its first row and toggles playback, restoring the cursor on stop

**File operation shortcuts:**

- CTRL+N runs NEW SONG
- CTRL+O runs LOAD SONG
- CTRL+S runs SAVE SONG
- CTRL+I runs NEW INSTRUMENT

**Modal shortcuts:**

- ESCAPE cancels or closes the open modal dialog
- ENTER confirms the open modal dialog

The navigation order cycles through these sections: piano, octave, commands, trackA, trackB, trackC, mode, volume, shift, pitch, noise, songInfo, playlist, instrumentList.

## Session Persistence

The editor cursor is remembered across reloads through local storage. Local storage keys are centralised in `src/utils/storage/storageKeys.ts`.

The top-level cursor is stored under `EDITOR_CURSOR` as a JSON object with the focused section, the selected track, the playlist line, the track row, and the track column. On mount it is parsed, clamped to the restored song, and applied through the existing setters. The playlist line is clamped to the playlist length, the track row to the pattern length. An invalid section falls back to the selected track's section. It is written when playback is not running, so no local storage writes occur on the audio path.

Additional cursor state is persisted at its source of truth to avoid duplicate state. The selected instrument id is stored under `CURRENT_INSTRUMENT` - the instrument list highlight follows it. The playlist row cursor inside the playlist panel follows the top-level playlist line and is not stored separately.

Single-value panel cursors are persisted to local storage. The song information field is stored under `SONG_INFO_FIELD` through the `useLocalStorageState` hook. The playlist track column is stored under `PLAYLIST_TRACK`, each envelope panel step cursor under `ENVELOPE_CURSOR_PREFIX` followed by the panel type, and the per-instrument octave selection under `INSTRUMENT_OCTAVES` through `src/hooks/instrument/useInstrumentOctaves.ts`. Where the state setter is captured inside memoized callbacks, the cursor uses a plain `useState` with a lazy initializer and a persist effect instead of `useLocalStorageState`, so the setter stays a stable dispatch that the React Compiler can track. The octave is persisted in the ui store under `OCTAVE`. The envelope step cursor is per panel and independent of the selected instrument.

**Snapshot mirror**

Every scheduled save also mirrors the song and instrument payloads into an IndexedDB database named `dosound-tracker-backup`, store `snapshots`, through `src/utils/storage/persistenceMirror.ts`. The mirror write happens inside the same idle slot as the local storage write, is fully asynchronous, and degrades to a logged warning when IndexedDB is unavailable, so autosave latency and UX are unchanged.

**Mirror restore**

On startup the application requests persistent storage and checks `StorageKeys.SONG` in local storage. When the key is absent but a `song` snapshot exists in the mirror, the snapshot passes through `normalizeRestoredSong` (the same schema migration and speed clamping `loadInitialSong` applies) and becomes the current song. The restored session is marked dirty and a restore notice joins the notes-panel message rotation, telling the user a local snapshot was restored and a file copy is the durable record.

**Mirror invalidation**

Two destructive paths drop the mirror together with local storage: the legacy-schema removal inside `loadInitialSong` removes the `song` snapshot, and the RESET action removes every `dosound-tracker-*` local storage key except the preserved theme and debug-mode settings, then awaits the mirror clear and reloads only after the clear commits. Without this, intentionally deleted data would resurrect on the next load.

**Persistence reminder**

`public/MESSAGES.md` carries a rotation entry reminding composers that browser storage can be cleared and that a file copy of the song is the durable record.

**Settings persistence**

The application restores its state on page reload - persisted state, including the open view, survives exactly. The `UI_STATE` snapshot records the open restorable modal in `openModal` and, for the settings modal, the `settingsView` member holding the active category and the uncommitted draft. `updateSettingsView` writes the member whenever either changes while the modal is open, and the settings modal clears it on both close paths.

Three keys hold the settings toggles introduced with the modal: `STARTUP_TONE`, `RESTORE_CURSOR`, and `RESTORE_VIEW`, each storing `'on'` or `'off'` and defaulting to on. `STARTUP_TONE` gates the startup test tone. `RESTORE_VIEW` gates the whole view-snapshot restore, including the window scroll. `RESTORE_CURSOR` gates the application of the persisted editor cursor - cursor recording continues regardless.

The settings modal's committed values persist under the per-key storage: `THEME`, `TRACK_BACKGROUND_ENABLED`, and `PASTE_TRACK_MODE` cover the reused options.

## Markdown Rendering Security

Bundled Markdown documents are rendered into HTML by `src/utils/markdown/markdown.ts`. The renderer escapes every source byte and emits tags only from fixed templates, so markup outside the allowed grammar can never reach the DOM unescaped.

**Trusted output brand**

`renderMarkdown` returns a `TrustedHtml` branded string. `dangerouslySetInnerHTML` sinks are typed against `TrustedHtml`, so a sink cannot be fed a raw string by accident. The brand is compile-time only and emits no runtime code.

**Bounded source set**

Only bundled first-party documents may reach a markdown sink: `MESSAGES.md`, `CHANGELOG.md`, and `MANUAL.md`. All fetches go through `fetchBundledMarkdown` in `src/utils/markdown/bundledMarkdown.ts`, which rejects names outside the allowlist and bodies that look like HTML (a `text/html` content type, a leading `<!doctype`/`<html` marker, or a `<script type="module"` marker within the first 512 characters), so an SPA fallback page is never rendered as document content.

**Content security policy**

Production builds inject a restrictive CSP meta tag into `dist/index.html` through the `inject-content-security-policy` plugin in `vite.config.ts`. The directive list lives in that file. The plugin applies only during build, so `vite dev` is unaffected. The packaged Electron app loads `dist/index.html` over `file://`, which is why `connect-src` lists the `file:` scheme explicitly.

## Project-Specific Conventions

These conventions override or extend the general standards in `standard/typescript-react-development.md` with rules specific to the DOSOUND Tracker codebase.

### Shared Utilities

The following utilities were extracted to eliminate duplication and are the canonical implementations for their respective patterns:

- **`src/utils/timer/timerUtils.ts`** — `clearIntervalRef` for clearing interval timer refs. Used across hooks and components that manage interval-based playback or preview timers.
- **`src/hooks/storage/useLocalStorageState.ts`** — generic hook for localStorage-backed state with optional `read`/`write` serializers. Used by `useAppState`, `useTheme`, and `useInstrumentWarnings`.
- **`src/exports/core.ts`** — `formatPitchDelta` for formatting signed pitch delta values in assembly export comments. `exportInstrumentWith` generic wrapper for instrument preview exports across VGM, MAX, and WAV formats.
- **`src/utils/instrument/instrumentPanelUtils.ts`** — `createEmptyInstrument` factory accepting `number | InstrumentId`. Used by `createClearedInstrument` in `instrumentOperations.ts` and by `useDataManagement` for new song creation.
- **`src/utils/pattern/patternUtils.ts`** — `normalizePatternId` is the canonical pattern-id contract: strings normalize to `trim().toUpperCase()`, finite numbers format through `Formatter.hex`, and everything else yields `''`. It deliberately diverges from `normalizeInstrumentId` - no leading `$` strip and no hex padding, so `'a'` normalizes to `'A'`, not `'0A'`. Used by the song parser and `renumberSongData`.
- **`src/hooks/playback/usePreviewEnvelope.ts`** — the single ref-driven preview-envelope engine: per-key voices, sustain and release tracking, `window.setInterval` ticks through `advancePreviewEnvelopeTick`/`getPreviewEnvelopeApplyStep`, and auto-stop on a silent envelope tail or a caller-supplied `stopAfterStep` cap. The first envelope boundary is scheduled from the caller-supplied `tickIntervalMs` - the interval derived from the song's configured frame rate - so preview timing stays accurate at both 50 Hz and 60 Hz. Consumed by `TrackPanel`, `PianoKeyboard`, `HeaderPanel`, `useMidiActions`, and `useInstrumentActions` - per-start options reproduce each surface's reduced or extended semantics. MIDI preview surfaces wire `onAutoStop` to the outgoing MIDI noteOff path, so a released preview that reaches a silent envelope tail emits the matching noteOff on the connected device at the moment the channel is silenced.

### Branded Types

Branded identifier types (`InstrumentId`, `PatternId`, `TrackId`, `PlaylistPatternId`) are defined in `src/types/branded.ts`. Factory functions that create domain objects accept `number | BrandedType` so callers can pass either a numeric slot index or a pre-branded ID string. Use `asInstrumentId`, `asPatternId`, and `asPlaylistPatternId` constructor functions to convert plain strings to branded types at system boundaries (file parsing, user input).

### Naming Conventions

The baseline naming conventions live in `standard/typescript-react-development.md`. The project deltas are:

- **CSS classes**: `kebab-case` or BEM notation.
- **Config and data files**: `snake_case`.
- **Version numbers**: use just the number (for example `1.2.7`). Do not prefix with `v`.

**File naming rules**

- React component files must use `PascalCase` (for example `TrackPanel.tsx`, `CommandPanel.tsx`).
- All other TypeScript files must use `camelCase` (for example `songParser.ts`, `envelopeUtils.ts`).
- This distinction aligns with Vite, create-react-app, and modern React ecosystem standards.

### Date and Time Format

All timestamps in project metadata, logs, and data files use a modified ISO 8601 format in local time.

**Format: `YYYY-MM-DD hh:mm:ss`**

Examples:

- `2024-01-15 10:30:00`
- `2026-04-27 14:22:15`

**Rules**

- Use 24-hour time, from `00:00:00` to `23:59:59`.
- No `T` separator between date and time.
- No timezone indicator - local time only.
- Month and day are zero-padded, `01` to `12` and `01` to `31`.
- Hours, minutes, and seconds are zero-padded, `00` to `59`.

### Export Output Stability

Export modules in `src/exports/` must produce byte-identical output for the same input across refactoring changes. The test fixtures in `test/fixtures/` and the export test suite (`exportVgm.test.ts`, `exportMax.test.ts`, `exportWav.test.ts`, `exportAssemblyOptimized.test.ts`) verify zero diff in export output. Any change to export output is a behaviour change, not a refactoring, and must be routed through `docs/change/<version>/`.

### YM2149 Emulation Stability

The YM2149 register simulation, volume table, and noise generation algorithm in `src/synth/YM2149.ts` must not change during refactoring. These are hardware-accurate implementations. Any change to the emulation logic is a behaviour change, not a refactoring.

### MIDI Message Processing

MIDI message handling in `src/hooks/midi/useMidiMessageProcessing.ts` is a hot path that executes on every incoming MIDI message. Avoid per-event allocations: use direct `Uint8Array` indexed access instead of `Array.from()`, and use string concatenation loops instead of `array.map().join()` for hex formatting.

### Electron Permission Policy

The desktop main process (`electron/main.cjs`) grants the `midi` permission only when the requesting page is the application's own origin: the packaged bundle's `dist/index.html` loaded over `file://`, or the development server at `http://localhost:8008`. The check resolves the requesting `file://` URL to a file path and compares it against the bundled index location rather than matching the `file://` scheme prefix, so any other `file://` page is a foreign origin. Requests from any other origin are denied, and `midiSysex` is never granted because the app does not request it. The origin check lives in `electron/permissions.cjs`.

Navigation is contained by the same origin policy. `webContents.setWindowOpenHandler` never creates a second window: external `http:`/`https:` links are delegated to `shell.openExternal` and every other request is denied. `will-navigate` calls `preventDefault` for any target outside the app origin, including `file://` pages other than the bundled index, so top-level navigation is pinned to the bundle.

**Electron close handshake**

The desktop main process intercepts the window `close` event and forwards `app-close-requested` to the renderer instead of closing. `useElectronCloseGuard` answers the request: when the song is dirty it opens the quit-confirm modal, and when the song is clean it confirms the close directly through `confirmAppClose()`. The modal's confirm action calls `confirmAppClose()` (the main process then quits), and its cancel action calls `cancelAppClose()`, leaving the application running. In a plain browser without the Electron API the guard inerts and no handshake occurs.

### Modal Working State

A modal whose contents must respond to the global Enter and ESC handler keeps its working state in an orchestration hook owned above the modal pipeline. Component-internal state is invisible to `useModalManager` - the handler attaches to `window` in the capture phase and cannot read a draft or a selection held inside the modal component. `useSettingsDialog` holds the settings draft and category for this reason.

## Known Limitations

The following constraints reflect the current state of the codebase and are candidates for future improvement.

- **Single store**: All application state lives in one Zustand store (src/hooks/ui/useUiStore.ts). There is no store splitting or domain-based partitioning, which can make state updates difficult to reason about as the application grows.
- **No undo/redo**: The application does not implement an undo/redo history. All edits are immediate and irreversible without manual re-entry. No command pattern or state snapshot mechanism is present.
- **App.tsx orchestrator**: The main application component still concentrates the hook wiring and JSX prop map (~940 lines after the staged decomposition). Bounded concerns live in dedicated orchestration hooks under `src/hooks/` - further decomposition remains a candidate for later windows.
- **Low test coverage for the synth**: The YM2149 emulator (src/synth/YM2149.ts) now carries four `test/synth/` suites and the sequencer worker carries `test/workers/` protocol tests. The export modules (src/exports/) are exercised by the `test/exports/` suite. Remaining thin surfaces are components, hooks, and the `MidiModal`/`MarkdownModal` dialogs.
- **Single chip support**: Only the YM2149 chip is supported. The constants in src/constants/song.ts define supported chips as a single-element array, leaving no room for AY-3-8910 or other PSG variants without code changes.
- **Browser audio dependency**: Real-time playback relies on the Web Audio API and OscillatorNode, which imposes browser-specific behavior and latency characteristics that differ from native Atari ST hardware.
