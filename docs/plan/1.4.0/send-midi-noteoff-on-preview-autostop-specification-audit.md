# Specification Audit - Send a MIDI noteOff on Preview Auto-Stop

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                           |
| ---------- | ------------------------------------------------------------------------- |
| Change     | `docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`              |
| Plan       | `docs/plan/1.4.0/send-midi-noteoff-on-preview-autostop-implementation.md` |
| Audit Date | 2026-11-09                                                                |

## Verdict

The plan is ready for implementation. The engine's `onAutoStop` hook exists
and already fires at the right moment; `useMidiActions` is the one consumer
that does not wire it; the helper path the record names is the one already
used on explicit release.

## Completeness

- `onAutoStop` invokes the same noteOff path as explicit release: covered by
  the wiring step - `sendInstrumentMidiNoteOffForChannel` on the recorded
  channel.
- MIDI-released instrument at a silent tail emits the noteOff when the
  channel silences: covered by the new test, which rides the real engine
  auto-stop path rather than simulating the callback.

## Ambiguity

The record says "both the track-focused and unfocused paths share one engine
call site after the 1.3.9 consolidation" - verified: `useMidiActions` holds a
single `usePreviewEnvelope` instance keyed `live`, so one `onAutoStop` wiring
covers both surfaces.

A subtlety the record does not name: the explicit noteOff already fires at
the noteOff event, so auto-stop can emit a second noteOff for the same note.
The plan records this as accepted idempotent behaviour matching the engine's
existing `TrackPanel` semantics, not a new defect.

## Implementability

- `PreviewEnvelopeOptions.onAutoStop` is a public option
  (`usePreviewEnvelope.ts` line 14) invoked at the auto-stop point (line
  196).
- `lastMidiPreviewRef` is declared before the `usePreviewEnvelope` call, so
  the callback closes over a live ref.
- `midiHelpersRef.current?.sendInstrumentMidiNoteOffForChannel` is the
  exact helper the explicit-release path calls at lines 253 and 323.
- `TrackPanel.tsx` lines 108-113 demonstrate the same wiring shape, giving
  the plan a proven pattern.

## Fidelity

- Enumeration fidelity: every state the callback must handle is enumerated -
  recorded preview present (send + clear) and absent (no-op).
- Boundary decisions: clearing `lastMidiPreviewRef` inside `onAutoStop`
  prevents a later `handleHardStopLivePreview` from sending a third noteOff
  for an already-silent channel; the plan states this ordering.
- Vocabulary freeze: channel values stay on the 0-2 YM range the helper
  expects, sourced from the recorded preview, never recomputed.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
