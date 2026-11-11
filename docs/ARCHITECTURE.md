# DOSOUND Tracker Architecture

## System Overview

DOSOUND Tracker is a chiptune music editor for the AY/YM sound chip (YM2149 PSG) used in the Atari ST. It runs as a React 19 single-page application bundled with Vite 8 (rolldown) and ships as a desktop app through Electron 45. The core of the application is a software emulation of the YM2149 chip rendered through the Web Audio API, paired with a tracker-style song editor and a multi-format export pipeline.

The application is built around two main data paths. The first path is live audio playback: song data flows from React state through hooks into the sequencer integration, which computes register writes per tick, applies them to the YM2149 emulator, and produces sound through the Web Audio API. The second path is file export: the same song data flows through the exports modules into binary, assembly, VGM, WAV, or MAX formats.

The diagram below shows the high-level data flow.

```
+----------+     +-----------+     +----------------+     +------------+
|  UI      | --> |  Hooks    | --> |  Sequencer     | --> |  YM2149    |
|  React   |     |  useSeq   |     |  integration   |     |  emulator  |
+----------+     +-----------+     +----------------+     +------------+
     |                |                     |                    |
     |                |                     v                    v
     |                |          +------------------+    +----------------+
     |                |          |  playback utils  |    |  Web Audio API |
     |                |          |  50Hz VBLANK     |    |  AudioContext  |
     |                |          +------------------+    +----------------+
     |                |                     ^
     |                v                     |
     |     +--------------------+           |
     |     |  sequencer         | -- tick ->+
     |     |  AudioWorklet tick |
     |     +--------------------+
     |
     v
+----------+     +-----------+     +----------------+
|  Song    | --> |  exports/ | --> |  File output   |
|  data    |     |  core +   |     |  asm/bin/vgm/  |
|  state   |     |  formats  |     |  wav/max/mid/  |
|          |     |           |     |  mod           |
+----------+     +-----------+     +----------------+
```

## Module Boundaries

The source tree under `src/` is organized into focused folders. Each folder owns a single responsibility.

- **components** - Presentational React components. Includes layout shells (AppLayout), panels (HeaderPanel, CommandPanel, TrackerSection, EnvelopeSection, SongSection, FileInputs, PianoKeyboard), and the ModalManager. Components receive data and callbacks as props and do not own business logic. Three panels are the recorded exception: `PlaylistPanel`, `ToneNoisePanel`, and `EnvelopePanel` read and write `localStorage` directly for their persisted cursor and track-column state.
- **constants** - Static configuration values. Music constants (PATTERN_LENGTH, NOTE_FREQUENCIES, octave limits), song metadata options (SUPPORTED_SONG_CHIPS, SUPPORTED_SONG_FRAMES), and export type definitions.
- **exports** - File export pipeline. `core.ts` holds shared helpers (normalizeSongForExport, parseBaseKeyForExport, formatNoteLabel, downloadFile re-export). Format modules `asm.ts`, `bin.ts`, `max.ts`, `midi.ts`, `mod.ts`, `vgm.ts`, and `wav.ts` each produce a specific output format from normalized song data.
- **hooks** - Custom React hooks that encapsulate behavior. This is the largest folder and contains the bulk of the application logic: data management, playback, audio setup, MIDI, keyboard, modals, file operations, instrument actions, playlist operations, and sequencer integration. `usePreviewEnvelope` in `hooks/playback/` is the single preview-envelope engine shared by every instrument-preview surface. Every hook lives in a domain subdirectory (`midi/`, `instrument/`, `song/`, `playback/`, `keyboard/`, `audio/`, `sequencer/`, `modal/`, `app/`, `storage/`, `file/`, `ui/`) - the folder holds no files directly. It also holds the bounded orchestration hooks extracted from `App.tsx` (dialog groups, persistence, playback handlers) - each owns one concern and receives its dependencies through a typed parameter object.
- **modals** - Modal dialog components and their supporting logic. Separated from the general components folder to keep modal wiring isolated. Modal files are imported directly - the folder carries no barrel file.
- **hooks/ui** - Holds the single Zustand store, `useUiStore.ts`, beside the UI-domain hooks. The store holds cross-component UI state - `src/stores/` was dissolved when its only member moved here under the directories-only rule.
- **synth** - Audio synthesis core. Two selectable engines sit behind the `SoundEngine` contract in `soundEngine.ts`: `YM2149.ts` emulates the chip with Web Audio nodes (the `internal` engine, default) and `AyumiEngine.ts` drives the vendored `ayumiCore.ts` DSP inside `workers/ayumiWorklet.ts` (the `ayumi` engine). `channelInstrument.ts` holds the instrument-to-register logic shared by both engines, and `SoundDriver.ts` holds the song data-model interfaces (`Song`, `Pattern`, `Step`, `Note`, `Line`, `Instrument`) imported as types across the tree.
- **types** - Shared TypeScript type definitions used across modules.
- **utils** - Pure utility functions and stateless helpers. Every utility lives in a domain subdirectory (`instrument/`, `track/`, `song/`, `midi/`, `keyboard/`, `envelope/`, `playback/`, `file/`, `compression/`, `cursor/`, `export/`, `format/`, `log/`, `markdown/`, `panel/`, `pattern/`, `settings/`, `storage/`, `timer/`, `transpose/`, `validation/`, `yaml/`) - the folder holds no files directly, and single-file directories are allowed when a domain has one member.
- **workers** - Worklets and Web Workers. `sequencerWorklet.ts` is the `AudioWorkletProcessor` that paces the frame-rate VBLANK tick on the audio render thread, keeping playback timing isolated from the React render loop and the timer scheduler. `ayumiWorklet.ts` is the `AudioWorkletProcessor` that renders Ayumi samples off the main thread.
- **assets** - Static assets such as icons and images bundled with the app.

## State Domains

The application uses three distinct state domains, each chosen for a specific reason.

The first domain is the single Zustand store, `useUiStore`. It holds cross-component UI state that multiple panels need to read or write without prop drilling: `currentOctave`, `sharedCurrentLine`, and `channelMutes`. The store persists `currentOctave` to localStorage itself, while `sharedCurrentLine` and `channelMutes` are restored from localStorage at startup and written back by the persistence hooks. App.tsx subscribes to this store through `useAppUiState` - the selector bundle for the members and actions the shell wires - and passes values down as props.

The second domain is hook-owned local state. Song data, instrument lists, pattern data, and playback flags live in `useState` calls inside `useDataManagement` and sibling hooks wired from `App.tsx`. These are passed down to child components and hooks as props. This keeps the song model co-located with the orchestrator and avoids a second store.

The third domain is hook-local refs. Audio-rate state such as the live playback position, worker handles, and callback refs are stored in `useRef` inside hooks like `useSequencer`. This avoids triggering React re-renders at 50Hz and keeps the audio thread decoupled from the render thread.

A bounded undo/redo history also lives in this domain. `useDataManagement` snapshots the `{song, instrument}` pair before every recorded mutation and keeps the undo and redo stacks in a ref, so restores travel the same setter path as ordinary edits. There is still no Command pattern - snapshots at the single mutation boundary made command objects unnecessary. The decision is recorded in the Architectural Decisions section.

## Data Flow

The application has two primary data flows.

**Playback pipeline:**

1. Song data lives in `useState` inside `useDataManagement`, which is wired from App.tsx and handles load, save, and mutation of the song model.
2. `useSequencer` receives the song's pattern length and frame rate, starts the AudioWorklet clock node on the shared `AudioContext`, and emits tick events at that rate (50Hz default).
3. Each tick drives `useSequencerIntegration`, which advances the per-channel instrument envelopes and computes the next frame of YM2149 register values through `src/utils/playback/` helpers.
4. The integration applies those register writes to the selected `SoundEngine` instance.
5. The engine renders the registers: `internal` maps them to Web Audio nodes (oscillators, gain nodes, noise buffer, envelope gain), while `ayumi` forwards them to the `AudioWorkletProcessor` holding the Ayumi DSP core. Per-channel pans from the song's `stereo` node reach the engine through `setChannelPans` at setup time, and the song's `chip` field through `setChip`. Both produce sound through the `AudioContext`.

**Export pipeline:**

1. Song data is normalized through `exports/core.ts` (`normalizeSongForExport`) to fill in missing fields with safe defaults.
2. The selected format module (`asm`, `bin`, `max`, `midi`, `mod`, `vgm`, or `wav`) processes the normalized song into its target representation.
3. Shared helpers in `core.ts` (`parseBaseKeyForExport`, `formatNoteLabel`) are reused across formats to keep note and key handling consistent.
4. The resulting file content is delivered to the user through `downloadFile` (re-exported from `core.ts`).

## Audio Synthesis Pipeline

The audio pipeline mirrors the real Atari ST hardware path, emulated in software.

The `YM2149` class is the default (`internal`) hardware emulator. It owns 16 registers, three tone channels, a noise generator, an envelope generator, and a set of Web Audio nodes (oscillators, gain nodes, noise buffer source, envelope gain). It runs at a configurable clock (default 2 MHz, `YM_CLOCK = 2000000`) set per song via the `clock` field. The clock drives the tone and noise frequency calculations (`f = clock / (16 * period)`). At 1 MHz, period values are half of the 2 MHz values for the same note. It uses a 16-step logarithmic volume table (`YM_LOG_VOLUME_TABLE`) that approximates the real chip's -2dB per step curve. The song's `chip` field selects the variant's amplitude curve: `AY` swaps in the AY-3-8910 table (`AY_LOG_VOLUME_TABLE`, derived from the Ayumi `AY_DAC_TABLE`), and every other value keeps the YM curve. Register writes are batched to avoid redundant node updates.

The `AyumiEngine` class is the `ayumi` engine. It owns a main-thread register mirror and forwards writes to an `AudioWorkletProcessor` (`workers/ayumiWorklet.ts`) that runs the vendored `ayumiCore.ts` DSP - the precise AY/YM emulation by Peter Sovietov with measured YM2149 and AY-3-8910 DAC tables, hardware envelope generator, FIR decimation, and DC removal filter. The mirror keeps `getRegisters`, `getRegistersArray`, and `getState` synchronous for the Dump and EQ panels. The worklet renders two output channels; per-channel pans drive `AyumiCore.setPan`, and all-centre pans keep emitting the folded mono mixdown on both outputs to match the Atari ST. The song's `chip` field arrives as a `chip` message that flips the core's `isYm` flag, selecting the matching DAC table while the register model, tone, noise, and envelope machinery stay shared between the variants.

Both engines implement the `SoundEngine` contract in `src/synth/soundEngine.ts`. `createSoundEngine` resolves a persisted engine id (`internal` or `ayumi`, `internal` fallback) to a concrete engine inside `useAudioSetup`, and switching engines disposes the active instance and creates the new one without a reload. The instrument-to-register translation lives once in `src/synth/channelInstrument.ts` and feeds both engines.

The song data model (`Song`, `Pattern`, `Step`, `Note`, `Line`, `Instrument`) is defined as interfaces in `src/synth/SoundDriver.ts` and consumed across the tree through type-only imports. Per-tick playback logic lives in `src/hooks/sequencer/useSequencerIntegration.ts` and `src/utils/playback/`, which translate instruments, envelopes, and mixer state into register writes on the `YM2149` instance. Timing is anchored to the song's frame rate (default 50 Hz, `DEFAULT_SONG_FRAME`), configurable per song via the `frame` field.

The `sequencerWorklet` `AudioWorkletProcessor` runs the frame-rate timer (`tickInterval = 1000 / frameRate`, 20 ms at 50 Hz, 16.66 ms at 60 Hz) on the audio render thread of the shared `AudioContext`. It counts rendered samples inside `process()`, maintains playback position (pattern, line, tick), and posts `tick`, `update`, and `stop` messages back to the main thread. This isolates timing generation from React's render cadence, main-thread workloads, and timer-scheduler clamping - a suspended context simply produces no ticks, so the position view can never advance while nothing renders.

## Export Pipeline

The export pipeline converts the in-memory song model into distributable file formats. All formats share a common core and diverge only in their output stage.

- **asm.ts** - Produces Motorola 68000 assembly source compatible with the DOSOUND replay routine. Emits register-write byte streams with delay markers.
- **bin.ts** - Produces raw binary data representing the DOSOUND register stream, suitable for direct inclusion in Atari ST programs.
- **vgm.ts** - Produces VGM (Video Game Music) format files, a standard chip-music capture format that records YM2149 register writes with timing.
- **wav.ts** - Produces WAV audio by simulating the song's register frames (`simulateSong`) and synthesizing the resulting PCM samples in software.
- **max.ts** - Produces MAX (Music Audio eXchange) files, a chunk-based binary interchange format for chiptune songs, specified in `MAX.md`.
- **midi.ts** - Produces Standard MIDI Files (SMF type 1) at note level for DAW import, reporting the mapping losses it cannot represent.
- **mod.ts** - Produces ProTracker MOD modules from the simulated register stream at row granularity through two generated samples, reporting the mapping losses.

All format modules import shared helpers from `exports/core.ts`: `normalizeSongForExport` for safe defaults, `parseBaseKeyForExport` for base-key parsing, `formatNoteLabel` for note display, and `downloadFile` for file delivery. This keeps note handling, key parsing, and file writing consistent across every format.

The format modules load on demand: `useExportOperations` resolves them through dynamic `import()` inside its export handlers, so `asm`, `bin`, `max`, `vgm`, `wav`, and their `playbackSimulation`/`zx0` dependencies stay out of the entry chunk until the first export request. All handlers point at the single `exports/export.ts` barrel, so the build emits one consolidated lazy chunk (`js/export.js`) serving every format.

## Architectural Decisions

Several decisions in the codebase are deliberate trade-offs rather than oversights.

**Intentional React anti-patterns for audio stability.** The codebase disables `react-hooks/exhaustive-deps` at the top of App.tsx and in several hooks. Dependency arrays are kept sparse on purpose. Prop values are mirrored into refs so that audio callbacks always read the latest value without being re-created on every render. Direct `setState` calls are used in some hot paths instead of functional updates. These patterns violate common React guidance but are chosen because re-creating audio callbacks or re-rendering at 50Hz causes audible glitches and timing drift.

**Stereo output is opt-in; single chip remains an open end.** A song may declare a `stereo` node - a named layout (mono, ABC, ACB) plus free per-channel pans - resolved by `resolveChannelPans` and pushed to the engine through `SoundEngine.setChannelPans`. The internal engine inserts `StereoPannerNode`s per channel only while stereo is active, keeping the default mono graph bit-identical; the Ayumi worklet renders two channels and folds to the same mono sample while every pan sits at centre. Compatible hardware pairs two AY-family chips in stereo (for example the PETAY board on the Commodore PET and the TurboSound dual-AY configuration on the ZX Spectrum), and machines wire the A/B/C channels to stereo positions differently, so the layout catalog is data-driven and channel keys are letter-addressed to admit a dual-chip stereo configuration rather than exclude it.

**Single store vs domain stores.** The project uses one Zustand store (`uiStore`) for cross-component UI state only. Song, instrument, and pattern data stay in `useState` inside the domain hooks wired from App.tsx and travel as props. This avoids the overhead of synchronizing multiple stores and keeps the song model close to the orchestrator. The trade-off is a heavy App component and deep prop passing. Re-evaluated in the 1.5.2 window: the store surface is three members (`currentOctave`, `sharedCurrentLine`, `channelMutes`) and member-wise selectors already isolate re-renders, so a domain split would add files and persistence sites without reducing re-render scope - the single store is confirmed.

**Snapshot history over a command layer.** The undo/redo model records `{song, instrument}` snapshots inside `useDataManagement` instead of encapsulating each edit as a command. Every composition mutation already funnels through that hook, and every mutation helper produces fresh objects through spreads, so snapshots hold references cheaply and restore through the ordinary setters. A command layer would rewrite every mutation site for no gain at a single boundary. The stacks stay in a ref, bounded and session-scoped, so recording and restoring add no render work on the audio path - undo during playback re-syncs the sequencer through the existing `usePlaybackControls` effects and never recreates an audio callback.

**AudioWorklet for timing.** The frame-rate VBLANK clock runs in `sequencerWorklet.ts` on the audio render thread rather than in a `setTimeout` worker. This protects tick generation from React renders, garbage collection pauses, UI event handlers, and timer coalescing - and ties cadence to the audio render quantum. The processor owns the tick interval and playback position, posting messages back to the hook, which then drives the synth. Tick delivery still crosses the main-thread event loop, so the gain is exact generation, not zero-latency delivery.

**TypeScript audio cores over WebAssembly.** Evaluated and declined in the 1.5.2 window against a measured-cost basis. The internal engine holds no TypeScript DSP - `YM2149.ts` maps register writes to Web Audio node parameters and the browser renders samples natively - and the only sample-rate DSP (`ayumiCore.ts`) already runs inside `ayumiWorklet.ts` on the render thread. Measured costs sit far below budget: the three-channel per-tick register update is about 0.0001 ms of a 20 ms window, and an Ayumi 128-sample quantum is about 1.3 percent of the render budget. Tick delivery crosses the main-thread event loop either way, so a WASM core cannot tighten timing beyond the AudioWorklet clock. A WASM core also prices in a new toolchain, a contributor prerequisite, and a byte-identical parity obligation across engines, chip variants, and stereo - declined until measured CPU evidence on a real device reopens it.

**App.tsx as central orchestrator.** App.tsx is the single composition root. It instantiates the domain and orchestration hooks, wires their inputs and outputs together, and renders the component tree through `AppLayout`. Dialog, persistence, and playback handler clusters live in dedicated orchestration hooks under `src/hooks/` (`useAppInfoDialogs`, `useAppState`, `useSongLifecycleDialogs`, `useInstrumentFileLoading`, `usePasteTrackOptions`, `useInstrumentDialogs`, `useSongToolDialogs`, `useExportModal`, `useTransposeDialog`, `useMidiDialog`, `useResponsivePanels`, `useEditorPersistence`, `usePlaybackHandlers`, `usePlaybackBridge`, `usePlaybackControls`, `useSongImportWarning`, `useInstrumentOctaves`, `useTrackFocus`, `useAudioContextResume`, `useElectronCloseGuard`, `useTrackPattern`, `useNavigationSuspension`, `useStartupRestore`, `useAppModals`, `useAppUiState`, `useChannelPans`, `useSettingsSession`), so App.tsx keeps the wiring visible in one file without carrying every handler body. `useAppModals` assembles the modal layer - it calls `useModalManager` internally and returns the rendered `ModalManager` element - while `useNavigationSuspension` computes the aggregate flag that gates keyboard navigation and `useStartupRestore` owns the persisted-view restoration and startup test tone. `useAppUiState` bundles the uiStore members and actions the shell consumes, `useChannelPans` owns the stereo pan resolution and the EQ pan-cycle handler, and `useSettingsSession` owns the committed-settings reload plus the settings commit and cancel handlers over `useSettingsDialog`.

## Known Limitations

The current architecture has several documented constraints.

- **App.tsx concentrates the wiring.** The central orchestrator still holds all hook wiring and the JSX prop map. Staged decomposition moved the dialog, persistence, playback handler bodies, the modal layer, the store-selector bundle, the stereo pan cluster, and the settings session into `src/hooks/`, but the file remains the largest in the tree and the main navigation cost.
- **Business logic is scattered across hooks and utils.** Song management, MIDI, file operations, instrument actions, and sequencer integration each live in their own hook files, some of which are among the largest files in the tree (`useSequencerIntegration`, `useSongManagement`, `useMidiMessageProcessing`). Cross-hook dependencies are implicit and wired in App.tsx.
- **No Command pattern.** Mutations are free functions and setter calls, not encapsulated command objects. Edit history is covered by the snapshot mechanism recorded in the decisions above, but the absence of commands still makes fine-grained edit auditing difficult.
- **History restores are whole-pair snapshots.** Undo restores the song and the current instrument together rather than the edited field alone, so it cannot express partial or selective reverts and coalescing is limited to the marked song-information fields.
- **Low test coverage for the synth.** The YM2149 emulator and the Ayumi engine now carry dedicated `test/synth/` suites plus `test/workers/` protocol tests, and the export format modules are exercised by the `test/exports/` suite - the bulk of remaining coverage targets utilities and hooks.
