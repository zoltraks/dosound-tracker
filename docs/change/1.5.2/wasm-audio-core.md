# Evaluate a WebAssembly Audio Core

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Evaluate moving the YM2149 emulation and sequencer computation into a   |
|               | WebAssembly core to cut CPU use and tighten timing on lower-end devices |
| Key decisions | Evaluation produces a feasibility answer and, if favourable, a staged   |
|               | migration - not a big-bang rewrite                                      |
| Open risks    | WASM tooling enters the build pipeline; the emulation must stay         |
|               | bit-identical to the TypeScript implementation or exports diverge       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The YM2149 emulation and per-tick envelope/sequencer computation run in
TypeScript on the main thread and in the sequencer worker. Moving the
hot DSP and register-simulation path into WebAssembly could reduce CPU
usage on lower-end devices and allow tighter timing.

This record starts with an evaluation: whether a WASM core can reproduce
the current emulation bit-identically (register sequences and PCM
output), what toolchain the build pipeline would need, and how the WASM
module bridges to the existing Web Audio integration and export
simulation. The two engines share the instrument-to-register logic in
`channelInstrument.ts`, so the boundary for a WASM core is already drawn
in the architecture.

If the evaluation is favourable, migration proceeds in stages that keep
the TypeScript path working until parity is proven - the parallel-change
pattern, not a flag day.

## Use Cases

- When the evaluation runs, it reports measured parity (register streams
  and sample output) between the WASM core and the TypeScript path.
- When the WASM core lands behind the engine contract, exports produce
  byte-identical output to today.

## Hints

- `src/synth/channelInstrument.ts` and the `SoundEngine` contract in
  `src/synth/soundEngine.ts` mark the seam - a WASM core slots behind
  the same contract.
- The export simulation (`simulateSong`, `synthTickSamples`) is the
  parity harness: identical register frames and PCM in both paths.
- Toolchain choice affects every contributor - the plan evaluates Rust,
  AssemblyScript, or C-to-WASM against the build and licensing rules in
  `COPYRIGHTS.md`.

## Out of Scope

- Replacing the Web Audio output layer - WASM computes, Web Audio
  renders.
- The Ayumi engine - it already runs a dedicated DSP core in a worklet;
  this record targets the internal path.
