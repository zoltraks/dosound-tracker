# Send a MIDI noteOff on preview auto-stop

**Type:** Fix

**Source:** AUDIT-1.4 REC-006 (FND-ARC-001) - divergence discovered during the 1.3.9 preview-envelope consolidation

## Summary

| Field         | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Intent        | Stop the outgoing MIDI note when a MIDI-triggered preview envelope auto-stops             |
| Key decisions | the engine's `onAutoStop` hook invokes the same MIDI noteOff path as an explicit release  |
| Open risks    | `none`                                                                                    |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`useMidiActions.ts` auto-stops a released preview when the volume envelope tail reaches silence, clearing state and writing the volume register, but never sends `sendInstrumentMidiNoteOffForChannel` - unlike `TrackPanel`, which calls `onPreviewMidiNoteOff` on the same path. The outgoing MIDI note hangs on connected devices until the next note or an explicit stop.

The change wires the shared preview engine's `onAutoStop` for the MIDI surfaces to the same MIDI noteOff path used on explicit release.

## Use Cases

- When a MIDI-released instrument reaches a silent envelope tail, the external MIDI device receives the matching noteOff at the same moment the channel is silenced.

## Hints

- Verification is a MIDI monitor check on auto-stop versus release.
- Both the track-focused and unfocused paths share one engine call site after the 1.3.9 consolidation.

## Out of Scope

- Changing when the auto-stop fires.
- Instrument or envelope semantics.
