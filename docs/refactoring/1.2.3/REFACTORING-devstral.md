# DOSOUND Tracker Refactoring Proposal - Version 1.2.3

## Overview

This document outlines the refactoring proposal for DOSOUND Tracker version 1.2.3, focusing on code quality improvements, removal of unused/duplicated code, and better organization of the export system while maintaining audio performance and stability.

## Current State Analysis

### Codebase Structure
- The project follows a modular structure with clear separation of concerns
- Export functionality is centralized in `src/exports/core.ts` with format-specific files in `src/exports/`
- The codebase has grown organically with some duplication and unused code
- Audio performance is critical and must not be compromised

### Key Issues Identified

1. **Export System Complexity**: The `core.ts` file contains 1615 lines with mixed responsibilities
2. **Duplicate Code**: Several helper functions are duplicated or could be better organized
3. **Unused Functions**: Some functions may not be used or could be consolidated
4. **Type Safety**: Some areas could benefit from improved TypeScript typing
5. **Code Organization**: Export-related functions could be better distributed

## Proposed Refactoring Plan

### 1. Export System Refactoring

#### Current Structure Issues
- `src/exports/core.ts` is overly large (1615 lines)
- Format-specific files (`asm.ts`, `bin.ts`, etc.) only re-export from core
- Mixed responsibilities: assembly formatting, binary parsing, MAX/VGM/WAV export logic

#### Proposed Changes

**Move format-specific functions to dedicated files:**
- Move assembly-related functions to `src/exports/asm.ts`:
  - `exportToAssembly()`
  - `exportInstrumentToAssembly()`
  - `exportSongRegisterDump()`
  - `downloadAssemblyFile()`
  - Helper functions: `formatFramesToAssembly()`, `formatAsmLine()`, `formatDelayLine()`, etc.

- Move binary-related functions to `src/exports/bin.ts`:
  - `parseAssemblyToBinary()`
  - `exportToBinary()`
  - `downloadBinaryFile()`

- Move MAX-related functions to `src/exports/max.ts`:
  - `exportSongToMax()`
  - `exportInstrumentToMax()`
  - `downloadMaxFile()`
  - Helper functions: `buildMaxShortChunk()`, `buildMaxLongChunk()`, etc.

- Move VGM-related functions to `src/exports/vgm.ts`:
  - `exportSongToVgm()`
  - `exportInstrumentToVgm()`
  - `downloadVgmFile()`
  - Helper functions: `optimizeVgmDelays()`, `mergeVgmDelaySequence()`, etc.

- Move WAV-related functions to `src/exports/wav.ts`:
  - `exportSongToWav()`
  - `exportInstrumentToWav()`
  - `downloadWavFile()`
  - Helper functions: `encodePcm16Wav()`, `synthTickSamples()`, etc.

**Shared utilities to remain in core.ts:**
- `normalizeSongForExport()`
- `parseBaseKeyForExport()`
- `formatNoteLabel()`
- `frequencyToPeriod()`
- `buildInstrumentPreviewSong()`
- Common helper functions used across multiple formats

### 2. Code Duplication Removal

**Identified duplicates:**
- `parseBaseKeyForExport()` in `core.ts` vs `parseBaseKey()` in `utils/pianoUtils.ts`
- Similar note/period conversion logic in multiple places
- Redundant helper functions that could be consolidated

**Proposed actions:**
- Consolidate duplicate parsing functions
- Create shared utilities for common operations
- Remove unused helper functions

### 3. Unused Code Removal

**Functions to audit for usage:**
- Internal helper functions in `core.ts` that may not be used externally
- Redundant type definitions
- Unused import statements

**Proposed actions:**
- Remove truly unused functions
- Document internal-only functions
- Clean up import statements

### 4. Type Safety Improvements

**Areas for improvement:**
- Add explicit return types to all exported functions
- Improve type definitions for complex data structures
- Add proper typing for internal helper functions

### 5. Performance Considerations

**Critical requirements:**
- Maintain 20ms/40ms cycle performance for playback and sequencer
- No changes to audio processing logic
- Preserve existing timing behavior
- Keep React component structure unchanged

**Safe refactoring approach:**
- Only move functions between files, don't change their logic
- Preserve all existing function signatures
- Maintain identical import/export patterns
- Test audio performance after each change

## Implementation Plan

### Phase 1: Export System Restructuring
1. **Create new format-specific files** with moved functions
2. **Update core.ts** to remove moved functions and keep only shared utilities
3. **Update imports** throughout the codebase to use new locations
4. **Test all export formats** to ensure they work identically

### Phase 2: Code Cleanup
1. **Remove duplicate functions** and consolidate logic
2. **Clean up unused code** and imports
3. **Improve type safety** with explicit types
4. **Add documentation** for internal functions

### Phase 3: Testing and Validation
1. **Verify all export formats** produce identical output
2. **Test audio performance** remains unchanged
3. **Validate TypeScript compilation** with no new errors
4. **Run ESLint** to ensure code quality

## Expected Benefits

1. **Improved Maintainability**: Smaller, focused files are easier to understand and modify
2. **Better Organization**: Clear separation of concerns by export format
3. **Reduced Duplication**: Consolidated helper functions
4. **Enhanced Type Safety**: Better TypeScript typing throughout
5. **Easier Testing**: Format-specific logic can be tested in isolation

## Risk Assessment

**Low Risk:**
- Function movement without logic changes
- Removal of truly unused code
- Type safety improvements
- Code organization changes

**Medium Risk:**
- Consolidation of duplicate functions (requires careful testing)
- Import/export pattern changes (requires comprehensive testing)

**High Risk:**
- Any changes to audio processing logic (NOT included in this proposal)
- Modifications to playback/sequencer timing (NOT included in this proposal)

## Success Criteria

1. All export formats produce identical output before and after refactoring
2. Audio performance remains at 20ms/40ms cycle timing
3. No new TypeScript or ESLint errors introduced
4. All existing tests continue to pass
5. Codebase is better organized and more maintainable

## Implementation Timeline

This refactoring is designed to fit within a single sprint, with the following estimated breakdown:

- **Export System Restructuring**: 3-4 days
- **Code Cleanup and Type Safety**: 2-3 days  
- **Testing and Validation**: 2-3 days
- **Buffer for unexpected issues**: 1-2 days

Total: ~10 days (within typical 2-week sprint)

## Files to be Modified

### Primary Changes:
- `src/exports/core.ts` - Significant reduction in size
- `src/exports/asm.ts` - Expanded with assembly-specific functions
- `src/exports/bin.ts` - Expanded with binary-specific functions  
- `src/exports/max.ts` - Expanded with MAX-specific functions
- `src/exports/vgm.ts` - Expanded with VGM-specific functions
- `src/exports/wav.ts` - Expanded with WAV-specific functions

### Secondary Changes:
- Update import statements in files that use export functions
- Remove duplicate functions from utility files
- Clean up unused imports and code

## Files NOT to be Modified

- Audio processing files (`synth/`, `workers/sequencerWorker.ts`)
- React components and hooks (except for import updates)
- Core playback and sequencer logic
- Sound generation procedures

## Verification Strategy

1. **Automated Testing**: Run existing test suite
2. **Manual Testing**: Verify all export formats work correctly
3. **Performance Testing**: Measure audio timing before/after
4. **Regression Testing**: Compare export outputs byte-for-byte
5. **Code Review**: Ensure no logic changes were introduced

## Rollback Plan

If any issues are discovered:
1. Revert changes using git
2. Identify root cause
3. Fix issue in isolation
4. Re-apply changes incrementally
5. Test thoroughly at each step

## Documentation Updates

After successful implementation:
1. Update project documentation to reflect new structure
2. Add comments explaining the organization
3. Document any new patterns or conventions
4. Update README if necessary

## Future Considerations

This refactoring sets the foundation for:
1. Easier addition of new export formats
2. Better unit testing of export functionality
3. Improved maintainability for future developers
4. Potential performance optimizations in isolated components