# DOSOUND Tracker v1.2.3 Refactoring Proposal

## Overview

This refactoring proposal addresses code quality issues in DOSOUND Tracker while maintaining the critical 20ms/40ms audio timing requirements for YM2149 playback and sequencer functionality. The focus is on eliminating code duplication, reducing complexity, and improving maintainability within a single sprint timeline.

## Current State Analysis

### Critical Constraints
- Real-time audio application requiring stable 20ms/40ms cycle timing
- YM2149 sound chip support only
- Flat file structure that should be maintained
- Existing export file organization that should be preserved
- No breaking changes to core audio functionality

### Major Issues Identified

#### 1. Export System Monolith (Priority: Critical)
**File**: `src/exports/core.ts` (1615 lines)

**Problem**: Single file contains all export functionality for multiple formats:
- Assembly export functions
- Binary export functions  
- MAX format export functions
- VGM format export functions
- WAV format export functions
- Common utilities and helpers

**Current Structure**:
```
src/exports/
├── core.ts (1615 lines - contains everything)
├── asm.ts (6 lines - just re-exports from core)
├── bin.ts (5 lines - just re-exports from core)
├── max.ts (7 lines - just re-exports from core)
├── vgm.ts (7 lines - just re-exports from core)
└── wav.ts (7 lines - just re-exports from core)
```

**Impact**: 
- Violates Single Responsibility Principle
- Difficult to maintain and test individual formats
- Complex dependency relationships
- Hard to debug export issues

#### 2. Large Components (Priority: High)
Several components exceed reasonable size limits:

- `src/components/TrackPanel.tsx` (705 lines)
- `src/components/PianoKeyboard.tsx` (492 lines) 
- `src/components/EnvelopePanel.tsx` (482 lines)
- `src/components/ModalContainer.tsx` (471 lines)

**Impact**:
- Hard to understand and maintain
- Multiple responsibilities mixed together
- Difficult to test individual features
- Increased cognitive load for developers

#### 3. Complex Hooks (Priority: Medium)
- `src/hooks/useInstrumentActions.ts` (591 lines)
- 29 total hooks suggest potential duplication

**Impact**:
- Over-complex state management
- Potential code duplication across hooks
- Difficult to reuse logic

#### 4. Utility Function Distribution (Priority: Low)
- Some utility functions could be consolidated
- Similar patterns scattered across modules

## Refactoring Strategy

### Phase 1: Export System Modularization (Priority: Critical)

**Objective**: Break down the monolithic `core.ts` file using the existing export file structure.

**Approach**: Move format-specific functions from `core.ts` to dedicated format files while preserving the flat structure.

**Implementation Plan**:

1. **Assembly Format (`src/exports/asm.ts`)**
   - Move: `exportToAssembly`, `exportInstrumentToAssembly`
   - Move: Assembly-specific helper functions (`formatAsmLine`, `formatDelayLine`, `combineDelayLines`)
   - Move: Assembly-related utilities (`parseBaseKeyForExport`, `formatNoteLabel`, `getRegisterComment`)

2. **Binary Format (`src/exports/bin.ts`)**
   - Move: `exportToBinary`, `parseAssemblyToBinary`
   - Move: Binary-specific utilities

3. **MAX Format (`src/exports/max.ts`)**
   - Move: `exportSongToMax`, `exportInstrumentToMax`
   - Move: MAX-specific helpers (`buildMaxShortChunk`, `buildMaxLongChunk`, `buildMaxInfoChunk`, `buildMaxStreamFromDumpBytes`, `optimizeReg7Delays`)

4. **VGM Format (`src/exports/vgm.ts`)**
   - Move: `exportSongToVgm`, `exportInstrumentToVgm`
   - Move: VGM-specific helpers (`optimizeVgmDelays`, `mergeVgmDelaySequence`, `encodeUtf16LeNullTerminated`, `buildGd3Tag`, `buildInstrumentPreviewSong`)

5. **WAV Format (`src/exports/wav.ts`)**
   - Move: `exportSongToWav`, `exportInstrumentToWav`
   - Move: WAV-specific helpers (`encodePcm16Wav`, `synthTickSamples`)

6. **Core Utilities (`src/exports/core.ts` - Simplified)**
   - Keep: `normalizeSongForExport` (common utility)
   - Keep: `exportSongRegisterDump` (register dump utility)
   - Keep: Download functions (`downloadAssemblyFile`, `downloadBinaryFile`, etc.)
   - Remove: All format-specific functions moved to dedicated files

**Expected Result**:
```
src/exports/
├── core.ts (~200 lines - common utilities and orchestration)
├── asm.ts (~300 lines - assembly format functions)
├── bin.ts (~100 lines - binary format functions)
├── max.ts (~400 lines - MAX format functions)
├── vgm.ts (~500 lines - VGM format functions)
└── wav.ts (~300 lines - WAV format functions)
```

**Benefits**:
- Each format is self-contained and testable
- Clear separation of concerns
- Easier to debug format-specific issues
- Better IDE navigation and code discovery

### Phase 2: Component Simplification (Priority: High)

**Objective**: Reduce complexity in large components while preserving functionality.

**TrackPanel.tsx (705 lines → ~400 lines)**
- Extract track note rendering logic to separate utility
- Separate instrument management logic
- Extract keyboard event handling to custom hooks
- Move pattern/step manipulation to utility functions

**PianoKeyboard.tsx (492 lines → ~300 lines)**
- Extract keyboard layout configuration
- Separate audio preview logic
- Extract note/playback management
- Move key mapping utilities to separate module

**EnvelopePanel.tsx (482 lines → ~300 lines)**
- Extract envelope type-specific logic
- Separate value formatting utilities
- Move keyboard navigation to custom hooks
- Extract bar rendering logic

**ModalContainer.tsx (471 lines → ~300 lines)**
- Extract modal configuration to separate constants file
- Separate modal state management
- Create modal rendering utilities

### Phase 3: Hook Refactoring (Priority: Medium)

**useInstrumentActions.ts (591 lines → ~350 lines)**
- Extract instrument validation logic
- Separate instrument playback utilities
- Move instrument management operations to utility functions
- Extract common instrument operations

**Hook Consolidation Analysis**
- Review 29 hooks for potential duplication
- Identify opportunities for shared custom hooks
- Extract common patterns to utility functions

### Phase 4: Utility Consolidation (Priority: Low)

**Create Shared Utilities**:
- `src/utils/audioCalculations.ts` - Frequency/period calculations
- `src/utils/fileOperations.ts` - File download and parsing utilities  
- `src/utils/formatHelpers.ts` - Text and data formatting functions
- `src/utils/validationUtils.ts` - Input validation and sanitization

## Implementation Approach

### Safety Measures
1. **Incremental Implementation**: Move one export format at a time
2. **Preserve Interfaces**: Maintain existing function signatures
3. **Update Imports**: Ensure all imports are updated correctly
4. **Test Each Phase**: Verify functionality after each major change
5. **Audio Testing**: Test audio playback after each component change

### Code Organization Principles
1. **Single Responsibility**: Each file handles one concern
2. **Clear Dependencies**: Minimize cross-file dependencies
3. **Consistent Patterns**: Use similar patterns across similar functions
4. **Maintain Flat Structure**: Don't create deep directory hierarchies

### File Movement Strategy
1. **Copy Functions First**: Copy functions to new locations
2. **Update Imports**: Update all import statements
3. **Test Functionality**: Verify each moved function works
4. **Remove from Core**: Remove functions from core.ts after verification
5. **Update Exports**: Ensure public APIs remain unchanged

## Risk Assessment

### Low Risk Changes
- Moving utility functions between files
- Creating shared utility modules
- Extracting component sub-logic
- Consolidating validation functions

### Medium Risk Changes  
- Refactoring large components
- Modifying hook implementations
- Moving export format functions

### Mitigation Strategies
1. **Feature Branches**: Use git branches for each refactoring phase
2. **Automated Testing**: Run tests after each change
3. **Manual Audio Testing**: Test audio playback after changes
4. **Rollback Plan**: Maintain ability to revert changes quickly
5. **Incremental Progress**: Complete one format before starting next

## Success Criteria

### Code Quality Metrics
- Reduce `core.ts` from 1615 lines to under 300 lines
- Eliminate all format-specific code from core.ts
- Reduce largest components by at least 30%
- Achieve clear separation of concerns in export system

### Maintainability Metrics  
- Each export format in separate, self-contained file
- Clear dependency relationships between modules
- Improved IDE navigation and code discovery
- Easier debugging of format-specific issues

### Audio Performance Metrics
- Maintain 20ms/40ms audio cycle timing
- No audio glitches introduced
- No performance regression in sequencer
- Preserve all existing export functionality

## Implementation Plan

### Step 1: Export System Refactoring
1. Create backup of current export functionality
2. Move assembly functions from core.ts to asm.ts
3. Update all imports and exports
4. Test assembly export functionality
5. Move binary functions from core.ts to bin.ts
6. Update all imports and exports  
7. Test binary export functionality
8. Continue for MAX, VGM, and WAV formats
9. Verify all export formats work correctly
10. Clean up core.ts to contain only shared utilities

### Step 2: Component Refactoring
1. Identify extraction opportunities in TrackPanel.tsx
2. Extract track rendering utilities
3. Test track functionality
4. Apply similar pattern to PianoKeyboard.tsx
5. Apply similar pattern to EnvelopePanel.tsx
6. Apply similar pattern to ModalContainer.tsx
7. Test all affected components

### Step 3: Hook Refactoring  
1. Analyze useInstrumentActions.ts for extraction opportunities
2. Extract validation and utility functions
3. Create shared hooks where appropriate
4. Test instrument functionality
5. Review other hooks for consolidation opportunities

### Step 4: Utility Consolidation
1. Identify common utility patterns across codebase
2. Create shared utility modules
3. Update imports throughout codebase
4. Remove duplicate implementations
5. Test affected functionality

## Testing Strategy

### Export System Testing
1. Test each export format individually
2. Verify exported files are identical to original
3. Test with various song complexity levels
4. Validate file format compliance

### Component Testing  
1. Test UI functionality after component refactoring
2. Verify event handling works correctly
3. Test keyboard navigation and shortcuts
4. Validate visual consistency

### Audio Performance Testing
1. Test audio playback with simple songs
2. Test audio playback with complex songs  
3. Verify timing accuracy with measurement tools
4. Test sequencer functionality

### Regression Testing
1. Test all existing features work unchanged
2. Verify no performance degradation
3. Test on different browsers and devices
4. Validate export file compatibility
