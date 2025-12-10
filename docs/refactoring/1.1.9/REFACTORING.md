# DOSOUND Tracker Refactoring Proposal - Version 1.1.9

## Overview

This document outlines the proposed refactoring changes for DOSOUND Tracker version 1.1.9. The focus is on extracting functionality to reduce source code file sizes while maintaining the existing functionality, particularly the sound generation procedures which are working properly and should not be modified.

## Current State Analysis

### Project Structure
- Current version: 1.1.8
- Primary language: TypeScript
- Architecture: React-based UI with Web Audio API for sound synthesis
- Sound chip: YM2149 emulation
- Performance requirements: 20ms or 40ms cycle times for playback and sequencer

### Large Files Identified
1. `src/utils/songParser.ts` - 575 lines
2. `src/utils/songIO.ts` - 462 lines
3. `src/modals/MidiModal.tsx` - 593 lines
4. `src/modals/TransposeModal.tsx` - 183 lines
5. `src/synth/SoundDriver.ts` - 314 lines

## Refactoring Goals

1. **Reduce file sizes** by extracting related functionality into separate modules
2. **Improve maintainability** through better separation of concerns
3. **Preserve performance** for playback and sequencer operations
4. **Maintain compatibility** with existing YAML formats and YM2149 functionality
5. **Focus on safe changes** that can be implemented in a single sprint

## Proposed Refactoring Changes

### 1. Extract YAML Parsing Utilities

**Current Issue**: `songParser.ts` contains both YAML parsing logic and utility functions like `parseBaseKey`, `formatBaseKey`, and `normalizeInstrumentColor` that are used throughout the codebase.

**Proposed Solution**:
- Create `src/utils/yamlUtils.ts` for YAML-specific parsing functions
- Create `src/utils/musicUtils.ts` for music-related utility functions
- Move color normalization to a dedicated `src/utils/colorUtils.ts`

**Expected Benefits**:
- Reduce `songParser.ts` by ~150 lines
- Improve reusability of utility functions
- Better separation of concerns

### 2. Split Song IO Operations

**Current Issue**: `songIO.ts` handles both song and instrument serialization/deserialization in a single large file.

**Proposed Solution**:
- Create `src/utils/instrumentIO.ts` for instrument-specific IO operations
- Keep song-related operations in `songIO.ts`
- Extract common YAML processing utilities to `yamlUtils.ts`

**Expected Benefits**:
- Reduce `songIO.ts` by ~200 lines
- Clearer separation between song and instrument operations
- Better maintainability

### 3. Modularize MIDI Modal Components

**Current Issue**: `MidiModal.tsx` is overly large at 593 lines, handling device selection, configuration, and monitoring.

**Proposed Solution**:
- Extract MIDI device selection into `MidiDeviceSelector.tsx`
- Create `MidiMonitorPanel.tsx` for monitoring functionality
- Move configuration export/import to separate utility functions

**Expected Benefits**:
- Reduce `MidiModal.tsx` by ~300 lines
- Improved component reusability
- Better separation of UI concerns

### 4. Extract Sound Driver Components

**Current Issue**: `SoundDriver.ts` contains event processing, optimization, and assembly export logic.

**Proposed Solution**:
- Create `src/synth/EventOptimizer.ts` for event optimization logic
- Extract assembly export to `src/synth/AssemblyExporter.ts`
- Keep core sound driver functionality in `SoundDriver.ts`

**Expected Benefits**:
- Reduce `SoundDriver.ts` by ~100 lines
- Better separation of export vs. playback concerns
- Improved testability

## Implementation Plan

### Phase 1: Utility Extraction (Days 1-3)
1. Create `yamlUtils.ts`, `musicUtils.ts`, and `colorUtils.ts`
2. Refactor `songParser.ts` to use new utilities
3. Update imports throughout the codebase

### Phase 2: IO Operations Split (Days 4-5)
1. Create `instrumentIO.ts`
2. Refactor `songIO.ts` to focus on song operations
3. Update all references to use appropriate IO modules

### Phase 3: MIDI Modal Refactoring (Days 6-8)
1. Extract `MidiDeviceSelector.tsx`
2. Create `MidiMonitorPanel.tsx`
3. Refactor `MidiModal.tsx` to use new components

### Phase 4: Sound Driver Modularization (Days 9-10)
1. Create `EventOptimizer.ts`
2. Extract `AssemblyExporter.ts`
3. Refactor `SoundDriver.ts`

## Performance Considerations

- **Playback Performance**: All refactoring will maintain the existing 20ms/40ms cycle requirements
- **Sequencer Timing**: Web Worker-based sequencer remains unchanged
- **YM2149 Emulation**: Sound generation code is untouched
- **Memory Usage**: Extracted modules may slightly increase bundle size but improve runtime performance through better code organization

## Risk Assessment

### Low Risk Changes
- Utility function extraction (yamlUtils, musicUtils, colorUtils)
- IO operations split (instrumentIO.ts)
- Event optimizer extraction

### Medium Risk Changes
- MIDI modal component splitting (requires careful state management)
- Assembly exporter extraction (must maintain exact output format)

### High Risk Changes (Avoided)
- Any modifications to YM2149 emulation code
- Changes to core playback timing logic
- Alterations to existing YAML file formats

## Testing Strategy

1. **Unit Testing**: Each extracted utility function will have dedicated tests
2. **Integration Testing**: Verify that refactored components work together correctly
3. **Regression Testing**: Ensure existing functionality remains unchanged
4. **Performance Testing**: Confirm 20ms/40ms cycle requirements are still met

## Success Criteria

1. All large files reduced in size by at least 30%
2. No breaking changes to existing functionality
3. Playback and sequencer performance maintained
4. Improved code organization and maintainability
5. Successful completion within single sprint timeline

## Future Considerations

1. Further modularization of UI components
2. Performance optimization of YAML processing
3. Enhanced error handling in IO operations
4. Additional utility function extraction as needed

This refactoring proposal focuses on the most impactful changes that can be safely implemented in a single sprint while preserving the core functionality that makes DOSOUND Tracker effective.