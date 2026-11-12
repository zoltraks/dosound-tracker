# Specification Audit - Reconcile YM2149 Initial State

## Document Information

|            |                                                                    |
| ---------- | ------------------------------------------------------------------ |
| Change     | `docs/change/1.4.7/reconcile-ym2149-initial-state.md`              |
| Plan       | `docs/plan/1.4.7/reconcile-ym2149-initial-state-implementation.md` |
| Audit Date | 2026-11-10                                                         |

## Completeness

| Requirement                                               | Plan step               |
| --------------------------------------------------------- | ----------------------- |
| Constructor derives initial state from zero registers     | Replace the literal     |
| `getState()` before first write matches register decoding | Add a consistency test  |
| Existing assertions checked for encoded literal values    | Testing Strategy - unit |

Requirements with no covering step: none.

Steps with no stated requirement: none.

## Ambiguity

- The record leaves the decoder untouched - `deriveYmState`'s active-low
  reading is the shared contract both engines and consumers already use.
- `AyumiEngine` already derives its initial state from the zero file, so
  the fix makes the two engines consistent rather than introducing a new
  behavior.

## Implementability

- One-line change in the constructor; `deriveYmState` is already imported
  and used by `updateState()`.
- Audit of `test/synth/`, `EQPanel.tsx`, and `DumpPanel`-adjacent state
  readers: no consumer or test reads `getState()` before a register write
  - `channels[].volume` and `envelopeEnabled` already read zero/false on a
    fresh instance, so rendered output is unchanged.

## Fidelity

- The literal's `toneEnabled: true` reading is preserved by the decoder
  (mixer bits are active-low), so only `noiseEnabled` changes on a fresh
  instance - matching the record's described divergence exactly.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  |         |                  |
