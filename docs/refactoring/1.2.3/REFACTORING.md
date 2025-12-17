# DOSOUND Tracker v1.2.3 - Comprehensive Refactoring Proposal

## Executive Summary

This synthesis combines the best elements from three independent refactoring analyses to create a comprehensive, achievable plan for improving DOSOUND Tracker's code quality while maintaining critical audio performance requirements (20ms/40ms cycle timing).

**Primary Goals:**
1. Modularize the monolithic export system
2. Reduce code duplication across the codebase
3. Simplify large components and complex hooks
4. Improve type safety and maintainability
5. Complete within a single 2-week sprint

## Current State Analysis

### Critical Constraints
- **Performance**: Real-time audio requiring stable 20ms/40ms cycle timing
- **Sound Chip**: YM2149 emulation only (no modifications)
- **Architecture**: React-based UI with Web Audio API
- **Structure**: Flat file structure to be maintained

### Major Issues Identified

#### 1. Monolithic Export System (Priority: CRITICAL)
- **File**: `src/exports/core.ts` (1615 lines)
- **Problem**: All export logic for 5 formats in one file
- **Impact**: Difficult to maintain, test, and debug

#### 2. Large Components (Priority: HIGH)
- `TrackPanel.tsx` (705 lines)
- `PianoKeyboard.tsx` (492 lines)
- `EnvelopePanel.tsx` (482 lines)
- `ModalContainer.tsx` (471 lines)

#### 3. Complex Hooks (Priority: MEDIUM)
- `useInstrumentActions.ts` (591 lines)
- 29 total hooks suggesting potential duplication

#### 4. Code Duplication (Priority: MEDIUM)
- Download functions duplicated across 5 export formats (~100 lines)
- `parseBaseKeyForExport()` vs `parseBaseKey()` duplication
- Similar helper patterns across modules

#### 5. Type Safety (Priority: LOW)
- Missing explicit return types in some functions
- Areas needing improved TypeScript typing

## Refactoring Strategy

### Phase 1: Export System Modularization

**Objective**: Break down `core.ts` from 1615 lines to ~200 lines by moving format-specific code to dedicated files.

#### Step 1.1: Create Shared Download Utility

Create `downloadFile` utility in `core.ts`:
```typescript
function downloadFile(
  content: string | Uint8Array,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

**Impact**: Eliminates ~100 lines of duplicated code across 5 formats.

#### Step 1.2: Move Assembly Functions to `asm.ts`

**Functions to move** (from Devstral's explicit list):
- `exportToAssembly()`
- `exportInstrumentToAssembly()`
- `exportSongRegisterDump()`
- `downloadAssemblyFile()` → refactor to use `downloadFile()`

**Helper functions to move**:
- `formatFramesToAssembly()`
- `combineDelayLines()`
- `periodToNoteAndPitch()`
- `toHex()`
- `formatAsmLine()`
- `formatDelayLine()`
- `getCoarseFine()`
- `getMixerForMode()`
- `getRegisterComment()`

**Expected result**: `asm.ts` grows to ~300 lines

#### Step 1.3: Move Binary Functions to `bin.ts`

**Functions to move**:
- `parseAssemblyToBinary()`
- `exportToBinary()`
- `downloadBinaryFile()` → refactor to use `downloadFile()`

**Expected result**: `bin.ts` grows to ~100 lines

#### Step 1.4: Move MAX Functions to `max.ts`

**Functions to move**:
- `exportSongToMax()`
- `exportInstrumentToMax()`
- `downloadMaxFile()` → refactor to use `downloadFile()`

**Helper functions to move**:
- `buildMaxShortChunk()`
- `buildMaxLongChunk()`
- `buildMaxInfoChunk()`
- `buildMaxStreamFromDumpBytes()`
- `optimizeReg7Delays()`

**Types to move**:
- `MaxExportResult`

**Expected result**: `max.ts` grows to ~400 lines

#### Step 1.5: Move VGM Functions to `vgm.ts`

**Functions to move**:
- `exportSongToVgm()`
- `exportInstrumentToVgm()`
- `downloadVgmFile()` → refactor to use `downloadFile()`

**Helper functions to move**:
- `optimizeVgmDelays()`
- `mergeVgmDelaySequence()`
- `encodeUtf16LeNullTerminated()`
- `buildGd3Tag()`

**Types to move**:
- `VgmExportResult`

**Expected result**: `vgm.ts` grows to ~500 lines

#### Step 1.6: Move WAV Functions to `wav.ts`

**Functions to move**:
- `exportSongToWav()`
- `exportInstrumentToWav()`
- `downloadWavFile()` → refactor to use `downloadFile()`

**Helper functions to move**:
- `encodePcm16Wav()`
- `synthTickSamples()`

**Types to move**:
- `WavExportResult`

**Expected result**: `wav.ts` grows to ~300 lines

#### Step 1.7: Retain in `core.ts`

**Shared utilities** (used by multiple formats):
- `normalizeSongForExport()`
- `parseBaseKeyForExport()`
- `formatNoteLabel()`
- `frequencyToPeriod()`
- `buildInstrumentPreviewSong()`
- `downloadFile()` (new shared utility)

**Expected result**: `core.ts` reduces to ~200 lines

### Phase 2: Component Simplification

#### TrackPanel.tsx (705 → ~400 lines)
**Extractions**:
1. Create `src/utils/trackRendering.ts`
   - Extract track note rendering logic
   - Move pattern/step manipulation utilities
2. Create custom hook `useTrackKeyboard.ts`
   - Extract keyboard event handling
3. Create `src/utils/instrumentSelection.ts`
   - Separate instrument management logic

#### PianoKeyboard.tsx (492 → ~300 lines)
**Extractions**:
1. Create `src/constants/keyboardLayout.ts`
   - Extract keyboard configuration
   - Move key mapping constants
2. Create `src/utils/audioPreview.ts`
   - Separate audio preview logic
3. Create `src/utils/notePlayback.ts`
   - Extract note/playback management

#### EnvelopePanel.tsx (482 → ~300 lines)
**Extractions**:
1. Create `src/utils/envelopeTypes.ts`
   - Extract envelope type-specific logic
2. Create `src/utils/valueFormatting.ts`
   - Separate value formatting utilities
3. Create custom hook `useEnvelopeNavigation.ts`
   - Move keyboard navigation logic
4. Create `src/utils/barRendering.ts`
   - Extract bar rendering logic

#### ModalContainer.tsx (471 → ~300 lines)
**Extractions**:
1. Create `src/constants/modalConfig.ts`
   - Extract modal configuration
2. Create custom hook `useModalState.ts`
   - Separate modal state management
3. Create `src/utils/modalRendering.ts`
   - Create modal rendering utilities

### Phase 3: Hook Refactoring

#### useInstrumentActions.ts (591 → ~350 lines)
**Extractions**:
1. Create `src/utils/instrumentValidation.ts`
   - Extract instrument validation logic
2. Create `src/utils/instrumentPlayback.ts`
   - Separate instrument playback utilities
3. Create `src/utils/instrumentOperations.ts`
   - Move instrument management operations

#### Hook Consolidation
**Analysis needed**:
- Review 29 hooks for duplication patterns
- Identify opportunities for shared custom hooks
- Extract common patterns to utility functions

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
2. `src/utils/fileOperations.ts`
   - File download utilities (wraps `downloadFile`)
   - File parsing utilities
3. `src/utils/formatHelpers.ts`
   - Text formatting functions
   - Data formatting utilities
4. `src/utils/validationUtils.ts`
   - Input validation
   - Data sanitization

### Phase 5: Testing & Documentation

#### Testing Strategy

**1. Export System Testing**
- Test each format produces identical output (byte-for-byte comparison)
- Test with various song complexity levels
- Validate file format compliance
- Test download functionality with new shared utility

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
- Creating shared download utility
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
1. Incremental implementation (one format/component at a time)
2. Preserve all function signatures
3. Automated testing after each change
4. Manual audio testing after component changes
5. Byte-for-byte export comparison
6. Performance measurement before/after

## Success Criteria

### Code Quality Metrics
✅ Reduce `core.ts` from 1615 lines to ~200 lines (87% reduction)
✅ Eliminate ~100 lines of download function duplication
✅ Reduce largest components by 30-40%
✅ Extract useInstrumentActions.ts to ~350 lines (40% reduction)
✅ Zero new TypeScript or ESLint errors

### Maintainability Metrics
✅ Each export format in self-contained file
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
6. **Improved Debugging**: Format-specific issues easier to isolate
