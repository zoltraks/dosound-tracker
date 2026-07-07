# Implement Replay Rate and Chip Clock Audio Support

**Type:** Feature

## Summary

Wire the existing `frame` (50 Hz / 60 Hz) and `clock` (2 MHz / 1 MHz) song fields into the audio playback engine, preview timers, and all export formats so that changing these values produces correct timing and pitch.

## Description

The previous change (replay-rate-clock-buttons) added the UI toggle buttons and the song format fields but explicitly scoped out audio and export support. This change implements that support.

**Replay rate (frame rate)**

When the replay rate changes from 50 Hz to 60 Hz, a single screen refresh lasts 1000/60 ≈ 16.66 ms instead of 20 ms. The playback cycle, which lasts two refreshes according to the DOSOUND procedure and the program's assumptions, shortens from 40 ms to approximately 33.33 ms. This affects:

- The sequencer worker tick interval (20 ms → 16.66 ms).
- All instrument preview envelope timers (PianoKeyboard, TrackPanel, HeaderPanel, useMidiActions, useInstrumentActions).
- The envelope progression cadence (every 2 ticks = 40 ms at 50 Hz, 33.33 ms at 60 Hz).
- Export timing: samples per tick in WAV and VGM, the VGM rate header field, the MAX chip setup chunk speed field.

**Chip clock**

When the chip clock changes from 2 MHz to 1 MHz, the pitch changes because the output frequency is derived from the divider value via `f = clock / (16 * period)`. To maintain the same composed pitch, the TA, TB, TC period register values must be recalculated using the configured clock. At 1 MHz, the period values are half of what they would be at 2 MHz for the same note. This falls naturally out of the formula `period = clock / (16 * frequency)`.

This affects:

- The YM2149 emulator frequency calculation and the `updateChannelWithInstrument` period calculation.
- The playback simulation period calculation in `playbackSimulation.ts`.
- The `frequencyToPeriod` helper in `exports/core.ts`.
- The ASM export `periodToNoteAndPitch` helper.
- The WAV export inline synthesizer.
- The VGM and MAX chip clock header fields.
- The `useAudioSetup` test tone calculation.

**Noise**

Noise timbre also changes with the clock because the noise frequency is derived from `f_noise = clock / (16 * noisePeriod)`. Since the NS register values (R6) are set directly from the instrument envelope, no additional recalculation is performed for noise. The timbre change is expected and correct.

**VGM wait commands**

The VGM format provides two single-byte VBLANK wait commands:

- `0x62` = wait 1/60 second (735 samples at 44100 Hz) — used for 60 Hz.
- `0x63` = wait 1/50 second (882 samples at 44100 Hz) — used for 50 Hz.

The export must select the correct command based on the song's frame rate. The delay merging logic must also handle both commands.

**Export normalization**

`normalizeSongForExport` must fill in `frame` and `clock` defaults so that export modules always receive concrete values.

**DOSOUND assembly and binary export**

The DOSOUND assembly format uses frame-count-based delays (not absolute time). At 60 Hz, a delay of 2 frames represents 33.33 ms instead of 40 ms. The frame counts in the export remain the same; only the absolute time they represent changes. The period values in the register stream are recalculated using the configured clock. No format-level changes are needed for ASM/BIN beyond using the dynamic clock in the period calculation.

## Use Cases

- When the user sets the replay rate to 60 Hz and plays the song, the sequencer ticks at 16.66 ms intervals and envelope steps advance every 33.33 ms.
- When the user sets the chip clock to 1 MHz and plays the song, the pitch remains the same as at 2 MHz because the period values are halved.
- When the user exports a 60 Hz song to VGM, the VGM header records 60 Hz, the wait commands use `0x62`, and the total sample count reflects 735 samples per tick.
- When the user exports a 1 MHz song to VGM or MAX, the chip clock header field records 1000000 and the register period values are halved.
- When the user exports a 60 Hz song to WAV, the rendered audio duration reflects the faster tick rate.
- When the user previews an instrument on the piano keyboard with a 60 Hz song, the envelope preview advances at 33.33 ms per step.

## Hints

- The `frame` and `clock` fields already exist on the `Song` interface and are persisted in the YAML format.
- The `DEFAULT_SONG_FRAME`, `DEFAULT_SONG_CLOCK`, `SUPPORTED_SONG_FRAMES`, and `SUPPORTED_SONG_CLOCKS` constants already exist in `src/constants/song.ts`.
- The worker already accepts a `tickInterval` parameter via `setParams`; it just needs to be fed the correct value from the song's frame rate.
- The `previewEnvelopeTiming.ts` utility already accepts a `tickIntervalMs` parameter with a default of 20; callers need to pass the dynamic value.
- The `YM2149` class constructor currently takes only `audioContext`; it needs to accept the clock as a second parameter.
- The `VBLANK_RATE` and `YM_CLOCK` constants should remain as defaults but must not be used directly in audio or export paths; the song's `frame` and `clock` fields drive the actual values.
- Audio-critical development principles in `GUIDELINES.md` apply. The `useSequencer` and `useSequencerIntegration` hooks use sparse dependency arrays and prop mirroring intentionally. New parameters (`frameRate`, `chipClock`) must be threaded through without breaking these patterns.

## Out of Scope

- Adding more than two frame rates or clock values.
- Changing the DOSOUND assembly delay format to support absolute time.
- Retroactively converting existing songs to the new timing; songs without `frame` or `clock` fields default to 50 Hz and 2 MHz.
- The `SequencerEngine.processFrame` stub; it is not used in the current playback path.
