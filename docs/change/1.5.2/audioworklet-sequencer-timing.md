# Move Sequencer Timing to AudioWorklet

**Type:** Feature

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Replace the `setTimeout`-driven sequencer clock with AudioWorklet       |
|               | timing for sample-accurate playback free of main-thread jitter          |
| Key decisions | The worker timer is replaced, not wrapped - the tick contract with the  |
|               | main thread stays the existing message protocol                         |
| Open risks    | Significant architectural change touching the audio path's timing root; |
|               | timing accuracy must be proven against the current worker before swap   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Playback timing is anchored by `src/workers/sequencer.ts`, which paces
frames with a `setTimeout` loop in a dedicated worker. Worker isolation
already protects the tick from React renders, but `setTimeout` still
suffers timer coalescing and event-loop jitter - a tick can land late
and the whole frame slips.

Driving the frame clock from the audio thread gives sample-accurate
timing: an `AudioWorkletProcessor` emits ticks tied to the audio render
quantum, eliminating main-thread and timer-scheduler jitter. The
sequencer integration on the main thread keeps its existing tick
contract - the swap is in the clock source, not the playback model.

The Ayumi engine already runs an `AudioWorkletProcessor`
(`ayumiWorklet.ts`), so the worklet lifecycle, bundling, and messaging
patterns exist in the tree to follow.

## Use Cases

- When the song plays, tick cadence follows the audio clock rather than
  the timer scheduler - no drift under main-thread load.
- When the user switches between 50 Hz and 60 Hz frame rates, the
  worklet clock tracks the configured rate exactly.
- When the tab is busy with export work, playback timing is unaffected.

## Hints

- Preserve the existing `tick`/`update`/`stop` message contract toward
  `useSequencer` so integration code changes minimally.
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
