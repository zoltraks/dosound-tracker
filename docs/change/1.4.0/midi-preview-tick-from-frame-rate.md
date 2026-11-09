# Derive the MIDI preview tick from the frame rate

**Type:** Fix

**Source:** AUDIT-1.4 REC-013 (FND-CQY-003)

## Summary

| Field         | Value                                                                       |
| ------------- | --------------------------------------------------------------------------- |
| Intent        | Keep MIDI live-preview timing accurate at both supported frame rates        |
| Key decisions | the first-tick offset derives from `song.frame` instead of a 20 ms constant |
| Open risks    | `none`                                                                      |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`useMidiActions.ts` sets `midiLiveNextTickTimeRef.current = nowTick + 20` at two sites while the tick interval derives from `song.frame`. At 60 Hz replay the first envelope tick lands about 3.3 ms late; the 50 Hz path is correct only because 20 ms happens to equal its interval.

The change derives the offset from the configured frame interval at both sites, so live preview keeps accurate timing at 50 Hz and 60 Hz.

## Use Cases

- When a song runs at 60 Hz, the first MIDI live-preview envelope tick lands on the 16.66 ms boundary.
- When a song runs at 50 Hz, preview timing is unchanged.

## Hints

- Verification is a manual preview check at 60 Hz.
- This touches an audio-adjacent timing path; the audio-critical principles in `GUIDELINES.md` apply.

## Out of Scope

- Sequencer tick scheduling outside the live-preview offset.
- The broader preview-envelope consolidation, owned by `consolidate-preview-envelope-engine`.
