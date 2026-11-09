# Expand synth and worker test coverage

**Type:** Chore

**Source:** 1.4.3 session reconciliation (TESTING.md recorded gaps)

## Summary

| Field         | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Intent        | Close the recorded coverage gaps in the audio engine and worker surfaces         |
| Key decisions | `test/synth/` holds a single file; `src/workers/` and `src/modals/` are untested |
| Open risks    | emulator tests must pin hardware-accurate output, not just line coverage         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`TESTING.md` records coverage gaps in `src/synth/` (one test file for the YM2149 emulator and SoundDriver), `src/workers/` (no Web Worker tests), and `src/modals/` (thin coverage beyond `FilePickerModal`). These are the project's most correctness-critical surfaces - register math, tick timing, and dialog contracts - yet they carry the thinnest automated evidence.

Add characterization and unit tests for the emulator's register writes, volume table, and noise LFSR, the sequencer worker's message protocol and position tracking, and the modal behaviors most likely to regress.

## Hints

- The 80% coverage thresholds in `vitest.config.ts` already pass; this work raises evidence quality, not the number.
- Pin YM2149 behavior against the documented formulas in `SPECIFICATION.md` before restructuring any test.

## Out of Scope

- Refactoring the emulator or worker - characterization tests land first, structure stays.
