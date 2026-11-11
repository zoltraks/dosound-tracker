# Specification Audit - Evaluate a WebAssembly Audio Core

## Document Information

|            |                                                     |
| ---------- | --------------------------------------------------- |
| Change     | `docs/change/1.5.2/wasm-audio-core.md`              |
| Plan       | `docs/plan/1.5.2/wasm-audio-core-implementation.md` |
| Audit Date | 2026-11-11                                          |

## Completeness

- Evaluation of the WASM-core premise - covered by the Evaluation
  section, which names every compute surface the record proposed and
  measures each.
- Decision recorded so the question does not resurface without evidence
  - covered by the single step updating `ARCHITECTURE.md`.
- "Measure, then decide" - the plan names the evidence source (the
  `work/wasm-eval/` harness) and lands no migration.

## Ambiguity

none - the record admits two outcomes (favourable proceeds to staged
migration, unfavourable declines) and the plan names which one the
measured evidence selects.

## Implementability

- `src/synth/channelInstrument.ts`, `src/synth/soundEngine.ts`,
  `src/workers/sequencerWorklet.ts`, `src/workers/ayumiWorklet.ts`,
  `src/utils/playback/playbackSimulation.ts`, and `src/exports/wav.ts`
  verified: the internal engine holds no TypeScript DSP, the sequencer
  worklet is a pure clock, and the seam the record claims exists.
- The measurement claims were reproduced by running the
  `work/wasm-eval/bench.ts` harness under Node: per-tick register work
  about 0.0001 ms of a 20 ms window, `simulateSong` about 0.1 ms,
  Ayumi quantum about 0.04 ms of a 2.9 ms budget, 15 s WAV export about
  7 ms.
- `ARCHITECTURE.md` carries the Architectural Decisions log - the
  update target exists.

## Fidelity

- Out-of-scope honoured: no WASM migration, no dependency addition, no
  Web Audio output change, no Ayumi-path change.
- The declined outcome is one of the two outcomes the record explicitly
  admits.
- The reopen condition (measured CPU evidence on a real device) keeps
  the boundary honest rather than foreclosed.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
