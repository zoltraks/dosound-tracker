# Send a MIDI noteOff on Preview Auto-Stop Implementation Plan

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Send the matching MIDI noteOff when a MIDI-triggered preview auto-stops               |
| Key decisions | `useMidiActions` wires `onAutoStop` to the same helper path the explicit release uses |
| Open risks    | `none`                                                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/send-midi-noteoff-on-preview-autostop.md`.

## Analysis

The shared engine fires `onAutoStop` when a released voice reaches a silent
envelope tail. `TrackPanel` already wires that hook to `onPreviewMidiNoteOff`.
`useMidiActions` creates its `livePreview` engine without `onAutoStop`, so a
preview that auto-stops never reaches `sendInstrumentMidiNoteOffForChannel`.
The explicit noteOff path sends at the noteOff event and clears
`lastMidiPreviewRef`, but a preview can outlive that path: a noteOff event
whose note number or MIDI channel does not match the recorded preview skips
the guard, the sustained envelope later auto-stops, and the outgoing MIDI
note stays hanging on the device. Wiring `onAutoStop` closes the hang and
clears the recorded preview so a later hard stop cannot double-send.

## Best Practices

Follow TypeScript engineering standards from
`docs/standard/typescript-general-development.md` and the real-time audio
standard `docs/standard/typescript-audio-development.md`:

- Reuse the existing helper path (`sendInstrumentMidiNoteOffForChannel`)
  rather than adding a second MIDI-out route.
- Guard on recorded state, matching the explicit-release semantics.
- Keep the callback allocation-free at event time, per the MIDI hot-path
  rule in `SPECIFICATION.md`.

## Audio-Critical Requirements

This change touches an audio-adjacent path.

- The change adds one option value at engine construction - it does not alter
  React render timing, dependency arrays, or state management.
- `onAutoStop` fires inside the engine's interval callback, the same point
  `TrackPanel` already uses - no new timing surface.

## Documentation Updates

Per project guidelines, update the active documentation set before any source
code modifications. Update only the files affected by this change.

- `SPECIFICATION.md` — the `usePreviewEnvelope` entry records that MIDI
  preview surfaces wire `onAutoStop` to the outgoing noteOff path.

`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` are unaffected.

## Type and State Updates

None. `PreviewEnvelopeOptions.onAutoStop` already exists in the engine's
public interface.

## Step by Step Implementation

**Update SPECIFICATION.md**

Extend the `usePreviewEnvelope` entry so the MIDI auto-stop noteOff is
documented behaviour.

File to modify: `docs/SPECIFICATION.md`.

**Add the auto-stop noteOff test**

Extend `test/hooks/midi/useMidiActions.test.tsx` with a case that previews a
sustained instrument on the unfocused path, releases it, advances fake
timers past the silent tail, and asserts the noteOff helper ran for the
preview channel at auto-stop.

File to modify: `test/hooks/midi/useMidiActions.test.tsx`.

**Wire onAutoStop in useMidiActions**

Pass `onAutoStop` to `usePreviewEnvelope`. Inside it, read
`lastMidiPreviewRef.current`, call
`helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel)` when helpers
exist, and clear the recorded preview.

**Keep the recorded preview until the voice ends**

The noteOff paths currently clear `lastMidiPreviewRef` even when
`release()` returns true and the sustained voice keeps fading, which would
leave `onAutoStop` nothing to read. Clear `last` only on the immediate-stop
branch (`release()` returns false) - a sustained voice keeps its recorded
channel until the engine's auto-stop fires the noteOff and clears it there.

File to modify: `src/hooks/midi/useMidiActions.ts`.

```typescript
const livePreview = usePreviewEnvelope({
  ym2149: () => ym2149Ref.current,
  onAutoStop: () => {
    const last = lastMidiPreviewRef.current;
    if (last) {
      const helpers = midiHelpersRef.current;
      if (helpers) {
        helpers.sendInstrumentMidiNoteOffForChannel(last.ymChannel);
      }
      lastMidiPreviewRef.current = null;
    }
  },
});
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md`.
2. Add the test.
3. Apply the wiring.
4. Run verification loop.

## Testing Strategy

**Unit tests**

The new case covers the auto-stop noteOff on the unfocused path - existing
tests cover explicit release and hard-stop semantics. A second noteOff for an
already-released preview is idempotent for the device, so no guard against
double-send is added.

Test file to update: `test/hooks/midi/useMidiActions.test.tsx`.

**Integration tests**

The record's MIDI-monitor check is a device-level verification - the hook
test approximates it through the helper spy and fake timers.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test -- test/hooks/midi/`
