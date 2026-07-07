# Changes

## Version 1.2.8

Configurable replay rate and chip clock support across audio playback and all export formats, MAX export correctness fixes, and sequencer timing stability improvement.

- **Replay rate toggle**: added a toggle button to the Song information panel allowing the user to switch between 50 Hz and 60 Hz replay rates, persisted in the YAML song file format.
- **Chip clock toggle**: added a toggle button to the Song information panel allowing the user to switch between 2 MHz and 1 MHz YM2149 chip clock, persisted in the YAML song file format.
- **Audio playback**: wired the frame rate and chip clock fields into the sequencer worker tick interval, instrument preview envelope timers, and envelope progression cadence so that changing these values produces correct timing and pitch during playback.
- **VGM export**: recorded the song frame rate in the VGM header rate field and used the chip clock for period calculations, with correct wait command selection for 50 Hz and 60 Hz.
- **MAX export**: recorded the song frame rate and chip clock in the chip setup chunk and used the chip clock for period calculations.
- **WAV export**: derived samples per tick from the song frame rate and used the chip clock for frequency calculations in the software YM2149 simulation.
- **ASM export**: used the chip clock for period-to-note and note-to-period conversions in assembly comment generation.
- **MAX format correctness**: rewrote MAX export to capture all 14 YM2149 registers per frame, use correct REG7 single-byte frame delimiters, apply ZX0 compression with a 1024-byte ring-buffer window, and include the uncompressed stream size in the stream definition chunk.
- **Sequencer stability**: fixed a race condition where changing the frame rate during playback could silence the audio by causing the sequencer worker to restart and incorrectly set isPlaying to false in the main thread.
- **Documentation**: updated SPECIFICATION.md, ARCHITECTURE.md, FORMAT.md, MAX.md, and PROJECT.md to reflect configurable clock and frame rate support.
- **Documentation**: redesigned the TypeScript/React engineering standard to separate general guidelines from project-specific conventions and added assessment document content requirements to the refactoring process.

## Version 1.2.7

Unified documentation structure and ASE workflow with PET LAB project.

- **Documentation**: added README.md as agent entry point with read-all-guidelines rule.
- **Documentation**: rewrote GUIDELINES.md as full rules document with hard rules, sources of truth, implementation planning, change request workflow, and preserved audio-critical development principles.
- **Documentation**: renamed ARCHITECT.md to ARCHITECTURE.md and rewrote as full architecture document covering module boundaries, state domains, data flow, audio synthesis pipeline, and export pipeline.
- **Documentation**: added SPECIFICATION.md with technology stack, source directory structure, data models, YM2149 register mapping, sequencer timing, export formats, constants, and keyboard shortcuts.
- **Documentation**: added COPYRIGHTS.md with copyright and licensing rules.
- **Documentation**: added WORKFLOW.md with verification loop, standard implementation process, and version-based feature implementation cycle.
- **Documentation**: added TESTING.md with clean build definition, test types, coverage targets, and test data locations.
- **Documentation**: added VERSIONING.md with version numbering scheme, automated bump script documentation, and CHANGELOG conventions.
- **Documentation**: added DEPLOYMENT.md with build output, Electron distribution, static hosting, and Docker deployment.
- **Documentation**: added REFACTORING.md with refactoring process, project-specific constraints, and version-based refactoring cycle.
- **Documentation**: rewrote PROJECT.md as active requirements document with vision, goals, functional requirements, use cases, and preserved YM2149 and UI layout reference material.
- **Documentation**: added change request and implementation plan templates under docs/template/.
- **Documentation**: added TypeScript and React engineering standard under docs/standard/ with audio-critical override section.
- **Documentation**: updated root README.md with documentation section referencing all core files and ASE directory structure.
- **Documentation**: created CHANGELOG.md at repository root.
