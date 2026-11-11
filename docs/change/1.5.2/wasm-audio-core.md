# Evaluate a WebAssembly Audio Core

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Evaluate moving the YM2149 register computation and DSP into a          |
|               | WebAssembly core to cut CPU use and tighten timing on lower-end devices |
| Key decisions | Evaluation complete, migration declined: measured compute sits at       |
|               | fractions of a percent of each budget, the internal engine runs no      |
|               | TypeScript DSP at all, and the timing goal was already delivered by the |
|               | AudioWorklet sequencer clock in this window                             |
| Open risks    | none - the question reopens only on measured CPU evidence from a real   |
|               | target device                                                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The record proposed moving the hot DSP and register-simulation path into
WebAssembly. Analysis against the current tree corrects the premises.

The internal engine runs no TypeScript DSP. `YM2149.ts` maps register
writes to Web Audio node parameters - oscillators, gain nodes, a noise
buffer - and the browser renders samples natively. The only sample-rate
DSP in the project is the vendored `ayumiCore.ts`, which already runs
inside `ayumiWorklet.ts` on the audio render thread. The remaining
TypeScript compute is the per-tick instrument-to-register path in
`channelInstrument.ts`, driven by `useSequencerIntegration`, plus the WAV
export synthesizer `synthTickSamples`, a cold path.

The record also predates this window's sequencer change: the
`setTimeout` worker it calls "the sequencer worker" was replaced by
`sequencerWorklet.ts`, an `AudioWorkletProcessor` that only counts
rendered samples and posts position messages - no compute lives there
to move.

Measured on the bundled song (harness under `work/wasm-eval/`, Node
host): the three-channel per-tick register update costs about 0.0001 ms
inside a 20 ms window, roughly 0.001 percent of the frame budget. A full
`simulateSong` pass produces the register stream in about 0.1 ms. An
Ayumi 128-sample render quantum costs about 0.04 ms, roughly 1.3 percent
of the 2.9 ms render budget. A 15-second WAV export completes in about
7 ms. No surface shows a CPU problem a WASM core could measurably fix.

Timing cannot tighten either. The sequencer clock is already
sample-accurate on the audio render thread, and tick delivery still
crosses `postMessage` and the main-thread event loop - a limit a WASM
core does not remove.

The costs stand unchanged. A WASM core needs a Rust, AssemblyScript, or
C toolchain in the build pipeline, a new contributor prerequisite, a
licensing review under `COPYRIGHTS.md`, and byte-identical parity proof
across engines, chip variants, and stereo against the TypeScript path.
Paying that for sub-percent CPU relief is not justified.

Decision: migration declined. The boundary stays drawn at
`channelInstrument.ts` and the `SoundEngine` contract - if measured CPU
evidence on a real target device ever appears, a WASM core slots behind
that seam under the parallel-change pattern, keeping the TypeScript path
until parity is proven.

## Use Cases

- When the evaluation runs, it reports the measured cost of every
  compute surface the record named.
- When a measured CPU shortfall appears on a real device, the WASM
  question reopens with the seam already drawn.

## Hints

- `src/synth/channelInstrument.ts` and the `SoundEngine` contract in
  `src/synth/soundEngine.ts` mark the seam - a WASM core would slot
  behind the same contract.
- The export simulation (`simulateSong`, `synthTickSamples`) is the
  parity harness: identical register frames and PCM in both paths.
- Toolchain choice affects every contributor - any future revisit
  evaluates Rust, AssemblyScript, or C-to-WASM against the build and
  licensing rules in `COPYRIGHTS.md`.
- The measurement harness lives under `work/wasm-eval/` - scratch
  evidence, not shipped code.

## Out of Scope

- Replacing the Web Audio output layer - WASM would compute, Web Audio
  renders.
- The Ayumi engine - it already runs a dedicated DSP core in a worklet;
  the record targets the internal path.
