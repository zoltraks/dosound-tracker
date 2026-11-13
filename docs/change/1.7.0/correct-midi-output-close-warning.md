# Correct the MIDI output close warning label

**Type:** Fix

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Correct a mislabeled warning so MIDI output close failures identify the output device |
| Key decisions | none                                                                                  |
| Open risks    | none                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The unmount cleanup in `src/hooks/midi/useMidiDeviceAttachments.ts` logs
`Failed to close MIDI input` when closing the MIDI output device fails. The
message names the wrong device kind - the guarded call closes the output
stored in `currentOutputRef`, not an input.

The warning should identify the output device, for example
`Failed to close MIDI output`, matching the message used by the output-close
guards elsewhere in the same file.

The characterisation suite `test/hooks/midi/useMidiDeviceAttachments.test.tsx`
pins the current message in its unmount-cleanup case and must be updated in
the same change set.

## Hints

The mislabel was found during the 1.6.3 window refactoring characterisation
work and deferred here per the Deferral rule - a log-message correction is
observable behaviour, not refactoring.
