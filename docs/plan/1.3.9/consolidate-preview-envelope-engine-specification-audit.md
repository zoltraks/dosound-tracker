# Specification Audit - Consolidate the Preview-Envelope Engine

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                         |
| ---------- | ----------------------------------------------------------------------- |
| Change     | `docs/change/1.3.9/consolidate-preview-envelope-engine.md`              |
| Plan       | `docs/plan/1.3.9/consolidate-preview-envelope-engine-implementation.md` |
| Audit Date | 2026-11-09                                                              |

## Verdict

The plan is ready for implementation. All five copies were diffed against the canonical pattern, including a line-level survey of the two `useMidiActions` copies. Every divergence maps to an engine option or a call-site-side responsibility, and the one behavioral divergence (MIDI auto-stop noteOff) splits into its own record per the record's own rule.

## Completeness

| Requirement                                                   | Plan step                                    |
| ------------------------------------------------------------- | -------------------------------------------- |
| One ref-driven implementation under `src/hooks/`              | `usePreviewEnvelope` engine step             |
| All five call sites consume it                                | Five migration steps                         |
| Ref-driven timing, no new re-renders, no semantic change      | Audio-Critical Requirements + engine options |
| Call-site-by-call-site migration with verification after each | Implementation Order                         |
| Semantic differences split into their own record              | MIDI auto-stop noteOff deferred record       |

## Ambiguity

`useInstrumentActions` plays a fixed one-shot envelope (`step >= 64` cap, no release). "Consume the shared engine" resolves to `start` with `honorSustain: false` and `stopAfterStep: 64`, which reproduces the reduced semantics exactly rather than silently gaining sustain/release behavior.

## Implementability

- `useMidiActions` inputs arrive per event (`ym2149Ref`, derived `ymChannel`, `tickIntervalMsRef`) - the engine takes `channel` and `tickIntervalMs` per `start`, and `ym2149` from the mirrored options ref, so per-event values flow correctly.
- `usePlaybackHandlers` clears `playInstTimerRef` at two sites - passing `stopInstrumentPreview` through `App.tsx` keeps the external-stop contract.
- `PianoKeyboard`'s stale key-up guard maps to `hasState(keyId)` - `TrackPanel`'s `hasPreviewState` maps to `hasState()` plus `pressedNoteKeysRef`, which stays component-side.
- `clearIntervalRef` remains used where timers live outside the engine - `window.setInterval` inside the engine returns `number` in the DOM lib, matching existing usage.

## Fidelity

- Tick math: the engine calls `advancePreviewEnvelopeTick` + `getPreviewEnvelopeApplyStep` - the shared helpers already used by three of five copies - `useMidiActions` copy B's inlined equivalent math is removed.
- Reduced variants reproduce exactly through `honorSustain: false` (HeaderPanel) and `honorSustain: false` + `stopAfterStep: 64` (useInstrumentActions) - HeaderPanel's missing catch-up changes only under timer throttling and moves toward the canonical contract - recorded as an accepted implementation difference.
- Divergence recorded, not folded: MIDI auto-stop noteOff omission is deferred to `docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`.
- The record's localStorage claim is false for all five files - noted in the plan rather than silently absorbed.

## Findings Returned to Planning

`none`
