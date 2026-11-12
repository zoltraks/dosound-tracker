# Specification Audit - Align Ayumi Output Gain

## Document Information

|            |                                                             |
| ---------- | ----------------------------------------------------------- |
| Change     | `docs/change/1.5.2/align-ayumi-output-gain.md`              |
| Plan       | `docs/plan/1.5.2/align-ayumi-output-gain-implementation.md` |
| Audit Date | 2026-11-11                                                  |

## Completeness

- Level parity on engine switch - the constant moves to the recorded `1.2`
  parity point.
- No clipping at full volume - covered by the headroom suite measuring the
  folded peak at maximum channel output.
- Comment records the chosen value and evidence - part of the constant step.
- Export paths untouched - out of scope per the record, no step touches them.

## Ambiguity

none - the constant, its value, and the measured property are all named.

## Implementability

- `AYUMI_OUTPUT_GAIN` exists at `src/workers/ayumiWorklet.ts` line 27 and feeds
  the output expression at line 134 - verified.
- `AyumiCore` is importable under the node test environment (`test/synth/`
  suites already exercise it) and exposes `configure`, `setPan`, `setMixer`,
  `setVolume`, `setTone`, `process`, `removeDc`, `left`, and `right` - the
  exact surface the headroom suite needs.
- The owner listening check cannot run inside the window - the plan records it
  as the acceptance note rather than a step, matching the record's wording.

## Fidelity

- The record's linear-headroom premise failed verification - the folded peak
  measures `~1.33`, so the record and plan were amended to the `1.2` parity
  gain plus a soft-knee limiter. The limiter contract (linear below `0.9`,
  asymptotic to `1.0`) is stated once for both the worklet and the suite.
- The value `1.2` is the measured parity point from the record - no other
  candidate was considered.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
