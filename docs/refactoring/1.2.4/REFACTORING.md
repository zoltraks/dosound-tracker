# DOSOUND Tracker v1.2.4 - Refactoring Proposal

## Executive Summary

This refactoring proposal targets specific code duplication, unused functionality, and component complexity while maintaining critical audio performance requirements. The focus is on consolidation and simplification rather than restructuring, keeping the flat file structure and ensuring all changes fit within a single sprint.

**Primary Objectives:**
1. Eliminate duplicate base key parsing and formatting functions
2. Remove unused code and development artifacts
3. Simplify large components (TrackPanel, PianoKeyboard, useInstrumentActions)
4. Consolidate envelope timing logic
5. Improve type safety without breaking existing patterns

## Current State Analysis

### Performance Constraints
- Real-time audio requiring stable 20ms/40ms cycle timing
- YM2149 sound chip emulation (no modifications)
- React-based UI with Web Audio API and Web Workers
- Flat file structure to be maintained

### Critical Issues Identified

#### 1. Duplicate Base Key Functions (Priority: HIGH)

**parseBaseKey Duplication**
- `src/utils/songFormat.ts` - Core `parseBaseKey` implementation
- `src/exports/core.ts` - Duplicate `parseBaseKeyForExport` function
- Impact: Inconsistent parsing behavior, maintenance overhead

**formatBaseKey Duplication**
- `src/utils/songFormat.ts` - Core `formatBaseKey` implementation
- `src/App.tsx` - Duplicate `formatNoteKey` function
- `src/utils/pianoUtils.ts` - Re-exported duplicate
- Impact: Code duplication across multiple files, inconsistent formatting

#### 2. Envelope Update Logic Duplication (Priority: HIGH)

- `src/hooks/useMidiActions.ts` - Complex sustain and envelope advance logic
- `src/utils/previewEnvelopeTiming.ts` - Similar envelope timing functionality
- Impact: Duplicated complex logic, difficult to maintain consistency

#### 3. Unused Code and Development Artifacts (Priority: MEDIUM)

- Unconditional debug console logs in `src/hooks/useSequencerIntegration.ts`
- Unconditional development warnings in `src/hooks/useAudioSetup.ts`
- Commented-out code sections throughout codebase
- Unused function parameters and imports
- Impact: Code bloat, confusion about intentional vs. leftover code
- Note: DEBUG mode exists for conditional debug output - ensure all debug statements respect this mode

#### 4. Large Complex Components (Priority: MEDIUM)

**TrackPanel.tsx** (585 lines)
- Complex keyboard event handling
- Audio preview and envelope timing logic mixed with UI
- Pattern/step manipulation utilities embedded

**PianoKeyboard.tsx** (469 lines)
- Complex keyboard and MIDI handling
- Layout and responsive logic mixed
- Note playback management embedded

**useInstrumentActions.ts** (379 lines)
- Instrument validation, playback, and CRUD operations combined
- Multiple responsibilities in single hook

#### 5. Export Function Over-Engineering (Priority: LOW)

- Complex export context building in `src/App.tsx`
- Redundant export type handling
- Over-engineered export strategy selection

### Component Line Count Targets

- TrackPanel.tsx: 585 → ~400 lines (32% reduction)
- PianoKeyboard.tsx: 469 → ~320 lines (32% reduction)
- useInstrumentActions.ts: 379 → ~260 lines (31% reduction)

## Refactoring Strategy

### Phase 1: Consolidate Base Key Functions

#### Unify Base Key Parsing

**Objective**: Single source of truth for base key parsing

Remove `parseBaseKeyForExport` from `src/exports/core.ts`:
```typescript
// REMOVE this function from src/exports/core.ts
export function parseBaseKeyForExport(rawBase?: string): { note: string; octave: number } {
  // ... duplicate implementation
}
```

Update all consumers to use `parseBaseKey` from `src/utils/songFormat.ts`:
- `src/exports/asm.ts` - Update `exportInstrumentToAssembly`
- `src/exports/core.ts` - Update `buildInstrumentPreviewSong`
- Ensure all imports reference `src/utils/songFormat.ts`

**Expected Outcome**: Eliminates ~15 lines of duplicate code, single parsing implementation

#### Unify Base Key Formatting

**Objective**: Single source of truth for base key formatting

Remove `formatNoteKey` from `src/App.tsx`:
```typescript
// REMOVE this function from src/App.tsx
const formatNoteKey = (note: string, octave: number) => {
  // ... duplicate implementation
}
```

Consolidate re-exports in `src/utils/pianoUtils.ts`:
- Remove duplicate `formatBaseKey` if present
- Export only from `src/utils/songFormat.ts`

Update all consumers to use `formatBaseKey` from `src/utils/songFormat.ts`

**Expected Outcome**: Eliminates duplicate formatting logic across multiple files

### Phase 2: Consolidate Envelope Logic

#### Extract Unified Envelope Timing

**Objective**: Consolidate envelope advance and sustain logic

Create `src/utils/envelopeOperations.ts`:
```typescript
export function advanceEnvelope(
  envelope: EnvelopePoint[],
  currentIndex: number,
  sustainEnabled: boolean
): number {
  // Unified envelope advance logic
}

export function handleEnvelopeSustain(
  envelope: EnvelopePoint[],
  currentIndex: number,
  sustainPoint: number
): number {
  // Unified sustain handling logic
}
```

**Extract from**:
- `src/hooks/useMidiActions.ts` - Complex sustain logic in note handling
- `src/utils/previewEnvelopeTiming.ts` - Similar envelope timing functionality

**Expected Outcome**: Single implementation of envelope timing logic, reduced complexity in MIDI handling

### Phase 3: Remove Unused Code

#### Clean Up Development Artifacts

**Conditional debug statements**:
- Identify unconditional console.log calls in `src/hooks/useSequencerIntegration.ts`
- Review development warnings in `src/hooks/useAudioSetup.ts`
- Ensure all debug output is wrapped in DEBUG mode checks
- Keep debug statements that provide valuable diagnostic information when DEBUG mode is enabled

**Remove commented-out code**:
- Systematic removal of old code blocks
- Remove unused function parameters
- Clean up dead code paths

**Remove unused imports**:
- Systematic scan for unused import statements
- Remove unreferenced variables
- Clean up unused type definitions

**Expected Outcome**: Cleaner codebase with proper DEBUG mode integration, reduced confusion about intentional code

### Phase 4: Simplify Components

#### TrackPanel.tsx Refactoring (585 → ~400 lines)

**Extract to `src/utils/trackRendering.ts`**:
```typescript
export function renderTrackNote(/* ... */): string {
  // Track note rendering logic
}

export function calculateTrackPosition(/* ... */): number {
  // Position calculation for track
}
```

**Extract to `src/hooks/useTrackKeyboard.ts`**:
```typescript
export function useTrackKeyboard() {
  // Keyboard event handling for track editing
  // Navigation logic
  // Copy/paste functionality
  return { handlers, state };
}
```

**Extract to `src/utils/trackOperations.ts`**:
```typescript
export function validateStep(/* ... */): boolean {
  // Step validation logic
}

export function manipulatePattern(/* ... */): Pattern {
  // Pattern manipulation utilities
}
```

**Expected Outcome**: TrackPanel focused on rendering and coordination, logic extracted to focused modules

#### PianoKeyboard.tsx Refactoring (469 → ~320 lines)

**Extract to `src/utils/pianoKeyboardHandling.ts`**:
```typescript
export function createKeyboardEventHandler(/* ... */): EventHandler {
  // Keyboard event handling logic
}

export function mapKeyToNote(/* ... */): Note {
  // Key mapping utilities
}
```

**Extract to `src/hooks/usePianoLayout.ts`**:
```typescript
export function usePianoLayout() {
  // Layout calculation and responsive logic
  // Key positioning utilities
  return { layout, dimensions };
}
```

**Expected Outcome**: PianoKeyboard focused on rendering, interaction logic extracted

#### useInstrumentActions.ts Refactoring (379 → ~260 lines)

**Extract to `src/utils/instrumentValidation.ts`**:
```typescript
export function validateInstrument(/* ... */): ValidationResult {
  // Instrument data validation
  // Envelope validation
  // ID normalization
}
```

**Extract to `src/utils/instrumentPlayback.ts`**:
```typescript
export function previewInstrument(/* ... */): void {
  // Instrument preview playback
  // Audio preview utilities
}
```

**Extract to `src/utils/instrumentOperations.ts`**:
```typescript
export function createInstrument(/* ... */): Instrument {
  // Instrument creation utilities
}

export function modifyInstrument(/* ... */): Instrument {
  // Instrument modification utilities
}
```

**Expected Outcome**: useInstrumentActions focused on state coordination, operations extracted to utilities

### Phase 5: Type Safety and Cleanup

#### Add Explicit Return Types

**Target files**:
- All exported functions in hooks
- Utility functions with complex return types
- Event handlers and callbacks

**Example**:
```typescript
// BEFORE
export function validateStep(step) {
  // ...
}

// AFTER
export function validateStep(step: Step): ValidationResult {
  // ...
}
```

#### Remove Any Types

**Target areas**:
- Validation functions in `src/utils/validation.ts`
- Data management functions in hooks
- Instrument action functions

**Replace with**:
- Specific type definitions
- Union types where appropriate
- Generic type parameters

#### Consolidate Configuration

**Move hardcoded values to constants**:
- Extract magic numbers to named constants
- Consolidate configuration objects
- Standardize constant naming conventions

**Expected Outcome**: Improved type safety, better IDE support, clearer code intent

## Safety Constraints

### DO NOT MODIFY

**Audio Core Components**:
- `src/synth/SoundDriver.ts` - Core audio generation
- `src/synth/YM2149.ts` - Sound chip interface
- `src/workers/sequencerWorker.ts` - Audio timing critical
- Audio timing constants (20ms/40ms cycles)

**React Hooks Optimization**:
- Current dependency array patterns (may appear incorrect but are audio-optimized)
- Local state mirroring for timing stability
- Existing useCallback/useMemo patterns affecting render timing

**Critical Patterns**:
- Web Worker communication patterns
- Sequencer timing logic
- Playback cycle implementation
- Export output byte-level compatibility

### PRESERVE

**File Structure**:
- Current directory organization
- Flat structure requirement
- Existing component boundaries involving audio timing
- Current export/import patterns

**Functionality**:
- All user-facing features
- All export format outputs (must remain byte-identical)
- All keyboard shortcuts and UI behaviors
- All MIDI input/output functionality

## Testing Requirements

### Automated Verification

**Audio Timing Tests**:
- Verify 20ms/40ms cycle timing remains within ±0ms tolerance
- Test with simple songs (single instrument, basic pattern)
- Test with complex songs (multiple instruments, complex patterns)
- Measure timing consistency over extended playback

**Export Format Tests**:
- Byte-for-byte comparison of all export formats before/after
- Test ASM export output
- Test binary export output
- Test JSON export output
- Verify file format compliance

**Component Functionality Tests**:
- TrackPanel keyboard navigation
- PianoKeyboard note triggering
- Instrument preview playback
- Modal dialogs open/close
- Song/instrument loading and saving

**MIDI Functionality Tests**:
- MIDI input response time
- MIDI channel mapping
- Sustain pedal handling
- Note on/off events

**Type Safety Tests**:
- TypeScript compilation without errors
- ESLint passes without new warnings
- No runtime type errors in browser console

### Manual Verification Checklist

**Audio Playback**:
- Playback starts without glitches
- No audio dropouts during playback
- Envelope timing sounds correct
- Instrument preview plays correctly

**User Interface**:
- All keyboard shortcuts work
- Track editing responds correctly
- Piano keyboard triggers notes
- Modal dialogs function properly

**MIDI Integration**:
- MIDI input responds correctly
- MIDI output generates correct events
- Sustain pedal affects envelope correctly

**Export Functionality**:
- All export formats generate valid output
- Downloaded files can be re-imported
- Exported files work in target environments

## Implementation Phases

### Phase 1: Base Key Consolidation

**Objective**: Eliminate duplicate parsing and formatting functions

**Tasks**:
- Remove `parseBaseKeyForExport` from `src/exports/core.ts`
- Update all consumers to use `parseBaseKey` from `src/utils/songFormat.ts`
- Remove `formatNoteKey` from `src/App.tsx`
- Consolidate `formatBaseKey` usage from single source
- Update all imports and references

**Safety**: No audio-critical code modification

**Verification**: Unit tests for parsing/formatting, export format byte comparison

### Phase 2: Envelope Logic Consolidation

**Objective**: Unify envelope timing and sustain handling

**Tasks**:
- Create `src/utils/envelopeOperations.ts` with unified functions
- Extract envelope advance logic from `src/hooks/useMidiActions.ts`
- Extract sustain handling from multiple locations
- Update all consumers to use unified functions

**Safety**: Test MIDI sustain functionality, envelope timing

**Verification**: Audio timing tests, MIDI functionality tests

### Phase 3: Code Cleanup

**Objective**: Remove unused code and development artifacts

**Tasks**:
- Review and wrap unconditional console.log statements in DEBUG mode checks
- Ensure development warnings respect DEBUG mode
- Remove commented-out code sections
- Remove unused imports systematically
- Clean up unused function parameters
- Preserve debug statements that provide diagnostic value when DEBUG mode is enabled

**Safety**: No functional changes, only removal and proper DEBUG mode integration

**Verification**: All existing functionality continues to work, TypeScript compilation passes, DEBUG mode output validates correctly

### Phase 4: Component Simplification

**Objective**: Extract logic from large components into focused modules

**Tasks**:
- Extract TrackPanel rendering logic to `src/utils/trackRendering.ts`
- Extract TrackPanel keyboard handling to `src/hooks/useTrackKeyboard.ts`
- Extract TrackPanel operations to `src/utils/trackOperations.ts`
- Extract PianoKeyboard handling to `src/utils/pianoKeyboardHandling.ts`
- Extract PianoKeyboard layout to `src/hooks/usePianoLayout.ts`
- Extract useInstrumentActions validation to `src/utils/instrumentValidation.ts`
- Extract useInstrumentActions playback to `src/utils/instrumentPlayback.ts`
- Extract useInstrumentActions operations to `src/utils/instrumentOperations.ts`

**Safety**: Careful testing of audio timing and UI responsiveness

**Verification**: Component functionality tests, audio timing tests, MIDI tests

### Phase 5: Type Safety Enhancement

**Objective**: Improve type safety and configuration management

**Tasks**:
- Add explicit return types to all exported functions
- Remove `any` types in favor of specific types
- Consolidate configuration values into constants
- Standardize type definitions across similar functions

**Safety**: No runtime behavior changes

**Verification**: TypeScript compilation, existing tests pass, no new console errors

## Expected Outcomes

### Code Quality Improvements

**Reduced Duplication**:
- Single implementation of base key parsing
- Single implementation of base key formatting
- Unified envelope timing logic
- Consolidated MIDI handling patterns

**Simplified Components**:
- TrackPanel reduced to ~400 lines (32% reduction)
- PianoKeyboard reduced to ~320 lines (32% reduction)
- useInstrumentActions reduced to ~260 lines (31% reduction)

**Enhanced Type Safety**:
- Explicit return types on all exported functions
- Elimination of unnecessary `any` types
- Improved type definitions for complex structures

**Cleaner Codebase**:
- Unconditional debug statements properly wrapped in DEBUG mode checks
- No commented-out code
- No unused imports or variables
- Standardized patterns across similar functionality
- Preserved diagnostic capabilities in DEBUG mode

### Maintainability Benefits

**Better Code Organization**:
- Clear separation of concerns
- Focused modules with single responsibilities
- Consistent patterns across similar functionality
- Improved code discoverability

**Easier Testing**:
- Smaller, focused functions easier to test
- Isolated logic testable without component rendering
- Clear boundaries for unit testing

**Improved Developer Experience**:
- Better IDE navigation and autocomplete
- Clearer code intent and purpose
- Reduced cognitive load when reading code
- Standardized patterns reduce learning curve

### Performance Characteristics

**Maintained Audio Performance**:
- 20ms/40ms cycle timing preserved
- No audio glitches or dropouts
- Real-time audio stability maintained
- MIDI latency unchanged

**UI Responsiveness**:
- Component render performance maintained or improved
- Keyboard input responsiveness unchanged
- Modal interactions remain smooth

## Success Criteria

**Code Quality Metrics**:
- Duplicate `parseBaseKey` and `formatBaseKey` functions eliminated
- TrackPanel, PianoKeyboard, useInstrumentActions reduced by ~30%
- Zero new TypeScript or ESLint errors
- All `any` types removed from validation and data management

**Functionality Preservation**:
- All existing features work identically
- All export formats produce byte-identical output
- All keyboard shortcuts and UI behaviors unchanged
- All MIDI input/output functionality preserved

**Performance Requirements**:
- Audio cycle timing maintained at 20ms/40ms (±0ms tolerance)
- No audio glitches or timing issues
- No performance regression in sequencer
- UI responsiveness maintained or improved

**Testing Validation**:
- All automated tests pass
- Manual verification checklist complete
- Export format byte comparison passes
- Audio timing verification passes