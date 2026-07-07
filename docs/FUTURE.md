# DOSOUND Tracker - Future Development

This document tracks potential future enhancements. Items here are not committed work; they are candidates for future change requests.

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

## Audio Engine Enhancements

**Additional chip emulations**

The constants in `src/constants/song.ts` define supported chips as a single-element array containing only `YM`. Adding AY-3-8910 or other PSG variants would require extending the chip array, adding chip-specific register mappings, and updating the YM2149 emulator to handle variant differences (such as the AY-3-8910's different envelope timing).

**WebAssembly audio core**

Moving the YM2149 emulation and sequencer engine to WebAssembly could reduce CPU usage on lower-end devices and allow tighter timing. This would require a build pipeline for the WASM module and a bridge to the existing Web Audio API integration.

**AudioWorklet integration**

Replacing the current setTimeout-based sequencer with an AudioWorklet node would provide sample-accurate timing and eliminate main-thread jitter. This is a significant architectural change that would affect the sequencer worker, the sound driver, and all audio-critical hooks.

**Stereo output**

The YM2149 has three channels but the current mix is mono. Stereo panning per channel would require adding a pan control per track and using stereo gain nodes in the Web Audio API integration.

## User Interface Enhancements

**Undo and redo**

The application has no undo/redo history. All edits are immediate and irreversible without manual re-entry. Implementing this would require a command pattern or state snapshot mechanism in the Zustand store.

**App.tsx decomposition**

The main application component has grown to over 2000 lines and handles significant rendering and event-handling logic. Decomposing it into smaller orchestrator components and extracting logic into dedicated hooks would improve maintainability.

**Store splitting**

All application state lives in a single Zustand store. Splitting into domain stores (song, instrument, playback, UI) would tighten responsibilities and reduce re-render scope.

**Accessibility**

Screen reader support, high contrast mode beyond the current dark/light themes, and text size scaling would improve accessibility. The current keyboard navigation is already comprehensive but could be extended.

## Export Format Extensions

**Additional formats**

ProTracker MOD, Impulse Tracker IT, and MIDI export are potential additions. Each would require a new module in `src/exports/` and corresponding test fixtures.

**Enhanced assembly optimization**

The current optimized dump strategy merges consecutive delays. Further optimization could include custom register mappings, pattern data compression, and instrument sharing mechanisms to reduce output size.

## Testing and Quality

**Synth and export test coverage**

The YM2149 emulator (`src/synth/YM2149.ts`), sound driver (`src/synth/SoundDriver.ts`), and export modules have minimal automated test coverage. Core audio synthesis and file generation paths should be fully exercised by the test suite.

**End-to-end test suite**

The Playwright E2E test infrastructure is in place but the test coverage for critical user flows (first launch, note entry, playback, export, save/load) should be expanded.
