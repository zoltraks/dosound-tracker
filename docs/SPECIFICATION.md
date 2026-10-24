# DOSOUND Tracker Specification

DOSOUND Tracker is a chiptune music creation tool targeting the AY/YM sound chip (YM2149 PSG) used in the Atari ST. The application provides a pattern-based sequencer, instrument editor, playlist arrangement, and multiple export formats including native DOSOUND assembly for Atari ST demos and games.

The project is built as a desktop application using Electron, with the audio engine running in the browser via the Web Audio API. Songs are authored in a tracker-style interface and can be exported to formats suitable for retro hardware playback.

## Technology Stack

See `package.json` for the dependency list and exact versions. The application is a React and TypeScript single-page app built with rolldown-vite, using Zustand for state and the Web Audio API for real-time YM2149 synthesis, packaged for the desktop with Electron. Tests run on Vitest and linting on ESLint. Song files are parsed with js-yaml, icons come from lucide-react, and desktop installers are produced by electron-builder.

## Audio-Critical Development

This project is a real-time audio application where timing is critical. The general TypeScript/React standards in `standard/ts-react-development.md` are overridden for audio-critical code paths as defined in `GUIDELINES.md`.

The following patterns are intentional and must not be "fixed" in audio-critical code paths:

- **Prop mirroring**: local state synced with props for stable timing.
- **Sparse dependency arrays**: minimal dependencies to prevent unnecessary re-renders.
- **Direct setState calls**: synchronous state updates for predictable timing.
- **Manual memoization**: carefully controlled memoization vs React's automatic optimizations.

The `setState` in `useEffect` prohibition from the general standard does not apply to audio-critical code paths. In audio paths, synchronous state updates are intentional for predictable timing.

Consult `GUIDELINES.md` before applying any linting fixes or React optimisations to audio-related code.

## Source Directory Structure

Source is organised by responsibility under `src/`, with folders for components, hooks, utilities, constants, stores, types, and workers, the `synth/` audio engine (YM2149 emulator and sound driver), and the `exports/` format modules. See ARCHITECTURE.md for the module boundaries and the responsibility of each folder.

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

where YM_CLOCK is the configured chip clock (2000000 Hz by default, 1000000 Hz at 1 MHz) and period is the 12-bit tone period value. For example, at 2 MHz a period of 284 produces approximately 440 Hz (A4); at 1 MHz the same note uses a period of 142.

The mixer register (R7) uses active-low bits: a bit value of 0 means the corresponding tone or noise generator is enabled. Bits 0-2 control tone for channels A, B, C and bits 3-5 control noise for channels A, B, C.

Volume uses a 16-level logarithmic scale defined by YM_LOG_VOLUME_TABLE in src/synth/YM2149.ts, approximating -2 dB per step from silence (0) to full amplitude (15).

The register write path supports batch updates via beginBatch and endBatch to avoid redundant audio node recalculations when multiple registers change in a single frame.

## Sequencer Timing

Playback is driven by the song's frame rate (default 50 Hz, VBLANK_RATE = 50, defined in src/synth/SoundDriver.ts). The frame rate is configurable per song via the `frame` field. Each tick corresponds to 1000 / frameRate milliseconds (20 ms at 50 Hz, 16.66 ms at 60 Hz).

Envelope progression advances every 2 ticks (40 ms at 50 Hz, 33.33 ms at 60 Hz). This means instrument envelope arrays (volume, shift, pitch, noise, mode) step forward at half the frame rate.

Pattern-based playback uses 64-step resolution (PATTERN_LENGTH = 64, defined in src/constants/music.ts). Each pattern contains 64 rows, and the playlist arranges patterns into a song sequence across three channels (A, B, C).

The playback speed parameter controls how many delay cycles elapse between sequencer steps. The minimum speed is 2 (MIN_DELAY_CYCLES = 2). In DOSOUND mode, only even values are accepted: if an odd value is provided, it is rounded up to the next even number. This constraint is enforced in SoundDriver.setPlaybackSpeed.

The song speed field on the Song object determines the global tempo. The frame rate field (default 50), chip field (default "YM"), and chip clock field (default 2000000) are defined in src/constants/song.ts. Supported frame rates are 50 and 60 Hz. Supported chip clocks are 2000000 (2 MHz) and 1000000 (1 MHz).

## Export Formats

DOSOUND Tracker supports five export formats. Each format produces a downloadable file from the browser environment. See FORMAT.md for detailed file layout specifications.

**DOSOUND Assembly** generates Motorola 68000 assembly source compatible with the DOSOUND XBIOS playback routine. The export simulates song playback, collects register states per frame, and emits optimized dc.b directives with register/value pairs and delay markers. Three strategies are available: simple, complex, and optimized. See src/exports/asm.ts.

**Binary** parses the generated assembly output and extracts raw byte data from dc.b directives, producing a compact binary file suitable for direct memory loading. See src/exports/bin.ts.

**MAX** produces a MAX-format binary file (MAX specification v1.6) with chunk-based structure, including info chunks for song metadata, a chip setup chunk for the YM2149, a stream definition chunk specifying the stream format and compression, and a data chunk containing the compressed register stream. The chip setup chunk records the song's frame rate and chip clock. The export captures one register snapshot per tick and writes all 14 YM2149 registers (R0–R13). Three strategies map to stream formats: simple produces a RAW8 dump (14 bytes per frame), complex produces a REG7 differential stream with single-byte frame delimiters, and optimized produces a REG7 stream with coalesced multi-frame delays. All strategies apply ZX0 compression with a 1024-byte ring-buffer window (maxOffset 1023) and include the uncompressed stream size in the stream definition chunk. See src/exports/max.ts and src/utils/zx0.ts.

**VGM** generates a VGM (Video Game Music) file, a standard chiptune logging format. The export converts register writes and delays into VGM command stream with delay optimization and loop point preservation. The VGM header records the song's frame rate (offset 0x24) and chip clock (offset 0x74). Wait commands use 0x63 for 50 Hz, 0x62 for 60 Hz, and 0x61 with explicit sample counts for other rates. See src/exports/vgm.ts.

**WAV** renders the song to a 16-bit PCM WAV file at 44100 Hz sample rate. The export uses a software YM2149 simulation including a noise LFSR to produce the final audio samples. The samples-per-tick is derived from the song's frame rate (882 at 50 Hz, 735 at 60 Hz) and the frequency calculation uses the song's chip clock. See src/exports/wav.ts.

Export scope can target the full song, a single pattern, or a single instrument. Export strategies (simple, complex, optimized) and formats (dump, data, bin, vgm, max, wav) are typed in src/constants/export.ts.

## Constants

Application constants live in `src/constants/`, one file per domain. See those files for the actual values.

- **music.ts** — note frequencies, octave bounds, pattern length, instrument count, and envelope, volume, noise, pitch, and shift limits.
- **keyboard.ts** — the KEYBOARD_TO_NOTE piano map.
- **song.ts** — chip, frame rate, and clock defaults and their supported values.
- **export.ts** — the ExportType, ExportStrategy, and ExportFormat union types.
- **navigation.ts** — NAVIGATION_ORDER and the KEYBOARD_SHORTCUTS map.

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
- BACKSPACE clears and moves the cursor up
- CTRL+SPACE inserts a note-off event
- CTRL+Minus selects the previous instrument
- CTRL+Plus selects the next instrument

**Playback shortcuts:**

- F2 plays the current line
- CTRL+5 plays from the start of the line
- CTRL+6 plays the current line
- CTRL+8 stops playback
- ESC stops playback
- ENTER in a track plays the current line from the cursor row and toggles playback, restoring the cursor on stop
- CTRL+ENTER in a track plays the current line from its first row and toggles playback, restoring the cursor on stop

**File operation shortcuts:**

- CTRL+N creates a new song
- CTRL+O loads a song from file
- CTRL+S saves the current song
- CTRL+I creates a new instrument

The navigation order cycles through these sections: piano, octave, commands, trackA, trackB, trackC, mode, volume, shift, pitch, noise, songInfo, playlist, instrumentList.

## Session Persistence

The editor cursor is remembered across reloads through local storage. Local storage keys are centralised in `src/utils/storageKeys.ts`.

The top-level cursor is stored under `EDITOR_CURSOR` as a JSON object with the focused section, the selected track, the playlist line, the track row, and the track column. On mount it is parsed, clamped to the restored song, and applied through the existing setters. The playlist line is clamped to the playlist length, the track row to the pattern length. An invalid section falls back to the selected track's section. It is written when playback is not running, so no local storage writes occur on the audio path.

Additional cursor state is persisted at its source of truth to avoid duplicate state. The selected instrument id is stored under `CURRENT_INSTRUMENT`; the instrument list highlight follows it. The playlist row cursor inside the playlist panel follows the top-level playlist line and is not stored separately.

Single-value panel cursors are persisted to local storage. The song information field is stored under `SONG_INFO_FIELD` through the `useLocalStorageState` hook. The playlist track column is stored under `PLAYLIST_TRACK`, and each envelope panel step cursor under `ENVELOPE_CURSOR_PREFIX` followed by the panel type. Where the state setter is captured inside memoized callbacks, the cursor uses a plain `useState` with a lazy initializer and a persist effect instead of `useLocalStorageState`, so the setter stays a stable dispatch that the React Compiler can track. The octave is persisted in the ui store under `OCTAVE`. The envelope step cursor is per panel and independent of the selected instrument.

**Snapshot mirror**

Every scheduled save also mirrors the song and instrument payloads into an IndexedDB database named `dosound-tracker-backup`, store `snapshots`, through `src/utils/persistenceMirror.ts`. The mirror write happens inside the same idle slot as the local storage write, is fully asynchronous, and degrades to a logged warning when IndexedDB is unavailable, so autosave latency and UX are unchanged.

**Mirror restore**

On startup the application requests persistent storage and checks `StorageKeys.SONG` in local storage. When the key is absent but a `song` snapshot exists in the mirror, the snapshot passes through `normalizeRestoredSong` (the same schema migration and speed clamping `loadInitialSong` applies) and becomes the current song. The restored session is marked dirty and a restore notice joins the notes-panel message rotation, telling the user a local snapshot was restored and a file copy is the durable record.

**Mirror invalidation**

Two destructive paths drop the mirror together with local storage: the legacy-schema removal inside `loadInitialSong` removes the `song` snapshot, and the RESET action clears the whole snapshot store. Without this, intentionally deleted data would resurrect on the next load.

**Persistence reminder**

`public/MESSAGES.md` carries a rotation entry reminding composers that browser storage can be cleared and that `CTRL+S` keeps a file copy of the song.

## Markdown Rendering Security

Bundled Markdown documents are rendered into HTML by `src/utils/markdown.ts`. The renderer escapes every source byte and emits tags only from fixed templates, so markup outside the allowed grammar can never reach the DOM unescaped.

**Trusted output brand**

`renderMarkdown` returns a `TrustedHtml` branded string. `dangerouslySetInnerHTML` sinks are typed against `TrustedHtml`, so a sink cannot be fed a raw string by accident. The brand is compile-time only and emits no runtime code.

**Bounded source set**

Only bundled first-party documents may reach a markdown sink: `MESSAGES.md`, `CHANGELOG.md`, and `MANUAL.md`. All fetches go through `fetchBundledMarkdown` in `src/utils/bundledMarkdown.ts`, which rejects names outside the allowlist and bodies that look like HTML (a `text/html` content type or a leading `<!doctype`/`<html` marker), so an SPA fallback page is never rendered as document content.

**Content security policy**

Production builds inject a restrictive CSP meta tag into `dist/index.html` through the `inject-content-security-policy` plugin in `vite.config.ts`. The directive list lives in that file. The plugin applies only during build, so `vite dev` is unaffected. The packaged Electron app loads `dist/index.html` over `file://`, which is why `connect-src` lists the `file:` scheme explicitly.

## Project-Specific Conventions

These conventions override or extend the general standards in `standard/ts-react-development.md` with rules specific to the DOSOUND Tracker codebase.

### Shared Utilities

The following utilities were extracted to eliminate duplication and are the canonical implementations for their respective patterns:

- **`src/utils/timerUtils.ts`** — `clearIntervalRef` for clearing interval timer refs. Used across hooks and components that manage interval-based playback or preview timers.
- **`src/hooks/useLocalStorageState.ts`** — generic hook for localStorage-backed state with optional `read`/`write` serializers. Used by `useAppState`, `useTheme`, and `useInstrumentWarnings`.
- **`src/exports/core.ts`** — `formatPitchDelta` for formatting signed pitch delta values in assembly export comments. `exportInstrumentWith` generic wrapper for instrument preview exports across VGM, MAX, and WAV formats.
- **`src/utils/instrumentPanelUtils.ts`** — `createEmptyInstrument` factory accepting `number | InstrumentId`. Used by `createClearedInstrument` in `instrumentOperations.ts` and by `useDataManagement` for new song creation.

### Branded Types

Branded identifier types (`InstrumentId`, `PatternId`, `TrackId`, `PlaylistPatternId`) are defined in `src/types/branded.ts`. Factory functions that create domain objects accept `number | BrandedType` so callers can pass either a numeric slot index or a pre-branded ID string. Use `asInstrumentId`, `asPatternId`, `asTrackId`, and `asPlaylistPatternId` constructor functions to convert plain strings to branded types at system boundaries (file parsing, user input).

### Export Output Stability

Export modules in `src/exports/` must produce byte-identical output for the same input across refactoring changes. The test fixtures in `test/fixtures/` and the export test suite (`exportVgm.test.ts`, `exportMax.test.ts`, `exportWav.test.ts`, `exportAssemblyOptimized.test.ts`) verify zero diff in export output. Any change to export output is a behaviour change, not a refactoring, and must be routed through `docs/change/<version>/`.

### YM2149 Emulation Stability

The YM2149 register simulation, volume table, and noise generation algorithm in `src/synth/YM2149.ts` must not change during refactoring. These are hardware-accurate implementations. Any change to the emulation logic is a behaviour change, not a refactoring.

### MIDI Message Processing

MIDI message handling in `src/hooks/useMidiMessageProcessing.ts` is a hot path that executes on every incoming MIDI message. Avoid per-event allocations: use direct `Uint8Array` indexed access instead of `Array.from()`, and use string concatenation loops instead of `array.map().join()` for hex formatting.

### Electron Permission Policy

The desktop main process (`electron/main.cjs`) grants the `midi` permission only when the requesting page is the application's own origin: the packaged `file://` bundle or the development server at `http://localhost:8008`. Requests from any other origin are denied, and `midiSysex` is never granted because the app does not request it. The origin check lives in `electron/permissions.cjs`.

## Known Limitations

The following constraints reflect the current state of the codebase and are candidates for future improvement.

- **Single store**: All application state lives in one Zustand store (src/stores/). There is no store splitting or domain-based partitioning, which can make state updates difficult to reason about as the application grows.
- **No undo/redo**: The application does not implement an undo/redo history. All edits are immediate and irreversible without manual re-entry. No command pattern or state snapshot mechanism is present.
- **App.tsx monolith**: The main application component has grown large and handles significant rendering and event-handling logic that could be decomposed into smaller components or hooks.
- **Low test coverage for synth and exports**: The YM2149 emulator (src/synth/YM2149.ts), sound driver (src/synth/SoundDriver.ts), and export modules (src/exports/) have minimal automated test coverage. Core audio synthesis and file generation paths are not fully exercised by the test suite.
- **Single chip support**: Only the YM2149 chip is supported. The constants in src/constants/song.ts define supported chips as a single-element array, leaving no room for AY-3-8910 or other PSG variants without code changes.
- **Browser audio dependency**: Real-time playback relies on the Web Audio API and OscillatorNode, which imposes browser-specific behavior and latency characteristics that differ from native Atari ST hardware.
