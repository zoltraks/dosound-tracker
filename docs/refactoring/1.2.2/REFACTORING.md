# DOSOUND Tracker Refactoring Proposal - Version 1.2.2

## Overview

This document outlines the proposed refactoring changes for DOSOUND Tracker version 1.2.2. The focus is on extracting functionality to reduce source code file sizes while maintaining the existing functionality, particularly the sound generation procedures which are working properly and should not be modified.

## Current State Analysis

### Project Structure
- Current version: 1.2.2
- Primary language: TypeScript
- Architecture: React-based UI with Web Audio API for sound synthesis
- Sound chip: YM2149 emulation
- Performance requirements: 20ms or 40ms cycle times for playback and sequencer

### Large Files Identified

1. `src/App.tsx` - 3008 lines (main application component)
2. `src/exports/core.ts` - 2495 lines (export functionality)
3. `src/hooks/useMidi.ts` - 981 lines (MIDI handling hook)
4. `src/hooks/useTrackOperations.ts` - 889 lines (track operations hook)

### Code Quality Observations

- **App.tsx**: Contains extensive playback logic, state management, and UI rendering mixed together
- **core.ts**: Contains multiple export functions with significant duplication in playback simulation logic
- **useMidi.ts**: Handles MIDI input/output, device management, and monitoring in a single large hook
- **useTrackOperations.ts**: Contains complex track manipulation logic that could be better organized

## Refactoring Goals

1. **Reduce file sizes** by extracting related functionality into separate modules
2. **Improve maintainability** through better separation of concerns
3. **Preserve performance** for playback and sequencer operations (20ms/40ms cycle requirements)
4. **Maintain compatibility** with existing YAML formats and YM2149 functionality
5. **Focus on safe changes** that can be implemented in a single sprint
6. **Avoid breaking** sound generation procedures which are working properly

## Proposed Refactoring Changes

### 1. Extract Playback Simulation Logic from core.ts

**Current Issue**: `core.ts` contains 2495 lines with significant duplication in playback simulation logic across different export functions (`exportToAssembly`, `exportSongRegisterDump`, `exportSongToVgm`, `exportSongToWav`).

**Proposed Solution**:
- Create `src/exports/playbackSimulation.ts` to contain shared playback simulation logic
- Extract common functions like `applyInstrumentToRegisters` and playback state management
- Create reusable playback simulation engine that can be used by all export formats
- Keep export format-specific code in their respective files

**Expected Benefits**:
- Reduce `core.ts` by ~1200 lines
- Eliminate code duplication across export functions
- Improve maintainability of export functionality
- Make it easier to add new export formats in the future

### 2. Modularize MIDI Handling Hook

**Current Issue**: `useMidi.ts` is large at 981 lines, handling MIDI input/output, device management, monitoring, and message processing.

**Proposed Solution**:
- Create `src/hooks/useMidiDeviceManagement.ts` for device enumeration and selection
- Create `src/hooks/useMidiMessageProcessing.ts` for MIDI message handling and parsing
- Create `src/utils/midiUtils.ts` for utility functions like `formatTime`, `resolveDeviceName`
- Keep core MIDI functionality in refactored `useMidi.ts`

**Expected Benefits**:
- Reduce `useMidi.ts` by ~400 lines
- Clearer separation between device management and message handling
- Better maintainability of monitoring operations
- Improved testability of MIDI components

### 3. Extract Track Operation Utilities

**Current Issue**: `useTrackOperations.ts` is large at 889 lines, containing complex track manipulation logic mixed with clipboard operations.

**Proposed Solution**:
- Create `src/utils/trackClipboard.ts` for clipboard-specific operations (copy/paste logic)
- Create `src/utils/transposeUtils.ts` for transpose-related calculations
- Create `src/utils/patternUtils.ts` for pattern manipulation utilities
- Keep core track operations logic in refactored `useTrackOperations.ts`

**Expected Benefits**:
- Reduce `useTrackOperations.ts` by ~300 lines
- Better separation of clipboard vs. track manipulation logic
- Reusable utility functions for other parts of the codebase
- Improved testability of complex operations

### 4. Extract App Component Playback Logic

**Current Issue**: `App.tsx` contains 3008 lines with extensive playback logic mixed with UI state management.

**Proposed Solution**:
- Create `src/hooks/usePlaybackSimulation.ts` for core playback simulation logic
- Create `src/hooks/useSequencerIntegration.ts` for sequencer callback handling
- Create `src/utils/playbackUtils.ts` for playback-related utility functions
- Keep UI and state management in refactored `App.tsx`

**Expected Benefits**:
- Reduce `App.tsx` by ~800 lines
- Better separation between UI and playback logic
- Improved maintainability of complex playback state
- Easier to test playback functionality independently

## Implementation Plan

### Phase 1: Extract Playback Simulation Logic (High Priority)
1. Create `src/exports/playbackSimulation.ts` with shared playback simulation engine
2. Extract `applyInstrumentToRegisters` and related functions
3. Refactor export functions to use the new simulation engine
4. Update imports and ensure all exports still work correctly

### Phase 2: Modularize MIDI Handling (Medium Priority)
1. Create `src/hooks/useMidiDeviceManagement.ts` for device handling
2. Create `src/hooks/useMidiMessageProcessing.ts` for message processing
3. Create `src/utils/midiUtils.ts` for utility functions
4. Refactor main MIDI hook to use new components

### Phase 3: Extract Track Operation Utilities (Medium Priority)
1. Create `src/utils/trackClipboard.ts` for clipboard operations
2. Create `src/utils/transposeUtils.ts` for transpose logic
3. Create `src/utils/patternUtils.ts` for pattern utilities
4. Refactor track operations hook to use new utilities

### Phase 4: Extract App Component Playback Logic (Lower Priority - if time permits)
1. Create `src/hooks/usePlaybackSimulation.ts` for playback logic
2. Create `src/hooks/useSequencerIntegration.ts` for sequencer handling
3. Create `src/utils/playbackUtils.ts` for utilities
4. Refactor App.tsx to use new hooks

## Performance Considerations

- **Playback Performance**: All refactoring will maintain the existing 20ms/40ms cycle requirements
- **Sequencer Timing**: Web Worker-based sequencer remains unchanged
- **YM2149 Emulation**: Sound generation code is untouched
- **Memory Usage**: Extracted modules may slightly increase bundle size but improve runtime performance through better code organization

## Risk Assessment

### Low Risk Changes
- Utility function extraction (MIDI utils, track utils)
- Playback simulation engine extraction (focused on export functionality)
- Storage operations separation

### Medium Risk Changes
- MIDI hook splitting (must maintain device connectivity)
- Track operations refactoring (complex clipboard logic)
- Playback logic extraction from exports (must preserve timing accuracy)

### High Risk Changes (Avoided)
- Any modifications to YM2149 emulation code
- Changes to core playback timing logic in App.tsx
- Alterations to existing YAML file formats
- Modifications to sound generation procedures

## Testing Strategy

1. **Unit Testing**: Each extracted utility function will have dedicated tests
2. **Integration Testing**: Verify that refactored components work together correctly
3. **Regression Testing**: Ensure existing functionality remains unchanged
4. **Performance Testing**: Confirm 20ms/40ms cycle requirements are still met
5. **Export Testing**: Verify all export formats produce identical output to current implementation
6. **MIDI Testing**: Verify MIDI input/output functionality works identically

## Success Criteria

1. All large files reduced in size by at least 30%
2. No breaking changes to existing functionality
3. Playback and sequencer performance maintained
4. Improved code organization and maintainability
5. Successful completion within single sprint timeline
6. All export formats produce identical output to current implementation
7. All MIDI functionality produces identical output to current implementation

## Future Considerations

1. Further modularization of remaining large components
2. Performance optimization of export processing
3. Enhanced error handling in IO operations
4. Additional utility function extraction as needed
5. Potential Web Worker integration for heavy export operations

## Estimated Impact

| File | Current Size | Expected Reduction | Target Size |
|------|--------------|---------------------|-------------|
| App.tsx | 3008 lines | ~800 lines | ~2200 lines |
| core.ts | 2495 lines | ~1200 lines | ~1295 lines |
| useMidi.ts | 981 lines | ~400 lines | ~581 lines |
| useTrackOperations.ts | 889 lines | ~300 lines | ~589 lines |

This refactoring proposal focuses on the most impactful changes that can be safely implemented in a single sprint while preserving the core functionality that makes DOSOUND Tracker effective. The changes prioritize maintainability improvements without risking the critical audio performance requirements.