# DOSOUND Tracker Project Specification

## Vision

DOSOUND Tracker is a music creation tool for the AY/YM sound chip used in the Atari ST.

It functions as a complete three-track music tracker that leverages the unique audio capabilities of the Yamaha YM2149 Programmable Sound Generator (PSG).

The application's core feature is its ability to export music data directly into the assembly format compatible with the DOSOUND function of the XBIOS subsystem on the Atari ST's TOS operating system.

## Goals and Non-Goals

**Goals**

- Provide a complete three-track music tracker for the YM2149 PSG.
- Export music data as DOSOUND-compatible assembly code for the Atari ST.
- Support composition across three independent audio channels (Tracks A, B, and C).
- Provide a pattern-based playlist system for song arrangement.
- Offer 256 instrument slots with full parameter control.
- Emulate the YM2149 chip with bit-perfect register simulation.
- Support multiple export formats (assembly, binary, VGM, WAV, MAX).
- Provide real-time audio playback with sub-millisecond timing.
- Support MIDI input for live recording and instrument control.
- Deploy as both a web application and a cross-platform desktop application via Electron.

**Non-Goals**

- Multi-chip support (only YM2149, no support for other sound chips).
- Multi-track beyond three channels (hardware limitation of the YM2149).
- Modern audio synthesis techniques (the focus is authentic retro chip sound).
- Server-side processing (all synthesis happens client-side).

## Target Audience

- Retro computing enthusiasts.
- Chiptune composers.
- Anyone who appreciates the raw, unfiltered sound of retro synthesis.
- Atari ST demoscene developers needing DOSOUND-compatible music data.

## Glossary

| Term      | Definition                                                              |
| --------- | ----------------------------------------------------------------------- |
| YM2149    | Yamaha YM2149 Programmable Sound Generator (PSG) used in the Atari ST   |
| PSG       | Programmable Sound Generator                                            |
| DOSOUND   | XBIOS function on Atari ST TOS for playing music data                   |
| XBIOS     | Extended BIOS of the Atari ST operating system                          |
| VBLANK    | Vertical blanking interrupt, 50Hz on PAL Atari ST                       |
| Chiptune  | Music written for sound chips from old computers and consoles           |
| Pattern   | A 64-step sequence of notes for a single track                          |
| Playlist  | A sequence of pattern references defining the song arrangement          |
| Track     | One of three independent audio channels (A, B, C)                       |
| Instrument| A set of parameters defining the sound of a note                        |
| Envelope  | A sequence of volume or pitch values over time                          |
| LFSR      | Linear Feedback Shift Register, used for noise generation               |

## Functional Requirements

**F-01: Three-Track Composition**

The system must support composition across three independent audio channels (Tracks A, B, and C) with simultaneous playback.

**F-02: Pattern-Based Sequencing**

The system must use pattern-based composition with 64-step pattern length. Patterns are single-track sequences.

**F-03: Playlist Arrangement**

The system must provide a playlist system to define the sequence of single-track patterns for the entire song arrangement.

**F-04: Instrument Editor**

The system must provide 256 instrument slots with the following parameters:

- Mode control: pure tone, pure noise, or mixed tone and noise generation.
- Volume envelope: 32-step amplitude control (ADSR-like shaping).
- Arpeggio engine: real-time pitch shifting in semitone increments (-24 to +24).
- Pitch modulation: direct frequency deviation for vibrato and fine-tuning.
- Noise generation: dynamic noise period control (0-31 range).
- Sustain points: realistic note release behavior with configurable sustain.

**F-05: Real-Time Audio Playback**

The system must provide real-time audio playback with sub-millisecond timing using the Web Audio API.

**F-06: YM2149 Emulation**

The system must emulate the YM2149 chip with:

- Bit-perfect register simulation of all 16 registers.
- Proper AY/YM logarithmic volume curves (16 levels, approximately -2dB per step).
- Accurate noise generation using 17-bit LFSR algorithm.
- 2MHz clock precision with proper frequency calculations.
- Square wave synthesis with period-accurate tone generation.

**F-07: DOSOUND Assembly Export**

The system must export music data as DOSOUND-compatible assembly code with:

- Register change tracking (only output changed registers).
- Automatic delay insertion for proper timing resolution.
- Volume-based optimization (remove unnecessary data when channels are silent).
- Pattern boundary markers with comments.

**F-08: Multiple Export Formats**

The system must support the following export formats:

- DOSOUND assembly (native Atari ST format with optimization).
- WAV audio (44.1kHz 16-bit stereo rendering).
- Register dump (raw YM2149 register state sequences).
- Instrument-only export (individual instrument definitions).
- Binary export.
- VGM (Video Game Music) format.
- MAX (Music Audio eXchange) format.

**F-09: File I/O**

The system must support loading and saving complete songs or individual instrument definitions in YAML format.

**F-10: Keyboard Input**

The system must support keyboard input for:

- Piano keyboard mapping (Z=C, S=C#, X=D, etc.).
- Navigation between sections using TAB and Shift+TAB.
- Note entry, clearing (Space/Backspace), and note off (Ctrl+Space).
- Instrument selection (Ctrl+/-).

**F-11: MIDI Support**

The system must support MIDI input for live recording and instrument control, including device selection and velocity sensitivity.

**F-12: Theme Support**

The system must support both a night mode (dark, default) and a day mode (light) with a theme toggle in the top-right corner.

**F-13: Cross-Platform Deployment**

The system must deploy as:

- A web application supporting Chrome, Firefox, Safari, and Edge.
- A desktop application via Electron for Windows, macOS, and Linux.
- A responsive interface for mobile devices.

## Non-Functional Requirements

**N-01: Audio Performance**

Audio stability is the highest priority. React best practices are secondary to audio performance. The system must maintain consistent audio timing without glitches, pops, or stuttering.

**N-02: Timing Accuracy**

The system must use 50Hz VBLANK timing matching the original Atari ST DOSOUND behavior. Envelope progression must occur every 40ms (every 2 ticks).

**N-03: Export Fidelity**

Exported assembly code must be 100% compatible with the original Atari ST DOSOUND XBIOS function.

**N-04: Type Safety**

The codebase must use TypeScript strict mode with no `any` types.

**N-05: Code Quality**

The codebase must pass ESLint with zero errors and zero warnings, with documented exceptions for audio-critical linting warnings.

**N-06: Test Coverage**

The project targets 80% coverage for lines, functions, branches, and statements.

## Use Cases

**C-01: Compose a Song**

A user creates a new song, enters notes in the track panels using the piano keyboard or computer keyboard, creates instruments with custom envelopes, arranges patterns in the playlist, and plays back the song in real time.

**C-02: Export for Atari ST**

A user composes a song, selects the DOSOUND assembly export, configures optimization options, and downloads the generated assembly file ready to be included in custom Atari ST software.

**C-03: Edit an Instrument**

A user selects an instrument from the instrument list, edits the volume envelope, arpeggio, pitch modulation, and noise parameters, and previews the sound in real time using the on-screen piano keyboard.

**C-04: Save and Load**

A user saves the current song to a YAML file, closes the application, reopens it, and loads the song file to continue editing.

**C-05: MIDI Recording**

A user connects a MIDI keyboard, selects the device in the application, plays notes on the MIDI keyboard to enter them into the current track, and adjusts velocity sensitivity.

## Quality Targets

- Audio playback with zero glitches during normal operation.
- Export output byte-identical for the same input song.
- Application loads in under 2 seconds.
- Song file size under 100KB for typical compositions.
- Assembly export optimized for minimal memory usage on target hardware.

## YM2149 Implementation Reference

The emulation logic is split into two core areas under `src/synth/`.

**YM2149 Chip Emulation**

This module is responsible for the low-level register simulation.

- Implement functions to handle the 14 programmable YM2149 registers (R0 through R13).
- Ensure accurate calculation of tone frequencies, noise generation, and envelope shapes.

**DOSOUND Driver Logic**

The DOSOUND format uses a packed data structure to define musical events, relying on delays and data blocks rather than a simple note-on/note-off stream.

- The logic must correctly read and interpret the DOSOUND data format and translate these events into sequential register writes for the YM2149 emulator.
- The timing must be tied to the Atari ST's 50Hz VBLANK, as the original DOSOUND routine relied on this timing.

**Playback**

The playback procedure should behave exactly as the DOSOUND function from the XBIOS subsystem does. If, at a given moment, more than one instrument specifies a value for noise, only the last value should be taken into account. If the values do not change in a given cycle, the delay should be extended accordingly for optimization purposes.

**Export Optimization**

The DOSOUND format export must be efficient and optimized. When an instrument's volume is silenced (volume = 0), all remaining sequence data for that channel (noise, pitch changes, arpeggio) must be ignored and excluded from the exported data stream to minimize memory usage and processing overhead on the target Atari ST system.

## User Interface Reference

The UI must be simple, monospaced, and DOS-like. Avoid complex modern UI features where simple text and pseudo-graphic rendering is sufficient.

**Hexadecimal Display**

Use hexadecimal notation (0x prefix) for displaying all hardware-related values in the user interface, including position numbers, instrument IDs, pattern positions, and register values. This maintains consistency with the underlying Atari ST hardware and assembly format.

The note C sharp is written as "C#".

**Layout Requirements**

- The application screen should fit entirely within the browser tab so that using the scroll bar is not necessary.
- The application should support both a night mode (dark, default) and a day mode (light).
- In the top-right corner, there should be an icon to switch the theme.
- Place the application logo in the top-left corner.
- Keyboard support is required. The active section should be highlighted, and navigation between sections should use the TAB key clockwise or Shift+TAB in reverse.
- Individual blocks can be scrolled vertically (pattern positions, instrument list, playlist) and horizontally (envelope blocks).
- All three track blocks (A, B, and C) must scroll simultaneously with the position number block.
- The interface should keep the current element centered vertically during navigation.

**Interface Layout Diagram**

```
┌───┐┌───────────────────────────────────────────────┐┌─┬─┬─┬─┬─┬─┬─┬─┐┌───┐
│ ♪ ││ Title bar with title, theme selection, etc    ││0│1│2│3│4│5│6│7││ ☾ │
└───┘└───────────────────────────────────────────────┘└─┴─┴─┴─┴─┴─┴─┴─┘└───┘
┌──────────────────────────────────────────────────────────────────────────┐
│ Command (operations) button panel                                        │
└──────────────────────────────────────────────────────────────────────────┘
┌──┐┌─────────┐┌─────────┐┌─────────┐┌─────────────────┐┌──────────────────┐
│  ││ Track A ││ Track B ││ Track C ││ Tone/Noise mode ││ Song information │
│  ││         ││         ││         │└─────────────────┘└──────────────────┘
│00││         ││         ││         │┌─────────────────┐┌──────────────────┐
│01││         ││         ││         ││ Volume          ││ Song playlist    │
│..││         ││         ││         ││                 ││                  │
│..││         ││         ││         │└─────────────────┘└──────────────────┘
│..││         ││         ││         │┌─────────────────┐┌──────────────────┐
│..││         ││         ││         ││ Arpeggio        ││ Instrument list  │
│..││         ││         ││         ││                 ││                  │
│..││         ││         ││         │└─────────────────┘│                  │
│..││         ││         ││         │┌─────────────────┐│                  │
│..││         ││         ││         ││ Pitch           ││                  │
│..││         ││         ││         ││                 ││                  │
│..││         ││         ││         │└─────────────────┘└──────────────────┘
│..││         ││         ││         │┌─────────────────┐┌────────────┐┌────┐
│..││         ││         ││         ││ Noise           ││ Dump       ││ EQ │
│..││         ││         ││         ││                 ││            ││    │
└──┘└─────────┘└─────────┘└─────────┘└─────────────────┘└────────────┘└────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ On-screen piano keyboard                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

See `media/layout.png` for the full layout image.

**Navigation Block Order**

- Octave selection
- Theme mode (dark/light)
- Track A
- Track B
- Track C
- Tone/Noise
- Volume
- Arpeggio
- Pitch
- Noise
- Song information
- Song playlist
- Instrument list
- On-screen piano keyboard

Do not focus on Dump, EQ, logo, or title during navigation.

**Piano Keyboard Mapping**

| Keyboard key | Piano note | Relative octave |
| ------------ | ---------- | --------------- |
| Z            | C          | +0              |
| S            | C#         | +0              |
| X            | D          | +0              |
| D            | D#         | +0              |
| C            | E          | +0              |
| V            | F          | +0              |
| G            | F#         | +0              |
| B            | G          | +0              |
| H            | G#         | +0              |
| N            | A          | +0              |
| J            | A#         | +0              |
| M            | B          | +0              |
| ,            | C          | +1              |
| L            | C#         | +1              |
| .            | D          | +1              |
| ;            | D#         | +1              |
| /            | E          | +1              |
| Q            | C          | +1              |
| 2            | C#         | +1              |
| W            | D          | +1              |
| 3            | D#         | +1              |
| E            | E          | +1              |
| R            | F          | +1              |
| 5            | F#         | +1              |
| T            | G          | +1              |
| 6            | G#         | +1              |
| Y            | A          | +1              |
| 7            | A#         | +1              |
| U            | B          | +1              |
| I            | C          | +2              |
| 9            | C#         | +2              |
| O            | D          | +2              |
| 0            | D#         | +2              |
| P            | E          | +2              |
| [            | F          | +2              |
| +            | F#         | +2              |
| ]            | G          | +2              |

See `SPECIFICATION.md` for the complete keyboard shortcut and input binding reference.
