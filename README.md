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

## Downloads

- **Electron desktop builds** can be downloaded from the project home page: https://dosound.alyx.pl
- **macOS note**: binaries are not code-signed. After downloading the `.dmg`, macOS may mark it as coming from an unidentified developer.

If that happens, open **Terminal** in the folder where you downloaded the file and run:

```bash
xattr -dr com.apple.quarantine dosound-tracker-1.2.0-mac-arm64.dmg
```

Adjust the file name if you downloaded a different version.

After this, open the `.dmg` and install as usual.

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

- **Configurable replay rate** (50 Hz / 60 Hz) matching original ATARI ST DOSOUND behavior or NTSC systems
- **Configurable chip clock** (2 MHz / 1 MHz) for YM2149 or AY-3-8910 frequency ranges
- **Envelope progression** every 2 ticks (40 ms at 50 Hz, 33.33 ms at 60 Hz)
- **Pattern-based playback** with seamless loop detection

### YM2149 Emulation

- **Bit-perfect register simulation** of all 16 YM2149 registers
- **Proper AY/YM logarithmic volume curves** (16 levels, ~-2dB per step)
- **Accurate noise generation** using 17-bit LFSR algorithm
- **Configurable clock precision** (2 MHz or 1 MHz) with proper frequency calculations
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
- **Binary Export**: Raw DOSOUND command stream for direct memory loading
- **WAV Audio Export**: 44.1kHz 16-bit PCM rendering with software YM2149 simulation
- **VGM Export**: Video Game Music standard format with loop point support
- **MAX Export**: MAX specification v1.6 with ZX0 compression
- **Register Dump**: Raw YM2149 register state sequences
- **Instrument-only Export**: Individual instrument definitions

## Technical details

### Technology Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **State**: Zustand
- **Audio**: Web Audio API, custom YM2149 emulator
- **Build**: Electron 28, Electron Builder 24
- **Testing**: Vitest, jsdom, Playwright
- **Linting**: ESLint 9 with TypeScript support
- **Formatting**: Prettier

### **Implementation Details**

- **Configurable YM2149 chip clock** (2 MHz or 1 MHz) with precise frequency calculations
- **Configurable replay rate** (50 Hz or 60 Hz) for PAL and NTSC compatibility
- **Logarithmic volume mapping** matching AY/YM chip characteristics
- **Real-time envelope processing** at half the frame rate (25 Hz at 50 Hz, 30 Hz at 60 Hz)
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

## Documentation

This project follows an Agentic Software Engineering (ASE) documentation structure. All documentation lives under `docs/`.

The primary entry point for development rules is [GUIDELINES.md](docs/GUIDELINES.md). Read it first, then read every file listed in its Sources of Truth section before making any change.

**Core Guidelines**

| File                                | Purpose                                                          |
| ----------------------------------- | ---------------------------------------------------------------- |
| [GUIDELINES.md](docs/GUIDELINES.md) | Central source of truth for development rules and audio-critical principles |
| [PROJECT.md](docs/PROJECT.md)       | Project description, scope, requirements, use cases, and quality targets |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, module boundaries, state domains, and patterns |
| [SPECIFICATION.md](docs/SPECIFICATION.md) | Project-specific implementation details, stack, schemas, and constants |
| [COPYRIGHTS.md](docs/COPYRIGHTS.md) | Copyright and licensing rules                                    |
| [WORKFLOW.md](docs/WORKFLOW.md)     | Day-to-day development workflow                                  |
| [REFACTORING.md](docs/REFACTORING.md) | Refactoring proposal and assessment process                      |
| [TESTING.md](docs/TESTING.md)       | Testing strategy, test types, fixtures, and CI                   |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment targets and hosting                                   |
| [VERSIONING.md](docs/VERSIONING.md) | Version numbering scheme, bumping rules, and CHANGELOG format    |
| [FORMAT.md](docs/FORMAT.md)         | Project file format specification for song and instrument files  |
| [MAX.md](docs/MAX.md)               | MAX audio file format specification                              |
| [FUTURE.md](docs/FUTURE.md)         | Candidate future enhancements (not committed work)              |

**Engineering Standards**

| File                                                  | Purpose                                              |
| ----------------------------------------------------- | ---------------------------------------------------- |
| [standard/ts-react-development.md](docs/standard/ts-react-development.md) | TypeScript and React engineering standard |

**Document Templates**

| File                                                          | Purpose                                    |
| ------------------------------------------------------------- | ------------------------------------------ |
| [template/change-request-template.md](docs/template/change-request-template.md) | Template for change request documents |
| [template/implementation-plan-template.md](docs/template/implementation-plan-template.md) | Template for implementation plan documents |

**ASE Directory Structure**

| Directory                     | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `docs/change/<version>/`      | Change request descriptions: features, bug fixes, enhancements |
| `docs/plan/<version>/`        | Implementation plans created from change requests              |
| `docs/refactoring/<version>/` | Refactoring proposals and assessments after implementation     |
| `docs/archive/`               | Historical documents                                           |
| `docs/feature/`               | Feature proposals (historical, not part of active workflow)    |
| `docs/prompt/`                | Historical AI prompt logs (historical, not part of active workflow) |
| `docs/report/`                | Generated analysis reports                                     |
| `docs/media/`                 | Images and media files for documentation                       |

See [GUIDELINES.md](docs/GUIDELINES.md) for the complete rule set, including the new feature implementation workflow, audio-critical development principles, and sources of truth.

---

*Built with dedication to authentic retro computing and the timeless appeal of 8-bit chiptune music. Every envelope, every register write, every frequency calculation aims to capture the pure essence of what made the YM2149 chip a cornerstone of computer music history.*

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
