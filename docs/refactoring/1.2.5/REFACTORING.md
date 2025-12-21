# DOSOUND Tracker Refactoring Proposal

**Version:** 1.2.5  
**Project:** DOSOUND Tracker  
**Type:** Refactoring Proposal for AI-Assisted Implementation

## Project Analysis

### Current Architecture Overview

The DOSOUND Tracker is a React-based chiptune music tracker application:

- **Core Architecture**: React 19.2.0 with TypeScript 5.9.3
- **Build System**: Vite 7.2.2 with Rolldown
- **State Management**: Zustand 4.5.0 with custom hooks
- **Audio Engine**: Custom YM2149 sound chip emulation
- **Target Platform**: Web application with Electron desktop support

### File Structure

```
src/
├── components/          # React UI components
├── constants/           # Application constants
├── exports/             # Export functionality
├── hooks/              # Custom React hooks
├── modals/             # Modal components
├── stores/             # Zustand stores
├── synth/              # Audio synthesis engine
├── utils/              # Utility functions
└── workers/            # Web Workers
```

### Current Naming Conventions

**Files:**
- Components: PascalCase (`App.tsx`, `HeaderPanel.tsx`, `TrackPanel.tsx`)
- Hooks: camelCase with `use` prefix (`useSequencer.ts`, `usePlaybackControls.ts`, `useAppState.ts`)
- Utilities: camelCase (`hexFormatting.ts`, `playbackUtils.ts`, `instrumentIO.ts`)
- Constants: PascalCase (`music.ts`)

**Code Patterns:**
- Functions: camelCase (`normalizeInstrumentId()`, `handleStartSong()`, `calculateNoteFrequency()`)
- Variables: camelCase (`currentSong`, `sequencerState`, `playbackSpeed`)
- Constants: UPPER_SNAKE_CASE (`PATTERN_LENGTH`, `NOTE_FREQUENCIES`, `DEFAULT_OCTAVE`, `YM_CLOCK`)
- Boolean variables: Prefix conventions (`isPlaying`, `hasLoop`, `shouldPlayTone`)
- Types/Interfaces: PascalCase (`UiStore`, `SequencerState`, `Instrument`, `Pattern`)

**Identified Inconsistencies:**
- Mixed use of abbreviations vs full words (`inst` vs `instrument`)
- Inconsistent parameter naming in similar functions
- Some utility functions lack consistent naming patterns

### Module Relationships

**Core Data Flow:**
```
App.tsx → useSequencer() → usePlaybackControls() → useSequencerIntegration()
                → YM2149 → AudioContext
                → SoundDriver → Event processing
```

**Key Dependencies:**
- `App.tsx` orchestrates all functionality (2538 lines, needs decomposition)
- `useSequencer()` manages timing and playback state
- `usePlaybackControls()` bridges sequencer with song data
- `useSequencerIntegration()` handles real-time audio rendering
- `YM2149` class handles low-level sound chip emulation

**Critical Timing Paths:**
1. **Playback**: `handleStartSong()` → `startSong()` → worker timing → `sequencerCallback()` → `updateChannelWithInstrument()`
2. **Instrument Processing**: `updateChannelWithInstrument()` → `YM2149.updateChannelWithInstrument()` → register writes
3. **Audio Rendering**: YM2149 register changes → Web Audio API nodes → speaker output

### Design Patterns Employed

- Component composition with React hooks
- Singleton pattern for audio context management
- Web Worker pattern for timing-critical operations
- Observer pattern through Zustand stores
- Factory pattern for instrument creation
- Command pattern for user actions

## Identified Issues

### Issue 1: Console Logging Consolidation

**Impact:** High - Affects debugging, performance, and code clarity

**Problem:** 32 instances of console.log/console.error/console.warn scattered throughout codebase

**Affected Files:**
- `src/hooks/useDataManagement.ts` - 8 instances
- `src/hooks/usePlaybackControls.ts` - 6 instances
- `src/App.tsx` - 5 instances
- `src/utils/songIO.ts` - 4 instances
- `src/exports/*.ts` - 9 instances across multiple files

**Current Behavior:**
- Unconditional console output mixed with DEBUG mode logging
- Inconsistent message formatting
- No log level control
- Performance overhead in production

**Required Solution:** Implement structured logging system that:
- Distinguishes between unconditional output (to be fixed) and DEBUG mode output (to be preserved)
- Provides configurable log levels
- Maintains all existing debug facilities
- Adds context to log messages

### Issue 2: Code Duplication in Value Formatting

**Impact:** Medium - Increases maintenance burden, potential inconsistency

**Problem:** Multiple similar formatting functions across utility files

**Affected Files:**
- `src/utils/valueFormatting.ts` - Base formatting utilities
- `src/utils/hexFormatting.ts` - Duplicate hex formatting logic
- `src/utils/instrumentSelection.ts` - Contains `formatInstrumentSlotId()` similar to other formatters

**Duplicated Patterns:**
- Hex value formatting with padding
- Signed number formatting (+/-)
- Mode value conversion (TONE/NOISE/BOTH)
- Envelope value formatting logic

**Required Solution:** Consolidate into unified formatting utilities with:
- Single source of truth for each format type
- Configurable formatting options
- Consistent API across all formatters

### Issue 3: localStorage Key Management

**Impact:** Medium - Risk of key conflicts, inconsistent patterns

**Problem:** Inconsistent localStorage key patterns throughout application

**Current Patterns Found:**
- Mix of kebab-case: `dosound-tracker-theme`
- Mix of underscore: `dosound_tracker_debug`
- No centralized key management
- Risk of typos and conflicts

**Affected Files:**
- `src/hooks/useAppState.ts`
- `src/hooks/useDataManagement.ts`
- `src/stores/uiStore.ts`

**Required Solution:** Centralized storage key management system with:
- Consistent naming convention
- Type-safe key access
- Single source of truth for all keys
- Migration support for existing data

### Issue 4: App.tsx Complexity

**Impact:** High - Reduces maintainability, increases cognitive load

**Problem:** Large monolithic component with extensive responsibilities

**Metrics:**
- 2538 lines of code
- Manages 40+ state variables
- Contains 50+ event handlers
- Complex prop drilling patterns

**Responsibilities Mixed:**
- State initialization and management
- Event handler definitions
- Modal state management
- Playback control coordination
- File operations handling
- UI state persistence

**Required Solution:** Extract logical sections into focused components and hooks:
- State management extraction
- Event handler grouping
- Modal management separation
- Maintain all existing functionality

### Issue 5: Error Handling Standardization

**Impact:** Medium - Inconsistent error experience, difficult debugging

**Problem:** Mixed error handling approaches across application

**Patterns Found:**
- Some functions throw errors
- Others return error objects
- Inconsistent error message formatting
- Missing error boundaries in some components
- No centralized error handling strategy

**Required Solution:** Standardized error handling system with:
- Typed error hierarchy
- Consistent error propagation patterns
- Centralized error handling
- Severity levels for appropriate responses

## Protected Code Areas

**ABSOLUTE RESTRICTIONS - MUST NOT BE MODIFIED:**

### Audio Generation Components
- **File:** `src/synth/YM2149.ts`
  - All sound chip register manipulation
  - Waveform generation algorithms
  - Audio buffer management
  - Tone and noise generation
  - Real-time audio processing

- **File:** `src/synth/SequencerEngine.ts`
  - Timing engine and cycle management
  - 20ms/40ms playback timing
  - Pattern sequencing logic
  - Audio rendering callbacks

- **File:** `src/workers/sequencerWorker.ts`
  - Web Worker timing loops
  - Real-time event processing
  - Timing-critical operations

### Sequencer and Playback
- **File:** `src/hooks/useSequencer.ts`
  - Audio timing hooks
  - Sequencer state management
  - Playback coordination

- **File:** `src/hooks/useSequencerIntegration.ts`
  - Real-time audio rendering integration
  - Channel updates during playback
  - Audio context coordination

### Audio Processing Functions
- All functions in `updateChannelWithInstrument()` call chain
- All YM2149 register write operations
- All audio buffer processing loops
- All Web Audio API node manipulation related to audio generation

### Debug Facilities
- All DEBUG mode console.log statements (these are intentional)
- Performance monitoring code
- State inspection utilities
- Diagnostic output for troubleshooting

**Rationale:** These components work correctly and ANY modification risks breaking the 20ms/40ms timing cycles or audio output quality.

## Phase 1: Logging Infrastructure

### Objective
Replace scattered console statements with structured logging system that preserves debug facilities.

### Implementation

**New File:** `src/utils/logger.ts`

```typescript
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private debugMode: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.debugMode && this.logLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = Logger.getInstance();
```

### Migration Strategy

**Step 1: Replace Unconditional Console Output**

Target all console statements that are NOT inside DEBUG mode checks:

```typescript
// Before: Unconditional console output (SHOULD BE FIXED)
console.log('Loading song...');
console.error('Failed to parse:', error);

// After: Structured logging
logger.info('Loading song...');
logger.error('Failed to parse', error);
```

**Step 2: Preserve DEBUG Mode Output**

Keep all console statements that are inside DEBUG mode conditionals:

```typescript
// Before: DEBUG mode logging (PRESERVE AS-IS)
if (DEBUG) {
  console.log('Sequencer state:', state);
}

// After: Convert to debug logger
if (DEBUG) {
  logger.debug('Sequencer state', state);
}
```

**Step 3: Replace Console Methods By Priority**

1. Replace all `console.error()` → `logger.error()`
2. Replace all `console.warn()` → `logger.warn()`
3. Replace all `console.info()` → `logger.info()`
4. Replace all `console.log()` → `logger.debug()` or `logger.info()` based on context

**Step 4: Integration with Debug Mode**

```typescript
// In App.tsx or initialization code
import { logger } from './utils/logger';

// When debug mode changes
const handleToggleDebugMode = () => {
  const newDebugMode = !debugMode;
  setDebugMode(newDebugMode);
  logger.setDebugMode(newDebugMode);
};
```

### Files to Modify

Priority order based on number of console statements:

1. `src/hooks/useDataManagement.ts` (8 instances)
2. `src/exports/` directory (9 instances total)
3. `src/hooks/usePlaybackControls.ts` (6 instances)
4. `src/App.tsx` (5 instances)
5. `src/utils/songIO.ts` (4 instances)
6. All remaining files with console statements

### Testing Requirements

**Unit Tests for Logger Class:**

```typescript
describe('Logger', () => {
  let logger: Logger;
  
  beforeEach(() => {
    logger = Logger.getInstance();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  it('should filter messages based on log level', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const debugSpy = vi.spyOn(console, 'debug');
    
    logger.setLogLevel(LogLevel.ERROR);
    logger.error('Error message');
    logger.debug('Debug message');
    
    expect(errorSpy).toHaveBeenCalledWith('[ERROR] Error message');
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('should respect debug mode', () => {
    const debugSpy = vi.spyOn(console, 'debug');
    
    logger.setDebugMode(false);
    logger.debug('Should not appear');
    expect(debugSpy).not.toHaveBeenCalled();
    
    logger.setDebugMode(true);
    logger.debug('Should appear');
    expect(debugSpy).toHaveBeenCalledWith('[DEBUG] Should appear');
  });

  it('should handle multiple arguments', () => {
    const errorSpy = vi.spyOn(console, 'error');
    const obj = { key: 'value' };
    
    logger.error('Error with object', obj, 123);
    expect(errorSpy).toHaveBeenCalledWith('[ERROR] Error with object', obj, 123);
  });
});
```

**Integration Tests:**

```typescript
describe('Logger Integration', () => {
  it('should integrate with debug mode toggle', () => {
    const logger = Logger.getInstance();
    const debugSpy = vi.spyOn(console, 'debug');
    
    // Simulate debug mode off
    logger.setDebugMode(false);
    logger.debug('Hidden message');
    expect(debugSpy).not.toHaveBeenCalled();
    
    // Simulate debug mode on
    logger.setDebugMode(true);
    logger.debug('Visible message');
    expect(debugSpy).toHaveBeenCalled();
  });
});
```

**Manual Validation:**
- Verify debug mode toggle shows/hides debug messages
- Confirm no performance impact in production mode
- Validate all error messages still appear correctly

## Phase 2: Utility Consolidation

### Objective
Eliminate code duplication by consolidating formatting utilities into unified modules.

### Value Formatting Consolidation

**New File:** `src/utils/formatters.ts`

```typescript
export interface FormatOptions {
  padWidth?: number;
  uppercase?: boolean;
  prefix?: string;
  suffix?: string;
}

export class Formatter {
  /**
   * Format number as hexadecimal string
   * @param value - Number to format
   * @param options - Formatting options
   * @returns Formatted hex string
   */
  static hex(value: number, options: FormatOptions = {}): string {
    const { padWidth = 2, uppercase = true, prefix = '', suffix = '' } = options;
    const hex = Math.abs(value).toString(16);
    const padded = hex.padStart(padWidth, '0');
    const formatted = uppercase ? padded.toUpperCase() : padded;
    return `${prefix}${formatted}${suffix}`;
  }

  /**
   * Format number with sign prefix
   * @param value - Number to format
   * @returns Signed string (e.g., "+5", "-3")
   */
  static signed(value: number): string {
    return value >= 0 ? `+${value}` : value.toString();
  }

  /**
   * Format mode value as string
   * @param value - Mode number (0=TONE, 1=NOISE, 2=BOTH)
   * @returns Mode name string
   */
  static mode(value: number): string {
    switch (value) {
      case 0: return 'TONE';
      case 1: return 'NOISE';
      case 2: return 'BOTH';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Format envelope value based on type
   * @param type - Envelope parameter type
   * @param value - Value to format
   * @returns Formatted string appropriate for type
   */
  static envelopeValue(type: string, value: number): string {
    switch (type) {
      case 'volume':
      case 'noise':
        return Formatter.hex(value);
      case 'shift':
      case 'pitch':
        return Formatter.signed(value);
      case 'mode':
        return Formatter.mode(value);
      default:
        return value.toString();
    }
  }

  /**
   * Format instrument ID to consistent format
   * @param value - Raw instrument ID (number, string, or null)
   * @returns Normalized 2-digit hex string or empty string
   */
  static instrumentId(value?: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'number') {
      return Formatter.hex(value, { padWidth: 2, uppercase: true });
    }
    
    if (typeof value === 'string') {
      const parsed = parseInt(value, 16);
      if (isNaN(parsed)) {
        return '';
      }
      return Formatter.hex(parsed, { padWidth: 2, uppercase: true });
    }
    
    return '';
  }

  /**
   * Format instrument slot ID with prefix
   * @param slotIndex - Slot index number
   * @returns Formatted slot ID (e.g., "INST 01")
   */
  static instrumentSlot(slotIndex: number): string {
    return `INST ${Formatter.hex(slotIndex, { padWidth: 2, uppercase: true })}`;
  }
}
```

### Migration Strategy

**Step 1: Update Existing Utility Files**

Replace implementations in these files with calls to Formatter:

1. `src/utils/valueFormatting.ts`:
```typescript
// Before
export function formatHexValue(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

// After
import { Formatter } from './formatters';
export function formatHexValue(value: number): string {
  return Formatter.hex(value);
}
```

2. `src/utils/hexFormatting.ts`:
```typescript
// This file can be deprecated or become a re-export
export { Formatter as HexFormatter } from './formatters';
```

3. `src/utils/instrumentSelection.ts`:
```typescript
// Before
export function formatInstrumentSlotId(index: number): string {
  const hex = index.toString(16).padStart(2, '0').toUpperCase();
  return `INST ${hex}`;
}

// After
import { Formatter } from './formatters';
export function formatInstrumentSlotId(index: number): string {
  return Formatter.instrumentSlot(index);
}
```

**Step 2: Update All Import Statements**

Search for imports of old utility functions and update to use Formatter:

```typescript
// Before
import { formatHexValue } from './utils/hexFormatting';
import { formatInstrumentSlotId } from './utils/instrumentSelection';

// After
import { Formatter } from './utils/formatters';

// Usage
const hex = Formatter.hex(value);
const slot = Formatter.instrumentSlot(index);
```

**Step 3: Consolidate Duplicate Logic**

Find all instances of duplicate formatting code and replace:

```typescript
// Before: Inline formatting scattered in components
const hexValue = value.toString(16).padStart(2, '0').toUpperCase();

// After: Consolidated formatter
const hexValue = Formatter.hex(value);
```

### Testing Requirements

**Unit Tests for Formatter Class:**

```typescript
describe('Formatter', () => {
  describe('hex', () => {
    it('should format numbers as hex strings', () => {
      expect(Formatter.hex(0)).toBe('00');
      expect(Formatter.hex(15)).toBe('0F');
      expect(Formatter.hex(255)).toBe('FF');
    });

    it('should handle custom pad widths', () => {
      expect(Formatter.hex(15, { padWidth: 4 })).toBe('000F');
      expect(Formatter.hex(255, { padWidth: 1 })).toBe('FF');
    });

    it('should handle uppercase option', () => {
      expect(Formatter.hex(255, { uppercase: true })).toBe('FF');
      expect(Formatter.hex(255, { uppercase: false })).toBe('ff');
    });

    it('should handle prefix and suffix', () => {
      expect(Formatter.hex(15, { prefix: '0x' })).toBe('0x0F');
      expect(Formatter.hex(15, { suffix: 'h' })).toBe('0Fh');
    });

    it('should handle negative numbers', () => {
      expect(Formatter.hex(-10)).toBe('0A');
    });
  });

  describe('signed', () => {
    it('should format positive numbers with plus sign', () => {
      expect(Formatter.signed(5)).toBe('+5');
      expect(Formatter.signed(0)).toBe('+0');
    });

    it('should format negative numbers with minus sign', () => {
      expect(Formatter.signed(-5)).toBe('-5');
    });
  });

  describe('mode', () => {
    it('should format mode values correctly', () => {
      expect(Formatter.mode(0)).toBe('TONE');
      expect(Formatter.mode(1)).toBe('NOISE');
      expect(Formatter.mode(2)).toBe('BOTH');
    });

    it('should handle invalid mode values', () => {
      expect(Formatter.mode(99)).toBe('UNKNOWN');
    });
  });

  describe('envelopeValue', () => {
    it('should format volume as hex', () => {
      expect(Formatter.envelopeValue('volume', 15)).toBe('0F');
    });

    it('should format pitch as signed', () => {
      expect(Formatter.envelopeValue('pitch', 5)).toBe('+5');
      expect(Formatter.envelopeValue('pitch', -3)).toBe('-3');
    });

    it('should format mode as string', () => {
      expect(Formatter.envelopeValue('mode', 0)).toBe('TONE');
    });
  });

  describe('instrumentId', () => {
    it('should handle numeric input', () => {
      expect(Formatter.instrumentId(15)).toBe('0F');
      expect(Formatter.instrumentId(0)).toBe('00');
    });

    it('should handle string hex input', () => {
      expect(Formatter.instrumentId('A')).toBe('0A');
      expect(Formatter.instrumentId('0F')).toBe('0F');
    });

    it('should handle null/undefined', () => {
      expect(Formatter.instrumentId(null)).toBe('');
      expect(Formatter.instrumentId(undefined)).toBe('');
    });

    it('should handle invalid strings', () => {
      expect(Formatter.instrumentId('invalid')).toBe('');
    });
  });

  describe('instrumentSlot', () => {
    it('should format slot IDs', () => {
      expect(Formatter.instrumentSlot(0)).toBe('INST 00');
      expect(Formatter.instrumentSlot(15)).toBe('INST 0F');
      expect(Formatter.instrumentSlot(255)).toBe('INST FF');
    });
  });
});
```

**Regression Tests:**

```typescript
describe('Formatter Regression Tests', () => {
  it('should produce identical output to old formatHexValue', () => {
    const testCases = [0, 1, 15, 16, 255];
    testCases.forEach(value => {
      const oldResult = value.toString(16).padStart(2, '0').toUpperCase();
      const newResult = Formatter.hex(value);
      expect(newResult).toBe(oldResult);
    });
  });

  it('should produce identical output to old formatInstrumentSlotId', () => {
    const testCases = [0, 5, 10, 15];
    testCases.forEach(index => {
      const oldResult = `INST ${index.toString(16).padStart(2, '0').toUpperCase()}`;
      const newResult = Formatter.instrumentSlot(index);
      expect(newResult).toBe(oldResult);
    });
  });
});
```

**Performance Tests:**

```typescript
describe('Formatter Performance', () => {
  it('should format 1000 hex values efficiently', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      Formatter.hex(i);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10); // Should complete in under 10ms
  });
});
```

## Phase 3: Storage Key Management

### Objective
Centralize localStorage key management to prevent conflicts and ensure consistency.

### Implementation

**New File:** `src/utils/storageKeys.ts`

```typescript
export enum StorageNamespace {
  DOSOUND_TRACKER = 'dosound-tracker'
}

export class StorageKeyManager {
  private static keys = new Map<string, string>();

  /**
   * Generate a storage key with namespace
   * @param category - Key category (ui, data, export, etc.)
   * @param key - Specific key name
   * @returns Full storage key with namespace
   */
  static getKey(category: string, key: string): string {
    const fullKey = `${StorageNamespace.DOSOUND_TRACKER}-${category}-${key}`;
    
    if (!this.keys.has(fullKey)) {
      this.keys.set(fullKey, fullKey);
    }
    
    return this.keys.get(fullKey)!;
  }

  /**
   * Get all registered keys
   * @returns Array of all storage keys
   */
  static getAllKeys(): string[] {
    return Array.from(this.keys.values());
  }

  /**
   * Check if a key exists in localStorage
   * @param category - Key category
   * @param key - Specific key name
   * @returns True if key exists
   */
  static hasKey(category: string, key: string): boolean {
    const fullKey = this.getKey(category, key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * Migrate old key format to new format
   * @param oldKey - Old key name
   * @param category - New key category
   * @param key - New key name
   */
  static migrateKey(oldKey: string, category: string, key: string): void {
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue !== null) {
      const newKey = this.getKey(category, key);
      localStorage.setItem(newKey, oldValue);
      localStorage.removeItem(oldKey);
    }
  }

  // Predefined keys for consistency
  static readonly KEYS = {
    // UI State
    THEME: this.getKey('ui', 'theme'),
    DEBUG_MODE: this.getKey('ui', 'debug-mode'),
    EQ_MUTES: this.getKey('ui', 'eq-mutes'),
    INSTRUMENT_OCTAVES: this.getKey('ui', 'instrument-octaves'),
    TRACK_BACKGROUND: this.getKey('ui', 'track-background'),
    COMMAND_PANEL_MOBILE: this.getKey('ui', 'command-panel-mobile'),
    
    // Export settings
    EXPORT_TYPE: this.getKey('export', 'type'),
    DUMP_MODE: this.getKey('export', 'dump-mode'),
    
    // Transpose settings
    TRANSPOSE_SETTINGS: this.getKey('transpose', 'settings'),
    
    // Data
    SONG: this.getKey('data', 'song'),
    INSTRUMENT: this.getKey('data', 'instrument'),
    
    // Clipboard
    PASTE_TRACK_MODE: this.getKey('clipboard', 'paste-track-mode')
  } as const;
}

/**
 * Migration function to run on app initialization
 * Migrates old localStorage keys to new format
 */
export function migrateStorageKeys(): void {
  // Map old keys to new keys
  const migrations = [
    { old: 'dosound-tracker-theme', category: 'ui', key: 'theme' },
    { old: 'dosound_tracker_debug', category: 'ui', key: 'debug-mode' },
    { old: 'eq-mutes', category: 'ui', key: 'eq-mutes' },
    { old: 'instrument-octaves', category: 'ui', key: 'instrument-octaves' },
    { old: 'track-background', category: 'ui', key: 'track-background' },
    { old: 'command-panel-mobile', category: 'ui', key: 'command-panel-mobile' },
    { old: 'export-type', category: 'export', key: 'type' },
    { old: 'dump-mode', category: 'export', key: 'dump-mode' },
    { old: 'transpose-settings', category: 'transpose', key: 'settings' },
    { old: 'song', category: 'data', key: 'song' },
    { old: 'instrument', category: 'data', key: 'instrument' },
    { old: 'paste-track-mode', category: 'clipboard', key: 'paste-track-mode' }
  ];

  migrations.forEach(({ old, category, key }) => {
    StorageKeyManager.migrateKey(old, category, key);
  });
}
```

### Migration Strategy

**Step 1: Initialize Storage Key Manager**

Add migration call to app initialization:

```typescript
// In App.tsx or main entry point
import { migrateStorageKeys } from './utils/storageKeys';

function App() {
  useEffect(() => {
    // Run migration on first load
    migrateStorageKeys();
  }, []);
  
  // ... rest of component
}
```

**Step 2: Update Hook Usage**

Replace all localStorage calls with StorageKeyManager:

```typescript
// Before: Direct localStorage access
const theme = localStorage.getItem('dosound-tracker-theme');
localStorage.setItem('dosound-tracker-theme', 'dark');

// After: Using StorageKeyManager
import { StorageKeyManager } from '../utils/storageKeys';

const theme = localStorage.getItem(StorageKeyManager.KEYS.THEME);
localStorage.setItem(StorageKeyManager.KEYS.THEME, 'dark');
```

**Step 3: Update All Affected Files**

Files requiring updates:

1. `src/hooks/useAppState.ts` - UI state persistence
2. `src/hooks/useDataManagement.ts` - Song/instrument data
3. `src/stores/uiStore.ts` - UI settings storage
4. All other hooks/components using localStorage

### Testing Requirements

**Unit Tests for StorageKeyManager:**

```typescript
describe('StorageKeyManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getKey', () => {
    it('should generate consistent keys', () => {
      const key1 = StorageKeyManager.getKey('ui', 'theme');
      const key2 = StorageKeyManager.getKey('ui', 'theme');
      expect(key1).toBe(key2);
      expect(key1).toBe('dosound-tracker-ui-theme');
    });

    it('should handle different categories', () => {
      const uiKey = StorageKeyManager.getKey('ui', 'test');
      const dataKey = StorageKeyManager.getKey('data', 'test');
      expect(uiKey).not.toBe(dataKey);
    });
  });

  describe('hasKey', () => {
    it('should detect existing keys', () => {
      const key = StorageKeyManager.KEYS.THEME;
      expect(StorageKeyManager.hasKey('ui', 'theme')).toBe(false);
      
      localStorage.setItem(key, 'dark');
      expect(StorageKeyManager.hasKey('ui', 'theme')).toBe(true);
    });
  });

  describe('migrateKey', () => {
    it('should migrate old keys to new format', () => {
      localStorage.setItem('old-key', 'test-value');
      
      StorageKeyManager.migrateKey('old-key', 'ui', 'new-key');
      
      const newKey = StorageKeyManager.getKey('ui', 'new-key');
      expect(localStorage.getItem(newKey)).toBe('test-value');
      expect(localStorage.getItem('old-key')).toBeNull();
    });

    it('should handle non-existent old keys', () => {
      expect(() => {
        StorageKeyManager.migrateKey('non-existent', 'ui', 'test');
      }).not.toThrow();
    });
  });

  describe('predefined keys', () => {
    it('should have all required keys defined', () => {
      expect(StorageKeyManager.KEYS.THEME).toBeDefined();
      expect(StorageKeyManager.KEYS.DEBUG_MODE).toBeDefined();
      expect(StorageKeyManager.KEYS.SONG).toBeDefined();
      expect(StorageKeyManager.KEYS.INSTRUMENT).toBeDefined();
    });
  });
});
```

**Migration Tests:**

```typescript
describe('migrateStorageKeys', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should migrate all old keys', () => {
    // Set up old keys
    localStorage.setItem('dosound-tracker-theme', 'dark');
    localStorage.setItem('dosound_tracker_debug', 'true');
    localStorage.setItem('song', '{"name":"test"}');
    
    // Run migration
    migrateStorageKeys();
    
    // Verify new keys exist
    expect(localStorage.getItem(StorageKeyManager.KEYS.THEME)).toBe('dark');
    expect(localStorage.getItem(StorageKeyManager.KEYS.DEBUG_MODE)).toBe('true');
    expect(localStorage.getItem(StorageKeyManager.KEYS.SONG)).toBe('{"name":"test"}');
    
    // Verify old keys removed
    expect(localStorage.getItem('dosound-tracker-theme')).toBeNull();
    expect(localStorage.getItem('dosound_tracker_debug')).toBeNull();
    expect(localStorage.getItem('song')).toBeNull();
  });

  it('should be idempotent', () => {
    localStorage.setItem('dosound-tracker-theme', 'dark');
    
    migrateStorageKeys();
    const value1 = localStorage.getItem(StorageKeyManager.KEYS.THEME);
    
    migrateStorageKeys();
    const value2 = localStorage.getItem(StorageKeyManager.KEYS.THEME);
    
    expect(value1).toBe(value2);
  });
});
```

**Integration Tests:**

```typescript
describe('StorageKeyManager Integration', () => {
  it('should work with localStorage operations', () => {
    const key = StorageKeyManager.KEYS.THEME;
    
    localStorage.setItem(key, 'dark');
    expect(localStorage.getItem(key)).toBe('dark');
    
    localStorage.removeItem(key);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('should prevent key conflicts', () => {
    const uiTheme = StorageKeyManager.getKey('ui', 'theme');
    const dataTheme = StorageKeyManager.getKey('data', 'theme');
    
    localStorage.setItem(uiTheme, 'dark');
    localStorage.setItem(dataTheme, 'light');
    
    expect(localStorage.getItem(uiTheme)).toBe('dark');
    expect(localStorage.getItem(dataTheme)).toBe('light');
  });
});
```

## Phase 4: App.tsx Decomposition

### Objective
Reduce App.tsx complexity by extracting logical sections into focused hooks and components.

### Current State Analysis

**App.tsx Metrics:**
- Total lines: 2538
- State variables: 40+
- Event handlers: 50+
- Responsibilities: 6+ major areas

**Component Responsibilities:**
1. State initialization and management
2. Playback control coordination
3. File operations (load/save)
4. Modal state management
5. MIDI integration
6. UI state persistence

### Implementation Strategy

**New File:** `src/hooks/useAppEventHandlers.ts`

```typescript
import { useCallback } from 'react';
import { logger } from '../utils/logger';

export interface AppEventHandlers {
  // Playback handlers
  handleStartSong: () => void;
  handleStop: () => void;
  handleStartLinePlayback: () => void;
  handleStartPatternPlayback: () => void;
  
  // File operation handlers
  handleLoadSong: (file: File) => Promise<void>;
  handleSaveSong: () => void;
  handleLoadInstrument: (content: string) => void;
  handleSaveInstrument: () => void;
  
  // UI state handlers
  handleOctaveChange: (octave: number) => void;
  handleToggleDebugMode: () => void;
  handleToggleTheme: () => void;
  
  // Track operation handlers
  handleInsertLine: () => void;
  handleDeleteLine: () => void;
  handleClearLine: () => void;
}

export interface UseAppEventHandlersParams {
  // Dependencies for event handlers
  currentSong: Song | null;
  sequencerState: SequencerState;
  startSong: () => void;
  stop: () => void;
  loadSongFromFile: (file: File) => Promise<void>;
  saveSong: () => void;
  // ... other dependencies
}

export function useAppEventHandlers(
  params: UseAppEventHandlersParams
): AppEventHandlers {
  const {
    currentSong,
    sequencerState,
    startSong,
    stop,
    loadSongFromFile,
    saveSong,
  } = params;

  const handleStartSong = useCallback(() => {
    if (!currentSong) {
      logger.warn('Cannot start song: no song loaded');
      return;
    }
    
    if (sequencerState.isPlaying) {
      logger.info('Song already playing');
      return;
    }
    
    startSong();
  }, [currentSong, sequencerState.isPlaying, startSong]);

  const handleStop = useCallback(() => {
    if (!sequencerState.isPlaying) {
      return;
    }
    stop();
  }, [sequencerState.isPlaying, stop]);

  const handleLoadSong = useCallback(async (file: File) => {
    try {
      await loadSongFromFile(file);
      logger.info('Song loaded successfully', file.name);
    } catch (error) {
      logger.error('Failed to load song', error);
      throw error;
    }
  }, [loadSongFromFile]);

  const handleSaveSong = useCallback(() => {
    if (!currentSong) {
      logger.warn('Cannot save: no song loaded');
      return;
    }
    
    try {
      saveSong();
      logger.info('Song saved successfully');
    } catch (error) {
      logger.error('Failed to save song', error);
      throw error;
    }
  }, [currentSong, saveSong]);

  // ... implement other handlers

  return {
    handleStartSong,
    handleStop,
    handleStartLinePlayback,
    handleStartPatternPlayback,
    handleLoadSong,
    handleSaveSong,
    handleLoadInstrument,
    handleSaveInstrument,
    handleOctaveChange,
    handleToggleDebugMode,
    handleToggleTheme,
    handleInsertLine,
    handleDeleteLine,
    handleClearLine,
  };
}
```

**New File:** `src/hooks/useAppModalState.ts`

```typescript
import { useState, useCallback } from 'react';

export interface ModalState {
  isOpen: boolean;
  modalType: ModalType | null;
  modalData: unknown;
}

export type ModalType = 
  | 'about'
  | 'settings'
  | 'export'
  | 'import'
  | 'help'
  | 'shortcuts';

export interface UseAppModalState {
  modalState: ModalState;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
}

export function useAppModalState(): UseAppModalState {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    modalType: null,
    modalData: null,
  });

  const openModal = useCallback((type: ModalType, data?: unknown) => {
    setModalState({
      isOpen: true,
      modalType: type,
      modalData: data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      modalType: null,
      modalData: null,
    });
  }, []);

  return {
    modalState,
    openModal,
    closeModal,
  };
}
```

**New File:** `src/hooks/useAppInitialization.ts`

```typescript
import { useEffect } from 'react';
import { migrateStorageKeys } from '../utils/storageKeys';
import { logger } from '../utils/logger';

export interface UseAppInitializationParams {
  debugMode: boolean;
  loadPersistedData: () => void;
  initializeAudioContext: () => void;
}

export function useAppInitialization(
  params: UseAppInitializationParams
): void {
  const { debugMode, loadPersistedData, initializeAudioContext } = params;

  useEffect(() => {
    logger.info('Initializing DOSOUND Tracker');
    
    // Migrate storage keys
    migrateStorageKeys();
    
    // Set debug mode
    logger.setDebugMode(debugMode);
    
    // Load persisted data
    loadPersistedData();
    
    // Initialize audio
    initializeAudioContext();
    
    logger.info('Initialization complete');
  }, [debugMode, loadPersistedData, initializeAudioContext]);
}
```

### Migration Strategy

**Step 1: Extract Event Handlers**

1. Identify all event handler functions in App.tsx
2. Group related handlers by functionality
3. Move to `useAppEventHandlers` hook
4. Update App.tsx to use the hook:

```typescript
// In App.tsx
import { useAppEventHandlers } from './hooks/useAppEventHandlers';

function App() {
  // ... existing state and hooks
  
  const eventHandlers = useAppEventHandlers({
    currentSong,
    sequencerState,
    startSong,
    stop,
    loadSongFromFile,
    saveSong,
    // ... other dependencies
  });
  
  // Now use eventHandlers.handleStartSong, etc.
}
```

**Step 2: Extract Modal Management**

1. Replace modal state variables with `useAppModalState` hook
2. Update all modal-related code to use new hook:

```typescript
// In App.tsx
import { useAppModalState } from './hooks/useAppModalState';

function App() {
  const { modalState, openModal, closeModal } = useAppModalState();
  
  // Use openModal('about') instead of setShowAboutModal(true)
}
```

**Step 3: Extract Initialization Logic**

1. Move initialization code to `useAppInitialization` hook
2. Simplify App.tsx useEffect:

```typescript
// In App.tsx
import { useAppInitialization } from './hooks/useAppInitialization';

function App() {
  useAppInitialization({
    debugMode,
    loadPersistedData,
    initializeAudioContext,
  });
}
```

**Step 4: Validate Functionality**

After each extraction:
1. Test all affected features
2. Verify no regressions
3. Check performance impact
4. Ensure state updates work correctly

### Testing Requirements

**Unit Tests for useAppEventHandlers:**

```typescript
describe('useAppEventHandlers', () => {
  const mockParams = {
    currentSong: mockSong,
    sequencerState: { isPlaying: false },
    startSong: vi.fn(),
    stop: vi.fn(),
    loadSongFromFile: vi.fn(),
    saveSong: vi.fn(),
  };

  it('should start song when valid', () => {
    const { result } = renderHook(() => useAppEventHandlers(mockParams));
    
    act(() => {
      result.current.handleStartSong();
    });
    
    expect(mockParams.startSong).toHaveBeenCalled();
  });

  it('should not start song when already playing', () => {
    const params = {
      ...mockParams,
      sequencerState: { isPlaying: true },
    };
    
    const { result } = renderHook(() => useAppEventHandlers(params));
    
    act(() => {
      result.current.handleStartSong();
    });
    
    expect(mockParams.startSong).not.toHaveBeenCalled();
  });

  it('should handle load song errors', async () => {
    const error = new Error('Load failed');
    mockParams.loadSongFromFile.mockRejectedValue(error);
    
    const { result } = renderHook(() => useAppEventHandlers(mockParams));
    
    await expect(
      result.current.handleLoadSong(new File([], 'test.yaml'))
    ).rejects.toThrow('Load failed');
  });
});
```

**Integration Tests:**

```typescript
describe('App.tsx Integration', () => {
  it('should maintain functionality after refactoring', () => {
    render(<App />);
    
    // Test playback controls
    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);
    
    // Verify sequencer started
    // ... assertions
  });

  it('should handle file operations', async () => {
    render(<App />);
    
    const file = new File(['song data'], 'test.yaml', { type: 'text/yaml' });
    const input = screen.getByLabelText(/load song/i);
    
    await userEvent.upload(input, file);
    
    // Verify song loaded
    // ... assertions
  });
});
```

## Phase 5: Error Handling Standardization

### Objective
Implement consistent error handling with typed errors and centralized handling logic.

### Implementation

**New File:** `src/types/errors.ts`

```typescript
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly severity: 'low' | 'medium' | 'high';
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class FileOperationError extends AppError {
  readonly code = 'FILE_OPERATION_ERROR';
  readonly severity: 'medium' | 'high';
  
  constructor(
    message: string,
    public readonly operation: 'load' | 'save' | 'parse',
    public readonly fileType?: string,
    severity: 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.severity = severity;
  }
}

export class AudioError extends AppError {
  readonly code = 'AUDIO_ERROR';
  readonly severity = 'high' as const;
  
  constructor(
    message: string,
    public readonly context?: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly severity = 'low' as const;
  
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
  }
}

export class StateError extends AppError {
  readonly code = 'STATE_ERROR';
  readonly severity = 'medium' as const;
  
  constructor(
    message: string,
    public readonly stateName?: string
  ) {
    super(message);
  }
}

export class MIDIError extends AppError {
  readonly code = 'MIDI_ERROR';
  readonly severity = 'medium' as const;
  
  constructor(
    message: string,
    public readonly midiMessage?: unknown
  ) {
    super(message);
  }
}
```

**New File:** `src/utils/errorHandler.ts`

```typescript
import { AppError } from '../types/errors';
import { logger } from './logger';

export interface ErrorHandlerOptions {
  context?: string;
  showToUser?: boolean;
  fatal?: boolean;
}

export class ErrorHandler {
  private static userNotificationCallback?: (message: string, severity: string) => void;
  
  /**
   * Register callback for user notifications
   * @param callback - Function to call when user should be notified
   */
  static setUserNotificationCallback(
    callback: (message: string, severity: string) => void
  ): void {
    this.userNotificationCallback = callback;
  }
  
  /**
   * Handle any error with appropriate logging and user notification
   * @param error - Error to handle
   * @param options - Handling options
   */
  static handle(error: unknown, options: ErrorHandlerOptions = {}): void {
    const { context, showToUser = false, fatal = false } = options;
    
    if (error instanceof AppError) {
      this.handleAppError(error, context, showToUser);
    } else {
      this.handleUnknownError(error, context, showToUser);
    }
    
    if (fatal) {
      throw error;
    }
  }
  
  private static handleAppError(
    error: AppError,
    context?: string,
    showToUser?: boolean
  ): void {
    const contextStr = context ? `[${context}] ` : '';
    const fullMessage = `${contextStr}${error.message}`;
    
    switch (error.severity) {
      case 'low':
        logger.warn(fullMessage, error);
        break;
      case 'medium':
        logger.error(fullMessage, error);
        if (showToUser && this.userNotificationCallback) {
          this.userNotificationCallback(error.message, 'warning');
        }
        break;
      case 'high':
        logger.error(`FATAL: ${fullMessage}`, error);
        if (this.userNotificationCallback) {
          this.userNotificationCallback(
            error.message,
            'error'
          );
        }
        break;
    }
  }
  
  private static handleUnknownError(
    error: unknown,
    context?: string,
    showToUser?: boolean
  ): void {
    const contextStr = context ? `[${context}] ` : '';
    const message = error instanceof Error ? error.message : String(error);
    const fullMessage = `${contextStr}Unknown error: ${message}`;
    
    logger.error(fullMessage, error);
    
    if (showToUser && this.userNotificationCallback) {
      this.userNotificationCallback(
        'An unexpected error occurred',
        'error'
      );
    }
  }
  
  /**
   * Wrap async function with error handling
   * @param fn - Async function to wrap
   * @param options - Error handling options
   * @returns Wrapped function
   */
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: ErrorHandlerOptions = {}
  ): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, options);
        throw error;
      }
    }) as T;
  }
  
  /**
   * Wrap sync function with error handling
   * @param fn - Function to wrap
   * @param options - Error handling options
   * @returns Wrapped function
   */
  static wrap<T extends (...args: any[]) => any>(
    fn: T,
    options: ErrorHandlerOptions = {}
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      try {
        return fn(...args);
      } catch (error) {
        this.handle(error, options);
        throw error;
      }
    }) as T;
  }
}
```

### Migration Strategy

**Step 1: Replace Generic Errors with Typed Errors**

Identify all `throw new Error()` and replace with appropriate typed errors:

```typescript
// Before
throw new Error('Failed to load song');

// After
import { FileOperationError } from '../types/errors';
throw new FileOperationError(
  'Failed to load song',
  'load',
  'yaml',
  'high'
);
```

**Step 2: Update Try-Catch Blocks**

Replace manual error logging with ErrorHandler:

```typescript
// Before
try {
  await loadSong(file);
} catch (error) {
  console.error('Load failed:', error);
}

// After
import { ErrorHandler } from '../utils/errorHandler';

try {
  await loadSong(file);
} catch (error) {
  ErrorHandler.handle(error, {
    context: 'loadSong',
    showToUser: true
  });
}
```

**Step 3: Wrap Critical Functions**

Use ErrorHandler.wrap for functions that should never fail silently:

```typescript
// Wrap file operations
const handleLoadSong = ErrorHandler.wrapAsync(
  async (file: File) => {
    // Implementation
  },
  { context: 'handleLoadSong', showToUser: true }
);
```

**Step 4: Integrate User Notifications**

Set up notification callback in App.tsx:

```typescript
// In App.tsx
import { ErrorHandler } from './utils/errorHandler';

function App() {
  const [notification, setNotification] = useState<{
    message: string;
    severity: string;
  } | null>(null);
  
  useEffect(() => {
    ErrorHandler.setUserNotificationCallback((message, severity) => {
      setNotification({ message, severity });
      setTimeout(() => setNotification(null), 5000);
    });
  }, []);
  
  // ... render notification component
}
```

### Testing Requirements

**Unit Tests for Error Types:**

```typescript
describe('AppError types', () => {
  describe('FileOperationError', () => {
    it('should create error with correct properties', () => {
      const error = new FileOperationError(
        'Test message',
        'load',
        'yaml',
        'high'
      );
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('FILE_OPERATION_ERROR');
      expect(error.operation).toBe('load');
      expect(error.fileType).toBe('yaml');
      expect(error.severity).toBe('high');
      expect(error.name).toBe('FileOperationError');
    });
    
    it('should have proper stack trace', () => {
      const error = new FileOperationError('Test', 'load');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('FileOperationError');
    });
  });
  
  describe('ValidationError', () => {
    it('should store field and value', () => {
      const error = new ValidationError(
        'Invalid value',
        'octave',
        10
      );
      
      expect(error.field).toBe('octave');
      expect(error.value).toBe(10);
      expect(error.severity).toBe('low');
    });
  });
});
```

**Unit Tests for ErrorHandler:**

```typescript
describe('ErrorHandler', () => {
  let loggerErrorSpy: vi.SpyInstance;
  let loggerWarnSpy: vi.SpyInstance;
  
  beforeEach(() => {
    loggerErrorSpy = vi.spyOn(logger, 'error');
    loggerWarnSpy = vi.spyOn(logger, 'warn');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('handle', () => {
    it('should handle AppError with correct severity', () => {
      const error = new ValidationError('Test error');
      ErrorHandler.handle(error);
      
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Test error',
        error
      );
    });
    
    it('should handle high severity errors', () => {
      const error = new AudioError('Critical error');
      ErrorHandler.handle(error);
      
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'FATAL: Critical error',
        error
      );
    });
    
    it('should include context in message', () => {
      const error = new FileOperationError('Load failed', 'load');
      ErrorHandler.handle(error, { context: 'useDataManagement' });
      
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        '[useDataManagement] Load failed',
        error
      );
    });
    
    it('should trigger user notification when requested', () => {
      const callback = vi.fn();
      ErrorHandler.setUserNotificationCallback(callback);
      
      const error = new FileOperationError('Load failed', 'load', 'yaml', 'high');
      ErrorHandler.handle(error, { showToUser: true });
      
      expect(callback).toHaveBeenCalledWith('Load failed', 'error');
    });
  });
  
  describe('wrapAsync', () => {
    it('should catch and handle errors', async () => {
      const error = new ValidationError('Test error');
      const fn = async () => {
        throw error;
      };
      
      const wrapped = ErrorHandler.wrapAsync(fn, { context: 'test' });
      
      await expect(wrapped()).rejects.toThrow(error);
      expect(loggerWarnSpy).toHaveBeenCalledWith('[test] Test error', error);
    });
    
    it('should not interfere with successful execution', async () => {
      const fn = async (x: number) => x * 2;
      const wrapped = ErrorHandler.wrapAsync(fn);
      
      const result = await wrapped(5);
      expect(result).toBe(10);
    });
  });
});
```

**Integration Tests:**

```typescript
describe('Error Handling Integration', () => {
  it('should handle file load errors end-to-end', async () => {
    const mockFile = new File(['invalid'], 'test.yaml');
    
    render(<App />);
    
    const input = screen.getByLabelText(/load song/i);
    await userEvent.upload(input, mockFile);
    
    // Should show error notification
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load/i);
    });
  });
  
  it('should recover from validation errors', () => {
    render(<App />);
    
    const octaveInput = screen.getByLabelText(/octave/i);
    fireEvent.change(octaveInput, { target: { value: '10' } });
    
    // Should show validation error
    expect(screen.getByText(/invalid octave/i)).toBeInTheDocument();
    
    // Should allow correction
    fireEvent.change(octaveInput, { target: { value: '4' } });
    expect(screen.queryByText(/invalid octave/i)).not.toBeInTheDocument();
  });
});
```

## Testing Strategy

### Testing Approach

All refactored functions require comprehensive testing to verify behavior before and after changes.

### Unit Test Requirements

**Coverage Goals:**
- Logger system: 100% statement and branch coverage
- Formatter utilities: 100% coverage with edge cases
- Storage key management: 100% coverage including migration
- Error types and handlers: 95% coverage
- Extracted hooks: 90% coverage

**Test Structure for Each Refactored Function:**

```typescript
describe('[FunctionName]', () => {
  // Test normal operation
  it('should handle valid input correctly', () => {
    // Arrange
    const input = validTestInput;
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expectedOutput);
  });
  
  // Test edge cases
  it('should handle edge case: [description]', () => {
    // Test boundary values, empty inputs, etc.
  });
  
  // Test error conditions
  it('should throw error for invalid input', () => {
    expect(() => functionUnderTest(invalidInput)).toThrow(ExpectedError);
  });
  
  // Test integration points
  it('should integrate correctly with [dependency]', () => {
    // Test interaction with other functions/modules
  });
});
```

### Integration Test Requirements

**Scope:** Test module interactions and data flow

**Critical Paths to Test:**
1. Complete playback workflow (load song → start → play → stop)
2. File operations (load song → modify → save → reload)
3. Instrument operations (load → preview → modify → save)
4. MIDI integration (receive input → process → update state)
5. State persistence (modify state → reload app → verify restoration)

**Integration Test Template:**

```typescript
describe('[Feature] Integration', () => {
  beforeEach(() => {
    // Set up test environment
    render(<App />);
  });
  
  it('should complete full workflow', async () => {
    // Step 1: Initial action
    // Step 2: Verify intermediate state
    // Step 3: Complete workflow
    // Step 4: Final verification
  });
});
```

### Performance Test Requirements

**Benchmarks to Establish:**
- Audio initialization time: < 100ms
- File loading time: < 500ms for typical files (10KB)
- UI response time: < 16ms for non-audio operations
- Memory usage: < 50MB during normal operation
- Logger overhead: < 1ms per 1000 calls

**Performance Test Template:**

```typescript
describe('[Function] Performance', () => {
  it('should complete within time limit', () => {
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      functionUnderTest(testInput);
    }
    
    const duration = performance.now() - start;
    const avgTime = duration / iterations;
    
    expect(avgTime).toBeLessThan(expectedMaxTime);
  });
  
  it('should not leak memory', () => {
    const before = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Execute function many times
    for (let i = 0; i < 10000; i++) {
      functionUnderTest(testInput);
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const after = (performance as any).memory?.usedJSHeapSize || 0;
    const growth = after - before;
    
    // Memory growth should be minimal
    expect(growth).toBeLessThan(1024 * 1024); // 1MB
  });
});
```

### Regression Test Requirements

**Objective:** Ensure no existing functionality is broken

**Test Categories:**
1. Audio output verification (sample comparison)
2. File format compatibility (load old files)
3. UI behavior consistency (interaction patterns)
4. Performance benchmarks (no degradation)

**Regression Test Checklist:**
- [ ] All existing unit tests pass
- [ ] Audio playback produces identical output
- [ ] File import/export works with existing files
- [ ] MIDI input processing unchanged
- [ ] UI responsiveness maintained
- [ ] Memory usage not increased
- [ ] Build time not significantly increased
- [ ] Bundle size not increased beyond 5%

## Implementation Sequence

### Phase 1: Logging Infrastructure
1. Create `src/utils/logger.ts`
2. Write unit tests for Logger class
3. Replace console.error calls with logger.error
4. Replace console.warn calls with logger.warn
5. Replace console.info calls with logger.info
6. Replace console.log calls with logger.debug or logger.info
7. Integrate with DEBUG mode toggle
8. Run all tests and verify no regressions

### Phase 2: Utility Consolidation
1. Create `src/utils/formatters.ts` with Formatter class
2. Write comprehensive unit tests for all formatter methods
3. Write regression tests comparing old vs new output
4. Update `src/utils/valueFormatting.ts` to use Formatter
5. Update `src/utils/hexFormatting.ts` to use Formatter
6. Update `src/utils/instrumentSelection.ts` to use Formatter
7. Update all components importing old utilities
8. Run tests and verify identical behavior

### Phase 3: Storage Key Management
1. Create `src/utils/storageKeys.ts` with StorageKeyManager
2. Write unit tests for key generation and migration
3. Test migration with sample data
4. Add migration call to app initialization
5. Update `src/hooks/useAppState.ts` to use StorageKeyManager
6. Update `src/hooks/useDataManagement.ts` to use StorageKeyManager
7. Update `src/stores/uiStore.ts` to use StorageKeyManager
8. Test data persistence and migration thoroughly

### Phase 4: App.tsx Decomposition
1. Create `src/hooks/useAppEventHandlers.ts`
2. Write unit tests for event handlers
3. Extract event handlers from App.tsx
4. Create `src/hooks/useAppModalState.ts`
5. Write unit tests for modal state management
6. Extract modal state from App.tsx
7. Create `src/hooks/useAppInitialization.ts`
8. Extract initialization logic from App.tsx
9. Test all extracted functionality
10. Verify App.tsx line count reduced

### Phase 5: Error Handling Standardization
1. Create `src/types/errors.ts` with error classes
2. Write unit tests for all error types
3. Create `src/utils/errorHandler.ts` with ErrorHandler
4. Write unit tests for ErrorHandler
5. Replace throw statements with typed errors
6. Update try-catch blocks to use ErrorHandler
7. Integrate user notifications
8. Test error scenarios end-to-end

## Validation Criteria

### Functional Validation
- [ ] All existing features work identically
- [ ] Audio playback timing unchanged (20ms/40ms cycles)
- [ ] Sound output quality identical
- [ ] File import/export compatibility maintained
- [ ] MIDI functionality preserved
- [ ] UI behavior consistent
- [ ] State persistence working
- [ ] Debug mode functioning correctly

### Code Quality Validation
- [ ] TypeScript compilation without errors
- [ ] ESLint passes without warnings
- [ ] All unit tests pass (100% for refactored code)
- [ ] All integration tests pass
- [ ] Code duplication reduced by 40%+
- [ ] App.tsx reduced below 1500 lines
- [ ] Consistent naming conventions applied
- [ ] Comprehensive documentation added

### Performance Validation
- [ ] Audio initialization < 100ms
- [ ] File loading < 500ms for typical files
- [ ] UI response time < 16ms
- [ ] Memory usage < 50MB
- [ ] No performance degradation in any area
- [ ] Bundle size increase < 5%
- [ ] Build time increase < 10%

### Testing Validation
- [ ] Unit test coverage ≥ 90% for refactored code
- [ ] Integration tests cover all critical paths
- [ ] Performance benchmarks established and passing
- [ ] Regression tests all pass
- [ ] Manual testing checklist completed
- [ ] Audio output verified bit-identical

## Risk Mitigation

### Low Risk Areas
These changes are safe and unlikely to cause issues:
- Logger system implementation (no behavioral changes)
- Formatter utility consolidation (identical output)
- Storage key management (with migration)
- Documentation improvements
- Test coverage expansion

### Medium Risk Areas
These require careful validation:
- App.tsx component extraction (ensure no prop drilling issues)
- Error handling changes (verify all error paths)
- Hook optimization (check dependency arrays)

### Mitigation Strategies

**For All Changes:**
1. Implement incrementally (one phase at a time)
2. Run full test suite after each change
3. Perform manual testing of affected features
4. Monitor audio output quality
5. Check performance benchmarks

**For Medium Risk Changes:**
1. Create feature branch for each phase
2. Have second developer review changes
3. Test with real project files
4. Verify audio timing with oscilloscope/analyzer
5. Keep rollback options ready

**Audio Protection:**
- Never modify files in protected areas
- Always verify audio output after changes
- Test with multiple sample files
- Check timing with debug logging
- Monitor CPU usage during playback

## Success Metrics

### Quantitative Metrics
- Console statements reduced from 32 to 0 (unconditional)
- Code duplication reduced by 40%+ (measured by lines)
- App.tsx size reduced from 2538 to < 1500 lines
- Test coverage increased to ≥ 90% for refactored code
- Bundle size increase < 5%
- Zero audio timing regressions
- Zero functional regressions

### Qualitative Metrics
- Code is easier to understand and navigate
- Error messages are clear and actionable
- Debugging is more efficient with structured logging
- New features can be added more easily
- Confidence in making changes is higher
- Onboarding new developers is faster

## Post-Implementation

### Documentation Updates Required
- Update GUIDELINES.md with new patterns
- Document Logger usage in README
- Add Formatter utility examples
- Document StorageKeyManager usage
- Update component documentation
- Add error handling guidelines

### Knowledge Transfer
- Share refactoring approach with team
- Document lessons learned
- Create code examples for common patterns
- Update coding standards
- Prepare developer onboarding materials

### Monitoring Plan
- Track error rates in production
- Monitor performance metrics
- Collect user feedback
- Watch for unexpected issues
- Plan follow-up improvements

## Appendix: Naming Convention Reference

### File Naming Standards
- **Components**: PascalCase (e.g., `TrackPanel.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSequencer.ts`)
- **Utilities**: camelCase (e.g., `formatters.ts`, `errorHandler.ts`)
- **Types**: PascalCase (e.g., `errors.ts` contains `AppError`)
- **Constants**: camelCase or PascalCase (e.g., `music.ts`)

### Code Naming Standards
- **Functions**: camelCase, descriptive verbs (e.g., `handleStartSong()`, `formatHexValue()`)
- **Variables**: camelCase, descriptive nouns (e.g., `currentSong`, `sequencerState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `PATTERN_LENGTH`, `DEFAULT_OCTAVE`)
- **Boolean variables**: `is`, `has`, `should` prefixes (e.g., `isPlaying`, `hasLoop`)
- **Event handlers**: `handle` prefix (e.g., `handleClick`, `handleLoadSong`)
- **Types/Interfaces**: PascalCase (e.g., `Song`, `SequencerState`, `AppError`)
- **Enums**: PascalCase with UPPER_CASE values (e.g., `enum LogLevel { ERROR, WARN }`)

### Consistency Rules
- Use full words, not abbreviations (except common: `id`, `url`, `ui`)
- Be consistent within a file and related files
- Use same terminology across codebase (e.g., always "song" not "track" for Song type)
- Parameter names should match interface property names where applicable
- Private class members can use underscore prefix if needed for clarity

## Appendix: Function Testing Matrix

### Phase 1 Functions

| Function | Input Types | Edge Cases | Expected Behavior | Test Coverage |
|----------|-------------|------------|-------------------|---------------|
| `Logger.error` | string, ...unknown[] | Empty message, no args | Log to console.error | 100% |
| `Logger.warn` | string, ...unknown[] | Empty message, no args | Log to console.warn | 100% |
| `Logger.debug` | string, ...unknown[] | Debug mode off | No output when off | 100% |
| `Logger.setDebugMode` | boolean | Toggle multiple times | Update log level | 100% |

### Phase 2 Functions

| Function | Input Types | Edge Cases | Expected Behavior | Test Coverage |
|----------|-------------|------------|-------------------|---------------|
| `Formatter.hex` | number, FormatOptions? | Negative, 0, max int | Hex string padded | 100% |
| `Formatter.signed` | number | 0, positive, negative | Sign prefix | 100% |
| `Formatter.mode` | number | 0-2, invalid | Mode string | 100% |
| `Formatter.instrumentId` | string\|number\|null | null, invalid hex | Normalized ID | 100% |

### Phase 3 Functions

| Function | Input Types | Edge Cases | Expected Behavior | Test Coverage |
|----------|-------------|------------|-------------------|---------------|
| `StorageKeyManager.getKey` | string, string | Empty strings | Namespaced key | 100% |
| `StorageKeyManager.migrateKey` | string, string, string | Non-existent old key | Safe migration | 100% |
| `migrateStorageKeys` | void | Multiple calls | Idempotent | 100% |

### Phase 4 Functions

| Function | Input Types | Edge Cases | Expected Behavior | Test Coverage |
|----------|-------------|------------|-------------------|---------------|
| `useAppEventHandlers` | UseAppEventHandlersParams | Null song, already playing | Conditional execution | 90% |
| `useAppModalState` | void | Rapid open/close | State consistency | 90% |
| `useAppInitialization` | UseAppInitializationParams | Multiple mounts | Single initialization | 90% |

### Phase 5 Functions

| Function | Input Types | Edge Cases | Expected Behavior | Test Coverage |
|----------|-------------|------------|-------------------|---------------|
| `ErrorHandler.handle` | unknown, ErrorHandlerOptions | AppError, unknown error | Log + notify | 95% |
| `ErrorHandler.wrapAsync` | async function, options | Success, failure | Error handling | 95% |
| `AppError` subclasses | Constructor params | Missing optional params | Error creation | 100% |