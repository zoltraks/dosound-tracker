# Move Sequencer Timing to AudioWorklet Implementation Plan

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Move the 50 Hz frame clock out of the `sequencer.ts` worker into a     |
|               | `sequencerWorklet.ts` AudioWorkletProcessor paced by rendered samples  |
| Key decisions | The processor reuses the worker's message protocol and catch-up        |
|               | semantics verbatim; `useSequencer` receives the shared AudioContext    |
|               | and queues outgoing messages until the worklet node lands; the node    |
|               | emits silence on one output channel so the render graph pulls it       |
| Open risks    | `addModule` resolves asynchronously - early `setParams` messages must  |
|               | survive the readiness gap; suspended-context startup behaviour is only |
|               | reproducible under the webkit e2e project                              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/audioworklet-sequencer-timing.md`.

## Analysis

`src/workers/sequencer.ts` owns the playback position (pattern, line,
tick) and paces ticks with a self-rescheduling `setTimeout` loop that
targets `nextTickTime` and catches up on missed intervals in a `while`
loop. `useSequencer` constructs the worker through
`new URL('../../workers/sequencer.ts', import.meta.url)` and speaks a
four-message protocol in (`start`, `stop`, `update`, `setParams`) and a
three-message protocol out (`tick`, `update`, `stop`).

Moving the clock into an `AudioWorkletProcessor` keeps the protocol and
the position machine identical while the pacing moves to sample
counting inside `process()` - one invocation per 128-sample render
quantum on the audio render thread. Timer clamping, coalescing, and
event-loop jitter disappear from tick generation; a hidden tab no
longer compresses ticks into catch-up bursts.

The constraint the worker never had: the worklet needs the app's shared
`AudioContext`. It is created by `useAudioContext` inside `useAudioSetup`,
which `App.tsx` currently calls after `usePlaybackControls`. The audio
setup moves ahead of the playback controls so `useSequencer` receives
the context as a parameter.

`audioWorklet.addModule` is asynchronous. `usePlaybackControls` fires
`setParams` effects on mount before the node can exist, so the hook
queues outgoing messages and flushes them in order once the node lands -
the same arrival order the worker saw, since the worker's effect always
ran before the control effects.

While the context is suspended, `process()` never runs and no ticks
flow. `useAudioContextPlaybackSync` already stops the sequencer on
suspension and restarts it on resume, and the audio standard requires
the position view to never advance while nothing renders - the worklet
clock enforces that invariant by construction.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- No abbreviations in identifiers (use full words)
- Keep components focused on single responsibility

Follow the audio engineering standard from `docs/standard/typescript-audio-development.md`:

- One authority owns the cadence; tick handlers stay synchronous and
  allocation-free.
- A cadence start emits the starting step immediately.
- The position view may never advance while the context renders nothing.

## Audio-Critical Requirements

- The change does not add `useCallback`/`useMemo` dependencies and does
  not alter state-management patterns in the audio path. `useSequencer`
  keeps its refs, its sparse `calculateTickInterval` dependency, and its
  direct `setState` calls; only the transport behind `postMessage`
  changes.
- The message handler body that merges tick state is moved verbatim -
  the `safeIsPlaying` guard and the tick-only callback gating are
  preserved.
- Timing stability verification: the protocol suite drives the
  processor's `process()` directly with fixed block counts, proving
  cadence and position advance deterministically; live playback is
  proven by the e2e smoke suite under chromium and webkit.
- Playback simulation: `test/workers/` coverage is retargeted from the
  worker file to the worklet processor, covering start, tick advance,
  boundaries, loop wrap, stop, update echo, and interval rescheduling.
- Linting exceptions: none new. The worklet file declares audio-scope
  globals ambiently, matching `ayumiWorklet.ts`.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `ARCHITECTURE.md` - workers bullet, playback pipeline step, audio
  synthesis pipeline paragraph, system diagram clock box, and the
  "Web Worker for timing" decision become the AudioWorklet clock.
- `SPECIFICATION.md` - the Sequencer Timing section gains the worklet
  clock description; the known-limitations note names the worklet
  protocol suite.
- `PROJECT.md` - the F-14 replay-rate paragraph names the sequencer
  worklet instead of the worker.
- `TESTING.md` - the `test/workers/` directory line covers worklet
  protocol tests.
- `standard/typescript-audio-development.md` - the Project Conventions
  cadence bullet names `sequencerWorklet.ts` and the AudioContext.
- `standard/performance-budgets-development.md` - the Project
  Conventions tick bullet names `sequencerWorklet.ts`.
- `vite.config.ts` - the worker-output comment names the worklet
  bundles.

## Type and State Updates

**Type definitions**

File to modify: none. The message shapes are local to the worklet and
the hook, exactly as the worker kept them.

**State store modifications**

None. Sequencer state stays inside `useSequencer`.

## Step by Step Implementation

**Create the sequencer worklet processor**

New `src/workers/sequencerWorklet.ts` carries the position machine and
the message protocol from `sequencer.ts`, paced by sample counting.

File to create: `src/workers/sequencerWorklet.ts`.

```typescript
class SequencerProcessor extends AudioWorkletProcessor {
  private renderedSamples = 0;
  private nextTickSample = 0;

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channel = outputs[0]?.[0];
    if (channel) {
      channel.fill(0);
    }
    const frames = channel?.length ?? 128;
    this.renderedSamples += frames;
    while (this.isPlaying && this.nextTickSample <= this.renderedSamples) {
      this.scheduleTick();
      this.nextTickSample += this.samplesPerTick();
    }
    return true;
  }
}
```

`scheduleTick`, `stop`, `update`, and `setParams` port over verbatim -
they hold no timer API. `start` sets `nextTickSample` to
`renderedSamples + samplesPerTick()` and posts the starting tick from
the message handler, mirroring the worker's immediate-tick contract. A
`tickInterval` change while playing reschedules
`nextTickSample` one full new interval ahead, matching the worker's
reschedule behaviour. The processor registers as
`sequencer-processor`. `tickInterval` stays in milliseconds and
converts through the ambient `sampleRate`.

**Retarget the sequencer hook to the worklet**

`useSequencer` gains an `audioContext: AudioContext | null` parameter.
Its mount effect loads the worklet module, creates the node with
`outputChannelCount: [1]`, connects it to the destination, and attaches
the unchanged message handler to `node.port`. A `postRef` indirection
queues messages until the node lands and flushes them in order; the
initial `setParams` (tick interval and pattern length) posts through
the same queue so arrival order is preserved. Cleanup closes the port
and disconnects the node. The `Worker` guard becomes an
`audioContext?.audioWorklet` guard - when no context exists there is no
engine and no meaningful playback.

File to modify: `src/hooks/sequencer/useSequencer.ts`.

```typescript
useEffect(() => {
  if (!audioContext?.audioWorklet) {
    return;
  }
  let cancelled = false;
  const pending: SequencerIncomingMessage[] = [];
  postRef.current = (message) => {
    if (nodeRef.current) {
      nodeRef.current.port.postMessage(message);
    } else {
      pending.push(message);
    }
  };
  postRef.current({ type: 'setParams', data: {/* initial params */} });
  void audioContext.audioWorklet.addModule(sequencerWorkletUrl).then(() => {
    /* create node, attach handler, flush pending */
  });
  return () => {
    /* cancelled, close port, disconnect */
  };
}, [audioContext, calculateTickInterval]);
```

Every `workerRef.current.postMessage(...)` call site routes through
`postRef.current?...)`; the message handler body itself is unchanged.

**Pass the context through playback controls**

`usePlaybackControls` gains `audioContext` in its parameter object and
forwards it to `useSequencer`.

File to modify: `src/hooks/playback/usePlaybackControls.ts`.

**Reorder the audio setup in the orchestrator**

`App.tsx` moves the `soundEngineId` state, the `channelPans` memo, and
the `useAudioSetup` call above `usePlaybackControls`, and passes
`audioContext` into `usePlaybackControls`. No other wiring changes.

File to modify: `src/App.tsx`.

**Retire the worker file**

`src/workers/sequencer.ts` is deleted - the record requires the clock
replaced, not wrapped. `test/workers/sequencer.test.ts` is replaced by
`test/workers/sequencerWorklet.test.ts`, which installs ambient worklet
globals (a fake `AudioWorkletProcessor` base, a `registerProcessor`
capture, a fixed `sampleRate`), imports the module, and drives
`process()` with fixed block counts instead of fake timers.

File to delete: `src/workers/sequencer.ts`, `test/workers/sequencer.test.ts`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Create the sequencer worklet processor
3. Retarget the sequencer hook
4. Pass the context through playback controls
5. Reorder the audio setup in the orchestrator
6. Retire the worker file and retarget the protocol tests
7. Run verification loop

## Testing Strategy

**Unit tests**

- `test/workers/sequencerWorklet.test.ts` - replaces the worker suite
  one for one: immediate start tick, tick and line advance, start
  position, pattern advance, pattern loop, playlist loop wrap,
  past-end advance, stop payload and post-stop silence, update echo,
  and interval rescheduling while playing. Block counts replace timer
  advances: 960 samples at 48 kHz equals one 20 ms tick.
- The suite also proves catch-up: a multi-tick backlog inside one
  `process()` burst emits every owed tick, matching the worker's
  `while` loop.

**Integration tests**

- `e2e/smoke.spec.ts` already covers play, advance, and stop - no new
  spec needed; the flows prove the worklet clock end to end. The webkit
  project covers suspended-context startup per `TESTING.md`.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build` and confirm the emitted worklet bundle lands in `dist/js/`
- Run `npm test`
- Run `npm run test:e2e` under chromium and webkit for the audio-path slice
- Manually verify playback timing and audio stability
