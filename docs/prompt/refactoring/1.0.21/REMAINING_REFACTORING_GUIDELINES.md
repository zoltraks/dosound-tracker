# DOSOUND Tracker - Remaining Refactoring Guidelines

## Executive Summary

Based on the refactoring assessment showing **90% completion of architectural improvements**, this document outlines specific guidelines for the remaining refactoring tasks that will bring the project to production-ready standards.

## 📊 Current Status Overview

| Category | Status | Progress | Priority |
|----------|--------|----------|----------|
| **Architecture** | ✅ Excellent | 90% | - |
| **Type Safety** | 🔄 In Progress | 75% | High |
| **Code Duplication** | 🔄 Partially Resolved | 80% | Medium |
| **Testing** | 🔄 Basic Infrastructure | 30% | High |
| **Error Handling** | 🔄 Basic Implementation | 40% | Medium |

---

## 🔴 HIGH PRIORITY: Type Safety Improvements

### 1. Eliminate Remaining 'any' Types

**Current State:** 16 instances of `: any` found across the codebase

**Files Requiring Immediate Attention:**

#### `src/utils/songParser.ts` - 6 'any' instances
```typescript
// Lines 166, 187, 194, 243
// Issues: Pattern parsing, line node handling
```

#### `src/App.tsx` - 10+ 'any' instances
```typescript
// Lines 1511, 1517, 1519, 1522, 1553, 1563, 1567, 1681, 1682, 1686, 1745, 1750, 1756
// Issues: Step processing, compression logic, parsing
```

**Guidelines for Type Safety:**

```typescript
// Instead of: const ln: any = nodeLine;
// Use:
interface StepData {
  note?: Note;
  instrument?: string;
  volume?: number;
  space?: boolean;
  [key: string]: any; // For unknown properties
}

interface LineData {
  trackA: Note | null;
  trackB: Note | null;
  trackC: Note | null;
  volume?: number | null;
  [key: string]: any; // For future extensions
}

// Pattern interface updates
interface PatternData {
  id: string;
  name: string;
  lines: LineData[];
  [key: string]: any; // Allow extensions
}

// Validation function
const validateStepData = (data: unknown): data is StepData => {
  if (typeof data !== 'object' || data === null) return false;
  const step = data as StepData;
  return (
    typeof step === 'object' &&
    (step.space === undefined || typeof step.space === 'boolean') &&
    (step.note === undefined || typeof step.note === 'string') &&
    (step.instrument === undefined || typeof step.instrument === 'string') &&
    (step.volume === undefined || typeof step.volume === 'number')
  );
};
```

**Implementation Steps:**
1. Create comprehensive interfaces in `src/types/` directory
2. Add runtime validation functions
3. Replace all `any` types with proper interfaces
4. Update TypeScript config for stricter checking

### 2. Enhanced Error Handling for Type Validation

```typescript
// src/types/validation.ts
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const assertValidSong = (data: unknown): Song => {
  if (!isSongData(data)) {
    throw new ValidationError('Invalid song data structure');
  }
  return data;
};

const isSongData = (data: unknown): data is Song => {
  if (typeof data !== 'object' || data === null) return false;
  const song = data as Song;
  return (
    typeof song.title === 'string' &&
    Array.isArray(song.patterns) &&
    Array.isArray(song.instruments) &&
    Array.isArray(song.playlist)
  );
};
```

---

## 🟡 MEDIUM PRIORITY: Code Duplication Reduction

### 1. Extract Shared Sequencer Engine

**Current Issue:** Similar patterns between live sequencer and export logic

**Current Duplication Areas:**
- Note processing logic
- Envelope handling
- Register state management

**Recommended Solution:**

```typescript
// src/synth/SequencerEngine.ts
export interface SequencerOptions {
  ticksPerRow: number;
  patternLength: number;
  speed: number;
}

export class SequencerEngine {
  constructor(
    private instruments: Map<string, Instrument>,
    private patterns: Pattern[]
  ) {}

  /**
   * Process song state for a given frame
   */
  processFrame(
    lineIndex: number,
    tick: number,
    patternIndex: number,
    currentRegisters: RegisterState
  ): FrameState {
    const frameState: FrameState = {
      registers: { ...currentRegisters },
      lineIndex,
      tick
    };

    // Shared note processing logic
    this.processNotes(lineIndex, tick, patternIndex, frameState);
    
    // Shared envelope processing
    this.processEnvelopes(lineIndex, tick, frameState);
    
    return frameState;
  }

  private processNotes(
    lineIndex: number,
    tick: number,
    patternIndex: number,
    frameState: FrameState
  ): void {
    // Extract shared logic from both live sequencer and export
  }

  private processEnvelopes(
    lineIndex: number,
    tick: number,
    frameState: FrameState
  ): void {
    // Shared envelope processing
  }
}

// Update export logic to use engine
export function exportToAssembly(song: Song, isComplexDumpMode: boolean = false): string {
  const engine = new SequencerEngine(
    new Map(song.instruments.map(i => [i.id, i])),
    song.patterns
  );
  
  // Use shared processing logic
  // ...
}
```

### 2. Refactor Shared Processing Functions

**Guidelines:**
1. Identify common patterns between `assemblyExport.ts` and sequencer logic
2. Extract to shared utility functions
3. Parameterize differences through options
4. Ensure both live and export use identical core logic

---

## 🟢 HIGH PRIORITY: Testing Coverage Expansion

### 1. Current Testing Status

**Existing Infrastructure:**
- Vitest configuration ✅
- Basic hook testing ✅
- Test fixtures ✅

**Missing Test Coverage:**
- Component integration tests
- Audio processing tests
- Export functionality tests
- End-to-end workflow tests

### 2. Comprehensive Testing Strategy

#### Unit Tests for Core Logic

```typescript
// test/synth/SequencerEngine.test.ts
describe('SequencerEngine', () => {
  describe('processFrame', () => {
    it('should handle note changes correctly', () => {
      // Test note processing logic
    });

    it('should progress envelopes properly', () => {
      // Test envelope processing
    });

    it('should manage register state correctly', () => {
      // Test register state management
    });
  });
});
```

#### Component Integration Tests

```typescript
// test/components/TrackPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackPanel } from '../../src/components/TrackPanel';

describe('TrackPanel', () => {
  it('should render track data correctly', () => {
    // Test component rendering
  });

  it('should handle keyboard input', () => {
    // Test keyboard interactions
  });

  it('should sync with sequencer state', () => {
    // Test state synchronization
  });
});
```

#### Export Functionality Tests

```typescript
// test/utils/export.test.ts
describe('Export Functions', () => {
  describe('exportToAssembly', () => {
    it('should generate valid assembly code', () => {
      // Test assembly export
    });

    it('should handle complex songs correctly', () => {
      // Test with complex song data
    });
  });
});
```

#### Audio Processing Tests

```typescript
// test/synth/audio.test.ts
describe('Audio Processing', () => {
  it('should produce correct YM2149 output', () => {
    // Test audio synthesis
  });

  it('should handle real-time playback', () => {
    // Test playback timing
  });
});
```

### 3. Testing Implementation Guidelines

1. **Use React Testing Library** for component tests
2. **Mock audio contexts** for testing audio functionality
3. **Create comprehensive fixtures** for different song types
4. **Add integration tests** for critical user workflows
5. **Implement performance tests** for audio processing

---

## 🟡 MEDIUM PRIORITY: Error Handling Enhancement

### 1. React Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // TODO: Send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap critical components
<ErrorBoundary>
  <TrackPanel />
</ErrorBoundary>
```

### 2. Audio Context Error Handling

```typescript
// src/hooks/useAudioContext.ts
export const useAudioContext = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAudioContext = async () => {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      } catch (err) {
        setError('Failed to initialize audio context');
        console.error('Audio context initialization failed:', err);
      }
    };

    initAudioContext();

    return () => {
      audioContext?.close();
    };
  }, []);

  return { audioContext, error };
};
```

### 3. Input Validation Enhancement

```typescript
// src/utils/validation.ts
export const validateSongData = (data: unknown): Song => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Song data must be an object');
  }

  const song = data as Partial<Song>;

  // Validate required fields
  if (!song.title || typeof song.title !== 'string') {
    throw new ValidationError('Song must have a title', 'title');
  }

  if (!Array.isArray(song.patterns) || song.patterns.length === 0) {
    throw new ValidationError('Song must have at least one pattern', 'patterns');
  }

  // Validate patterns
  song.patterns.forEach((pattern, index) => {
    if (!pattern.id || !pattern.name) {
      throw new ValidationError(`Pattern ${index} must have id and name`, `patterns[${index}]`);
    }
  });

  return song as Song;
};
```

---

## 🔄 Implementation Roadmap

### Phase 1: Type Safety (Sprint 1-2)
1. ✅ Create comprehensive type definitions
2. ✅ Replace all 'any' types with proper interfaces
3. ✅ Add runtime validation functions
4. ✅ Update TypeScript configuration

### Phase 2: Testing Expansion (Sprint 2-3)
1. ✅ Create unit tests for core logic
2. ✅ Add component integration tests
3. ✅ Implement export functionality tests
4. ✅ Add audio processing tests

### Phase 3: Error Handling (Sprint 3-4)
1. ✅ Implement React error boundaries
2. ✅ Add audio context error handling
3. ✅ Enhance input validation
4. ✅ Add graceful degradation for audio failures

### Phase 4: Code Quality (Sprint 4-5)
1. ✅ Extract shared SequencerEngine
2. ✅ Eliminate remaining code duplication
3. ✅ Add performance monitoring
4. ✅ Final code review and cleanup

---

## 🎯 Success Criteria

### Type Safety
- [ ] Zero 'any' types in production code
- [ ] 100% TypeScript strict mode compliance
- [ ] Runtime validation for all public APIs

### Testing
- [ ] 80%+ code coverage for business logic
- [ ] Component integration tests for all major components
- [ ] End-to-end tests for critical user workflows

### Error Handling
- [ ] Graceful handling of audio context failures
- [ ] User-friendly error messages for all failure scenarios
- [ ] Comprehensive error boundaries

### Code Quality
- [ ] Eliminated code duplication
- [ ] Shared processing engine implemented
- [ ] Performance monitoring in place

---

## 🛠️ Development Guidelines

### Code Standards
1. **Never use 'any'** - always define proper interfaces
2. **Add runtime validation** for complex data structures
3. **Implement error boundaries** for UI components
4. **Write tests first** for new features
5. **Use TypeScript strict mode** for all new code

### Testing Standards
1. **Unit tests** for all business logic
2. **Integration tests** for component interactions
3. **Mock audio contexts** for consistent testing
4. **Test user workflows** end-to-end

### Error Handling Standards
1. **Graceful degradation** for non-critical failures
2. **User-friendly messages** for all error states
3. **Logging** for debugging and monitoring
4. **Recovery mechanisms** where possible

---

## 📋 Quick Win Checklist

- [ ] Replace 16 'any' types with proper interfaces
- [ ] Add error boundaries to TrackPanel and other critical components
- [ ] Create SequencerEngine class for shared logic
- [ ] Add 5 key component integration tests
- [ ] Implement input validation for song parsing
- [ ] Add audio context error handling

Following these guidelines will bring your refactoring efforts to completion and establish a solid foundation for ongoing development and maintenance.