# Evaluate a WebAssembly Audio Core Implementation Plan

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Evaluate whether the YM2149 compute path should move into a WASM core   |
| Key decisions | Evaluation outcome: migration declined - every measured surface sits at |
|               | fractions of a percent of its budget, the internal engine holds no      |
|               | TypeScript DSP, and the timing goal is already delivered by the         |
|               | AudioWorklet sequencer clock                                            |
| Open risks    | none                                                                    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/wasm-audio-core.md`.

## Evaluation

**Compute surfaces.** The record named the YM2149 emulation and the per-tick
envelope/sequencer computation. Verified against the tree, the internal
engine carries no TypeScript DSP - `src/synth/YM2149.ts` maps register
writes to Web Audio node parameters and the browser renders samples
natively. The real compute surfaces are three: the per-tick
instrument-to-register path in `src/synth/channelInstrument.ts` driven by
`useSequencerIntegration`, the vendored DSP in `src/synth/ayumiCore.ts`
inside `src/workers/ayumiWorklet.ts`, and the WAV export synthesizer
`synthTickSamples` in `src/exports/wav.ts`. The sequencer worklet is a
pure clock - it counts samples and posts positions, so nothing there is
a migration candidate.

**Measured cost.** A scratch harness under `work/wasm-eval/` measured
each surface on the bundled song under Node. The three-channel per-tick
register update costs about 0.0001 ms inside a 20 ms window - roughly
0.001 percent of the frame budget. A full `simulateSong` pass over the
bundled song completes in about 0.1 ms. An Ayumi 128-sample render
quantum costs about 0.04 ms against the 2.9 ms render budget - roughly
1.3 percent, on a path that is the alternate engine and already off the
main thread. A 15-second WAV export completes in about 7 ms. Even a
generous WASM speedup saves under one percent of any budget.

**Timing ceiling.** The record's second motivation - tighter timing -
was delivered in this window by `sequencerWorklet.ts`: the clock is
already sample-accurate on the audio render thread. Tick delivery still
crosses `postMessage` and the main-thread event loop, a limit WASM
compute cannot remove. A core could only tighten generation, which is
already exact.

**Toolchain and parity cost.** A WASM core prices in a Rust,
AssemblyScript, or C toolchain as a new build dependency and contributor
prerequisite, a licensing review under `COPYRIGHTS.md`, and a
byte-identical parity obligation - register streams and PCM - across two
engines, two chip variants, and mono plus stereo. Doubling the tested
surface for sub-percent relief fails the cost-benefit test.

Outcome: migration declined. The evaluation is the deliverable - the
decision is recorded in `ARCHITECTURE.md` so the question does not
resurface without measured CPU evidence.

## Best Practices

Follow the real-time audio engineering standard from `docs/standard/typescript-audio-development.md`:

- Measure the compute path before migrating it - a migration needs a
  demonstrated bottleneck, not a premise
- Keep the cadence authority where it is - one clock owns the schedule
  and it already sits on the render thread

## Audio-Critical Requirements

The change lands documentation only - no audio-path code, callback, or
state pattern is modified, so the audio-critical principles apply
vacuously. The WASM evaluation itself honours them: no dependency was
added, no callback was wrapped, no state update was deferred.

## Documentation Updates

- `ARCHITECTURE.md` - a decision entry records the 1.5.2 WASM-core
  evaluation and its measured evidence.
- `docs/change/1.5.2/wasm-audio-core.md` - amended in place against the
  verified tree before planning, per the window workflow.

## Type and State Updates

None.

## Step by Step Implementation

**Record the WASM decision**

Add a decision-log entry covering the corrected premises (no TypeScript
DSP on the internal path, sequencer worklet is a pure clock), the
measured budget figures, the delivery-latency ceiling, and the decline
with its reopen condition.

File to modify: `docs/ARCHITECTURE.md`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `ARCHITECTURE.md` - the only change

## Testing Strategy

Documentation-only change - no tests required. The measurement harness
is evaluation evidence living under `work/` and is not part of the
shipped suite.

## Verification

- Re-read the updated decision entry for consistency with `src/synth/`
  and `src/workers/`.
- Run `npx prettier --check docs/ARCHITECTURE.md`.
