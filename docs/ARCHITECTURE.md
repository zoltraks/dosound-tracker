# DOSOUND Tracker Architecture

## System Overview

DOSOUND Tracker has two independent paths from song data. Live playback follows an audio-thread clock and sends register updates to the selected sound engine. Export derives files from song data without depending on the live engine. [App.tsx](../src/App.tsx) is the composition root.

## Module Boundaries

Keep application wiring in [App.tsx](../src/App.tsx) and panel layout in [AppLayout.tsx](../src/components/shell/AppLayout.tsx). Put behaviour in domain hooks and pure transformations in domain utilities. Presentational components receive state and callbacks. Playlist, Tone/Noise, and envelope panels have a recorded exception for persisting their local cursor or column state.

Both renderers implement [SoundEngine](../src/synth/soundEngine.ts) and share [instrument-to-register translation](../src/synth/channelInstrument.ts). The canonical song types live in [SoundDriver.ts](../src/synth/SoundDriver.ts).

## State Domains

Keep cross-panel UI state in the single [Zustand store](../src/hooks/ui/useUiStore.ts) and composition data in domain hooks such as [useDataManagement](../src/hooks/song/useDataManagement.ts). The store persists the octave directly. Persistence hooks own writes for the shared row and channel mutes. Keep live playback position and callback state in refs so audio-rate changes avoid scheduling React renders. See Architectural Decisions for the undo/redo and store trade-offs.

## Data Flow

For live playback, trace [sequencerWorklet.ts](../src/workers/sequencerWorklet.ts) through [useSequencerIntegration.ts](../src/hooks/sequencer/useSequencerIntegration.ts) to the shared sound engine contract. For file output, trace [useExportOperations.ts](../src/hooks/file/useExportOperations.ts) through the selected exporter and [shared normalization](../src/exports/core.ts).

## Audio Synthesis Pipeline

[YM2149.ts](../src/synth/YM2149.ts) maps registers to browser audio nodes. [AyumiEngine.ts](../src/synth/AyumiEngine.ts) mirrors the registers on the main thread for synchronous UI reads and sends them to the [Ayumi worklet](../src/workers/ayumiWorklet.ts). Both engines use the same instrument translation. See [Specification](SPECIFICATION.md#sound-engines) for clock, chip, and stereo parity requirements.

## Export Pipeline

Keep export on demand. [useExportOperations.ts](../src/hooks/file/useExportOperations.ts) imports the shared [export entry](../src/exports/export.ts) on request so the format implementations and their heavy dependencies stay out of startup. Preserve shared normalization across format implementations. See [FORMAT.md](FORMAT.md) and [MAX.md](MAX.md) for file contracts.

## Architectural Decisions

Several decisions in the codebase are deliberate trade-offs rather than oversights.

**Intentional React anti-patterns for audio stability.** The codebase disables `react-hooks/exhaustive-deps` at the top of App.tsx and in several hooks. Dependency arrays are kept sparse on purpose. Prop values are mirrored into refs so that audio callbacks always read the latest value without being re-created on every render. Direct `setState` calls are used in some hot paths instead of functional updates. These patterns violate common React guidance but are chosen because re-creating audio callbacks or re-rendering at 50Hz causes audible glitches and timing drift.

**Stereo output is opt-in; single chip remains an open end.** A song may declare a `stereo` node - a named layout (mono, ABC, ACB) plus free per-channel pans - resolved by `resolveChannelPans` and pushed to the engine through `SoundEngine.setChannelPans`. The internal engine inserts `StereoPannerNode`s per channel only while stereo is active, keeping the default mono graph bit-identical; the Ayumi worklet renders two channels and folds to the same mono sample while every pan sits at centre. Compatible hardware pairs two AY-family chips in stereo (for example the PETAY board on the Commodore PET and the TurboSound dual-AY configuration on the ZX Spectrum), and machines wire the A/B/C channels to stereo positions differently, so the layout catalog is data-driven and channel keys are letter-addressed to admit a dual-chip stereo configuration rather than exclude it.

**Single store vs domain stores.** The project uses one Zustand store (`uiStore`) for cross-component UI state only. Song, instrument, and pattern data stay in `useState` inside the domain hooks wired from App.tsx and travel as props. This avoids the overhead of synchronizing multiple stores and keeps the song model close to the orchestrator. The trade-off is a heavy App component and deep prop passing. Re-evaluated in the 1.5.2 window: the store surface is three members (`currentOctave`, `sharedCurrentLine`, `channelMutes`) and member-wise selectors already isolate re-renders, so a domain split would add files and persistence sites without reducing re-render scope - the single store is confirmed.

**Snapshot history over a command layer.** The undo/redo model records `{song, instrument}` snapshots plus the sequencer cursor position inside `useDataManagement` instead of encapsulating each edit as a command. Every composition mutation already funnels through that hook, and every mutation helper produces fresh objects through spreads, so snapshots hold references cheaply and restore through the ordinary setters and the sequencer `setPosition` path. A command layer would rewrite every mutation site for no gain at a single boundary. The stacks stay in a ref, bounded in memory and persisted to local storage at a shallower depth, so recording and restoring add no render work on the audio path - undo during playback re-syncs the sequencer through the existing `usePlaybackControls` effects and never recreates an audio callback. NEW SONG, LOAD SONG, DEMO SONG, and RESET clear the stacks rather than leaving the previous song undoable.

**AudioWorklet for timing.** The frame-rate VBLANK clock runs in `sequencerWorklet.ts` on the audio render thread rather than in a `setTimeout` worker. This protects tick generation from React renders, garbage collection pauses, UI event handlers, and timer coalescing - and ties cadence to the audio render quantum. The processor owns the tick interval and playback position, posting messages back to the hook, which then drives the synth. Tick delivery still crosses the main-thread event loop, so the gain is exact generation, not zero-latency delivery.

**TypeScript audio cores over WebAssembly.** Evaluated and declined in the 1.5.2 window against a measured-cost basis. The internal engine holds no TypeScript DSP - `YM2149.ts` maps register writes to Web Audio node parameters and the browser renders samples natively - and the only sample-rate DSP (`ayumiCore.ts`) already runs inside `ayumiWorklet.ts` on the render thread. Measured costs sit far below budget: the three-channel per-tick register update is about 0.0001 ms of a 20 ms window, and an Ayumi 128-sample quantum is about 1.3 percent of the render budget. Tick delivery crosses the main-thread event loop either way, so a WASM core cannot tighten timing beyond the AudioWorklet clock. A WASM core also prices in a new toolchain, a contributor prerequisite, and a byte-identical parity obligation across engines, chip variants, and stereo - declined until measured CPU evidence on a real device reopens it.

**App.tsx as central orchestrator.** Keep dependency wiring visible at the composition root. Move dialog, persistence, and playback handler bodies into bounded hooks to keep each concern independently navigable.

## Known Limitations

The current architecture has several documented constraints.

- **App.tsx concentrates the wiring.** The central orchestrator still holds all hook wiring and the JSX prop map. Staged decomposition moved the dialog, persistence, playback handler bodies, the modal layer, the store-selector bundle, the stereo pan cluster, and the settings session into `src/hooks/`, but the file remains the largest in the tree and the main navigation cost.
- **Business logic is scattered across hooks and utils.** Song management, MIDI, file operations, instrument actions, and sequencer integration each live in their own hook files, some of which are among the largest files in the tree (`useSequencerIntegration`, `useSongManagement`, `useMidiMessageProcessing`). Cross-hook dependencies are implicit and wired in App.tsx.
- **No Command pattern.** Mutations are free functions and setter calls, not encapsulated command objects. Edit history is covered by the snapshot mechanism recorded in the decisions above, but the absence of commands still makes fine-grained edit auditing difficult.
- **History restores are whole-pair snapshots.** Undo restores the song, the current instrument, and the recorded cursor position together rather than the edited field alone, so it cannot express partial or selective reverts and coalescing is limited to the marked song-information fields.
