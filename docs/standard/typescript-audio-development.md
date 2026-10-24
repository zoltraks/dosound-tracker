# TypeScript Real-Time Audio Engineering Standards

<!-- Version: 0.1.0 | Date: 2026-10-24 -->

## Purpose

This document defines the engineering standard for TypeScript applications that schedule or
render real-time audio - browser and Electron applications where timing correctness is the
dominant quality attribute.

It covers the timing model, the audio-path state rules, the React exemptions that follow from
hard deadlines, project structure, worker isolation, testing, and verification.

It builds on the TypeScript and React engineering standards and overrides them wherever a
React-default pattern would put work on the render path that must run at audio cadence.

## Scope

This standard applies to TypeScript codebases that:

- schedule or synthesize audio on a fixed cadence (tick, clock, or frame callbacks),
- run audio-adjacent logic inside React components or hooks,
- process high-frequency event streams (MIDI, transport, envelopes),
- produce binary export output whose correctness is byte-level.

## How To Use This Standard

- Apply every rule on the audio path. The audio path is any code reachable from the timing
  callback, the audio worklet or render loop, or a high-frequency event handler.
- Rules below override the general TypeScript and React standards where they conflict -
  consult the owning project document for the recorded exemptions and treat accepted lint
  warnings on audio paths as deliberate, never as debt to fix.

## Language Version

- TypeScript strict mode, ES2020+ target.
- No `any` - use `unknown` for genuinely unknown values, and audio register and buffer types are
  typed exactly (`Uint8Array`, `Float32Array`, branded ids).

## Project Structure

Group modules by responsibility, then by domain - a kind-partitioned root with domain
subdirectories is the proven layout for this application kind. An audio application that grew
well looks like:

```
src/
  main.ts  App.tsx  index.css        entry files - recorded root exception
  components/                        UI panels, flat
  hooks/
    audio/    sequencer/  playback/  engine-adjacent hooks grouped by domain
    midi/     instrument/ song/      input and model hooks grouped by domain
    modal/    ui/                    orchestration hooks grouped by domain
  modals/                            dialog components
  synth/                             emulation core - emulator, driver, sequencer engine
  utils/
    audio/  midi/  envelope/ ...     pure helpers grouped by domain - no flat files
  workers/                           timing and background workers
  types/  constants/  exports/
```

- A directory that contains subdirectories holds no files directly, and single-file directories are
  acceptable when a domain has one member.
- There are no barrel files - imports are direct and relative, so a move is a specifier edit
  and nothing else.

## Timing Model

- One authority owns the cadence - a dedicated clock (worker, audio context time, or a single
  scheduler loop). UI timers never drive the audio schedule.
- Tick handlers are synchronous and allocation-free: no array or closure allocation inside the
  tick path, no string building, no `Array.from()` - use indexed `Uint8Array`/`Float32Array`
  access and in-place updates.
- Musical position travels as engine ticks or step indices, converting to milliseconds only at
  display time.

## Audio-Path State Rules

- Audio-rate values that must always read latest live in refs or engine-local state, never in
  React state that re-renders - a 50 Hz render loop is a defect, not a pattern.
- The following deliberate React exemptions apply on the audio path, and only there:
  - prop mirroring into refs or local state for callback stability,
  - sparse dependency arrays that intentionally omit values,
  - direct `setState` calls inside effects for synchronous ordering,
  - manual memoization in place of `useMemo`/`useCallback` when identity churn hurts.
- Lint rules that flag these patterns (`react-hooks/exhaustive-deps`, `set-state-in-effect`)
  are disabled locally with a recorded reason - never "fixed" by changing the code.

## Worker Isolation

- Metronome-critical scheduling runs in a dedicated Worker so main-thread layout and event work
  cannot jitter the schedule.
- Construct workers with `new Worker(new URL('<path>', import.meta.url))` and treat the URL as
  an import specifier in every move or rename refactoring.
- Worker messages are small typed payloads - never post closures or shared mutable references.

## High-Frequency Event Streams

- Per-event handlers (MIDI messages, envelope ticks) avoid per-event allocation - reuse buffers,
  use string concatenation or lookup tables instead of `map().join()`, and bound work per event.
- Backpressure and drop policies are explicit: a slow consumer degrades by a stated rule, not by
  unbounded queueing.

## Export and Serialization

- Export modules are pure functions over the song model and produce byte-identical output for
  identical input - refactors preserve the bytes exactly.
- Round-trip tests assert full-buffer equality, never sampled-field equality.

## Testing

- Engine and driver logic is unit-tested off the audio path - emulation cores, sequencers, and
  serializers run deterministically under a plain Node test runner.
- Timing tests assert ordering and counts, not wall-clock durations.
- Component tests on audio-adjacent components stub the clock or worker boundary, never the
  DOM-visible output.

## Verification

- The type gate is the project build (`tsc -b` or equivalent), not a `--noEmit` pass against a
  solution-style tsconfig.
- Audio behavior is verified by running the application - static checks cannot hear timing.
  Record manual audio verification as the final human gate on any change touching the audio path.

## General Principles

- Timing correctness outranks React idiom - idiomatic refactors that jitter the schedule are
  regressions, not cleanups.
- Small, allocation-free primitives compose the engine, while abstractions that hide allocation or
  per-tick work are rejected on the audio path.
- The audio path is documented as such - a reader can tell which functions run inside the
  cadence without tracing the call graph.

## Sources

- Web Audio API - <https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API>
- Web Workers - <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API>

## Project Conventions

Project-specific values for the DOSOUND Tracker codebase.

- The audio cadence is a 50 Hz tick driven by `src/workers/sequencerWorker.ts`; the worker
  URL is `new URL('../../workers/sequencerWorker.ts', import.meta.url)`.
- `GUIDELINES.md` owns the audio-critical principles - the accepted lint warnings
  (`react-hooks/exhaustive-deps`, `set-state-in-effect`) live there, not here.
- The MIDI hot path is `src/hooks/midi/useMidiMessageProcessing.ts` - direct `Uint8Array`
  access and string concatenation loops only.
- Export modules under `src/exports/` plus `src/utils/compression/zx0.ts` produce
  byte-identical output; round-trip tests assert full-buffer equality.
