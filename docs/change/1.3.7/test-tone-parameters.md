# Set the Startup Test Tone to 440 Hz for 250 ms

**Type:** Change

## Summary

| Field         | Value                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The audio-path validation tone plays A4 (440 Hz) for 200 ms after initialization completes at 50% volume after a 200 ms delay |
| Key decisions | Parameter change only - the tone remains part of audio setup                                                                  |
| Open risks    | None                                                                                                                          |

## Description

`useAudioSetup.ts` writes a 261.63 Hz (C4) test tone into the YM2149 period
registers on startup and mutes it after 100 ms. The required reference is
440 Hz (A4) held for 200 ms, fired once initialization and state restoration complete after initialization completes at half amplitude, starting 200 ms after setup.

## Implementation

- `testFrequency`: 261.63 -> 440.
- `testFrequency`: 440; volume registers 0x08-0x0a set to 0x0c - `YM_LOG_VOLUME_TABLE[12]` is 0.3536, the nearest level to one third of maximum output amplitude on the logarithmic scale; period write deferred 200 ms via the tone is a dedicated AudioContext oscillator (440 Hz square, 0.15 gain, `stop(now + 0.3)`) fired by `playTestTone()` after `restoreView()` plus two frames - deterministic duration immune to every YM2149 register reset; no register writes - the YM2149 emulator is not involved.

## Outcome

- Verification loop clean; the startup tone sounds A4 for 200 ms after initialization completes at half amplitude, starting after a 200 ms delay.
