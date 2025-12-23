# Refactoring Proposal - DOSOUND Tracker v1.2.6

## Overview

This document outlines refactoring opportunities identified through comprehensive analysis of the DOSOUND Tracker codebase. The primary focus is on removing unused and duplicated code while maintaining all audio generation, sequencer functionality, and debugging facilities.

## Protected Code Areas

The following components are working correctly and MUST NOT be modified:

- **YM2149 Chip Emulation** - [`src/synth/YM2149.ts`](src/synth/YM2149.ts) - Sound chip register manipulation and audio output
- **Sequencer Engine** - [`src/synth/SequencerEngine.ts`](src/synth/SequencerEngine.ts) - Timing-critical sequencer logic
- **Sound Driver** - [`src/synth/SoundDriver.ts`](src/synth/SoundDriver.ts) - Audio buffer management and event processing
- **Playback Controls** - [`src/hooks/usePlaybackControls.ts`](src/hooks/usePlaybackControls.ts) - Real-time playback state management
- **Sequencer Integration** - [`src/hooks/useSequencerIntegration.ts`](src/hooks/useSequencerIntegration.ts) - Callback mechanisms between React and audio engine
- **MIDI Handling** - [`src/hooks/useMidiHandling.ts`](src/hooks/useMidiHandling.ts) - MIDI device communication
- **YM2149 Methods Used by Playback** - [`YM2149.updateChannelWithInstrument()`](src/synth/YM2149.ts:381), [`YM2149.writeRegister()`](src/synth/YM2149.ts:103), [`YM2149.silenceAll()`](src/synth/YM2149.ts:308)
- **Debug Mode Logging** - All `logger.debug()`, `logger.info()`, and conditional debug output in [`logger.ts`](src/utils/logger.ts:1)

Any proposed changes near these components must be proven safe through call graph analysis.

## Phase 1: Unused Code Removal

### 1.1 SoundDriver.findInstrument() - Dead Code

**Location:** [`src/synth/SoundDriver.ts:174-187`](src/synth/SoundDriver.ts:174)

**Analysis:**
The `findInstrument()` method returns a hardcoded default instrument template instead of looking up the actual instrument from the song data. This method is never called - `processNote()` accepts an instrument parameter directly, and instrument lookup is handled by callers.

```typescript
private findInstrument(instrumentId: string): Instrument | null {
  // This returns a hardcoded default, not the actual instrument from song
  return {
    id: instrumentId,
    name: 'Default',
    volume: [0x0F, 0x0E, 0x0D, 0x0C],
    shift: [0, 0, 0, 0],
    pitch: [0, 0, 0, 0],
    noise: [0, 0, 0, 0],
    mode: Array(32).fill(0),
    sustain: null
  };
}
```

**Evidence:**
- Call graph analysis shows `findInstrument()` is never referenced
- The `processNote()` method receives instrument via parameter, not via this lookup
- This appears to be legacy code from an incomplete refactoring

**Proposed Action:**
Remove the `findInstrument()` method entirely. Update `processNote()` signature to accept the instrument directly (which it already does).

**Testing Requirements:**
- Verify `convertSongToSoundEvents()` still produces correct output
- Test instrument note processing with various instrument configurations
- Validate export functionality produces correct register values

---

### 1.2 SoundDriver.calculateNoteFrequency() - Duplicate Logic

**Location:** [`src/synth/SoundDriver.ts:189-192`](src/synth/SoundDriver.ts:189)

**Analysis:**
This method duplicates the frequency calculation logic already present in [`YM2149.updateChannelWithInstrument()`](src/synth/YM2149.ts:408-425). The `SoundDriver` class is used for static export (WAV, VGM, ASM) while `YM2149` handles real-time playback. Both perform identical note-to-frequency conversion.

**Evidence:**
- `calculateNoteFrequency()` in SoundDriver matches frequency calculation in YM2149
- Both use `NOTE_FREQUENCIES` constant and apply octave shift
- The duplication is intentional for separation of concerns (static export vs real-time)

**Proposed Action:**
Mark as intentionally duplicated. This is a case where code duplication serves architectural purposes - keeping export logic independent of real-time audio code. Do not unify.

**Testing Requirements:**
- N/A - no changes proposed

---

### 1.3 SequencerEngine.processFrame() - Placeholder Implementation

**Location:** [`src/synth/SequencerEngine.ts:58-77`](src/synth/SequencerEngine.ts:58)

**Analysis:**
The `processFrame()` method is a placeholder that returns an empty register state without modification. This appears to be future-proofing for expanded sequencer functionality.

```typescript
processFrame(
  lineIndex: number,
  tick: number,
  patternIndex: number,
  currentRegisters: RegisterState
): FrameState {
  const registers: RegisterState = { ...currentRegisters };
  void patternIndex;
  // Detailed note/envelope/register processing will be implemented later.
  // For now, this method simply returns a cloned register state...
  return {
    registers,
    lineIndex,
    tick,
  };
}
```

**Evidence:**
- Comment explicitly states this is incomplete
- Current implementation only clones input state
- No calls to this method exist in codebase

**Proposed Action:**
Mark as intentionally incomplete placeholder. Do not remove as it may be needed for future feature development.

**Testing Requirements:**
- N/A - no changes proposed

---

## Phase 2: Code Deduplication

### 2.1 Envelope Expansion Functions - Functional Duplication

**Locations:**
- [`src/utils/instrumentIO.ts:166-183`](src/utils/instrumentIO.ts:166) - `expandEnvelope()`
- [`src/utils/instrumentIO.ts:185-198`](src/utils/instrumentIO.ts:185) - `expandLoopingEnvelope()`
- [`src/utils/songParser.ts:344-363`](src/utils/songParser.ts:344) - `expandEnvelope()` (identical implementation)
- [`src/utils/songParser.ts:365-380`](src/utils/songParser.ts:365) - `expandLoopingEnvelope()` (identical implementation)

**Analysis:**
Both files implement identical envelope expansion functions. These functions:
- Take a raw array of values
- Expand to a fixed envelope length (ENVELOPE_LENGTH = 32)
- Handle edge cases (empty input, insufficient length)

The duplication exists because `instrumentIO.ts` handles standalone instrument files while `songParser.ts` handles full song files. However, the expansion logic is identical.

**Proposed Action:**
Create a shared utility function in `src/utils/envelopeUtils.ts`:

```typescript
// src/utils/envelopeUtils.ts
export function expandEnvelope(
  values: unknown,
  length: number,
  defaultValue: number
): number[] {
  const rawArray = Array.isArray(values) ? values : [];
  const numericValues = rawArray
    .map(v => Number(v))
    .filter(v => Number.isFinite(v));

  if (numericValues.length === 0) {
    return Array(length).fill(defaultValue);
  }

  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i < numericValues.length) {
      result[i] = numericValues[i];
    } else {
      result[i] = numericValues[numericValues.length - 1];
    }
  }
  return result;
}

export function expandLoopingEnvelope(
  values: unknown,
  length: number,
  defaultValue: number
): number[] {
  const rawArray = Array.isArray(values) ? values : [];
  const numericValues = rawArray
    .map(v => Number(v))
    .filter(v => Number.isFinite(v));

  if (numericValues.length === 0) {
    return Array(length).fill(defaultValue);
  }

  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    result[i] = numericValues[i % numericValues.length];
  }
  return result;
}
```

Update `instrumentIO.ts` and `songParser.ts` to import from the new module.

**Why Safe:**
- No changes to function signatures or behavior
- Only refactoring location of implementation
- Both callers have identical requirements

**Testing Requirements:**
- Add unit tests for `expandEnvelope()` and `expandLoopingEnvelope()`
- Test cases: empty input, single value, multiple values, boundary conditions
- Verify export/import produces identical results before and after refactoring

---

### 2.2 Trim Envelope Functions - Identical Duplication

**Locations:**
- [`src/utils/instrumentIO.ts:7-15`](src/utils/instrumentIO.ts:7) - `trimEnvelopeLocal()`
- [`src/utils/songIO.ts:9-17`](src/utils/songIO.ts:9) - `trimEnvelope()`

**Analysis:**
Both functions perform identical logic - trim trailing values that match the last value (for cleaner YAML export):

```typescript
// Both implementations are identical:
const trimEnvelope = (values: number[]): number[] => {
  if (!values || values.length === 0) return [];
  const last = values[values.length - 1];
  let i = values.length - 2;
  while (i >= 0 && values[i] === last) {
    i -= 1;
  }
  return values.slice(0, i + 1).concat(last);
};
```

**Proposed Action:**
Move to `src/utils/envelopeUtils.ts` (same file as Phase 2.1) and update both callers.

**Why Safe:**
- Pure refactoring with no behavioral change
- Functions are side-effect free

**Testing Requirements:**
- Test cases: empty array, all same values, mixed values, single element
- Verify YAML export produces identical output before and after

---

### 2.3 Is-Zero-Default Functions - Identical Duplication

**Locations:**
- [`src/utils/instrumentIO.ts:23-24`](src/utils/instrumentIO.ts:23) - `isZeroDefaultLocal()`
- [`src/utils/songIO.ts:19-20`](src/utils/songIO.ts:19) - `isZeroDefault()`

**Analysis:**
Both implementations are identical:

```typescript
// instrumentIO.ts
const isZeroDefaultLocal = (values: number[]): boolean =>
  values.length === 0 || (values.length === 1 && values[0] === 0);

// songIO.ts
const isZeroDefault = (values: number[]): boolean =>
  values.length === 0 || (values.length === 1 && values[0] === 0);
```

**Proposed Action:**
Move to `src/utils/envelopeUtils.ts` and rename to `isEnvelopeZeroDefault()` for clarity.

**Testing Requirements:**
- Test cases: empty, single zero, single non-zero, multiple values

---

## Phase 3: Utility Function Consolidation

### 3.1 Instrument Color Normalization - Duplicate Locations

**Locations:**
- [`src/utils/songFormat.ts:41-85`](src/utils/songFormat.ts:41) - `normalizeInstrumentColor()`
- [`src/utils/instrumentIO.ts:238`](src/utils/instrumentIO.ts:238) - imports from songFormat
- [`src/utils/songParser.ts:502`](src/utils/songParser.ts:502) - imports from songFormat
- [`src/utils/songIO.ts:48`](src/utils/songIO.ts:48) - imports from songFormat

**Analysis:**
The `normalizeInstrumentColor()` function is already centralized in `songFormat.ts` and properly imported by all callers. This is correct organization - no changes needed.

---

### 3.2 Base Key Parsing - Correctly Centralized

**Locations:**
- [`src/utils/songFormat.ts:3-31`](src/utils/songFormat.ts:3) - `formatBaseKey()`, `parseBaseKey()`
- Re-exported in [`src/utils/songParser.ts:110`](src/utils/songParser.ts:110)
- Used throughout codebase

**Analysis:**
Base key parsing is correctly centralized. The re-export in `songParser.ts` provides backward compatibility. No changes needed.

---

### 3.3 Instrument ID Formatting - Multiple Implementations

**Locations:**
- [`src/utils/playbackUtils.ts:4-21`](src/utils/playbackUtils.ts:4) - `normalizeInstrumentId()`
- [`src/utils/instrumentSelection.ts:3-6`](src/utils/instrumentSelection.ts:3) - `formatInstrumentSlotId()`
- [`src/utils/instrumentSelection.ts:8-13`](src/utils/instrumentSelection.ts:8) - `stepInstrumentId()`
- [`src/utils/hexFormatting.ts:3-5`](src/utils/hexFormatting.ts:3) - `formatHexId()`

**Analysis:**
- `normalizeInstrumentId()` - handles multiple input types (string, number, null), normalizes to 2-digit hex
- `formatInstrumentSlotId()` - wraps `normalizeInstrumentId()` for slot indices
- `formatHexId()` - generic hex formatting using `Formatter.hex()`

These serve different purposes and should remain separate. However, `formatInstrumentSlotId()` could be simplified by inlining the normalization logic if `normalizeInstrumentId()` is used directly.

**Proposed Action:**
No changes. Current organization is appropriate.

---

### 3.4 YAML Quote Functions - Duplication in instrumentIO.ts

**Location:** [`src/utils/instrumentIO.ts:81-127`](src/utils/instrumentIO.ts:81)

**Analysis:**
Four nearly identical quote functions exist:
- `quoteBaseValues()`
- `quoteColorValues()`
- `quoteNameValues()`

All follow the same pattern:
```typescript
const quoteXValues = (text: string): string => {
  const regex = /^(\s*-\s+|\s+)(X):\s*(.+)$/gm;
  return text.replace(regex, (_match, indent: string, key: string, value: string) => {
    let inner = String(value).trim();
    // Remove existing quotes...
    inner = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `${indent}${key}: "${inner}"`;
  });
};
```

**Proposed Action:**
Create a generic quote helper:

```typescript
// src/utils/yamlUtils.ts
export function quoteYamlValues(
  text: string,
  keyPattern: string
): string {
  const regex = new RegExp(`^(\\s*-\\s+|\\s+)(${keyPattern}):\\s*(.+)$`, 'gm');
  return text.replace(regex, (_match: string, indent: string, key: string, value: string) => {
    let inner = String(value).trim();
    if (
      (inner.startsWith('"') && inner.endsWith('"')) ||
      (inner.startsWith("'") && inner.endsWith("'"))
    ) {
      inner = inner.slice(1, -1);
    }
    inner = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `${indent}${key}: "${inner}"`;
  });
}
```

Update `instrumentIO.ts` to use the generic helper.

**Why Safe:**
- Only affects YAML formatting, not data structures
- Output format remains identical

**Testing Requirements:**
- Test YAML export produces identical output
- Verify special characters are properly escaped

---

### 3.5 YAML Quote Functions in songIO.ts - Similar Pattern

**Location:** [`src/utils/songIO.ts:315-444`](src/utils/songIO.ts:315)

**Analysis:**
Similar quote functions exist in `songIO.ts`:
- `quoteLineValues()` - for playlist lines (A, B, C)
- `quoteNoteValues()` - for note values
- `quoteBaseValues()` - for base keys
- `quoteNumberValues()` - for pattern/instrument numbers
- `quoteTitleValues()` - for song title
- `quoteColorValues()` - for instrument colors

These could also use the generic helper from Phase 3.4.

**Proposed Action:**
Update `songIO.ts` to use the generic helper from Phase 3.4.

**Testing Requirements:**
- Verify all export formats produce identical output
- Test edge cases with special characters in titles, names

---

## Phase 4: Naming Convention Improvements

### 4.1 Consistent Export Function Naming

**Current Pattern Analysis:**
- `src/utils/instrumentIO.ts` - `buildInstrumentYamlForExport()`, `parseInstrumentFromText()`
- `src/utils/songIO.ts` - `buildSongYamlForExport()`
- `src/utils/songParser.ts` - `parseSongFromYaml()`

**Observation:**
Mix of `buildXForExport`, `parseX`, and `parseXFromY` patterns. All serve the same purpose (convert between YAML text and internal data structures).

**Proposed Action:**
Adopt consistent naming pattern: `serializeX()` for export, `deserializeX()` for import.

New names:
- `buildInstrumentYamlForExport()` -> `serializeInstrument()`
- `parseInstrumentFromText()` -> `deserializeInstrument()`
- `buildSongYamlForExport()` -> `serializeSong()`
- `parseSongFromYaml()` -> `deserializeSong()`

**Why Safe:**
- Update all import statements accordingly
- No behavioral change

**Testing Requirements:**
- All existing tests must pass
- Add tests for new function names (alias exports for backward compatibility during transition)

---

### 4.2 Consistent Hook Naming

**Current Pattern:**
- `useAppState` - manages debug mode, export settings, transpose settings
- `useDataManagement` - manages song/instrument CRUD
- `useFileOperations` - manages file I/O
- `useInstrumentActions` - manages instrument operations (play, clone, delete)
- `useInstrumentManagement` - manages instrument state updates

**Observation:**
Some overlap in naming. `useInstrumentActions` and `useInstrumentManagement` could be confused.

**Proposed Action:**
Rename `useInstrumentActions` to `useInstrumentOperations` for consistency with `usePlaylistOperations`, `useTrackOperations`.

**Testing Requirements:**
- Verify all imports are updated
- Test instrument operations (play, clone, delete) still work correctly

---

### 4.3 Utility Function Naming

**Current Pattern:**
- `formatBaseKey`, `parseBaseKey` - consistent
- `normalizeInstrumentId` - uses "normalize"
- `countInstrumentUsage` - uses verb-noun
- `cloneInstrumentToNextFreeSlot` - uses full sentence

**Proposed Action:**
Adopt consistent verb-noun pattern for utility functions:
- `normalizeInstrumentId` -> `normalizeId` (or keep as-is)
- `countInstrumentUsage` -> `countUsage` (keep as-is)
- `createClearedInstrument` -> `createClearedInstrument` (keep as-is)

Current naming is acceptable. Focus on consistency in new code rather than renaming existing functions.

---

## Phase 5: Remove Unused Imports and Dead Code Paths

### 5.1 Unused Imports Identified

**File:** [`src/utils/instrument.ts`](src/utils/instrument.ts)
- Only imports `Instrument` type from SoundDriver
- Uses `isInstrumentEmpty()` function
- No unused imports found

**File:** [`src/utils/trackUtils.ts`](src/utils/trackUtils.ts)
- Imports `Pattern` type from SoundDriver
- Uses `computeEffectiveVolume()` function
- No unused imports found

**File:** [`src/hooks/useAppState.ts`](src/hooks/useAppState.ts)
- Imports `StorageKeys` from `../utils/storageKeys`
- Uses `StorageKeys.DEBUG_MODE`, `StorageKeys.EXPORT_TYPE`, `StorageKeys.DUMP_MODE`, `StorageKeys.TRANSPOSE_SETTINGS`
- All imports are used

**Verification:**
No unused imports were identified during analysis. The codebase appears well-maintained in this regard.

---

### 5.2 SoundDriver Export Methods - Possibly Unused

**Location:** [`src/synth/SoundDriver.ts:265-290`](src/synth/SoundDriver.ts:265)

**Analysis:**
`exportToAssembly()` method generates assembly code from sound events. This may be used for DOSOUND assembly export feature.

**Evidence:**
- Called by export functionality
- No evidence of removal needed

**Proposed Action:**
Keep as-is. Not dead code.

---

## Phase 6: Storage Key Cleanup

### 6.1 Inconsistent Storage Key Usage

**Current State:**
- [`src/utils/storageKeys.ts`](src/utils/storageKeys.ts) defines centralized constants
- `useAppState.ts` uses these constants correctly
- `useDataManagement.ts` defines `INSTRUMENT_STORAGE_KEY` inline (line 31)

**Location:** [`src/hooks/useDataManagement.ts:31`](src/hooks/useDataManagement.ts:31)

```typescript
const INSTRUMENT_STORAGE_KEY = StorageKeys.INSTRUMENT;
```

This correctly references the centralized constant.

**Proposed Action:**
No changes needed. Storage key usage is already centralized.

---

## Testing Strategy Summary

### Unit Tests Required

For each refactored function, add comprehensive unit tests:

**Phase 2.1 - Envelope Expansion Functions:**
```typescript
describe('expandEnvelope', () => {
  it('handles empty input', () => {
    expect(expandEnvelope(null, 32, 0)).toEqual(Array(32).fill(0));
  });
  it('handles single value', () => {
    expect(expandEnvelope([5], 32, 0)).toEqual(Array(32).fill(5));
  });
  it('handles partial values', () => {
    expect(expandEnvelope([1, 2, 3], 32, 0)).toEqual([1, 2, 3, ...Array(29).fill(3)]);
  });
  it('handles exact length', () => {
    expect(expandEnvelope([1, 2, 3], 3, 0)).toEqual([1, 2, 3]);
  });
});

describe('expandLoopingEnvelope', () => {
  it('loops values correctly', () => {
    expect(expandLoopingEnvelope([1, 2], 5, 0)).toEqual([1, 2, 1, 2, 1]);
  });
});
```

**Phase 2.2 - Trim Envelope Functions:**
```typescript
describe('trimEnvelope', () => {
  it('trims trailing duplicates', () => {
    expect(trimEnvelope([1, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });
  it('handles all same values', () => {
    expect(trimEnvelope([5, 5, 5])).toEqual([5]);
  });
  it('handles empty array', () => {
    expect(trimEnvelope([])).toEqual([]);
  });
});
```

**Phase 3.4 - YAML Quote Helper:**
```typescript
describe('quoteYamlValues', () => {
  it('quotes values correctly', () => {
    const input = '  name: Hello World';
    expect(quoteYamlValues(input, 'name')).toBe('  name: "Hello World"');
  });
  it('escapes special characters', () => {
    const input = '  name: Hello "World"';
    expect(quoteYamlValues(input, 'name')).toBe('  name: "Hello \\"World\\""');
  });
});
```

**Phase 4.1 - Serialization Functions:**
```typescript
describe('serializeInstrument', () => {
  it('produces valid YAML', () => {
    const instrument = createTestInstrument();
    const yaml = serializeInstrument(instrument);
    expect(() => yaml.load(yaml)).not.toThrow();
  });
});
```

### Integration Tests Required

- Full song export/import cycle
- Instrument file export/import cycle
- Playlist operations with pattern changes
- Instrument operations (clone, delete, move)

### Regression Tests Required

- Playback with various instrument configurations
- MIDI input/output with various devices
- Export formats (WAV, VGM, ASM, BIN, MAX)
- Storage persistence across page reloads

## Naming Conventions Summary

### Current Conventions (to maintain)

| Pattern | Example | Location |
|---------|---------|----------|
| Hooks | `useX` | `src/hooks/` |
| Components | `XComponent` | `src/components/` |
| Utilities | `camelCase` | `src/utils/` |
| Classes | `PascalCase` | `src/synth/` |
| Constants | `UPPER_SNAKE_CASE` | `src/constants/` |
| Types | `PascalCase` | All TypeScript files |

### Proposed Improvements

1. **Serialize/Deserialize Pattern** for data conversion functions
2. **Verb-Noun Pattern** for utility functions (already mostly followed)
3. **Consistent Component Naming** - all components end with Panel/Section/Container

## Dependencies and Coupling Analysis

### High Coupling Areas (Avoid Changes)

- `App.tsx` depends on 25+ hooks and components
- `useDataManagement.ts` coordinates between song, instrument, pattern management
- `YM2149.ts` is used by multiple hooks for audio output

### Low Coupling Areas (Safe for Refactoring)

- `src/utils/` - mostly pure functions with no side effects
- `src/constants/` - static values with no dependencies
- `src/exports/` - export formatting functions

## Implementation Safety Checklist

Before implementing any changes:

- [ ] Verify no audio-related code is affected
- [ ] Verify no sequencer timing code is affected
- [ ] Verify no debug logging is modified
- [ ] Run existing test suite
- [ ] Add new unit tests for refactored functions
- [ ] Test audio playback manually
- [ ] Test export functionality manually
- [ ] Verify localStorage persistence works

## Code Organization Observations

### Current Structure (Acceptable)

```
src/
  components/     - React UI components
  hooks/          - React hooks for state/logic
  synth/          - Audio engine (YM2149, Sequencer)
  utils/          - Pure utility functions
  stores/         - Zustand state stores
  constants/      - Static constants
  exports/        - Export format handlers
  workers/        - Web workers
```

Flat structure is appropriate for this project size. No structural changes recommended.

### File Count by Directory

- `src/utils/` - 35 files (largest, needs organization)
- `src/hooks/` - 25 files
- `src/components/` - 24 files
- `src/exports/` - 6 files
- `src/constants/` - 5 files
- `src/synth/` - 4 files
- `src/stores/` - 1 file

The utils directory could benefit from subdirectories:
- `src/utils/io/` - file I/O utilities
- `src/utils/format/` - formatting utilities
- `src/utils/data/` - data manipulation utilities

However, this is a minor organizational change and not a priority for this refactoring phase.
