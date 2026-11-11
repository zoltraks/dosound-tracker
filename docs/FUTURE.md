# DOSOUND Tracker - Future Development

This document tracks potential future enhancements. Items here are not committed work - they are candidates for future change requests.

## Implemented Features

The following items were previously listed as future work and have since been implemented:

- **MIDI device integration**: MIDI input and output with device selection, channel mapping, program change, and per-instrument MIDI configuration.
- **Configurable replay rate**: 50 Hz and 60 Hz frame rate toggle in the Song information panel, wired into audio playback and all export formats.
- **Configurable chip clock**: 2 MHz and 1 MHz chip clock toggle in the Song information panel, wired into audio playback and all export formats.
- **MAX export with ZX0 compression**: spec-compliant MAX format export with all 14 YM2149 registers, REG7 differential streams, and ZX0 compression.
- **VGM export**: Video Game Music standard format with loop point support and chip clock metadata.
- **WAV export**: 44.1 kHz 16-bit PCM rendering with software YM2149 simulation.
- **Transposition tools**: pattern-wide, track-specific, and instrument-scoped transposition with semitone offset and quick octave buttons.
- **Song optimization and pattern renumbering**: OPTIMIZE and RENUMBER commands.
- **Track copy/paste with mode selection**: Replace, Overwrite All, Overwrite Empty paste modes.
- **Per-instrument color assignment**: color picker with localStorage persistence.
- **Channel muting via EQ panel**: real-time volume display and click-to-mute.
- **Real-time register dump panel**: TA, TB, TC, VA, VB, VC, MX, NS with click-to-copy.
- **Dark and light theme**: toggle persisted to localStorage.
- **Demo song**: built-in demo loadable via DEMO button.
- **Built-in manual and changelog viewer**: in-app access to MANUAL.md and CHANGELOG.md.

## Candidates

- **`useExportOperations` hook extraction**: the export handlers still live inside `useFileOperations.ts` even after the shared scope/summary/error helpers moved to `utils/export/exportSummary.ts`. A dedicated export hook is the natural next decomposition step - noted in `docs/refactoring/1.5.3/ASSESSMENT.md` as a follow-up candidate.
