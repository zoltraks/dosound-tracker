# Specification Audit - Add Ayumi Sound Engine as Selectable Alternative

## Document Information

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Change     | `docs/change/1.4.6/ayumi-sound-engine.md`              |
| Plan       | `docs/plan/1.4.6/ayumi-sound-engine-implementation.md` |
| Audit Date | 2026-11-10                                             |

## Completeness

Requirement-to-step mapping from the change record.

| Requirement                                                             | Plan step                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Engine ids `internal` and `ayumi`, `internal` default                   | Define the engine contract and vocabulary                         |
| Display labels `Internal` and `Ayumi` in the settings surface           | Define the engine contract and vocabulary (`SOUND_ENGINE_LABELS`) |
| Shared `SoundEngine` contract for both engines                          | Define the engine contract and vocabulary                         |
| Persisted engine id read from local storage with invalid-value fallback | Add the persisted engine-selection reader                         |
| Ayumi core vendored as TypeScript port, MIT attribution                 | Vendor the Ayumi core; `COPYRIGHTS.md` documentation update       |
| Full R0-R13 register semantics routed to Ayumi setters                  | Build the worklet processor; AyumiEngine register mirror          |
| Sample rendering off the main thread in an AudioWorklet                 | Build the worklet processor; AyumiEngine facade                   |
| Synchronous `getRegisters`/`getRegistersArray`/`getState` for Dump/EQ   | AyumiEngine facade mirror; shared `deriveYmState` helper          |
| Engine switch without reload, sounding notes silenced                   | Rewire the audio setup (dispose, recreate, stale-resolve guard)   |
| Mono output matching the Atari ST                                       | Worklet processor panning and single-channel output               |
| Same instrument-to-register logic feeding both engines                  | Extract the shared channel-instrument logic                       |
| Consumer code unchanged across engines                                  | Retype the consumer surface                                       |

Requirements with no covering step: none.

Steps with no stated requirement: `Retype the consumer surface` serves the
contract requirement implicitly - every consumer sees one interface.

## Ambiguity

- **"Selectable through settings"**: the settings surface belongs to a
  separate change record. This plan resolves the ambiguity by owning only the
  binding contract - the storage key, the id vocabulary, and the reader - so
  either record can land first.
- **"Switching the engine"**: interpreted as full teardown and recreate
  rather than in-place register carry-over. Evidence: the change record
  states sounding notes are silenced and playback does not carry over.
- **`?worker&url` emission**: the primary worklet route depends on the
  rolldown-based Vite build emitting a self-contained ES bundle for the
  query. Interpretation risk is contained by the recorded fallback
  (plain-JS worklet under `public/`).
- **"Mono output"**: implemented as all channels panned centre inside Ayumi
  with `outputChannelCount: [1]` on the node, matching the summed stereo
  result.

## Implementability

Checked each plan step against the tree.

- `src/synth/YM2149.ts` carries the five helpers to extract
  (`updateChannelWithInstrument`, `getModeValueForTick`, `getToneNoiseState`,
  `updateMixerForChannel`, `applyNoiseEnvelopeValue`) - confirmed present.
- `src/hooks/audio/useAudioSetup.ts` instantiates `new YM2149(...)`
  synchronously in an effect - the async factory conversion is consistent
  with the recorded stale-resolve guard.
- `src/utils/storage/storageKeys.ts` exists and holds the key registry the
  reader extends.
- `src/workers/` exists and holds `sequencerWorker.ts`; the worker bundling
  config in `vite.config.ts` emits `js/[name].js` with format `es`.
- The CSP in `vite.config.ts` is `script-src 'self'` and `worker-src 'self'` -
  blob-URL worklets are not permitted; the plan's `?worker&url` route emits a
  real same-origin file and stays compliant.
- `test/synth/` holds four YM2149 suites plus `audioContextStub.ts` - the
  recorded regression net for the `internal` path.
- Ayumi licensing verified against upstream: `true-grue/ayumi` and
  `alexanderk23/ayumi-js` both carry MIT, inside the `COPYRIGHTS.md`
  permitted set.
- Consumer list for the retype step was enumerated by grep over `src/` - all
  files holding `YM2149` types are named in the plan.

## Fidelity

- **Enumeration fidelity**: all 14 writable registers R0-R13 are mapped in
  the worklet translation, including R11-R13 which no instrument writes
  today. The vocabulary `internal`/`ayumi` and the default `internal` are stated
  identically in record, plan, and constants sketch.
- **Vocabulary freeze**: engine ids are single lowercase tokens
  (`'internal'`, `'ayumi'`) with fixed display labels (`Internal`, `Ayumi`)
  carried once in `SOUND_ENGINE_LABELS`; the storage key is
  `'dosound-tracker-sound-engine'` assigned once in `StorageKeys`.
- **Cross-party parity**: the worklet message vocabulary is specified on
  both ends - `AyumiEngine` emits `write`, `writes`, `clock`, and `reset`,
  the processor consumes the same four types.
- **Constants completeness**: bounds recorded - `YM_CLOCK` 2000000 default,
  context `sampleRate` drives Ayumi `sr`, `outputChannelCount: [1]`, the
  192-tap FIR, 8x decimation, and 1024-entry DC filter carried unchanged
  from the vendored algorithm.
- **Boundary decisions**: WAV export keeps its own renderer (byte-identical
  output preserved); `YM_CLOCK` and `YM_LOG_VOLUME_TABLE` stay exported from
  `src/synth/YM2149.ts`; `window.ym2149` debug exposure becomes
  `SoundEngine`-typed; the `YM2149` class and file names are not renamed.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |

`none` - the settings-surface dependency is resolved by the recorded
contract: this change owns the key, ids, and reader, so it can land before
or after the settings change record.
