# Refactoring Proposal for DOSOUND Tracker v1.2.5

## Project Analysis Summary

### Current Architecture Overview
- **Framework**: React 19 with TypeScript and Vite
- **State Management**: Custom hooks with Zustand for UI state
- **Audio Processing**: YM2149 chip emulation with 20ms/40ms timing cycles
- **Build System**: Vite with Electron for desktop distribution
- **File Organization**: Well-structured modular architecture

### Current Naming Conventions Documented
- **Hooks**: `use` prefix with camelCase (useAppState, useDataManagement)
- **Components**: PascalCase with descriptive names (HeaderPanel, TrackPanel)
- **Utilities**: camelCase with functional names (formatHexId, downloadFile)
- **Constants**: UPPER_SNAKE_CASE (DEFAULT_OCTAVE, YM_CLOCK)
- **Types/Interfaces**: PascalCase with descriptive names (UiStore, SequencerState)
- **Files**: kebab-case for directories, descriptive names for files

### Protected Areas (Must Not Be Modified)
- All YM2149 chip emulation functions (`src/synth/YM2149.ts`)
- Sequencer engine and timing logic (`src/synth/SequencerEngine.ts`, `src/workers/sequencerWorker.ts`)
- Sound generation procedures and audio buffer management
- Real-time audio processing loops and timing-critical code
- Waveform generation and audio register manipulation
- Playback control and sequencer integration logic

## Identified Refactoring Opportunities

### 1. Console Logging Consolidation
**Issue**: 32 instances of console.log/console.error/console.warn found throughout codebase
**Impact**: Debug noise, inconsistent logging, performance overhead in production
**Solution**: Implement structured logging system

### 2. Code Duplication in Value Formatting
**Issue**: Multiple similar formatting functions across utility files
**Files Affected**: `src/utils/valueFormatting.ts`, `src/utils/hexFormatting.ts`, `src/utils/instrumentSelection.ts`
**Solution**: Consolidate into unified formatting utilities

### 3. localStorage Key Management
**Issue**: Inconsistent localStorage key patterns throughout hooks
**Pattern Found**: Mix of kebab-case and underscore patterns
**Solution**: Centralize storage key management

### 4. App.tsx Complexity Reduction
**Issue**: Large main component with extensive state management
**Current Size**: 2538 lines with complex prop drilling
**Solution**: Extract logical sections into smaller components

### 5. Error Handling Standardization
**Issue**: Inconsistent error handling patterns across hooks
**Solution**: Standardize error types and handling strategies

## Phase 1: Logging Infrastructure

### Implementation
Create centralized logging system to replace scattered console statements:

**New File**: `src/utils/logger.ts`
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

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
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
    if (this.logLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = Logger.getInstance();
```

### Migration Plan
1. Replace all console.error calls with logger.error
2. Replace all console.warn calls with logger.warn  
3. Replace all console.info calls with logger.info
4. Replace all console.log calls with logger.debug
5. Add DEBUG mode integration for debug-level logging

### Testing Requirements
- Unit tests for logger configuration and level filtering
- Integration tests for debug mode toggle behavior
- Verify no performance impact during production use

## Phase 2: Utility Consolidation

### Value Formatting Consolidation
**New File**: `src/utils/formatters.ts`

```typescript
export interface FormatOptions {
  padWidth?: number;
  uppercase?: boolean;
  prefix?: string;
  suffix?: string;
}

export class Formatter {
  static hex(value: number, options: FormatOptions = {}): string {
    const { padWidth = 2, uppercase = true } = options;
    const hex = Math.abs(value).toString(16);
    const padded = hex.padStart(padWidth, '0');
    return uppercase ? padded.toUpperCase() : padded;
  }

  static signed(value: number): string {
    return value >= 0 ? `+${value}` : value.toString();
  }

  static mode(value: number): string {
    switch (value) {
      case 0: return 'TONE';
      case 1: return 'NOISE';
      default: return 'BOTH';
    }
  }

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
}
```

### Migration Strategy
1. Update `src/utils/valueFormatting.ts` to use Formatter class
2. Consolidate hex formatting from `src/utils/hexFormatting.ts`
3. Update all imports to use new consolidated utilities

### Testing Requirements
- Unit tests for each formatting method with edge cases
- Regression tests ensuring identical output to current implementation
- Performance benchmarks for large-scale formatting operations

## Phase 3: Storage Key Management

### Implementation
**New File**: `src/utils/storageKeys.ts`

```typescript
export enum StorageNamespace {
  DOSOUND_TRACKER = 'dosound-tracker'
}

export class StorageKeyManager {
  private static keys = new Map<string, string>();

  static getKey(category: string, key: string): string {
    const fullKey = `${StorageNamespace.DOSOUND_TRACKER}-${category}-${key}`;
    
    if (!this.keys.has(fullKey)) {
      this.keys.set(fullKey, fullKey);
    }
    
    return this.keys.get(fullKey)!;
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
    
    // Paste track mode
    PASTE_TRACK_MODE: this.getKey('clipboard', 'paste-track-mode')
  } as const;
}
```

### Migration Plan
1. Update all localStorage references to use StorageKeyManager
2. Create migration function to copy existing keys to new format
3. Update all hooks using localStorage

### Testing Requirements
- Unit tests for key generation and consistency
- Migration tests ensuring existing data preservation
- Integration tests with localStorage operations

## Phase 4: App.tsx Refactoring

### Component Extraction Strategy
Break down the large App.tsx into logical sections:

**New File**: `src/components/AppState.tsx`
- Extract state management logic
- Centralize state initialization

**New File**: `src/components/AppEventHandlers.tsx` 
- Extract event handler functions
- Group related handlers together

**New File**: `src/components/AppModalHandlers.tsx`
- Extract modal management logic
- Consolidate modal state handling

### State Management Optimization
```typescript
// New file: src/hooks/useAppEventHandlers.ts
export interface AppEventHandlers {
  // Playback handlers
  handleStartSong: () => void;
  handleStop: () => void;
  handleStartLinePlayback: () => void;
  
  // File operation handlers
  handleLoadSong: (file: File) => void;
  handleSaveSong: () => void;
  handleLoadInstrument: (content: string) => void;
  
  // UI state handlers
  handleOctaveChange: (octave: number) => void;
  handleToggleDebugMode: () => void;
  handleToggleTheme: () => void;
}
```

### Testing Requirements
- Unit tests for each extracted component
- Integration tests ensuring state consistency
- Performance tests for re-render optimization
- Regression tests for all existing functionality

## Phase 5: Error Handling Standardization

### Error Type Definitions
**New File**: `src/types/errors.ts`

```typescript
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly severity: 'low' | 'medium' | 'high';
}

export class FileOperationError extends AppError {
  readonly code = 'FILE_OPERATION_ERROR';
  readonly severity: 'medium' | 'high';
  
  constructor(
    message: string,
    public readonly operation: 'load' | 'save' | 'parse',
    public readonly fileType?: string
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

export class AudioError extends AppError {
  readonly code = 'AUDIO_ERROR';
  readonly severity = 'high';
  
  constructor(message: string) {
    super(message);
    this.name = 'AudioError';
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly severity = 'low';
  
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Error Handler Integration
**New File**: `src/utils/errorHandler.ts`

```typescript
import { AppError } from '../types/errors';
import { logger } from './logger';

export class ErrorHandler {
  static handle(error: unknown, context?: string): void {
    if (error instanceof AppError) {
      this.handleAppError(error, context);
    } else {
      this.handleUnknownError(error, context);
    }
  }

  private static handleAppError(error: AppError, context?: string): void {
    const contextStr = context ? `[${context}] ` : '';
    
    switch (error.severity) {
      case 'low':
        logger.warn(`${contextStr}${error.message}`);
        break;
      case 'medium':
        logger.error(`${contextStr}${error.message}`);
        break;
      case 'high':
        logger.error(`${contextStr}FATAL: ${error.message}`);
        // Could trigger user notification for critical errors
        break;
    }
  }

  private static handleUnknownError(error: unknown, context?: string): void {
    const contextStr = context ? `[${context}] ` : '';
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`${contextStr}Unknown error: ${message}`);
  }
}
```

### Migration Strategy
1. Update all try-catch blocks to use ErrorHandler
2. Replace generic error strings with typed errors
3. Implement error recovery strategies where appropriate

### Testing Requirements
- Unit tests for each error type
- Integration tests for error handling flow
- Error recovery scenario tests
- Performance tests for error handling overhead

## Implementation Safety Measures

### Protected Components Verification
Before implementation, verify these areas remain untouched:
- `src/synth/YM2149.ts` - Audio chip emulation
- `src/synth/SequencerEngine.ts` - Timing engine
- `src/workers/sequencerWorker.ts` - Web Worker timing
- All audio timing and generation procedures

### Regression Testing Protocol
1. Audio playback timing verification (20ms/40ms cycles)
2. Instrument preview functionality
3. MIDI input/output operations
4. File import/export operations
5. UI state persistence
6. Real-time sequencer performance

### Performance Validation
- Audio context initialization time
- Playback latency measurements
- Memory usage during extended playback
- UI responsiveness during audio processing

## Testing Strategy Summary

### Unit Test Coverage Goals
- Logger system: 100% coverage
- Formatter utilities: 100% coverage  
- Storage key management: 100% coverage
- Error handling: 95% coverage
- Extracted components: 90% coverage

### Integration Test Scenarios
- End-to-end file operations (load/save song/instrument)
- Complete playback workflows (song/pattern/line playback)
- MIDI input processing and output generation
- UI state persistence and restoration
- Error recovery from various failure modes

### Performance Benchmarks
- Audio initialization < 100ms
- File loading < 500ms for typical files
- UI response time < 16ms for non-audio operations
- Memory usage < 50MB during normal operation

## Expected Benefits

### Maintainability Improvements
- Reduced cognitive load from console.log cleanup
- Consistent error handling patterns
- Centralized storage management
- Smaller, more focused components

### Code Quality Enhancements  
- Type-safe error handling
- Structured logging with configurable levels
- Reusable formatting utilities
- Clear separation of concerns

### Developer Experience
- Consistent patterns across codebase
- Better debugging capabilities with structured logging
- Easier testing with smaller, focused components
- Reduced risk of storage key conflicts

### Performance Optimizations
- Eliminated unnecessary console operations in production
- Consolidated utility functions reducing bundle size
- Optimized component re-rendering patterns
- More efficient error handling paths

## Risk Assessment

### Low Risk Changes
- Logger system implementation
- Utility consolidation
- Storage key management
- Error type standardization

### Medium Risk Changes
- App.tsx component extraction
- State management reorganization
- UI component refactoring

### Mitigation Strategies
- Extensive testing at each phase
- Audio timing validation after each change
- Gradual migration with rollback capabilities
- Performance monitoring throughout implementation

## Conclusion

This refactoring proposal addresses code quality and maintainability concerns while preserving the critical audio functionality that makes DOSOUND Tracker effective. The phased approach ensures minimal risk to existing features while systematically improving the codebase structure and developer experience.