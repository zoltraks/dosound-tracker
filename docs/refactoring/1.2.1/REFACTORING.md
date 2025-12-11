# DOSOUND Tracker Refactoring Proposal - Version 1.2.1

## Overview

This document outlines the proposed refactoring changes for DOSOUND Tracker version 1.2.1. The focus is on extracting functionality to reduce source code file sizes while maintaining the existing functionality, particularly the sound generation procedures which are working properly and should not be modified.

## Current State Analysis

### Project Structure
- Current version: 1.2.1
- Primary language: TypeScript
- Architecture: React-based UI with Web Audio API for sound synthesis
- Sound chip: YM2149 emulation
- Performance requirements: 20ms or 40ms cycle times for playback and sequencer

### Large Files Identified (from previous assessment)

1. `src/App.tsx` - 2939 lines (main application component)
2. `src/hooks/useMidi.ts` - 981 lines (MIDI handling hook)
3. `src/components/TrackPanel.tsx` - 730 lines (track panel component)

### Previous Refactoring Status

From the 1.2.0 assessment, the following areas remain incomplete:

1. **App Component Modularization** - NOT STARTED
2. **MIDI Handling Refactoring** - PARTIALLY COMPLETED
3. **Track Panel Refactoring** - NOT STARTED

## Refactoring Goals

1. **Reduce file sizes** by extracting related functionality into separate modules
2. **Improve maintainability** through better separation of concerns
3. **Preserve performance** for playback and sequencer operations
4. **Maintain compatibility** with existing YAML formats and YM2149 functionality
5. **Focus on safe changes** that can be implemented in a single sprint

## Proposed Refactoring Changes

### 1. Modularize App Component

**Current Issue**: `App.tsx` is overly large at 2939 lines, handling state management, playback logic, UI rendering, and numerous event handlers.

**Proposed Solution**:
- Extract playback-related logic into `src/hooks/usePlayback.ts`
- Extract MIDI-related state and handlers into `src/hooks/useMidiState.ts`
- Extract modal management into `src/hooks/useModalState.ts` (already exists but needs better integration)
- Extract file operations into `src/hooks/useFileOperations.ts` (already exists)
- Move keyboard shortcut handling to separate `src/hooks/useKeyboardShortcuts.ts` (already exists)

**Expected Benefits**:
- Reduce `App.tsx` by ~1200 lines
- Better separation of concerns between UI and logic
- Improved component reusability
- Easier to test individual functionality

### 2. Split MIDI Handling Hook

**Current Issue**: `useMidi.ts` is large at 981 lines, handling MIDI input/output, device management, and monitoring.

**Proposed Solution**:
- Create `src/hooks/useMidiDeviceManagement.ts` for device enumeration and selection
- Create `src/hooks/useMidiMonitoring.ts` for MIDI monitoring functionality
- Create `src/hooks/useMidiMessageHandling.ts` for MIDI message processing
- Keep core MIDI functionality in refactored `useMidi.ts`

**Expected Benefits**:
- Reduce `useMidi.ts` by ~500 lines
- Clearer separation between device management and message handling
- Better maintainability of monitoring operations
- Improved testability

### 3. Extract Track Panel Components

**Current Issue**: `TrackPanel.tsx` is large at 730 lines, containing track rendering, note playback, and envelope management.

**Proposed Solution**:
- Create `src/components/TrackLine.tsx` for individual line rendering
- Create `src/hooks/useTrackPlayback.ts` for note playback logic
- Create `src/utils/trackUtils.ts` for track-related utilities
- Extract envelope timing logic to `src/hooks/useEnvelopeTiming.ts`

**Expected Benefits**:
- Reduce `TrackPanel.tsx` by ~300 lines
- Better separation of rendering vs. playback logic
- Reusable track line component
- Improved maintainability of envelope timing

## Implementation Plan

### Phase 1: App Component Modularization (Days 1-3)
1. Extract playback logic to `usePlayback.ts`
2. Create MIDI state management hook
3. Extract modal management functionality
4. Refactor file operations handling
5. Update App.tsx to use new hooks

### Phase 2: MIDI Handling Split (Days 4-6)
1. Create device management hook
2. Extract monitoring functionality
3. Create message handling hook
4. Refactor main MIDI hook
5. Update imports throughout the codebase

### Phase 3: Track Panel Refactoring (Days 7-8)
1. Extract track line components
2. Create track playback hook
3. Extract utility functions
4. Create envelope timing hook
5. Update parent components to use new structure

## Performance Considerations

- **Playback Performance**: All refactoring will maintain the existing 20ms/40ms cycle requirements
- **Sequencer Timing**: Web Worker-based sequencer remains unchanged
- **YM2149 Emulation**: Sound generation code is untouched
- **Memory Usage**: Extracted modules may slightly increase bundle size but improve runtime performance through better code organization

## Risk Assessment

### Low Risk Changes
- UI component splitting (track lines)
- Utility function extraction
- Storage operations separation

### Medium Risk Changes
- App component modularization (requires careful state management)
- MIDI hook splitting (must maintain device connectivity)
- Playback logic extraction (must preserve timing accuracy)

### High Risk Changes (Avoided)
- Any modifications to YM2149 emulation code
- Changes to core playback timing logic
- Alterations to existing YAML file formats
- Modifications to sound generation procedures

## Testing Strategy

1. **Unit Testing**: Each extracted utility function will have dedicated tests
2. **Integration Testing**: Verify that refactored components work together correctly
3. **Regression Testing**: Ensure existing functionality remains unchanged
4. **Performance Testing**: Confirm 20ms/40ms cycle requirements are still met
5. **MIDI Testing**: Verify MIDI input/output functionality works identically

## Success Criteria

1. All large files reduced in size by at least 40%
2. No breaking changes to existing functionality
3. Playback and sequencer performance maintained
4. Improved code organization and maintainability
5. Successful completion within single sprint timeline
6. All MIDI functionality produces identical output to current implementation

## Future Considerations

1. Further modularization of remaining large components
2. Performance optimization of MIDI processing
3. Enhanced error handling in IO operations
4. Additional utility function extraction as needed
5. Potential Web Worker integration for heavy MIDI operations

This refactoring proposal focuses on the most impactful changes that can be safely implemented in a single sprint while preserving the core functionality that makes DOSOUND Tracker effective. The changes prioritize maintainability improvements without risking the critical audio performance requirements.