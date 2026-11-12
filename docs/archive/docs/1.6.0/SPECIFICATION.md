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

Source is organised by responsibility under `src/`, with folders for components, modals, hooks, utilities, constants, types, workers, and assets, the `synth/` audio engine (YM2149 emulator and sound driver), and the `exports/` format modules. `src/hooks/`, `src/utils/`, `src/components/`, and `src/modals/` are fully grouped into domain subdirectories - a source directory that contains subdirectories does not hold files directly, and a directory name carries the domain of the files it holds, including single-file directories. The `src/` root itself keeps its entry files (`main.tsx`, `App.tsx`, `index.css`, `App.css`) as the recorded exception. `test/` mirrors the `src/` split, holds two recorded exemptions at its root (`setup.ts` and `setup-localstorage.ts`, which `vitest.config.ts` references through `setupFiles`), and places a test that spans several domains of one kind in a `cross/` leaf inside that kind. `test/guard/directoryPurity.test.ts` enforces the rule mechanically. See ARCHITECTURE.md for the module boundaries and the responsibility of each folder.

## Data Models

The core data models represent the musical content of a song. See src/synth/SoundDriver.ts for Song, Instrument, Pattern, Note, Step, and Line type definitions.

**Song** is the top-level container. It holds metadata (title, author, year, speed, length, loop point, chip type, frame rate, chip clock), an optional `stereo` output setting, an array of Pattern objects, an array of Line objects forming the playlist, and an array of Instrument objects.

**SongStereo** declares the per-channel pan configuration. It carries an optional `layout` id and optional `A`, `B`, `C` channel pans on a 0..1 scale (0 left, 0.5 centre, 1 right). Resolution starts from the layout's canonical positions and applies each channel override. A missing `stereo` node resolves to all-centre pans - the mono mixdown. The layout catalog and helpers live in `src/constants/song.ts` and `src/utils/song/songStereo.ts`.

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

Volume uses a 16-level logarithmic scale defined by YM_LOG_VOLUME_TABLE in src/synth/YM2149.ts, approximating -2 dB per step from silence (0) to full amplitude (15). The song's `chip` field selects the variant's curve: `AY` uses AY_LOG_VOLUME_TABLE - the 16-level AY-3-8910 amplitude curve derived from the odd-index entries of the vendored AY_DAC_TABLE in src/synth/ayumiCore.ts - and every other value uses YM_LOG_VOLUME_TABLE. The volumeTableForChip helper in src/synth/YM2149.ts resolves the selection.

The register write path supports batch updates via beginBatch and endBatch to avoid redundant audio node recalculations when multiple registers change in a single frame.

## Sound Engines

Two engines render YM2149 audio behind the shared `SoundEngine` contract in `src/synth/soundEngine.ts`. The engine vocabulary lives in `src/constants/sound.ts`: ids `internal` and `ayumi`, display labels `Internal` and `Ayumi`, and `internal` as the default.

| Engine id  | Implementation                                                                     |
| ---------- | ---------------------------------------------------------------------------------- |
| `internal` | `src/synth/YM2149.ts` - Web Audio oscillators, noise buffer, and gain nodes        |
| `ayumi`    | `src/synth/AyumiEngine.ts` driving `ayumiCore.ts` inside `workers/ayumiWorklet.ts` |

The `SoundEngine` surface covers `writeRegister`, `beginBatch`, `endBatch`, `updateChannelWithInstrument`, `silenceAll`, `reset`, `setClock`, `getClock`, `setChip`, `setChannelPans`, `getRegisters`, `getRegistersArray`, `getState`, and `dispose`. The instrument-to-register helpers shared by both engines live in `src/synth/channelInstrument.ts`.

**Chip variant**

The song's `chip` field declares the PSG variant - `YM` (YM2149, the default) or `AY` (AY-3-8910 family), the `SUPPORTED_SONG_CHIPS` list in src/constants/song.ts. `useAudioSetup` mirrors the value into a ref, applies it on engine land after `setClock`, and pushes it to the live engine through `setChip` when it changes. Both engines model the variant as the amplitude curve alone - the register model, tone, noise, and envelope machinery stay shared. The internal engine swaps its stored volume table; the Ayumi worklet maps `AY` to `isYm = false` on its `configure` call so the core selects the AY_DAC_TABLE, and any other value keeps YM. An unrecognised chip resolves to the YM curve at every boundary.

**Stereo routing**

`setChannelPans` takes three pan values on the 0..1 scale (0 left, 0.5 centre, 1 right), one per channel A/B/C. `useAudioSetup` resolves the song's `stereo` node through `resolveChannelPans` and pushes the result to the engine - on engine land after `setClock` and again whenever the resolved pans change. Every preview and playback surface writes through the same engine instance, so pan applies uniformly.

The internal engine creates three `StereoPannerNode`s and three per-channel noise gains at construction but wires them only while stereo is active (any pan off centre). In mono mode the graph is the original one - channel gains straight to the destination and the summed noise gain - so default output is bit-identical to the pre-stereo path. In stereo mode each channel's tone and noise contributions route through its own panner, which maps the 0..1 domain onto the node's -1..1 equal-power pan law.

The Ayumi engine renders two output channels in `workers/ayumiWorklet.ts` (`outputChannelCount: [2]`). A `pans` message carries the three values to the worklet, which applies them through `AyumiCore.setPan` and keeps them across `configure` calls so clock changes and resets preserve the routing. When every pan sits at centre the worklet keeps emitting the folded mono sample `(left + right) * 0.5 * AYUMI_OUTPUT_GAIN` through the soft-knee limiter on both channels - the exact value the mono node produced; with any channel off centre each side renders `side * AYUMI_OUTPUT_GAIN` through the same limiter. The Ayumi pan law is the native linear mode (`isEqp = false`), so mid-pan weighting differs slightly from the internal engine's equal-power law - centre and the extremes agree exactly.

The engine selection persists under the `dosound-tracker-sound-engine` local storage key (`StorageKeys.SOUND_ENGINE`). `loadSoundEngineId` in `src/utils/storage/soundEngine.ts` validates the stored value against the id set and falls back to `internal` when the key is missing or holds an unrecognised value. Switching the engine disposes the active instance and creates the replacement inside `useAudioSetup` without a page reload - sounding notes are silenced and playback does not carry over.

**Ayumi register mapping**

The Ayumi core is setter-based rather than register-based. `workers/ayumiWorklet.ts` translates register writes onto the core's setters:

| Register | Translation                                                            |
| -------- | ---------------------------------------------------------------------- |
| R0-R5    | Channel A/B/C tone period pairs - `setTone(channel, 12-bit period)`    |
| R6       | Noise period - `setNoise(period & 0x1f)`                               |
| R7       | Mixer - `setMixer(channel, toneOff, noiseOff, envelopeOn)` per channel |
| R8-R10   | Channel volumes - `setVolume(channel, value & 0x0f)`, bit 4 into `eOn` |
| R11-R12  | Envelope period - `setEnvelope(16-bit period)`                         |
| R13      | Envelope shape - `setEnvelopeShape(shape & 0x0f)`                      |

The worklet renders one output block by looping `process()` plus `removeDc()` into the node's two output channels. While every channel pan sits at centre both sides carry the folded mono mixdown, matching the Atari ST; an off-centre pan renders the left and right taps separately. A stage gain (`AYUMI_OUTPUT_GAIN = 1.2`) scales the rendered stream to the measured loudness-parity point with the internal engine, followed by a soft-knee limiter (`AYUMI_SOFT_KNEE = 0.9`) that keeps the path linear for ordinary material and saturates the extreme tail smoothly - the folded peak reaches ~1.33 at three in-phase full-volume channels, so the limiter, not the gain alone, keeps output under `1.0`. `AyumiEngine` keeps a main-thread mirror of the register file so `getRegisters`, `getRegistersArray`, and `getState` stay synchronous for the Dump and EQ panels. A clock change reconfigures the core and replays the mirrored registers because `configure` resets tone and envelope state.

## Sequencer Timing

Playback is driven by the song's frame rate (default 50 Hz, DEFAULT_SONG_FRAME = 50, defined in src/constants/song.ts). The frame rate is configurable per song via the `frame` field. Each tick corresponds to 1000 / frameRate milliseconds (20 ms at 50 Hz, 16.66 ms at 60 Hz).

The tick clock is an `AudioWorkletProcessor` in src/workers/sequencerWorklet.ts, registered as `sequencer-processor` on the app's shared `AudioContext`. It counts rendered samples inside `process()` - one invocation per 128-sample render quantum - and posts a `tick` message for every interval boundary crossed, catching up inside a single quantum when several boundaries passed. The processor owns the playback position (pattern, line, tick) and the playlist wrap logic. `useSequencer` loads the module through a static `?worker&url` import, creates the node with one silent output channel connected to the destination so the render graph pulls it, and queues protocol messages until the asynchronous `addModule` resolves.

The message contract is unchanged from the worker implementation: `start`, `stop`, `update`, and `setParams` travel in, `tick`, `update`, and `stop` travel out. `start` posts the starting tick immediately from the message handler because tick 0 carries the first note's attack and cannot wait for the first render quantum. While the `AudioContext` is suspended `process()` does not run and no ticks flow - the position view can never advance while the context renders nothing, the same invariant `useAudioContextPlaybackSync` maintains across `statechange` transitions.

Envelope progression advances every 2 ticks (40 ms at 50 Hz, 33.33 ms at 60 Hz). This means instrument envelope arrays (volume, shift, pitch, noise, mode) step forward at half the frame rate.

Pattern-based playback uses 64-step resolution (PATTERN_LENGTH = 64, defined in src/constants/music.ts). Each pattern contains 64 rows, and the playlist arranges patterns into a song sequence across three channels (A, B, C).

The playback speed parameter controls how many ticks elapse between sequencer steps. The minimum speed is 2 and only even values are used: an odd value is normalized down to the previous even value, and non-positive or non-numeric input falls back to 6. The normalization is implemented by `normalizeSongSpeed` in src/utils/song/songSpeed.ts and is applied on the song load and restore paths.

The song speed field on the Song object determines the global tempo. The frame rate field (default 50), chip field (default "YM"), and chip clock field (default 2000000) are defined in src/constants/song.ts. Supported frame rates are 50 and 60 Hz. Supported chips are `YM` and `AY`. Supported chip clocks are 2000000 (2 MHz) and 1000000 (1 MHz).

## Export Formats

DOSOUND Tracker supports eight export formats. Each format produces a downloadable file from the browser environment. See FORMAT.md for detailed file layout specifications. Pan is a live-render property - no export format reads the `stereo` node: the register-stream formats carry the same YM2149 register data, the MAX chip-panning byte stays `0x00` (Not Specified, per `MAX.md` it positions a whole chip rather than per-channel wiring), the WAV export keeps its mono software mixdown, and the MOD and MIDI exports carry no pan data.

**DOSOUND Assembly** generates Motorola 68000 assembly source compatible with the DOSOUND XBIOS playback routine. The export simulates song playback, collects register states per frame, and emits optimized dc.b directives with register/value pairs and delay markers. Three strategies are available: simple, complex, and tight. Tight extends the complex path with merged delays - split at the 256-frame single-command maximum - plus byte-level tone dedup, audible-channel-keyed mixer dedup, and conditional END silences - the emitted stream stays replay-equivalent for the stock routine. See src/exports/asm.ts.

**Binary** parses the generated assembly output and extracts raw byte data from dc.b directives, producing a tight binary file suitable for direct memory loading. See src/exports/bin.ts.

**Register Dump** writes the raw YM2149 register stream as a 68k assembly listing (typical extension `_dump.s`), produced by `exportSongRegisterDump` in src/exports/asm.ts. The dump is intended for debugging and analysis of the per-frame register data rather than for tight inclusion. See FORMAT.md for the dump layout.

**MAX** produces a MAX-format binary file (MAX specification v1.7) with chunk-based structure, including info chunks for song metadata, a chip setup chunk for the YM2149, a stream definition chunk specifying the stream format and compression, and a data chunk containing the compressed register stream. The chip setup chunk records the song's frame rate and chip clock. The export captures one register snapshot per tick and writes all 14 YM2149 registers (R0–R13). Strategies map to stream formats: simple produces a RAW8 dump (14 bytes per frame), complex produces a REG7 differential stream with single-byte frame delimiters, and tight produces a REG7 stream with coalesced multi-frame delays - REG7 already dedups registers per byte. All strategies apply ZX0 compression with a 1024-byte ring-buffer window (maxOffset 1023) and include the uncompressed stream size in the stream definition chunk. See src/exports/max.ts and src/utils/compression/zx0.ts.

**VGM** generates a VGM (Video Game Music) file, a standard chiptune logging format. The export converts register writes and delays into VGM command stream with delay optimization and loop point preservation. The tight strategy selects the delay-optimized command stream. The VGM header records the song's frame rate (offset 0x24) and chip clock (offset 0x74). Wait commands use 0x63 for 50 Hz, 0x62 for 60 Hz, and 0x61 with explicit sample counts for other rates. See src/exports/vgm.ts.

**WAV** renders the song to a 16-bit PCM WAV file at 44100 Hz sample rate. The export uses a software YM2149 simulation including a noise LFSR to produce the final audio samples. The samples-per-tick is derived from the song's frame rate (882 at 50 Hz, 735 at 60 Hz) and the frequency calculation uses the song's chip clock. See src/exports/wav.ts.

**MOD** produces a ProTracker 31-sample module (`M.K.` tag) from the simulated register stream at row granularity. Each tracker row becomes one MOD row: tone periods convert to Amiga periods snapped to the finetune-0 table, channel volumes become `Cxx` set-volume effects, release rows become `EC0` note cuts, and the song's speed and frame-derived BPM land as `F` effects on the always-empty fourth channel's first two rows. Two generated samples carry all instruments - a 32-byte square wave for tone and a 512-byte deterministic noise block for noise - so envelope and timbre detail is approximated and reported through the result's warning list. See src/exports/mod.ts.

**MIDI** produces a Standard MIDI File type 1 at note level for DAW import. One tracker row maps to 24 ticks at a 96 PPQ division, so the tempo meta event encodes the song's speed and frame rate directly (speed 6 at 50 Hz is 125 BPM). Each tracker channel becomes one SMF track on its own MIDI channel unless `instrument.midi.channel` overrides it; `instrument.midi.program` emits program changes, and the volume column arrives as note velocity plus CC7 on held notes. Envelope, noise, pitch, and sustain semantics have no MIDI representation and are reported as dropped in the result's warning list. See src/exports/midi.ts.

Export scope can target the full song, a single pattern, or a single instrument. The `ExportType`, `ExportFormat`, and `ExportStrategy` (simple, complex, tight) unions are typed in src/constants/export.ts - the eight formats dispatch through the export modal's per-format handlers. The strategy's relevance is per format and per scope: under the song and pattern scopes DATA, BIN, VGM, and MAX consume it - for VGM only `tight` differs from the other two, and for MAX it selects the stream format - while under the instrument scope only MAX consumes it, since the other instrument export paths take no strategy parameter. DUMP, WAV, MOD, and MIDI ignore the selector under every scope. The export modal renders every format button with its plain label and shows no marker or caption for the strategy-honoring formats.

## Constants

Application constants live in `src/constants/`, one file per domain. See those files for the actual values.

- **music.ts** — note frequencies, octave bounds, default and maximum pattern length, instrument count, and envelope, volume, noise, pitch, and shift limits. Also holds the `POW2_OCTAVE_SCALE` and `POW2_SEMITONE_SCALE` lookup tables with their `pow2Octave`/`pow2Semitone` accessors - tables built from `Math.pow` itself so the frequency paths stay bit-identical, with a `Math.pow` fallback outside the integer domain.
- **keyboard.ts** — the KEYBOARD_TO_NOTE piano map.
- **song.ts** — chip, frame rate, and clock defaults and their supported values, plus the stereo vocabulary (`STEREO_LAYOUTS`, `STEREO_LAYOUT_ORDER`, `DEFAULT_CHANNEL_PANS`).
- **export.ts** — the ExportType and ExportStrategy union types.
- **sound.ts** — the sound-engine vocabulary (SOUND_ENGINE_IDS, SoundEngineId, DEFAULT_SOUND_ENGINE_ID, SOUND_ENGINE_LABELS).
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
- PAGEUP and PAGEDOWN without a modifier step the cursor 16 rows inside the focused track pattern
- SHIFT+PAGEUP and SHIFT+PAGEDOWN navigate to the previous and next song line from any focused section, keeping the cursor row inside the track - clamped at the first and last playlist entries
- ALT+PAGEUP and ALT+PAGEDOWN select the previous and next instrument from any focused section - wrapping around the stored instrument list (ALT is OPTION on macOS)
- ALT+1 focuses track A, ALT+2 focuses track B, ALT+3 focuses track C (ALT is OPTION on macOS)
- CTRL+SPACE focuses the on-screen piano, or returns focus to the section that was active before the piano

**Editing shortcuts:**

- SPACE clears the current cursor position
- BACKSPACE clears the current cursor position
- SHIFT+SPACE inserts a note-off event, or clears the position when it already holds a note-off
- CTRL+Minus selects the previous instrument with the same wrap-around as ALT+PAGEUP
- CTRL+Plus selects the next instrument with the same wrap-around as ALT+PAGEDOWN
- CTRL+digit enters the hex value in the Volume, Arpeggio, and Noise envelopes and advances to the next step
- ALT+ENTER inside the playlist pattern-id input finishes editing and focuses the track
- Section editing keys require bare keys - an event carrying Ctrl, Cmd, or Alt never mutates envelope or playlist data, and no section handler swallows a global chord

**Selection and clipboard shortcuts:**

- SHIFT+ARROWUP extends the track selection one row upward and moves the cursor with it
- SHIFT+ARROWDOWN extends the track selection one row downward and moves the cursor with it
- The selection covers the rows between the anchor and the cursor, inclusive of the anchor and exclusive of the cursor row - the first step selects only the origin row
- Extension continues an existing selection only while the cursor sits on its moving edge - from anywhere else it anchors a fresh selection at the cursor
- Collapsing the range back onto its anchor clears the selection - extending back past the origin row is the way to drop it
- CTRL+C copies the selected row range to the clipboard - with no selection it copies the whole track like COPY TRACK
- COPY TRACK always copies the whole current track - an active selection does not narrow it
- A fragment copy keeps its trailing empty rows so the pasted fragment spans the full selection size; the whole-track copy trims them as before
- CTRL+X cuts the selected row range to the clipboard, clears the covered cells, and drops the selection
- CTRL+V pastes the clipboard fragment at the cursor row, clipped at the pattern length, preserving the rows after the pasted fragment, then moves the cursor one row below the last pasted row - wrapping to the first row when the fragment reaches the pattern end
- PASTE TRACK pastes the clipboard fragment from the first row of the track, clipped at the pattern length, clears the rows after the pasted fragment, and leaves the cursor on the first row
- CLONE TRACK copies the active track's whole pattern - regardless of any selection - into a new pattern assigned to the target track at the current line, landing the steps from the first row; the clipboard is never touched, the pattern creation and playlist assignment record as one history entry, and focus lands on the new track's first row like ADD TRACK
- The clipboard bindings fire only while a track section is the active section

**Playback shortcuts:**

- F2 plays the current line
- ALT+5 plays the song from the start of the current line
- ALT+6 plays the current line
- ALT+8 stops playback
- ESC stops playback
- ENTER in a track or the piano plays the current line from the cursor row and toggles playback
- CTRL+ENTER in a track, the playlist, or the piano plays the current line from its first row and toggles playback
- SHIFT+ENTER in a track, the playlist, or the piano plays the song from the cursor row and toggles playback
- CTRL+SHIFT+ENTER in a track, the playlist, or the piano plays the song from its first row and toggles playback
- The Enter bindings fire from a disabled track too - a track is disabled when its channel has no pattern on the current playlist line, but the line bindings still start when another channel on the line holds one, and only a completely empty playlist line makes line playback a no-op
- In the playlist the modifier Enter bindings yield to an open pattern-id edit - while a value is being edited, Enter commits it and bare Enter outside an edit still starts one
- Pressing an Enter binding while playback is running switches to the binding's mode instead of stopping - a line binding during song playback loops the running line from the next pattern boundary, and a song binding during a line loop continues as song playback
- Pressing the Enter binding that owns the running mode stops playback
- Playback started with an Enter binding restores the playlist position and the track row held before playback started when it stops, whichever control stops it - the return position survives mode switches, and a mode switch during playback that was not Enter-started records the pressed position

**File operation shortcuts:**

- CTRL+N runs NEW SONG
- CTRL+O runs LOAD SONG
- CTRL+S runs SAVE SONG
- CTRL+I runs NEW INSTRUMENT

**History shortcuts:**

- CTRL+Z undoes the last recorded edit
- CTRL+Y redoes the last undone edit
- CTRL+SHIFT+Z redoes the last undone edit
- The meta modifier folds into ctrl, so CMD+Z undoes and CMD+Y or CMD+SHIFT+Z redoes on macOS
- The UNDO and REDO buttons on the third command row run the same actions - UNDO is enabled while the undo stack holds entries and REDO while the redo stack holds entries

**Modal shortcuts:**

- ESCAPE cancels or closes the open modal dialog
- ENTER confirms the open modal dialog

The navigation order cycles through these sections: piano, octave, commands, trackA, trackB, trackC, mode, volume, shift, pitch, noise, songInfo, playlist, instrumentList.

Clicking inside the command panel activates the `commands` section, except for buttons that swallow the click to keep the caller's section - the playlist line commands (ADD LINE, DUPLICATE LINE, CLONE LINE, DELETE LINE), INSERT STEP, DELETE STEP, MIDI, and EXPORT. The playlist line commands also prevent the press from taking DOM focus and bump a playlist focus revision, so while the playlist is the active section the panel stays focused after the operation.

Clicking an instrument in the instrument list selects it and activates `instrumentList`, except while a track section is active - then the selection applies but the track keeps the section and DOM focus, so note entry continues uninterrupted.

## Edit History

The application keeps a bounded undo/redo history over the composition data: pattern steps, instrument parameters, playlist lines, and song information fields. The model is snapshot-based, not command-based - see `src/utils/song/editHistory.ts` for the stack logic and `src/hooks/song/useDataManagement.ts` for the recording boundary.

**Recording boundary**

`useDataManagement` holds the undo and redo stacks in a ref and snapshots the `{song, instrument}` pair plus the live editor position (`{pattern, line}`) before every recorded mutation - the playlist line comes from the sequencer index and the track row from the shared cursor, since track navigation never touches the sequencer row. The position arrives through an optional bridge `App.tsx` wires to the editor, so the hook keeps no playback dependency; snapshots persisted before the bridge existed carry no position and restore as before. Every recorded mutator - `updateSong`, `updateInstrument`, `createNewInstrument`, `loadInstrument`, `createNewPattern`, `addPlaylistEntry`, `optimizeSong`, and `renumberSong` - pushes one entry before applying its change, so composite operations such as paste, transpose, renumber, and optimize land as single history entries. Snapshots hold object references because every mutation helper produces fresh objects through spreads; nothing is deep-copied.

`createNewSong` and `applyParsedSong` are lifecycle operations - they clear both stacks instead of recording, so NEW SONG, LOAD SONG, the pending-import confirmation, and DEMO SONG (which loads through `loadSongFromText`) destroy the history rather than leaving the previous song undoable.

**Non-recorded paths**

`setCurrentInstrument` alone is instrument selection, not a composition edit, and stays out of the history. The startup mirror restore, the instrument-sync effect, and the lazy pattern materialization in `getCurrentPatternForTrack` are also silent - the last runs `updateSong` with `{ record: false }`. The track selection range and the header-bar current octave are session state outside the history.

**Coalescing**

`updateSong` accepts a `coalesceKey` option. A second recorded edit carrying the same key inside `EDIT_COALESCE_MS` (1000 ms) joins the previous entry instead of pushing a new one. Only the song information fields pass a key (`song-info:<field>`), so a typing burst or a toggle cycle merges while every other edit stays one entry per gesture.

**Restore**

`undo` pops the undo stack, pushes the live snapshot onto the redo stack, and restores both setters with the song marked dirty; `redo` mirrors it. A snapshot that carries a position also re-applies it through the bridge, so the cursor returns to the row the edit started from - an undone ADD LINE or DELETE LINE lands back on its starting row instead of leaving the cursor where the operation moved it, and an undone note, note-off, or volume entry lands back on the edited row instead of staying where the edit step advanced it. A recorded edit clears the redo stack, so a new edit after undo discards the redo branch. The stacks are bounded in memory by `EDIT_HISTORY_LIMIT` (100 entries, oldest evicted) and persist to local storage under `EDIT_HISTORY` - each scheduled save writes the stacks serialized to the newest `EDIT_HISTORY_PERSIST_LIMIT` (20) entries, and startup restores them with the coalescing cursor reset so coalescing never spans a reload. RESET clears the key with the rest of the application storage. The history never travels with the song file.

**Audio path**

Restore applies through the ordinary `setCurrentSong`/`setCurrentInstrument` setters plus the sequencer's `setPosition` and the shared track-cursor setter when the snapshot carries a position - the same `update` message a playlist position select posts, so an undo during playback moves the playhead the way a mid-playlist click would. No engine call or callback re-creation happens on undo, so an undo during playback re-syncs the sequencer through the existing `usePlaybackControls` effects exactly like a normal edit.

The history shortcuts fire from the global key handler, which skips editable targets. Inside a song information text input CTRL+Z therefore runs the browser's native text undo, not the song history.

## Session Persistence

The editor cursor is remembered across reloads through local storage. Local storage keys are centralised in `src/utils/storage/storageKeys.ts`.

The top-level cursor is stored under `EDITOR_CURSOR` as a JSON object with the focused section, the selected track, the playlist line, the track row, and the track column. On mount it is parsed, clamped to the restored song, and applied through the existing setters. The playlist line is clamped to the playlist length, the track row to the pattern length. An invalid section falls back to the selected track's section. It is written when playback is not running, so no local storage writes occur on the audio path.

Additional cursor state is persisted at its source of truth to avoid duplicate state. The selected instrument id is stored under `CURRENT_INSTRUMENT` - the instrument list highlight follows it. `useDataManagement` restores it inside the instrument state initializer so the selection is set on the first render and cannot race the mount-time instrument sync. The playlist row cursor inside the playlist panel follows the top-level playlist line and is not stored separately.

Single-value panel cursors are persisted to local storage. The song information field is stored under `SONG_INFO_FIELD` through the `useLocalStorageState` hook. The playlist track column is stored under `PLAYLIST_TRACK`, each envelope panel step cursor under `ENVELOPE_CURSOR_PREFIX` followed by the panel type, and the per-instrument octave selection under `INSTRUMENT_OCTAVES` through `src/hooks/instrument/useInstrumentOctaves.ts`. Where the state setter is captured inside memoized callbacks, the cursor uses a plain `useState` with a lazy initializer and a persist effect instead of `useLocalStorageState`, so the setter stays a stable dispatch that the React Compiler can track. The octave is persisted in the ui store under `OCTAVE`. The envelope step cursor is per panel and independent of the selected instrument.

The track selection is stored under `TRACK_SELECTION` as a JSON object carrying the track id and the anchor and head rows. It is written whenever the selection changes, restored on startup normalized to a start and end range clamped to the current pattern length, and stays bound to the track where it was created - one selection exists at a time.

The edit history stacks persist under `EDIT_HISTORY` - see the Edit History section for the recording boundary, the persisted depth, and the lifecycle clears.

**Snapshot mirror**

Every scheduled save also mirrors the song and instrument payloads into an IndexedDB database named `dosound-tracker-backup`, store `snapshots`, through `src/utils/storage/persistenceMirror.ts`. The mirror write happens inside the same idle slot as the local storage write, is fully asynchronous, and degrades to a logged warning when IndexedDB is unavailable, so autosave latency and UX are unchanged.

**Mirror restore**

On startup the application requests persistent storage and checks `StorageKeys.SONG` in local storage. When the key is absent but a `song` snapshot exists in the mirror, the snapshot passes through `normalizeRestoredSong` (the same schema migration and speed clamping `loadInitialSong` applies) and becomes the current song. The restored session is marked dirty and a restore notice joins the notes-panel message rotation, telling the user a local snapshot was restored and a file copy is the durable record.

**Mirror invalidation**

Two destructive paths drop the mirror together with local storage: the legacy-schema removal inside `loadInitialSong` removes the `song` snapshot, and the RESET action removes every `dosound-tracker-*` local storage key except the preserved theme, text-scale, and debug-mode settings. RESET begins a reset epoch that invalidates every already scheduled save and mirror write, clears local storage, then awaits the mirror clear's transaction commit and reloads only on success - a failed clear reports an error and leaves the session running. Mirror writes serialize through a shared queue so a queued put cannot commit after the clear. Without this, intentionally deleted data would resurrect on the next load.

**Persistence reminder**

`public/MESSAGES.md` carries a rotation entry reminding composers that browser storage can be cleared and that a file copy of the song is the durable record.

**Settings persistence**

The application restores its state on page reload - persisted state, including the open view, survives exactly. The `UI_STATE` snapshot records the open restorable modal in `openModal` and, for the settings modal, the `settingsView` member holding the active category, the uncommitted draft, the focused control's element id, the property-pane scroll offset, and the reset-confirmation state. `updateSettingsView` writes the member whenever either changes while the modal is open, and the settings modal clears it on both close paths.

Three keys hold the settings toggles introduced with the modal: `STARTUP_TONE`, `RESTORE_CURSOR`, and `RESTORE_VIEW`, each storing `'on'` or `'off'` and defaulting to on. `STARTUP_TONE` gates the startup test tone. `RESTORE_VIEW` gates the whole view-snapshot restore, including the window scroll. `RESTORE_CURSOR` gates the application of the persisted editor cursor - cursor recording continues regardless. `PASTE_CONFIRM` gates the paste-mode confirmation modal for fragment pastes over existing data and defaults to `'off'` - paste confirmations apply the stored paste-track mode directly.

Content modals size by layout: on the desktop layout the settings dialog takes only the height its controls need, capped at 80% of the viewport and centered inside the backdrop, while in the mobile layout the sized modals - settings, text display, MIDI, download - expand to fill the screen and keep their own internal scrolling regions.

The settings modal's committed values persist under the per-key storage: `THEME`, `TEXT_SCALE`, `TRACK_BACKGROUND_ENABLED`, `PASTE_TRACK_MODE`, `PASTE_CONFIRM`, and `SOUND_ENGINE` cover the reused options. The `SOUND` category holds the engine selector (`Internal`, `Ayumi`); committing it applies the engine swap live through `useAudioSetup`, silencing and disposing the previous engine without a reload.

**Theme and text scale**

`THEME` stores one of three values - `'dark'`, `'light'`, or `'contrast'` - with `'dark'` as the default and the fallback for unrecognised values. The selected value applies as a class on `.app`: `dark` uses the `:root` custom-property palette, `light` and `contrast` override the same palette surface through their own blocks in `src/App.css`. The header toggle keeps day/night semantics and flips only between `dark` and `light`; `contrast` is reachable through the settings modal. `useTheme` returns the variant directly and `isDarkMode` is derived as `theme !== 'light'`, so dark-based assets (logo, rainbow-mode icon, initial overlay) serve both dark variants.

`TEXT_SCALE` stores one of three steps - `'100'`, `'125'`, or `'150'` - with `'100'` as the default. A non-default step applies an `app-scale-<n>` class on `.app` that sets a `--app-zoom` factor; `.app` renders at `zoom: var(--app-zoom)` with `width` and `height` divided by the same factor, so the grid scales uniformly while the window keeps exactly the app size. Panels keep their own scroll regions under scaling, and `.modal-dialog` bounds are capped by the inverse factor so dialogs stay inside the window. Both keys join `THEME` and `DEBUG_MODE` in the RESET-preserved set.

**Assistive-technology semantics**

The landmark structure is a `<main>` element for `.main-content`, the existing `<header>` banner, and labelled `role="region"` landmarks on the command panel (`Commands`) and the three columns (`Pattern editor`, `Instrument envelopes`, `Song and instruments`). The application intercepts TAB globally for section navigation, so a native skip link can never receive focus - the landmark map carries the skip-to-content role instead. Inside the pattern editor each `TrackPanel` renders a visually-hidden `role="status"` live region that announces the cursor row with column context (`Track A row 0A, note column, C-4 instrument 00, volume 0F`), populated only while the track is the active section, which gives a designed row announcement without exposing sixty-four cells per track to flat reading.

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

Export modules in `src/exports/` must produce byte-identical output for the same input across refactoring changes. The test fixtures in `test/fixtures/` and the export test suite (`exportVgm.test.ts`, `exportMax.test.ts`, `exportWav.test.ts`, `exportAssemblyTight.test.ts`) verify zero diff in export output. Any change to export output is a behaviour change, not a refactoring, and must be routed through `docs/change/<version>/`.

### YM2149 Emulation Stability

The YM2149 register simulation, volume table, and noise generation algorithm in `src/synth/YM2149.ts` must not change during refactoring. These are hardware-accurate implementations. Any change to the emulation logic is a behaviour change, not a refactoring.

### MIDI Message Processing

MIDI message handling in `src/hooks/midi/useMidiMessageProcessing.ts` is a hot path that executes on every incoming MIDI message. Avoid per-event allocations: use direct `Uint8Array` indexed access instead of `Array.from()`, and use string concatenation loops instead of `array.map().join()` for hex formatting.

### Electron Permission Policy

The desktop main process (`electron/main.cjs`) grants the `midi` permission only when the requesting page is the application's own origin: the packaged bundle's `dist/index.html` loaded over `file://`, or the development server at `http://localhost:8008` while the app runs unpackaged. The development origin passes only when `app.isPackaged` is false - a packaged build denies it like any other foreign origin. The check resolves the requesting `file://` URL to a file path and compares it against the bundled index location rather than matching the `file://` scheme prefix, so any other `file://` page is a foreign origin. Requests from any other origin are denied, and `midiSysex` is never granted because the app does not request it. The origin check lives in `electron/permissions.cjs` and takes the packaged state as a parameter.

Navigation is contained by the same origin policy. `webContents.setWindowOpenHandler` never creates a second window: external `http:`/`https:` links are delegated to `shell.openExternal` and every other request is denied. `will-navigate` calls `preventDefault` for any target outside the app origin, including `file://` pages other than the bundled index, so top-level navigation is pinned to the bundle.

**Electron close handshake**

The desktop main process intercepts the window `close` event and forwards `app-close-requested` to the renderer instead of closing. `useElectronCloseGuard` answers the request: when the song is dirty it opens the quit-confirm modal, and when the song is clean it confirms the close directly through `confirmAppClose()`. The modal's confirm action calls `confirmAppClose()` (the main process then quits), and its cancel action calls `cancelAppClose()`, leaving the application running. In a plain browser without the Electron API the guard inerts and no handshake occurs.

### Modal Working State

A modal whose contents must respond to the global Enter and ESC handler keeps its working state in an orchestration hook owned above the modal pipeline. Component-internal state is invisible to `useModalManager` - the handler attaches to `window` in the capture phase and cannot read a draft or a selection held inside the modal component. `useSettingsSession` owns the settings session at the composition root - the committed-settings reload and the commit and cancel handlers - and delegates the working state to `useSettingsDialog`, which holds the settings draft, category, and reset-confirmation state for this reason.

## Known Limitations

The following constraints reflect the current state of the codebase and are candidates for future improvement.

- **Single store**: All application state lives in one Zustand store (src/hooks/ui/useUiStore.ts). There is no store splitting or domain-based partitioning, which can make state updates difficult to reason about as the application grows.
- **Bounded persisted history**: The undo/redo history persists to localStorage capped at the newest `EDIT_HISTORY_PERSIST_LIMIT` entries per stack, so a reload restores a shallower history than the in-memory bound and coalescing does not span a reload.
- **App.tsx orchestrator**: The main application component still concentrates the hook wiring and JSX prop map and remains the largest file in the tree. Bounded concerns live in dedicated orchestration hooks under `src/hooks/`, including the store-selector bundle, the stereo pan cluster, and the settings session - further decomposition remains a candidate for later windows.
- **Low test coverage for the synth**: The YM2149 emulator (src/synth/YM2149.ts) and the Ayumi engine now carry dedicated `test/synth/` suites, and the sequencer worklet carries `test/workers/` protocol tests. The export modules (src/exports/) are exercised by the `test/exports/` suite. Remaining thin surfaces are components, hooks, and the `AboutModal`/`DownloadModal` dialogs.
- **Single chip instance**: A song drives one PSG instance. The `chip` field selects the variant (YM, AY) and the `stereo` node routes its three channels, but dual-chip configurations such as TurboSound have no representation in the song model.
- **Browser audio dependency**: Real-time playback relies on the Web Audio API and OscillatorNode, which imposes browser-specific behavior and latency characteristics that differ from native Atari ST hardware.
