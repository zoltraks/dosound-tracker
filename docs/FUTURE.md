# DOSOUND Tracker - Future Development Guidelines

## Project Overview

DOSOUND Tracker is a music composition application that emulates the Yamaha YM2149 Programmable Sound Generator (PSG) from Atari ST computers. It allows users to create three-track chiptune music and export it to assembly format compatible with the original DOSOUND XBIOS function.

**Key Technologies:**
- React 19 + TypeScript frontend
- Web Audio API for sound synthesis
- Electron for desktop deployment
- Vite build system
- YAML for song data storage

## Architecture Overview

### Core Components

1. **Frontend (src/components/)**
   - React components for UI panels
   - TrackPanel: Individual track editors
   - EnvelopePanel: Instrument parameter editors
   - PianoKeyboard: On-screen keyboard input
   - CommandPanel: Operation buttons

2. **Audio Engine (src/synth/)**
   - YM2149: Core chip emulation
   - SequencerEngine: Pattern and playlist processing
   - SoundDriver: Event generation and export

3. **Data Management (src/utils/)**
   - songParser: YAML parsing/serialization
   - instrument.ts: Instrument utilities
   - assemblyExport: Assembly format generation

4. **State Management**
   - React hooks for local state
   - No global state management library
   - Props drilling for component communication

### File Organization

```
src/
├── components/         # React UI components
├── synth/             # Audio synthesis engine
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
├── modals/            # Modal dialog components
├── constants/         # Application constants
└── stores/           # Zustand state stores (minimal)
```

## Coding Standards

### Naming Conventions

**Files and Components:**
- React components: PascalCase (TrackPanel.tsx)
- Utilities: camelCase (songParser.ts)
- Constants: SCREAMING_SNAKE_CASE (YM_CLOCK)

**Variables and Functions:**
- camelCase: `calculateFrequency`, `trackData`
- Constants: `MAX_CHANNEL_VOLUME`, `YM_BASE_CLOCK`

**Types and Interfaces:**
- PascalCase: `Song`, `Pattern`, `Instrument`
- Descriptive names that match domain concepts

### Code Style

1. **TypeScript Usage**
   - Strict typing required
   - Interface-first design
   - No `any` types except for external libraries
   - Explicit return types for functions

2. **React Patterns**
   - Functional components with hooks
   - useCallback for event handlers
   - useMemo for expensive calculations
   - Component composition over inheritance

3. **Code Organization**
   - Single responsibility per file
   - Pure functions for business logic
   - Side effects isolated in hooks
   - Constants grouped in dedicated files

### Error Handling

1. **Data Validation**
   - Input validation in parsers
   - Graceful degradation for malformed data
   - User-friendly error messages

2. **Audio Context**
   - Handle browser audio restrictions
   - Fallback mechanisms for unsupported features
   - Cleanup in component unmount

## YM2149 Implementation Requirements

### Accurate Hardware Simulation

1. **Clock Accuracy**
   - 2MHz base clock (YM_CLOCK = 2000000)
   - Correct frequency calculations: f = clock / (16 * period)
   - Proper register mapping for all 16 registers

2. **Volume Processing**
   - AY/YM logarithmic volume table (16 levels)
   - ~-2dB per step attenuation
   - Proper mixing for multiple channels

3. **Noise Generation**
   - 17-bit LFSR algorithm
   - Period-accurate noise frequency
   - Proper bit manipulation for noise generation

4. **Timing Constraints**
   - 50Hz VBLANK timing (20ms per frame)
   - Envelope advancement every 2 ticks (40ms)
   - Even speed values only (2, 4, 6, ...)

### Register Processing

**Core Registers:**
- R0-R5: Tone periods (3 channels, fine/coarse)
- R6: Noise period
- R7: Mixer (enable/disable tone/noise per channel)
- R8-R10: Channel volumes
- R11-R13: Envelope shape (emulated via software)

**Register Mapping:**
```typescript
// Channel A
R0: tonePeriod & 0xFF           // Fine
R1: (tonePeriod >> 8) & 0x0F    // Coarse  
R8: volume & 0x0F               // Volume

// Channel B
R2: tonePeriod & 0xFF
R3: (tonePeriod >> 8) & 0x0F
R9: volume & 0x0F

// Channel C
R4: tonePeriod & 0xFF
R5: (tonePeriod >> 8) & 0x0F
R10: volume & 0x0F

// Shared
R6: noisePeriod & 0x1F          // Noise period
R7: mixerValue & 0x3F           // Mixer configuration
```

## Data Format Specifications

### Song File Structure (YAML)

```yaml
song:
  title: "Song Title"           # Optional string
  author: "Composer Name"       # Optional string  
  year: 2025                    # Optional integer
  speed: 6                      # Required: even values only (2,4,6,...)
  length: 64                    # Required: pattern length (4-256 rows)
  loop: 0                       # Optional: 0-based playlist index
  playlist: [...]               # Required: arrangement data
  pattern: [...]                # Required: pattern definitions
  instrument: [...]             # Required: instrument definitions
```

### Playlist Format

```yaml
playlist:
  - A: "01"  # Pattern ID for Track A
    B: "02"  # Pattern ID for Track B  
    C: "--"  # "--" means no pattern (sustain)
```

### Pattern Format

```yaml
pattern:
  - number: "01"         # Pattern identifier
    name: "Pattern 01"   # Optional name
    steps:               # Step data (64 rows max)
      - note: "C-3"      # Musical note
        instrument: "00" # Instrument number
        volume: 15       # Optional per-row volume (0-15)
      - space: 3         # 3 empty rows
      - off: true        # Note-off
```

### Instrument Format

```yaml
instrument:
  - name: "Bass"              # Optional name
    number: "00"              # Hex slot index
    base: "C-4"               # Base note for arpeggio calculations
    octave: 3                 # Base octave
    sustain: 8                # Optional sustain point (0-based)
    volume: [15,15,13,0]      # Volume envelope (32 steps)
    arpeggio: [0,0,12,12]     # Arpeggio semitone offsets
    pitch: [0,0,0,0]          # Pitch modulation (-128 to +128)
    noise: [0,0,0,0]          # Noise period (0-31)
    mode: [0,0,0,0]           # 0=tone, 1=noise, 2=tone+noise
```

### Assembly Export Format

```assembly
music:

    ; === LINE 00 ===
    dc.b $07,$38           ; MX T+T+T (mixer settings)
    dc.b $01,$02,$00,$34   ; TA C-4 (tone frequency)
    dc.b $08,$0F           ; VA 15 (volume)
    dc.b $FF,$01           ; DL 2 (delay 2 frames)
    
    ; === END ===
    dc.b $08,$00           ; VA 0 (silence)
    dc.b $09,$00           ; VB 0
    dc.b $0A,$00           ; VC 0
    dc.b $FF,$00           ; STOP
```

**Commands:**
- `dc.b $reg,$value`: Register write
- `dc.b $FF,$N`: Delay N frames at 50Hz
- `dc.b $FF,$0`: End marker

## User Interface Guidelines

### Design Principles

1. **DOS Aesthetic**
   - Monospaced fonts throughout
   - Dark theme (default) and light theme
   - Hexadecimal values for all hardware data
   - Keyboard-first navigation

2. **Layout Structure**
   - Fixed layout: no scrolling required
   - Grid-based panel arrangement
   - Consistent spacing and alignment
   - Responsive scaling for different displays

3. **Navigation**
   - TAB/Shift+TAB cycling through panels
   - Arrow keys for content navigation
   - Enter/Space for actions
   - Escape for cancellation

### Panel Layout

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
│02││         ││         ││         ││                 ││                  │
├──┤│         ││         ││         │└─────────────────┘└──────────────────┘
│0F││         ││         ││         │┌─────────────────┐┌────────────┐┌────┐
│10││         ││         ││         ││ Noise           ││ Dump       ││ EQ │
│11││         ││         ││         │└─────────────────┘│            ││    │
└──┘└─────────┘└─────────┘└─────────┘└─────────────────┘└────────────┘└────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ On-screen piano keyboard                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Keyboard Mappings

**Note Input:**
```
Z=C   S=C#  X=D   D=D#  C=E   V=F   G=F#  B=G
H=G#  N=A   J=A#  M=B   ,=C+1 L=C#+1 .=D+1 ;=D#+1 /=E+1
Q=C+1 2=C#+1 W=D+1 3=D#+1 E=E+1 R=F+1 5=F#+1 T=G+1
6=G#+1 Y=A+1 7=A#+1 U=B+1 I=C+2 9=C#+2 O=D+2 0=D#+2
P=E+2 [=F+2 +=F#+2 ]=G+2
```

**Function Keys:**
- Space/Backspace: Clear position
- Ctrl+Space: Note-off
- Ctrl+-/+: Previous/next instrument

## Performance Considerations

### Audio Performance

1. **Low Latency**
   - Use Web Audio API's high-precision timing
   - Minimize garbage collection during playback
   - Pre-allocate audio buffers
   - Use setTimeout/setInterval carefully

2. **Efficient Synthesis**
   - Reuse oscillator nodes
   - Update only changed parameters
   - Limit update rate to 50Hz maximum
   - Use gain nodes for volume control

3. **Memory Management**
   - Dispose of audio resources on cleanup
   - Avoid creating new objects in tight loops
   - Use object pooling for frequently created items
   - Clear timeouts and intervals on unmount

### UI Performance

1. **React Optimization**
   - useCallback for event handlers
   - useMemo for expensive calculations
   - Proper key props for list rendering
   - Avoid unnecessary re-renders

2. **Large Data Handling**
   - Virtual scrolling for long lists
   - Lazy loading for large songs
   - Efficient diffing algorithms
   - Debounced user input

## Export System Requirements

### Assembly Export Optimization

1. **Register Change Tracking**
   - Only write registers when values change
   - Track previous register state
   - Insert delays when no changes occur

2. **Volume-Based Optimization**
   - Skip channel data when volume = 0
   - Remove unnecessary register writes
   - Compress silence periods

3. **Pattern Boundary Markers**
   - Add comments at pattern transitions
   - Maintain clear section separation
   - Include line numbers in comments

### Binary Export

1. **Raw DOSOUND Format**
   - Direct byte stream extraction
   - Parse assembly output
   - Generate Uint8Array of commands

2. **VGM Export**
   - Proper VGM header construction
   - AY/YM register write commands
   - Correct timing calculations
   - Loop point support

3. **WAV Export**
   - 44.1kHz 16-bit PCM
   - Simulated YM2149 synthesis
   - Proper envelope processing
   - Stereo output support

## Testing Strategy

### Unit Testing

1. **Core Logic**
   - YM2149 register calculations
   - Frequency and period conversions
   - Envelope processing
   - Assembly export accuracy

2. **Data Parsing**
   - YAML song loading
   - Error handling for malformed data
   - Format validation
   - Round-trip consistency

3. **Audio Synthesis**
   - Sound generation accuracy
   - Volume and mixing calculations
   - Noise generation algorithms
   - Timing precision

### Integration Testing

1. **Full Song Workflow**
   - Load → Edit → Export cycle
   - Playback accuracy verification
   - Cross-platform compatibility
   - Performance under load

2. **Export Format Verification**
   - Assembly code validation
   - Binary format accuracy
   - VGM file compatibility
   - WAV rendering quality

## Build and Deployment

### Development Workflow

1. **Local Development**
   ```bash
   npm run dev          # Web development server
   npm run electron:dev # Electron development mode
   npm run lint         # Code quality checks
   npm run test         # Run test suite
   ```

2. **Production Build**
   ```bash
   npm run build        # Web build
   npm run electron:build # Desktop distribution
   ```

### Build Configuration

**Vite Setup:**
- Base path: `./` for relative paths
- React plugin enabled
- Stable asset naming (no content hashes)
- Worker bundling configuration

**Electron Configuration:**
- Main process: `electron/main.cjs`
- Preload script: `electron/preload.cjs`
- Cross-platform builds (Windows/macOS/Linux)
- Proper icons and metadata

## Error Handling and Logging

### User-Facing Errors

1. **File Operations**
   - Clear error messages for corrupt files
   - Graceful handling of missing files
   - Format conversion failures
   - Permission issues

2. **Audio Context**
   - Browser compatibility warnings
   - Permission request handling
   - Fallback mechanisms
   - Device availability checks

3. **Data Validation**
   - Schema validation errors
   - Range checking failures
   - Format incompatibility
   - Recovery suggestions

### Development Logging

1. **Debug Mode**
   - Register state logging
   - Timing information
   - Performance metrics
   - Audio context status

2. **Error Tracking**
   - Stack traces for unhandled errors
   - State snapshots for debugging
   - User action logging
   - System information capture

## Security Considerations

### Data Handling

1. **File Input**
   - Validate file types and sizes
   - Sanitize YAML content
   - Limit memory usage
   - Handle malicious files gracefully

2. **Browser Permissions**
   - Request audio permissions appropriately
   - Handle permission denial
   - Provide fallback options
   - Respect user privacy

3. **Cross-Origin Resources**
   - Use proper CORS configuration
   - Avoid external script injection
   - Secure file loading mechanisms
   - Content Security Policy compliance

## Maintenance Guidelines

### Code Quality

1. **Documentation**
   - JSDoc comments for public APIs
   - Inline comments for complex logic
   - README updates for new features
   - Changelog maintenance

2. **Refactoring**
   - Regular dependency updates
   - Performance profiling
   - Code complexity analysis
   - Dead code elimination

3. **Testing Coverage**
   - Maintain high test coverage
   - Add tests for new features
   - Regression testing protocols
   - Performance regression checks

### Version Management

1. **Semantic Versioning**
   - Major: Breaking changes
   - Minor: New features, backward compatible
   - Patch: Bug fixes, backward compatible

2. **Release Process**
   - Version bump automation
   - Change log generation
   - Automated testing
   - Manual verification steps

## Future Enhancement Areas

### Audio Engine Improvements

1. **Enhanced Synthesis**
   - Additional chip emulations (AY-3-8910)
   - Improved noise generation
   - More accurate hardware timing
   - Stereo output capabilities

2. **Performance Optimizations**
   - WebAssembly for critical audio code
   - AudioWorklet implementation
   - Buffer size optimizations
   - Memory usage improvements

### User Interface Enhancements

1. **Accessibility**
   - Screen reader support
   - Keyboard navigation improvements
   - High contrast mode
   - Text size scaling

2. **Modern Features**
   - Drag and drop file support
   - MIDI device integration
   - Real-time collaboration
   - Cloud storage integration

### Export Format Extensions

1. **Additional Formats**
   - ProTracker MOD support
   - Impulse Tracker IT support
   - MIDI export
   - Audio format conversions

2. **Enhanced Assembly**
   - Multiple optimization levels
   - Custom register mappings
   - Pattern data compression
   - Instrument sharing mechanisms

---

This document serves as a comprehensive guide for maintaining and extending the DOSOUND Tracker project while preserving its core functionality and retro computing heritage.