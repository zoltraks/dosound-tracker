# DOSOUND Tracker Refactoring Proposal - Version 1.2.0

## Overview

This document outlines the proposed refactoring changes for DOSOUND Tracker version 1.2.0. The focus is on extracting functionality to reduce source code file sizes while maintaining the existing functionality, particularly the sound generation procedures which are working properly and should not be modified.

## Current State Analysis

### Project Structure
- Current version: 1.2.0
- Primary language: TypeScript
- Architecture: React-based UI with Web Audio API for sound synthesis
- Sound chip: YM2149 emulation
- Performance requirements: 20ms or 40ms cycle times for playback and sequencer

### Large Files Identified
1. `src/App.tsx` - 2939 lines (main application component)
2. `src/utils/assemblyExport.ts` - 2495 lines (assembly export functionality)
3. `src/hooks/useDataManagement.ts` - 982 lines (data management hook)
4. `src/components/PianoKeyboard.tsx` - 623 lines (piano keyboard component)
5. `src/components/PlaylistPanel.tsx` - 577 lines (playlist panel component)
6. `src/components/TrackPanel.tsx` - 730 lines (track panel component)
7. `src/hooks/useMidi.ts` - 981 lines (MIDI handling hook)

## Refactoring Goals

1. **Reduce file sizes** by extracting related functionality into separate modules
2. **Improve maintainability** through better separation of concerns
3. **Preserve performance** for playback and sequencer operations
4. **Maintain compatibility** with existing YAML formats and YM2149 functionality
5. **Focus on safe changes** that can be implemented in a single sprint

## Proposed Refactoring Changes

### 1. Extract Assembly Export Components

**Current Issue**: `assemblyExport.ts` is extremely large at 2495 lines, containing multiple export formats (assembly, binary, VGM, WAV, MAX).

**Proposed Solution**:
- Create `src/exports/asm.ts` for assembly-specific export
- Create `src/exports/bin.ts` for BIN export functionality
- Create `src/exports/vgm.ts` for VGM export functionality
- Create `src/exports/wav.ts` for WAV export functionality
- Create `src/exports/max.ts` for MAX format export

**Expected Benefits**:
- Reduce `assemblyExport.ts` by ~1800 lines
- Better separation of export format concerns
- Improved testability of individual export formats
- Easier to maintain and extend export functionality

### 2. Modularize App Component

**Current Issue**: `App.tsx` is overly large at 2939 lines, handling state management, playback logic, UI rendering, and numerous event handlers.

**Proposed Solution**:
- Extract playback-related logic into `src/hooks/usePlayback.ts`
- Extract MIDI-related state and handlers into `src/hooks/useMidiState.ts`
- Extract modal management into `src/hooks/useModalState.ts`
- Extract file operations into `src/hooks/useFileOperations.ts`
- Move keyboard shortcut handling to separate `src/hooks/useKeyboardShortcuts.ts`

**Expected Benefits**:
- Reduce `App.tsx` by ~1200 lines
- Better separation of concerns between UI and logic
- Improved component reusability
- Easier to test individual functionality

### 3. Split Data Management Hook

**Current Issue**: `useDataManagement.ts` is large at 982 lines, handling song, instrument, and pattern management.

**Proposed Solution**:
- Create `src/hooks/useSongManagement.ts` for song-specific operations
- Create `src/hooks/useInstrumentManagement.ts` for instrument operations
- Create `src/hooks/usePatternManagement.ts` for pattern operations
- Create `src/hooks/useStorage.ts` for localStorage persistence
- Keep core data management in refactored `useDataManagement.ts`

**Expected Benefits**:
- Reduce `useDataManagement.ts` by ~500 lines
- Clearer separation between different data types
- Better maintainability of storage operations
- Improved testability

### 4. Extract Piano Keyboard Components

**Current Issue**: `PianoKeyboard.tsx` is large at 623 lines, containing keyboard rendering, note playback, and envelope management.

**Proposed Solution**:
- Create `src/components/PianoKey.tsx` for individual key rendering
- Create `src/hooks/usePianoPlayback.ts` for note playback logic
- Create `src/utils/pianoUtils.ts` for piano-related utilities
- Extract envelope timing logic to `src/hooks/useEnvelopeTiming.ts`

**Expected Benefits**:
- Reduce `PianoKeyboard.tsx` by ~300 lines
- Better separation of rendering vs. playback logic
- Reusable piano key component
- Improved maintainability of envelope timing

### 5. Split Playlist Panel Components

**Current Issue**: `PlaylistPanel.tsx` is large at 577 lines, handling playlist rendering, editing, and navigation.

**Proposed Solution**:
- Create `src/components/PlaylistLine.tsx` for individual line rendering
- Create `src/components/PlaylistHeader.tsx` for header rendering
- Create `src/hooks/usePlaylistNavigation.ts` for navigation logic
- Create `src/utils/playlistUtils.ts` for playlist utilities

**Expected Benefits**:
- Reduce `PlaylistPanel.tsx` by ~250 lines
- Better separation of rendering concerns
- Reusable playlist components
- Improved navigation logic maintainability

## Implementation Plan

### Phase 1: Export Functionality Refactoring (Days 1-3)
1. Create new export module structure
2. Move assembly export functionality to dedicated files
3. Extract VGM, WAV, and MAX export formats
4. Create shared utilities and YM helpers
5. Update imports throughout the codebase

### Phase 2: App Component Modularization (Days 4-6)
1. Extract playback logic to `usePlayback.ts`
2. Create MIDI state management hook
3. Extract modal management functionality
4. Refactor file operations handling
5. Update App.tsx to use new hooks

### Phase 3: Data Management Split (Days 7-8)
1. Create song management hook
2. Extract instrument management
3. Create pattern management hook
4. Extract storage operations
5. Refactor main data management hook

### Phase 4: UI Component Refactoring (Days 9-10)
1. Extract piano keyboard components
2. Split playlist panel components
3. Create reusable UI elements
4. Update parent components to use new structure

## Performance Considerations

- **Playback Performance**: All refactoring will maintain the existing 20ms/40ms cycle requirements
- **Sequencer Timing**: Web Worker-based sequencer remains unchanged
- **YM2149 Emulation**: Sound generation code is untouched
- **Memory Usage**: Extracted modules may slightly increase bundle size but improve runtime performance through better code organization

## Risk Assessment

### Low Risk Changes
- Export functionality extraction (assembly, VGM, WAV, MAX)
- UI component splitting (piano keys, playlist lines)
- Utility function extraction
- Storage operations separation

### Medium Risk Changes
- App component modularization (requires careful state management)
- Data management hook splitting (must maintain data consistency)
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
5. **Export Format Testing**: Verify all export formats produce identical output

## Success Criteria

1. All large files reduced in size by at least 40%
2. No breaking changes to existing functionality
3. Playback and sequencer performance maintained
4. Improved code organization and maintainability
5. Successful completion within single sprint timeline
6. All export formats produce identical output to current implementation

## Future Considerations

1. Further modularization of remaining large components
2. Performance optimization of export processing
3. Enhanced error handling in IO operations
4. Additional utility function extraction as needed
5. Potential Web Worker integration for heavy export operations

This refactoring proposal focuses on the most impactful changes that can be safely implemented in a single sprint while preserving the core functionality that makes DOSOUND Tracker effective. The changes prioritize maintainability improvements without risking the critical audio performance requirements.
