# Align Ayumi Output Gain

**Type:** Fix

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Bring the Ayumi engine's live output level to parity with the internal |
|               | engine so switching engines does not change perceived loudness         |
| Key decisions | Raise `AYUMI_OUTPUT_GAIN` in `src/workers/ayumiWorklet.ts` toward the  |
|               | measured parity point while keeping headroom against clipping          |
| Open risks    | Perceived loudness varies with material and output device - acceptance |
|               | requires an owner listening check                                      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Ayumi engine renders noticeably quieter than the internal engine at the
same song and volume settings. The worklet applies `AYUMI_OUTPUT_GAIN` to
the rendered stream - it currently sits at `0.5`, set conservatively for
clipping headroom against a centre-panned peak near 1.5 with all three
channels at full volume. A stage gain measured near `1.2` was recorded as
the parity point.

Raising the constant makes engine switching level-neutral for live
playback. The change is a one-line mechanism, but acceptance is perceptual
rather than numerical: perceived loudness varies with the song material
and the output device, so the final value is confirmed by a listening
check rather than fixed from the measurement alone.

## Use Cases

- When the user switches the sound engine from Internal to Ayumi in the
  settings dialog, the audible level stays the same.
- When all three channels play at full volume through Ayumi, the output
  does not clip.

## Hints

- The constant lives in `src/workers/ayumiWorklet.ts` beside
  `AYUMI_REGISTER_COUNT`; its comment records the headroom rationale and
  should be updated to record the chosen value and the parity evidence.
- Evaluate on the bundled demo song and on a dense three-channel song,
  alternating engines mid-playback after a fresh page load.
- Keep margin below the recorded peak ceiling - parity at `1.2` leaves
  less headroom than `0.5` did, so the listening check should include the
  loudest available material.

## Out of Scope

- Per-channel loudness balancing or stereo changes.
- Export paths - WAV rendering uses its own software simulation and the
  register-stream formats do not pass through the worklet gain.
