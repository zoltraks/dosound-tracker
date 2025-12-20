# DOSOUND Tracker v1.2.4 - Refactoring Proposal

## Executive Summary

This proposal outlines a focused refactoring plan for DOSOUND Tracker v1.2.4, targeting code quality improvements while maintaining critical audio performance requirements (20ms/40ms cycle timing). The proposal focuses on removing unused/duplicated code, simplifying complex components, and improving maintainability within a single sprint.

**Primary Goals:**
1. Remove duplicate `parseBaseKey` functions and consolidate parsing logic
2. Simplify large components (TrackPanel, PianoKeyboard)
3. Reduce complexity in hooks (useInstrumentActions)
4. Improve type safety and maintainability
5. Complete within a single sprint

## Current State Analysis

### Critical Constraints
- **Performance**: Real-time audio requiring stable 20ms/40ms cycle timing
- **Sound Chip**: YM2149 emulation only (no modifications)
- **Architecture**: React-based UI with Web Audio API
- **Structure**: Flat file structure to be maintained

### Major Issues Identified

#### 1. Duplicate Base Key Parsing Functions (Priority: HIGH)
- **Files**: Multiple files import and use `parseBaseKey` functions
- **Problem**: `parseBaseKeyForExport` in `src/exports/core.ts` duplicates functionality from `src/utils/songFormat.ts`
- **Impact**: Code duplication, inconsistent parsing behavior, maintenance overhead

#### 2. Large Components (Priority: MEDIUM)
- `TrackPanel.tsx` (585 lines) - Complex keyboard handling and audio preview logic
- `PianoKeyboard.tsx` (469 lines) - Complex keyboard and MIDI handling
- `EnvelopePanel.tsx` (needs verification)
- `ModalContainer.tsx` (needs verification)

#### 3. Complex Hooks (Priority: MEDIUM)
- `useInstrumentActions.ts` (379 lines) - Complex instrument management logic
- Multiple hooks with similar patterns suggesting potential duplication

#### 4. Code Duplication (Priority: MEDIUM)
- `parseBaseKey` vs `parseBaseKeyForExport` duplication
- Similar envelope timing logic across components
- Redundant helper functions in utils

#### 5. Type Safety (Priority: LOW)
- Missing explicit return types in some functions
- Areas needing improved TypeScript typing

## Refactoring Strategy

### Phase 1: Consolidate Base Key Parsing

**Objective**: Eliminate duplicate base key parsing functions and create a single source of truth.

#### Step 1.1: Unify Base Key Parsing

Remove `parseBaseKeyForExport` from `src/exports/core.ts` and use the existing `parseBaseKey` from `src/utils/songFormat.ts`:

```typescript
// Remove from src/exports/core.ts
export function parseBaseKeyForExport(rawBase?: string): { note: string; octave: number } {
  // ... duplicate implementation
}

// Replace all calls to parseBaseKeyForExport with parseBaseKey
```

**Impact**: Eliminates ~15 lines of duplicated code and creates single source of truth.

#### Step 1.2: Update Export System

Update all export files to use the unified parsing function:
- `src/exports/asm.ts` - Update `exportInstrumentToAssembly`
- `src/exports/core.ts` - Update `buildInstrumentPreviewSong`
- Ensure all imports point to `src/utils/songFormat.ts`

### Phase 2: Component Simplification

#### TrackPanel.tsx (585 → ~400 lines)
**Extractions**:
1. Create `src/utils/trackKeyboardHandling.ts`
   - Extract keyboard event handling logic
   - Move pattern/step manipulation utilities
2. Create custom hook `useTrackAudioPreview.ts`
   - Extract audio preview and envelope timing logic
   - Separate instrument management logic

#### PianoKeyboard.tsx (469 → ~300 lines)
**Extractions**:
1. Create `src/utils/pianoKeyboardHandling.ts`
   - Extract keyboard event handling
   - Move note playback management
2. Create custom hook `usePianoLayout.ts`
   - Separate layout and responsive logic
   - Extract key mapping utilities

### Phase 3: Hook Refactoring

#### useInstrumentActions.ts (379 → ~250 lines)
**Extractions**:
1. Create `src/utils/instrumentValidation.ts`
   - Extract instrument validation logic
   - Move instrument ID normalization
2. Create `src/utils/instrumentPlayback.ts`
   - Separate instrument playback utilities
   - Extract envelope timing logic
3. Create `src/utils/instrumentOperations.ts`
   - Move instrument management operations
   - Consolidate instrument CRUD logic

### Phase 4: Code Quality Improvements

#### 4.1: Remove Duplicate Functions

- Consolidate `parseBaseKeyForExport()` and `parseBaseKey()`
- Unify note/period conversion logic
- Remove redundant helper functions

#### 4.2: Improve Type Safety

- Add explicit return types to all exported functions
- Improve type definitions for complex data structures
- Add proper typing for internal helper functions
- Remove `any` types where possible

#### 4.3: Create Shared Utility Modules

1. `src/utils/audioCalculations.ts`
   - Frequency/period calculations
   - Pitch conversions
2. `src/utils/keyboardHandling.ts`
   - Keyboard event handling utilities
   - Key mapping functions
3. `src/utils/envelopeManagement.ts`
   - Envelope timing and playback logic
   - Sustain handling utilities

### Phase 5: Testing & Documentation

#### Testing Strategy

**1. Export System Testing**
- Test each format produces identical output (byte-for-byte comparison)
- Test with various song complexity levels
- Validate file format compliance
- Test download functionality with unified parsing

**2. Component Testing**
- Test UI functionality after refactoring
- Verify event handling works correctly
- Test keyboard navigation and shortcuts
- Validate visual consistency

**3. Audio Performance Testing** (CRITICAL)
- Measure playback timing before/after (must maintain 20ms/40ms)
- Test with simple and complex songs
- Verify sequencer functionality
- Test YM2149 emulation integrity

**4. Hook Testing**
- Test instrument actions after refactoring
- Verify state management works correctly
- Test edge cases and error conditions

**5. Regression Testing**
- Run existing test suite
- Test on multiple browsers
- Validate export file compatibility
- Check for TypeScript/ESLint errors

#### Documentation Updates

1. Update project documentation to reflect new structure
2. Add inline comments explaining organization
3. Document new patterns and conventions
4. Update README with refactoring notes
5. Add JSDoc comments to public APIs

## Risk Assessment

### Low Risk Changes
- Moving utility functions between files
- Consolidating duplicate parsing functions
- Extracting component sub-logic
- Adding explicit types
- Creating shared utility modules

### Medium Risk Changes
- Refactoring large components
- Modifying hook implementations
- Consolidating duplicate functions

### High Risk Changes (AVOIDED)
- ❌ YM2149 emulation modifications
- ❌ Core playback timing changes
- ❌ Sequencer logic alterations
- ❌ Web Worker modifications

### Mitigation Strategies

1. Incremental implementation (one component/hook at a time)
2. Preserve all function signatures
3. Automated testing after each change
4. Manual audio testing after component changes
5. Byte-for-byte export comparison
6. Performance measurement before/after

## Success Criteria

### Code Quality Metrics
✅ Eliminate `parseBaseKeyForExport` duplication
✅ Reduce largest components by 20-30%
✅ Extract useInstrumentActions.ts to ~250 lines (33% reduction)
✅ Zero new TypeScript or ESLint errors

### Maintainability Metrics
✅ Single source of truth for base key parsing
✅ Clear separation of concerns throughout codebase
✅ Improved IDE navigation and code discovery
✅ Comprehensive inline documentation

### Performance Metrics (CRITICAL)
✅ Maintain 20ms/40ms audio cycle timing (±0ms tolerance)
✅ No audio glitches introduced
✅ No performance regression in sequencer
✅ All export formats produce identical output

## Expected Benefits

1. **Improved Maintainability**: Each module has clear, focused responsibility
2. **Better Testability**: Isolated components and functions easier to test
3. **Reduced Complexity**: Large files broken into manageable pieces
4. **Enhanced Type Safety**: Explicit types throughout codebase
5. **Better Code Reuse**: Shared utilities eliminate duplication
6. **Improved Debugging**: Component-specific issues easier to isolate

## Safety Constraints

### What MUST NOT be Modified

1. **Audio Core**: YM2149 emulation and sound generation
2. **Playback Timing**: 20ms/40ms cycle requirements
3. **Sequencer Logic**: Core sequencing algorithms
4. **Export Output**: Byte-for-byte identical output required
5. **Web Workers**: Existing worker implementations

### Testing Requirements for Automated Verification

1. **Export Format Testing**: Byte-for-byte comparison of all export formats
2. **Audio Performance Testing**: Timing verification within ±0ms tolerance
3. **Component Rendering Testing**: Visual regression testing
4. **Keyboard Input Testing**: All keyboard shortcuts and inputs
5. **Type Safety Testing**: TypeScript compilation without errors