# DOSOUND Tracker Specification

DOSOUND Tracker is a chiptune music creation tool targeting the AY/YM sound chip (YM2149 PSG) used in the Atari ST. The application provides a pattern-based sequencer, instrument editor, playlist arrangement, and multiple export formats including native DOSOUND assembly for Atari ST demos and games.

The project is built as a desktop application using Electron, with the audio engine running in the browser via the Web Audio API. Songs are authored in a tracker-style interface and can be exported to formats suitable for retro hardware playback.


## Technology Stack

See `package.json` for exact version numbers. The project uses the following technologies:

| Technology | Purpose |
|---|---|
| React | UI component library and rendering |
| TypeScript | Static typing and compile-time safety |
| rolldown-vite | Build tool and dev server (Vite-compatible, Rolldown-backed) |
| Zustand | Lightweight state management |
| Web Audio API | Real-time YM2149 sound synthesis in the browser |
| Electron | Desktop application packaging for Windows, macOS, and Linux |
| Vitest | Unit and component test runner |
| ESLint | Linting and code style enforcement |

Additional libraries include js-yaml for song file parsing, lucide-react for icons, and electron-builder for cross-platform packaging.


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

| Directory | File Count | Responsibility |
|---|---|---|
| src/assets | 9 | Static assets, icons, and image resources |
| src/components | 27 | React UI components for the tracker interface |
| src/constants | 6 | Application constants for music, keyboard, song, export, and navigation |
| src/exports | 6 | Export modules for assembly, binary, MAX, VGM, and WAV formats |
| src/hooks | 30 | Custom React hooks for state, playback, and UI behavior |
| src/modals | 15 | Modal dialog components for file operations and settings |
| src/stores | 1 | Zustand store definitions for global application state |
| src/synth | 4 | YM2149 hardware emulator and sound driver engine |
| src/types | 2 | Branded type definitions and playlist type helpers |
| src/utils | 43 | Utility functions for parsing, formatting, validation, and simulation |
| src/workers | 1 | Web Worker for background audio or export processing |


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

| Register | Function |
|---|---|
| R0 | Channel A tone period, fine (8 bits) |
| R1 | Channel A tone period, coarse (4 bits) |
| R2 | Channel B tone period, fine (8 bits) |
| R3 | Channel B tone period, coarse (4 bits) |
| R4 | Channel C tone period, fine (8 bits) |
| R5 | Channel C tone period, coarse (4 bits) |
| R6 | Noise period (5 bits) |
| R7 | Mixer and envelope enable control (tone/noise on/off for all channels) |
| R8 | Channel A amplitude (4 bits volume, bit 4 envelope enable) |
| R9 | Channel B amplitude (4 bits volume, bit 4 envelope enable) |
| R10 | Channel C amplitude (4 bits volume, bit 4 envelope enable) |
| R11 | Envelope period, fine (8 bits) |
| R12 | Envelope period, coarse (8 bits) |
| R13 | Envelope shape (4 bits) and envelope enable (bit 4) |

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

Application constants are organized in src/constants/. Each file covers a specific domain.

- **music.ts** defines note frequencies (NOTE_FREQUENCIES with C4 = 261.63 Hz through B4), the base octave (NOTE_BASE_OCTAVE = 4), the chromatic note list, octave bounds (0-7), pattern length (64), max instruments (256), volume and noise limits, pitch and shift ranges, and envelope length (32).
- **keyboard.ts** defines the KEYBOARD_TO_NOTE map linking computer keyboard keys to musical notes with octave offsets.
- **song.ts** defines default song chip ("YM"), default frame rate (50), default chip clock (2000000), and arrays of supported chips, frame rates, and chip clocks.
- **export.ts** defines ExportType (song, pattern, instrument), ExportStrategy (simple, complex, optimized), and ExportFormat (dump, data, bin, vgm, max, wav) union types.
- **navigation.ts** defines NAVIGATION_ORDER for UI section focus cycling and KEYBOARD_SHORTCUTS mapping key combinations to application actions.


## Keyboard Shortcuts and Input Bindings

The computer keyboard doubles as a piano input device. The mapping is defined in src/constants/keyboard.ts and re-exported through src/constants/music.ts.

**Piano keyboard mapping** (lower row maps to the base octave, upper row maps to one or two octaves above):

- Z = C, S = C#, X = D, D = D#, C = E, V = F, G = F#, B = G, H = G#, N = A, J = A#, M = B
- Comma = C (octave +1), L = C# (octave +1), Period = D (octave +1), Semicolon = D# (octave +1), Slash = E (octave +1)
- Q = C (octave +1), 2 = C# (octave +1), W = D (octave +1), 3 = D# (octave +1), E = E (octave +1), R = F (octave +1), 5 = F# (octave +1), T = G (octave +1), 6 = G# (octave +1), Y = A (octave +1), 7 = A# (octave +1), U = B (octave +1)
- I = C (octave +2), 9 = C# (octave +2), O = D (octave +2), 0 = D# (octave +2), P = E (octave +2), LeftBracket = F (octave +2), Plus = F# (octave +2), RightBracket = G (octave +2)

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

**File operation shortcuts:**

- CTRL+N creates a new song
- CTRL+O loads a song from file
- CTRL+S saves the current song
- CTRL+I creates a new instrument

The navigation order cycles through these sections: piano, octave, commands, trackA, trackB, trackC, mode, volume, shift, pitch, noise, songInfo, playlist, instrumentList.


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


## Known Limitations

The following constraints reflect the current state of the codebase and are candidates for future improvement.

- **Single store**: All application state lives in one Zustand store (src/stores/). There is no store splitting or domain-based partitioning, which can make state updates difficult to reason about as the application grows.
- **No undo/redo**: The application does not implement an undo/redo history. All edits are immediate and irreversible without manual re-entry. No command pattern or state snapshot mechanism is present.
- **App.tsx monolith**: The main application component has grown large and handles significant rendering and event-handling logic that could be decomposed into smaller components or hooks.
- **Low test coverage for synth and exports**: The YM2149 emulator (src/synth/YM2149.ts), sound driver (src/synth/SoundDriver.ts), and export modules (src/exports/) have minimal automated test coverage. Core audio synthesis and file generation paths are not fully exercised by the test suite.
- **Single chip support**: Only the YM2149 chip is supported. The constants in src/constants/song.ts define supported chips as a single-element array, leaving no room for AY-3-8910 or other PSG variants without code changes.
- **Browser audio dependency**: Real-time playback relies on the Web Audio API and OscillatorNode, which imposes browser-specific behavior and latency characteristics that differ from native Atari ST hardware.
