# Correct the MIDI Output Close Warning Label Implementation Plan

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Correct a mislabeled warning so MIDI output close failures identify the output device |
| Key decisions | Change the unmount-cleanup label to `Failed to close MIDI output`; update the pin     |
| Open risks    | none                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.3/correct-midi-output-close-warning.md`.

## Best Practices

One string literal and its test pin - the applicable practice is consistency
with the file's own convention: the output-close guards at lines 110 and 138
already warn `Failed to close MIDI output`, so the unmount cleanup adopts the
same label.

## Audio-Critical Requirements

None - a log label change touches no timing, state, or audio path.

## Documentation Updates

None - no pillar document records individual log messages. The change record
is the documentation.

## Type and State Updates

None.

## Step by Step Implementation

**Correct the unmount output-close label**

In `src/hooks/midi/useMidiDeviceAttachments.ts`, the unmount cleanup catches a
throw from `output.close()` and warns `Failed to close MIDI input` - the
guarded call closes the output stored in `currentOutputRef`, not an input.
Change the literal to `Failed to close MIDI output`.

File to modify: `src/hooks/midi/useMidiDeviceAttachments.ts`.

**Update the characterisation pin**

In `test/hooks/midi/useMidiDeviceAttachments.test.tsx`, the
`warns when unmount cleanup detachment and close calls throw` case pins the
mislabeled message. Update the expectation to `Failed to close MIDI output`.

File to modify: `test/hooks/midi/useMidiDeviceAttachments.test.tsx`.

## Implementation Order

1. Correct the label and its test pin
2. Run verification loop

## Testing Strategy

The existing unmount-cleanup case exercises both throwing closes; updating its
expectation re-pins the corrected label. The neighboring input-side
expectation (`Failed to detach MIDI input listener`) stays unchanged - the
input `close()` throw already warns under that label.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
