# DOSOUND Tracker

## Quick Overview

**DOSOUND Tracker** is a music application designed for retro computing enthusiasts and chiptune developers.

It functions as a complete three-track music tracker that leverages the unique audio capabilities of the Yamaha YM2149 Programmable Sound Generator (PSG).

The application's core feature is its ability to export music data directly into the assembly format compatible with the DOSOUND function of the XBIOS subsystem on the Atari ST's TOS operating system.

Supports composition across three independent audio channels (Tracks A, B, and C).

Utilizes a standard tracker **playlist** to define the sequence of single-track patterns for the entire song arrangement.

Designed for retro computing enthusiasts, chiptune composers, and anyone who appreciates the raw, unfiltered sound of retro synthesis.

For more information take a look at manual for composers and assembly wizards:

- [MANUAL.md](public/MANUAL.md)

## Makers & Takers 

Made by **Zoltar X / New Generation** using **Windsurf** and **GPT 5.1**.

### Musical Workflow

- **Real-time audio playback** with sub-millisecond timing
- **Keyboard input support** with piano keyboard mapping
- **Copy/paste functionality** for pattern sharing
- **Transposition tools** with scope targeting
- **Song optimization** and pattern renumbering
- **YAML file format** for human-readable song storage

### Tracker Architecture

- **Three independent audio channels** with simultaneous playback
- **Pattern-based composition** with 64-step pattern length
- **Playlist arrangement system** for song structure
- **256 instrument slots** with full parameter control
- **Real-time sequencer** with pattern loop and position tracking

### Instrument Editor

- **Mode Control**: Pure tone, pure noise, or mixed tone+noise generation
- **Volume Envelope**: 32-step amplitude control (ADSR-like shaping)
- **Arpeggio Engine**: Real-time pitch shifting in semitone increments (-24 to +24)
- **Pitch Modulation**: Direct frequency deviation for vibrato and fine-tuning
- **Noise Generation**: Dynamic noise period control (0-31 range)
- **Sustain Points**: Realistic note release behavior with configurable sustain

### Timing and Sequencing

- **50Hz VBLANK timing** matching original ATARI ST DOSOUND behavior
- **Envelope progression** every 40ms (every 2 ticks)
- **Pattern-based playback** with seamless loop detection

### YM2149 Emulation

- **Bit-perfect register simulation** of all 16 YM2149 registers
- **Proper AY/YM logarithmic volume curves** (16 levels, ~-2dB per step)
- **Accurate noise generation** using 17-bit LFSR algorithm
- **2MHz clock precision** with proper frequency calculations
- **Square wave synthesis** with period-accurate tone generation

### Modern Web Implementation

- **React + TypeScript** architecture for type safety
- **Web Audio API** for low-latency synthesis
- **Vite build system** for fast development
- **Electron wrapper** for cross-platform desktop deployment
- **Responsive design** for mobile devices

## Cross-Platform Compatibility

- **Web Browsers**: Chrome, Firefox, Safari, Edge (Web Audio API required)
- **Desktop**: Windows, macOS, Linux via Electron
- **Mobile**: Supported via responsive web interface
- **Atari ST**: Exported assembly runs natively on TOS/DOSOUND

### Multiple Export Features

- **DOSOUND Assembly**: Native Atari ST format with optimization
- **WAV Audio Export**: 44.1kHz 16-bit stereo rendering
- **Register Dump**: Raw YM2149 register state sequences
- **Instrument-only Export**: Individual instrument definitions

## Technical details

### Technology Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **Audio**: Web Audio API, custom YM2149 emulator
- **Build**: Electron 28, Electron Builder 24
- **Testing**: Vitest, jsdom
- **Linting**: ESLint 9 with TypeScript support

### **Implementation Details**

- **2MHz YM2149 clock** with precise frequency calculations
- **Logarithmic volume mapping** matching AY/YM chip characteristics
- **Real-time envelope processing** at 25Hz update rate
- **Pattern-based sequencing** with 64-step resolution
- **Optimized export pipeline** for minimal assembly output

### Development Environment

- **Node.js**: v22.18.0
- **npm**: 11.7.0

### Export Features

- **Register change tracking**: Only outputs changed registers
- **Automatic delay insertion**: Maintains proper timing resolution
- **Volume-based optimization**: Removes unnecessary data when channels are silent
- **Pattern boundary markers**: Clear section separation with comments

## Assembly Format Compatibility

DOSOUND Tracker generates **100% compatible assembly code** for the original Atari ST DOSOUND XBIOS function:

```assembly
music:

    ; === LINE 00 ===

    ; --- PART 00 ---

    dc.b $7,$1c       ; MX T+T+N
    dc.b $1,$1,$0,$aa ; TA D-4
    dc.b $8,$C        ; VA
    dc.b $9,$0        ; VB
    dc.b $A,$0        ; VC
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$2        ; VA
    dc.b $ff,1        ; DL 2

    ; --- PART 01 ---

    dc.b $1,$1,$0,$1c ; TA A-4
    dc.b $8,$C        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,3        ; DL 4

    ; --- PART 02 ---

    dc.b $1,$0,$0,$d5 ; TA D-5
    dc.b $8,$E        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$A        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$6        ; VA
    dc.b $ff,3        ; DL 4

    ; --- PART 03 ---

    dc.b $1,$1,$0,$aa ; TA D-4
    dc.b $8,$C        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,3        ; DL 4

    ; --- PART 04 ---

    dc.b $1,$1,$0,$1c ; TA A-4
    dc.b $8,$C        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$8        ; VA
    dc.b $ff,1        ; DL 2
    dc.b $8,$4        ; VA
    dc.b $ff,3        ; DL 4

    ; === END OF SONG ===

    dc.b $8,$0        ; VA
    dc.b $9,$0        ; VB
    dc.b $A,$0        ; VC

    dc.b $ff,0
```

## Development Guidelines

### Architecture Guidelines

For guidelines on refactoring processes and architectural decisions, see:

- [ARCHITECT.md](docs/ARCHITECT.md)

### Data Format Documentation

For a detailed technical specification of all save and export formats (song/instrument YAML, clipboard formats, assembly, binary, VGM, and WAV), see:

- [FORMAT.md](docs/FORMAT.md)

---

*Built with dedication to authentic retro computing and the timeless appeal of 8-bit chiptune music. Every envelope, every register write, every frequency calculation aims to capture the pure essence of what made the YM2149 chip a cornerstone of computer music history.*

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
