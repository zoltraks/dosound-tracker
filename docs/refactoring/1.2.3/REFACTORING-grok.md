# DOSOUND Tracker Refactoring Proposal - Version 1.2.3

## Overview

This document outlines the proposed refactoring changes for DOSOUND Tracker version 1.2.3. The focus is on reorganizing the export system to move functionality from the monolithic `core.ts` file to dedicated format-specific files, reducing code duplication, and identifying any unused code. Sound generation procedures are omitted as they are working properly and should not be modified.

## Current State Analysis

### Project Structure
- Current version: 1.2.3
- Primary language: TypeScript
- Architecture: React-based UI with Web Audio API for sound synthesis
- Sound chip: YM2149 emulation
- Performance requirements: 20ms or 40ms cycle times for playback and sequencer

### Export System Structure
The `src/exports/` directory contains format-specific files (`asm.ts`, `bin.ts`, `max.ts`, `vgm.ts`, `wav.ts`) that currently re-export functions from `core.ts`. The `core.ts` file is 1615 lines and contains all export logic, leading to a monolithic structure.

### Identified Issues
1. **Monolithic core.ts**: All export functions and helpers are in one file
2. **Code duplication**: Download functions across formats are nearly identical
3. **Unused code**: Minimal unused code identified; most functions are utilized
4. **Duplicated patterns**: Similar helper functions for different formats

## Refactoring Goals

1. **Modularize export system** by moving format-specific functions to dedicated files
2. **Reduce code duplication** through shared utilities
3. **Preserve performance** for playback and sequencer operations
4. **Maintain compatibility** with existing export formats
5. **Focus on safe changes** that can be implemented in a single sprint

## Proposed Refactoring Changes

### 1. Move Export Functions to Dedicated Files

**Current Issue**: `src/exports/core.ts` contains all export functions (1615 lines), with dedicated files only re-exporting.

**Proposed Solution**:
- Move assembly-related functions to `src/exports/asm.ts`
- Move binary-related functions to `src/exports/bin.ts`
- Move MAX-related functions to `src/exports/max.ts`
- Move VGM-related functions to `src/exports/vgm.ts`
- Move WAV-related functions to `src/exports/wav.ts`
- Keep shared utilities in `core.ts`

**Functions to move**:
- `asm.ts`: `exportToAssembly`, `exportInstrumentToAssembly`, `exportSongRegisterDump`, `downloadAssemblyFile`, and helpers (`formatFramesToAssembly`, `combineDelayLines`, `periodToNoteAndPitch`, `toHex`, `formatAsmLine`, `formatDelayLine`, `parseBaseKeyForExport`, `formatNoteLabel`, `frequencyToPeriod`, `getCoarseFine`, `getMixerForMode`, `getRegisterComment`)
- `bin.ts`: `parseAssemblyToBinary`, `exportToBinary`, `downloadBinaryFile`
- `max.ts`: `buildMaxShortChunk`, `buildMaxLongChunk`, `buildMaxInfoChunk`, `buildMaxStreamFromDumpBytes`, `optimizeReg7Delays`, `exportSongToMax`, `exportInstrumentToMax`, `downloadMaxFile`, `MaxExportResult`
- `vgm.ts`: `optimizeVgmDelays`, `mergeVgmDelaySequence`, `encodeUtf16LeNullTerminated`, `buildGd3Tag`, `exportSongToVgm`, `exportInstrumentToVgm`, `downloadVgmFile`, `VgmExportResult`
- `wav.ts`: `encodePcm16Wav`, `synthTickSamples`, `exportSongToWav`, `exportInstrumentToVav`, `downloadWavFile`, `WavExportResult`

**Expected Benefits**:
- Reduce `core.ts` by ~1400 lines
- Improve maintainability through format-specific modules
- Better separation of concerns

### 2. Extract Common Download Utility

**Current Issue**: Download functions (`downloadAssemblyFile`, `downloadBinaryFile`, etc.) are duplicated across formats with only MIME type differences.

**Proposed Solution**:
- Create `downloadFile` utility in `core.ts`
- Refactor all download functions to use the common utility

**Expected Benefits**:
- Eliminate ~100 lines of duplicated code
- Improve consistency and maintainability

### 3. Remove Unused Code

**Current Issue**: Analysis shows minimal unused code; most functions are utilized in tests and application logic.

**Proposed Solution**:
- No significant unused code identified for removal
- Ensure all moved functions maintain their usage

**Expected Benefits**:
- Maintain clean codebase without unnecessary deletions

## Implementation Plan

1. Create shared `downloadFile` utility in `core.ts`
2. Move assembly export functions and helpers to `asm.ts`
3. Move binary export functions to `bin.ts`
4. Move MAX export functions to `max.ts`
5. Move VGM export functions to `vgm.ts`
6. Move WAV export functions to `wav.ts`
7. Update imports in `core.ts` to reference moved functions
8. Update dedicated files to contain implementations instead of re-exports
9. Verify all exports work correctly

## Performance Considerations

- **Playback Performance**: No changes to playback or sequencer logic
- **Sequencer Timing**: Web Worker-based sequencer remains unchanged
- **YM2149 Emulation**: Sound generation code is untouched
- **Export Performance**: Modularization may improve load times through better bundling

## Risk Assessment

### Low Risk Changes
- Moving functions between files within the same directory
- Creating shared download utility
- No changes to core application logic

### Medium Risk Changes
- Ensuring all imports and exports are correctly updated
- Verifying export outputs remain identical

### High Risk Changes (Avoided)
- Any modifications to YM2149 emulation code
- Changes to core playback timing logic
- Alterations to existing export formats

## Testing Strategy

1. **Unit Testing**: Test each moved function individually
2. **Integration Testing**: Verify export functionality across all formats
3. **Regression Testing**: Ensure existing exports produce identical output
4. **Performance Testing**: Confirm 20ms/40ms cycle requirements are maintained

## Success Criteria

1. All export functions successfully moved to dedicated files
2. `core.ts` reduced by at least 80%
3. Download code duplication eliminated
4. All export formats produce identical output
5. Playback and sequencer performance maintained
6. Successful completion within single sprint timeline