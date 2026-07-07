# DOSOUND Tracker Architecture

## System Overview

DOSOUND Tracker is a chiptune music editor for the AY/YM sound chip (YM2149 PSG) used in the Atari ST. It runs as a React 19 single-page application bundled with Vite (rolldown-vite) and ships as a desktop app through Electron 39. The core of the application is a software emulation of the YM2149 chip rendered through the Web Audio API, paired with a tracker-style song editor and a multi-format export pipeline.

The application is built around two main data paths. The first path is live audio playback: song data flows from React state through hooks into the SoundDriver, which generates register-write events, feeds them to the YM2149 emulator, and produces sound through the Web Audio API. The second path is file export: the same song data flows through the exports modules into binary, assembly, VGM, WAV, or Max/MSP formats.

The diagram below shows the high-level data flow.

```
+----------+     +-----------+     +----------------+     +------------+
|  UI      | --> |  Hooks    | --> |  SoundDriver   | --> |  YM2149    |
|  React   |     |  useSeq   |     |  event gen     |     |  emulator  |
+----------+     +-----------+     +----------------+     +------------+
     |                |                     |                    |
     |                |                     v                    v
     |                |          +------------------+    +----------------+
     |                |          |  SequencerEngine |    |  Web Audio API |
     |                |          |  50Hz VBLANK     |    |  AudioContext  |
     |                |          +------------------+    +----------------+
     |                |                     ^
     |                v                     |
     |     +--------------------+           |
     |     |  sequencerWorker   | -- tick ->+
     |     |  Web Worker timing |
     |     +--------------------+
     |
     v
+----------+     +-----------+     +----------------+
|  Song    | --> |  exports/ | --> |  File output   |
|  data    |     |  core +   |     |  asm/bin/vgm/  |
|  state   |     |  formats  |     |  wav/max       |
+----------+     +-----------+     +----------------+
```

## Module Boundaries

The source tree under `src/` is organized into focused folders. Each folder owns a single responsibility.

- **components** - Presentational React components. Includes layout shells (AppLayout), panels (HeaderPanel, CommandPanel, TrackerSection, EnvelopeSection, SongSection, FileInputs, PianoKeyboard), and the ModalManager. Components receive data and callbacks as props and do not own business logic.
- **constants** - Static configuration values. Music constants (PATTERN_LENGTH, NOTE_FREQUENCIES, octave limits), song metadata options (SUPPORTED_SONG_CHIPS, SUPPORTED_SONG_FRAMES), and export type definitions.
- **exports** - File export pipeline. `core.ts` holds shared helpers (normalizeSongForExport, parseBaseKeyForExport, formatNoteLabel, downloadFile re-export). Format modules `asm.ts`, `bin.ts`, `max.ts`, `vgm.ts`, and `wav.ts` each produce a specific output format from normalized song data.
- **hooks** - Custom React hooks that encapsulate behavior. This is the largest folder and contains the bulk of the application logic: data management, playback, audio setup, MIDI, keyboard, modals, file operations, instrument actions, playlist operations, and sequencer integration.
- **modals** - Modal dialog components and their supporting logic. Separated from the general components folder to keep modal wiring isolated.
- **stores** - Zustand stores. Currently contains a single store, `uiStore.ts`, which holds cross-component UI state.
- **synth** - Audio synthesis core. `YM2149.ts` emulates the hardware chip, `SoundDriver.ts` generates register-write events, `SequencerEngine.ts` handles frame timing, and `EventOptimizer.ts` optimizes event streams.
- **types** - Shared TypeScript type definitions used across modules.
- **utils** - Pure utility functions. Includes logger, file operations, piano utilities, playback utilities, and other stateless helpers.
- **workers** - Web Workers. `sequencerWorker.ts` runs the 50Hz VBLANK timer in a dedicated thread to keep playback timing isolated from the React render loop.
- **assets** - Static assets such as icons and images bundled with the app.

## State Domains

The application uses three distinct state domains, each chosen for a specific reason.

The first domain is the single Zustand store, `uiStore`. It holds cross-component UI state that multiple panels need to read or write without prop drilling: `currentOctave`, `sharedCurrentLine`, and `channelMutes`. The store also persists channel mutes to localStorage. App.tsx subscribes to this store at its top level and passes values down as props.

The second domain is App.tsx local state. Song data, instrument lists, pattern data, and playback flags live in `useState` calls inside the App component. These are passed down to child components and hooks as props. This keeps the song model co-located with the orchestrator and avoids a second store.

The third domain is hook-local refs. Audio-rate state such as the live playback position, worker handles, and callback refs are stored in `useRef` inside hooks like `useSequencer`. This avoids triggering React re-renders at 50Hz and keeps the audio thread decoupled from the render thread.

There is no Command pattern and no undo/redo system at the architecture level. Edits mutate state directly through setter functions passed down from App.tsx. This is an intentional trade-off documented in the Architectural Decisions section.

## Data Flow

The application has two primary data flows.

**Playback pipeline:**

1. Song data lives in App.tsx useState and is passed to `useDataManagement`, which handles load, save, and mutation of the song model.
2. `useSequencer` receives song speed and pattern length, starts the Web Worker, and emits tick events at 50Hz.
3. Each tick drives `useSequencerIntegration`, which calls into the `SoundDriver` to generate the next frame of register-write events.
4. The `SoundDriver` translates notes, instruments, and envelopes into YM2149 register writes and delay events, then applies them to the `YM2149` emulator instance.
5. The `YM2149` emulator maps registers to Web Audio nodes (oscillators, gain nodes, noise buffer, envelope gain) and produces sound through the `AudioContext`.

**Export pipeline:**

1. Song data is normalized through `exports/core.ts` (`normalizeSongForExport`) to fill in missing fields with safe defaults.
2. The selected format module (`asm`, `bin`, `max`, `vgm`, or `wav`) processes the normalized song into its target representation.
3. Shared helpers in `core.ts` (`parseBaseKeyForExport`, `formatNoteLabel`) are reused across formats to keep note and key handling consistent.
4. The resulting file content is delivered to the user through `downloadFile` (re-exported from `core.ts`).

## Audio Synthesis Pipeline

The audio pipeline mirrors the real Atari ST hardware path, emulated in software.

The `YM2149` class is the hardware emulator. It owns 16 registers, three tone channels, a noise generator, an envelope generator, and a set of Web Audio nodes (oscillators, gain nodes, noise buffer source, envelope gain). It runs at a configurable clock (default 2 MHz, `YM_CLOCK = 2000000`) set per song via the `clock` field. The clock drives the tone and noise frequency calculations (`f = clock / (16 * period)`). At 1 MHz, period values are half of the 2 MHz values for the same note. It uses a 16-step logarithmic volume table (`YM_LOG_VOLUME_TABLE`) that approximates the real chip's -2dB per step curve. Register writes are batched to avoid redundant node updates.

The `SoundDriver` class sits above the emulator. It defines the core data model (`Song`, `Pattern`, `Step`, `Note`, `Instrument`) and the event types (`SoundEvent` with `register` or `delay` variants). It converts the tracker's musical data into a stream of register writes and delays, using DOSOUND conventions (`DOSOUND_REGISTER_WRITE = 0xFF`, `DOSOUND_END_MARKER = 0x00`). The `EventOptimizer` post-processes the event stream to remove redundant writes. Timing is anchored to the song's frame rate (default 50 Hz, `VBLANK_RATE = 50`), configurable per song via the `frame` field.

The `SequencerEngine` class handles frame-level timing. It indexes instruments by id, resolves song speed into `ticksPerRow` (clamped and forced even), and exposes `processFrame` to advance the register state one tick at a time. The engine is deterministic and stateless across frames except for the register snapshot passed in by the caller.

The `sequencerWorker` Web Worker runs the frame-rate timer (`tickInterval = 1000 / frameRate`, 20 ms at 50 Hz, 16.66 ms at 60 Hz) in a dedicated thread. It maintains playback position (pattern, line, tick) and posts `tick`, `update`, and `stop` messages back to the main thread. This isolates timing from React's render cadence and from main-thread workloads.

## Export Pipeline

The export pipeline converts the in-memory song model into distributable file formats. All formats share a common core and diverge only in their output stage.

- **asm.ts** - Produces Motorola 68000 assembly source compatible with the DOSOUND replay routine. Emits register-write byte streams with delay markers.
- **bin.ts** - Produces raw binary data representing the DOSOUND register stream, suitable for direct inclusion in Atari ST programs.
- **vgm.ts** - Produces VGM (Video Game Music) format files, a standard chip-music capture format that records YM2149 register writes with timing.
- **wav.ts** - Produces WAV audio by rendering the song through the YM2149 emulator offline and encoding the resulting PCM samples.
- **max.ts** - Produces output for Max/MSP, enabling use of the song data inside the Max visual programming environment.

All format modules import shared helpers from `exports/core.ts`: `normalizeSongForExport` for safe defaults, `parseBaseKeyForExport` for base-key parsing, `formatNoteLabel` for note display, and `downloadFile` for file delivery. This keeps note handling, key parsing, and file writing consistent across every format.

## Architectural Decisions

Several decisions in the codebase are deliberate trade-offs rather than oversights.

**Intentional React anti-patterns for audio stability.** The codebase disables `react-hooks/exhaustive-deps` at the top of App.tsx and in several hooks. Dependency arrays are kept sparse on purpose. Prop values are mirrored into refs so that audio callbacks always read the latest value without being re-created on every render. Direct `setState` calls are used in some hot paths instead of functional updates. These patterns violate common React guidance but are chosen because re-creating audio callbacks or re-rendering at 50Hz causes audible glitches and timing drift.

**Single store vs domain stores.** The project uses one Zustand store (`uiStore`) for cross-component UI state only. Song, instrument, and pattern data stay in App.tsx useState and travel as props. This avoids the overhead of synchronizing multiple stores and keeps the song model close to the orchestrator. The trade-off is a heavy App component and deep prop passing.

**Web Worker for timing.** The 50Hz VBLANK clock runs in `sequencerWorker.ts` rather than on the main thread. This protects playback timing from React renders, garbage collection pauses, and UI event handlers. The worker owns the tick interval and playback position, posting messages back to the hook, which then drives the synth.

**App.tsx as central orchestrator.** App.tsx is the single composition root. It instantiates roughly 20 hooks, wires their inputs and outputs together, and renders the component tree through `AppLayout`. This keeps the data flow visible in one file but makes the file very large (see Known Limitations).

## Known Limitations

The current architecture has several documented constraints.

- **App.tsx is 2194 lines.** The central orchestrator holds the bulk of hook wiring, state declarations, and effect setup. This makes the file hard to navigate and is the single largest maintenance risk.
- **Business logic is scattered across hooks and utils.** Song management, MIDI, file operations, instrument actions, and sequencer integration each live in their own hook files, some of which are large (useSequencerIntegration at ~21KB, useMidiActions at ~21KB, useSongManagement at ~19KB). Cross-hook dependencies are implicit and wired in App.tsx.
- **No undo/redo.** There is no history stack and no snapshot mechanism. All edits apply directly to state. Recovering from a mistake requires manual re-entry or reloading the song.
- **No Command pattern.** Mutations are free functions and setter calls, not encapsulated command objects. This blocks future undo/redo and makes edit auditing difficult.
- **Low test coverage for synth and exports.** The YM2149 emulator, SoundDriver event generation, SequencerEngine frame logic, and the five export format modules have minimal automated tests. The bulk of test coverage targets utilities and hooks.
