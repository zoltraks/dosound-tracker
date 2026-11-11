# Move Sequencer Timing to AudioWorklet

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Replace the `setTimeout`-driven sequencer clock with AudioWorklet       |
|               | timing for sample-accurate playback free of main-thread jitter          |
| Key decisions | The worker is replaced, not wrapped - the whole sequencer moves into a  |
|               | `sequencerWorklet.ts` processor on the shared AudioContext, keeping the |
|               | existing `tick`/`update`/`stop` contract toward `useSequencer`          |
| Open risks    | none - shipped and verified: the play flows pass under the webkit e2e   |
|               | project, which preserves suspended-context startup                      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Playback timing is anchored by `src/workers/sequencer.ts`, which paces
frames with a `setTimeout` loop in a dedicated worker. Worker isolation
already protects the tick from React renders, but `setTimeout` still
suffers timer coalescing and event-loop jitter - a tick can land late
and the whole frame slips, and a hidden tab clamps the timer into
catch-up bursts that clump register writes.

Driving the frame clock from the audio thread gives sample-accurate
timing: an `AudioWorkletProcessor` counts rendered samples inside
`process()` and emits ticks tied to the audio render quantum,
eliminating main-thread and timer-scheduler jitter at generation.
Delivery to the main thread still crosses the event loop, so the gain
is exact cadence generation and immunity to timer clamping, not
zero-latency delivery.

The sequencer integration on the main thread keeps its existing tick
contract - the swap is in the clock source, not the playback model. The
processor receives the same `start`/`stop`/`update`/`setParams`
messages the worker receives today and posts the same
`tick`/`update`/`stop` messages back.

The clock needs the app's shared `AudioContext`, created by
`useAudioContext` inside `useAudioSetup`. `useSequencer` gains the
context through `usePlaybackControls`, and `App.tsx` must instantiate
`useAudioSetup` before `usePlaybackControls` for the context to be
reachable. Module load is asynchronous (`audioWorklet.addModule`), so
messages posted before the node lands queue and flush on readiness.

The node must sit inside the render graph to be pulled: it connects to
the destination with a silent output channel. While the context is
suspended `process()` does not run and no ticks flow - this enforces
the recorded invariant that the position view never advances while the
context renders nothing, which `useAudioContextPlaybackSync` already
maintains by stopping and resuming the sequencer across `statechange`.

The Ayumi engine already runs an `AudioWorkletProcessor`
(`ayumiWorklet.ts`), so the worklet lifecycle, bundling, and messaging
patterns exist in the tree to follow.

## Use Cases

- When the song plays, tick cadence follows the audio clock rather than
  the timer scheduler - no drift under main-thread load.
- When the user switches between 50 Hz and 60 Hz frame rates, the
  worklet clock tracks the configured rate exactly.
- When the tab is busy with export work, playback timing is unaffected.
- When the AudioContext suspends, the position view freezes with the
  audio instead of running ahead of it.

## Hints

- Preserve the existing `tick`/`update`/`stop` message contract toward
  `useSequencer` so integration code changes minimally.
- Post the starting tick immediately on `start` from the message
  handler - tick 0 carries the first note's attack and cannot wait for
  the first render quantum.
- Keep the worker's catch-up semantics: emit every tick whose sample
  boundary passed inside the current render quantum.
- Verify under the webkit e2e project per `TESTING.md` - suspended
  AudioContext startup behaviour only reproduces there.
- Follow the `?worker&url` static-import lesson in `WORKFLOW.md` when
  wiring the worklet bundle, and verify the emitted file lands in
  `dist/js/`.

## Out of Scope

- Moving the DSP rendering of the internal engine into a worklet - only
  the clock source moves.
- Changes to song timing semantics (speed, envelope stepping, frame
  rates) - the contract stays identical.
- Scheduling register writes at audio-time offsets - ticks still apply
  on the main thread as they arrive.
