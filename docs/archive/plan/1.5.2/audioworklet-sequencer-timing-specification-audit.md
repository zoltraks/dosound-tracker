# Specification Audit - Move Sequencer Timing to AudioWorklet

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.5.2/audioworklet-sequencer-timing.md`              |
| Plan       | `docs/plan/1.5.2/audioworklet-sequencer-timing-implementation.md` |
| Audit Date | 2026-11-11                                                        |

## Completeness

- Tick cadence follows the audio clock - covered by the worklet
  processor step, paced by sample counting inside `process()`.
- 50 Hz and 60 Hz rates tracked exactly - covered by the `tickInterval`
  message carried into `samplesPerTick()` and the reschedule step.
- Timing unaffected by main-thread load - covered by the audio render
  thread owning tick generation.
- Position view frozen while the context renders nothing - covered by
  `process()` never running under a suspended context, the same
  invariant `useAudioContextPlaybackSync` maintains.
- Existing `tick`/`update`/`stop` contract toward `useSequencer` -
  covered by the processor reusing the worker's protocol verbatim and
  the hook step moving the message handler unchanged.
- Immediate starting tick on `start` - covered by the worklet step
  posting from the message handler, not the render loop.
- Worklet bundling - covered by the `?worker&url` static import in the
  hook step and the `dist/js/` emission check in verification.
- DSP rendering of the internal engine stays out of scope - no plan
  step touches `YM2149.ts` or `ayumiWorklet.ts`.

## Ambiguity

- "Emits ticks tied to the audio render quantum" - resolved as sample
  counting inside `process()`: `nextTickSample` accumulates
  `samplesPerTick()` and every owed tick posts within the quantum that
  crossed it, so cadence error is bounded by 128 samples rather than
  timer jitter.
- "Keeps its existing tick contract" - resolved as the identical
  message types and payload fields on `node.port`; the hook's merge
  handler is moved verbatim.
- "Replaced, not wrapped" - resolved as deleting `sequencer.ts`; no
  worker path is retained as a fallback because a missing
  `audioWorklet` implies no engine and no playback.
- Suspended-context behaviour - resolved as ticks simply not flowing;
  no synthetic pause message exists in the contract and none is added,
  since `useAudioContextPlaybackSync` owns stop/resume across
  `statechange`.

## Implementability

- `AudioWorkletProcessor`, `registerProcessor`, and `sampleRate` are
  declared ambiently at `src/workers/ayumiWorklet.ts` - verified; the
  same declaration pattern applies to the new processor.
- `audioWorklet.addModule` with a `?worker&url` static import emits the
  worklet bundle - verified at `src/synth/AyumiEngine.ts`; the emitted
  file lands under `dist/js/` per `vite.config.ts` worker output.
- `useSequencer` constructs the worker and owns every call site that
  posts protocol messages - verified at
  `src/hooks/sequencer/useSequencer.ts`; the retarget is a transport
  swap behind `postRef`.
- `usePlaybackControls` forwards `patternLength` and `frameRate` to
  `useSequencer` - verified; one parameter joins the same call.
- `App.tsx` declares `useAudioSetup` and `usePlaybackControls` in the
  same component body - verified; reordering hook calls is safe
  because their data dependencies (`currentSong`, `soundEngineId`,
  `channelPans`) are available earlier.
- `useAudioContextPlaybackSync` already stops and restarts the
  sequencer across `statechange` - verified at
  `src/hooks/audio/useAudioContextPlaybackSync.ts`; the frozen-tick
  behaviour under suspension composes without changes.
- The protocol suite at `test/workers/sequencer.test.ts` drives the
  worker through `self.dispatchEvent` and fake timers - verified; the
  replacement drives `process()` with fixed `Float32Array` blocks.

## Fidelity

- Protocol vocabulary stated once: `start`, `stop`, `update`,
  `setParams` inbound and `tick`, `update`, `stop` outbound, with
  identical payload fields - the worklet file is the single owner.
- Position machine stated once: tick/line/pattern advance, playlist
  wrap, `loopIndex`, `hasLoop`, and pattern-loop semantics port
  verbatim, so both sides of the contract agree by construction.
- Constants enumerated: render quantum 128 samples, `sampleRate`
  ambient, `outputChannelCount: [1]`, silent output via `fill(0)`,
  processor name `sequencer-processor`, tick interval in milliseconds.
- Cross-party parity: the hook's initial `setParams` (tick interval and
  pattern length) posts through the same readiness queue as later
  control messages, preserving the arrival order the worker saw.
- Boundary decisions recorded: a suspended context emits no ticks and
  no synthetic message; `useAudioContextPlaybackSync` keeps owning the
  stop/resume across `statechange`; a missing `audioWorklet` leaves
  the sequencer transportless rather than falling back to a worker.
- Catch-up fidelity: the worker's `while (now >= nextTickTime)` maps to
  `while (nextTickSample <= renderedSamples)`, preserving multi-tick
  backlog emission inside one scheduling turn.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
