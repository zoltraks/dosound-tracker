# Add Ayumi Sound Engine as Selectable Alternative

**Type:** Feature

## Summary

| Field         | Value                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Intent        | Add a second YM2149 synthesis engine based on the Ayumi emulation core, selectable through Sound settings        |
| Key decisions | Engine ids `internal` and `ayumi` with `internal` as default; shared `SoundEngine` contract; AudioWorklet output |
| Open risks    | Settings surface lands in a separate change record first; worklet bundling route needs a build check             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The current sound engine (`src/synth/YM2149.ts`) approximates the chip with Web
Audio nodes: three square oscillators, a shared looped noise buffer, and gain
nodes. It does not model the hardware envelope, the per-channel tone/noise
masking, or the measured YM2149 volume curve. It remains the default engine and
is named `internal` in the engine vocabulary.

The Ayumi emulation core by Peter Sovietov (MIT license) is a highly precise
AY-3-8910/YM2149 emulator. It models the real 32-level YM2149 DAC table, the
hardware envelope generator, per-channel tone/noise AND masking, stereo
panning, a 192-tap FIR decimation filter, and a DC removal filter. The
JavaScript port by Alexander Kovalenko (`alexanderk23/ayumi-js`) is also MIT
licensed and serves as the porting reference. The core is vendored as a
TypeScript port with the license notice retained, following the `zx0.ts`
precedent, and the attribution is recorded in `COPYRIGHTS.md` during
implementation.

Both engines sit behind one `SoundEngine` contract so the sequencer
integration, instrument and MIDI previews, and the Dump and EQ panels work
unchanged regardless of the selected engine. The engine vocabulary is:

- `internal` - the current Web Audio node implementation, the default. Displayed as `Internal` in the settings surface.
- `ayumi` - the new Ayumi-based engine. Displayed as `Ayumi` in the settings surface.

The selection happens through the settings surface under the `Sound` category.
That surface is delivered by a separate change record that is implemented
first. This record owns the contract that surface binds to: a persisted engine
id read from local storage, the two engine id values, and `internal` as the
fallback when the stored value is missing or invalid. An implementation of
this record does not wait on the settings UI - the engine can already be
selected by writing the recorded key.

Switching the engine takes effect without reloading the application. The
active engine instance is disposed, the new engine is created, and any
sounding notes are silenced during the swap. Playback does not carry over -
the user starts playback again after the switch.

The Ayumi engine renders inside an `AudioWorkletProcessor` so sample
generation runs off the main thread. Register writes travel to the worklet as
messages, batched per tick the same way `beginBatch`/`endBatch` coalesces them
today. The engine keeps a main-thread register mirror so `getRegisters`,
`getRegistersArray`, and `getState` stay synchronous for the Dump and EQ
panels.

Channel output is mono. All three Ayumi channels are panned centre, matching
the Atari ST where the YM2149 voices merge into one mono path.

Export formats are unchanged. ASM, BIN, DUMP, VGM, and MAX operate on register
frames and never touch the audio engine. WAV keeps its current software
renderer - the Ayumi core stays a live-playback concern in this change.

## Use Cases

- When the user selects `ayumi` in Sound settings, the next song playback,
  instrument preview, or piano key press renders through the Ayumi core.
- When the user selects `internal`, the engine returns to the current Web Audio
  node behaviour without any other change.
- When the stored engine id is missing or holds an unrecognised value, the
  application behaves as if `internal` were selected.
- When the user changes the engine while audio is playing, playback is
  silenced and the new engine is ready immediately.

## Hints

- The Ayumi API is setter-based rather than register-based: `setTone`,
  `setNoise`, `setMixer`, `setVolume`, `setEnvelope`, `setEnvelopeShape`,
  `setPan`, plus `configure(isYm, clockRate, sampleRate)` and `process()`.
  Register writes map onto these setters inside the worklet.
- Ayumi runs its internal mix at the chip clock divided by eight and decimates
  to the output rate. At a 2 MHz clock this is roughly 250,000 mixer updates
  per second - heavier than the oscillator approach but still a small
  fraction of one core.
- `updateChannelWithInstrument` and its envelope helpers are part of the
  engine contract, not of the chip emulation. The same instrument-to-register
  logic must feed both engines.
- Dump and EQ panels poll engine state on a 50 ms interval. A register mirror
  on the main thread keeps that contract synchronous.
- Display labels for the settings surface are `Internal` for `internal` and `Ayumi` for `ayumi`.

## Out of Scope

- The settings surface and the `Sound` category - delivered by a separate
  change record.
- Export format changes, including WAV output. Export output stays
  byte-identical.
- WebAssembly builds of Ayumi. The engine is a TypeScript port - no new
  toolchain.
- Stereo channel panning. Output stays mono to match the Atari ST.
- Hardware-envelope authoring. No instrument writes R11-R13 today, although
  the engine routes those registers faithfully.
- Renaming `src/synth/YM2149.ts` or the `YM2149` class. `internal` is an engine
  id, not a code rename.
