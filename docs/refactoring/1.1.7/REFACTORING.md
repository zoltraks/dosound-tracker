# Refactoring Proposal for Version 1.1.7

## Overview

This document proposes refactoring changes to reduce the size of source code files by extracting functionality into separate modules. The focus is on maintaining code quality, readability, and performance, especially for playback and sequencer operations which require efficient execution.

## Proposed Changes

### 1. Extract MIDI Actions from App.tsx

**File:** `src/App.tsx` (currently 3696 lines)

**Proposal:** Extract MIDI note event handling logic into a new custom hook `useMidiActions`.

**Benefits:**
- Reduces App.tsx size by approximately 400-500 lines
- Improves separation of concerns
- Makes MIDI logic reusable and testable

**Implementation:**
- Create `src/hooks/useMidiActions.ts`
- Move `handleMidiNoteEvent` and related MIDI handling code
- Ensure no impact on sound generation or sequencer timing

### 2. Extract Instrument Actions from App.tsx

**File:** `src/App.tsx`

**Proposal:** Extract instrument operation handlers (clone, delete, move, rename) into a new custom hook `useInstrumentActions`.

**Benefits:**
- Further reduces App.tsx size by 300-400 lines
- Groups related instrument logic
- Enhances maintainability

**Implementation:**
- Create `src/hooks/useInstrumentActions.ts`
- Move handlers like `handleCloneInstrument`, `handleDeleteInstrument`, `handleMoveInstrument`
- Preserve all existing behavior and error handling

### 3. Extract Song I/O Utilities from useDataManagement.ts

**File:** `src/hooks/useDataManagement.ts` (currently 1505 lines)

**Proposal:** Extract song and instrument save/load logic into utility functions.

**Benefits:**
- Reduces useDataManagement.ts size by 600-700 lines
- Separates I/O concerns from state management
- Allows for better testing of I/O operations

**Implementation:**
- Create `src/utils/songIO.ts`
- Move `saveSong`, `loadSong`, `saveInstrument`, `loadInstrument` functions
- Ensure compatibility with existing YAML format and error handling

## Impact Assessment

- **Safety:** All proposed changes are safe as they involve moving existing code without modifying logic
- **Performance:** No impact on playback or sequencer efficiency (20ms/40ms cycles)
- **YM2149 Support:** No changes to sound chip implementation
- **Scope:** Limited to 3 key extractions to fit within one sprint

## Implementation Plan

1. Create new hook files and utility file
2. Move code sections carefully, preserving all dependencies
3. Update imports in App.tsx and useDataManagement.ts
4. Test all functionality to ensure no regressions
5. Update documentation if needed

## Risks and Mitigations

- **Risk:** Import/dependency issues during extraction
- **Mitigation:** Move code in small increments, test after each move
- **Risk:** Performance regression in hot paths
- **Mitigation:** Avoid extracting sequencer or sound generation code

This proposal focuses on code organization improvements while maintaining system stability and performance.