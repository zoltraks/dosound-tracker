# DOSOUND Tracker Refactoring Proposal - Version 1.1.4

## Overview

This refactoring proposal focuses on performance optimizations for the DOSOUND Tracker, with particular emphasis on the sequencer and playback systems that must operate efficiently at 20-40ms cycle times. The current implementation has several performance bottlenecks that could impact real-time audio performance and user experience.

## Current Performance Issues

### 1. Heavy Sequencer Callback (Critical)
**Location:** `App.tsx:sequencerCallback` (lines 642-1048, ~400 lines)
**Impact:** Executes every 20ms during playback
**Problems:**
- Complex pattern processing and note lookup
- Envelope progression calculations for all channels
- MIDI output generation
- Debug logging with string formatting
- UI state updates triggering React re-renders

**Current Performance:** Potentially 10-50ms execution time per callback, risking audio dropouts

### 2. Excessive UI Re-renders (High)
**Location:** `useSequencer.ts`, `App.tsx`
**Impact:** React re-renders at 50Hz during playback
**Problems:**
- `setSharedCurrentLine` called on every tick
- Complex dependency arrays in useCallback/useEffect
- Unnecessary component re-renders throughout the UI

### 3. Inefficient Data Structures (Medium)
**Location:** Pattern and instrument lookups
**Impact:** Map/Song data access during hot paths
**Problems:**
- `patternsById.get()` and `instrumentsById.get()` in sequencer callback
- Array searches for pattern data
- Memory allocations in hot paths

### 4. Web Audio API Overhead (Medium)
**Location:** `YM2149.ts`
**Impact:** Audio node management
**Problems:**
- Multiple gain nodes and oscillators per channel
- Frequent parameter updates
- Potential audio glitches from parameter scheduling

### 5. Worker Communication Bottleneck (Low)
**Location:** `sequencerWorker.ts`, `useSequencer.ts`
**Impact:** Inter-thread communication
**Problems:**
- PostMessage overhead for every tick
- Serialization of complex state objects

## Proposed Refactoring Changes

### Phase 1: Critical Performance Fixes

#### 1.1 Optimize Sequencer Callback
**Goal:** Reduce callback execution time to <5ms

**Changes:**
- **Precompute pattern data:** Create a flattened, optimized data structure for playback that eliminates lookups during ticks
- **Batch envelope processing:** Process envelopes in larger chunks rather than per-tick
- **Move debug logging off main thread:** Use a separate worker or debounce logging
- **Lazy MIDI processing:** Queue MIDI events and process asynchronously

**Implementation:**
```typescript
// New optimized playback data structure
interface PlaybackFrame {
  readonly patternIndex: number;
  readonly lineIndex: number;
  readonly tickIndex: number;
  readonly channelData: readonly ChannelFrame[];
}

interface ChannelFrame {
  readonly note?: NoteData;
  readonly instrument?: InstrumentData;
  readonly envelopeStep: number;
}

// Precompute all frames for a song/pattern
class PlaybackEngine {
  private frames: PlaybackFrame[] = [];

  precomputeSong(song: Song): void {
    // Flatten all patterns into sequential frames
    // Pre-resolve all instrument and note data
  }

  getFrame(frameIndex: number): PlaybackFrame {
    return this.frames[frameIndex];
  }
}
```

#### 1.2 Reduce UI Update Frequency
**Goal:** Limit React re-renders to essential updates only

**Changes:**
- **Debounce position updates:** Update UI position every 4-8 ticks (80-160ms) instead of every 20ms
- **Separate playback state from UI state:** Use refs for playback-critical state, React state only for UI
- **Memoize expensive computations:** Use useMemo for pattern data, instrument lookups

**Implementation:**
```typescript
// In useSequencer.ts
const [uiPosition, setUiPosition] = useState({ pattern: 0, line: 0 });
const playbackPositionRef = useRef({ pattern: 0, line: 0, tick: 0 });

// Update UI less frequently
const updateUiPosition = useCallback(() => {
  const current = playbackPositionRef.current;
  if (current.line !== uiPosition.line || current.pattern !== uiPosition.pattern) {
    setUiPosition({ pattern: current.pattern, line: current.line });
  }
}, [uiPosition]);

// Call updateUiPosition every 100ms instead of every tick
```

#### 1.3 Optimize Data Access Patterns
**Goal:** Eliminate lookups in hot paths

**Changes:**
- **Pre-resolve instrument references:** Store direct instrument objects in pattern data
- **Use typed arrays for envelope data:** Replace arrays with Float32Array for better performance
- **Cache computed values:** Pre-calculate frequencies, periods, etc.

**Implementation:**
```typescript
// Optimized instrument data for playback
interface PlaybackInstrument {
  readonly volume: Float32Array;
  readonly arpeggio: Float32Array;
  readonly pitch: Float32Array;
  readonly noiseEnvelope: Float32Array;
  readonly mode: Uint8Array;
  readonly sustain?: number;
}

// Pre-compute note frequencies
const NOTE_FREQUENCY_CACHE = new Float32Array(12 * 8); // 12 notes * 8 octaves
// ... populate cache on startup
```

### Phase 2: Architecture Improvements

#### 2.1 Separate Audio Thread
**Goal:** Move audio processing off main thread

**Changes:**
- **Audio Worklet for YM2149:** Use AudioWorkletNode for low-latency audio processing
- **Dedicated sequencer worker:** Expand sequencerWorker to handle more processing
- **Message passing optimization:** Use SharedArrayBuffer for real-time data

**Implementation:**
```typescript
// AudioWorkletProcessor for YM2149 synthesis
class YM2149Processor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    // Direct audio synthesis without main thread involvement
    return true;
  }
}
```

#### 2.2 Memory Management Optimization
**Goal:** Reduce garbage collection pressure

**Changes:**
- **Object pooling:** Reuse frame objects and channel data
- **Avoid string operations in hot paths:** Use numeric IDs instead of strings
- **Pre-allocate buffers:** Use fixed-size arrays for envelope processing

**Implementation:**
```typescript
// Object pool for playback frames
class FramePool {
  private pool: PlaybackFrame[] = [];
  private index = 0;

  get(): PlaybackFrame {
    if (this.index < this.pool.length) {
      return this.pool[this.index++];
    }
    // Allocate new frame
    return createEmptyFrame();
  }

  reset(): void {
    this.index = 0;
  }
}
```

#### 2.3 MIDI Processing Optimization
**Goal:** Reduce MIDI processing latency

**Changes:**
- **Dedicated MIDI worker:** Process MIDI events in separate thread
- **Event batching:** Group MIDI events and send in batches
- **Priority queuing:** Ensure critical audio events are processed first

### Phase 3: Advanced Optimizations

#### 3.1 SIMD and WebAssembly
**Goal:** Leverage hardware acceleration

**Changes:**
- **WebAssembly for YM2149:** Port core synthesis to WebAssembly
- **SIMD for envelope processing:** Use SIMD instructions for bulk calculations
- **GPU acceleration:** Consider WebGL for complex audio processing

#### 3.2 Predictive Caching
**Goal:** Pre-compute likely playback scenarios

**Changes:**
- **Pattern prediction:** Cache recently played patterns
- **Instrument preloading:** Pre-compute instrument data
- **Branch prediction:** Optimize for common playback patterns

## Implementation Plan

### Step 1: Immediate Critical Fixes (Week 1-2)
1. **Optimize sequencer callback:** Precompute pattern data, reduce complexity
2. **Debounce UI updates:** Limit position updates to 10-15Hz
3. **Fix data structure inefficiencies:** Use direct references, typed arrays

### Step 2: Architecture Refactoring (Week 3-4)
1. **Implement PlaybackEngine:** Separate playback logic from UI
2. **Add AudioWorklet support:** Move YM2149 to worklet
3. **Optimize worker communication:** Use more efficient message passing

### Step 3: Advanced Features (Week 5-6)
1. **Memory pooling:** Implement object reuse
2. **MIDI worker:** Offload MIDI processing
3. **Performance monitoring:** Add metrics and profiling

## Expected Performance Improvements

### Quantitative Metrics
- **Sequencer callback time:** 50ms → <5ms (90% reduction)
- **UI re-render frequency:** 50Hz → 10-15Hz (70-80% reduction)
- **Memory allocations:** Reduce by 60% in hot paths
- **Audio latency:** Maintain <20ms for real-time playback

### Qualitative Improvements
- **Audio stability:** Eliminate dropouts during complex patterns
- **UI responsiveness:** Smoother interaction during playback
- **Battery life:** Reduced CPU usage on mobile devices
- **Scalability:** Support for more complex songs without performance degradation

## Risk Assessment

### High Risk
- **Audio worklet compatibility:** May not work on all browsers
- **WebAssembly complexity:** Increases build complexity

### Medium Risk
- **Worker communication changes:** Could introduce synchronization issues
- **Memory pooling bugs:** Difficult to debug object reuse issues

### Low Risk
- **Data structure optimizations:** Straightforward performance wins
- **UI debouncing:** Minimal functionality impact

## Testing Strategy

### Performance Testing
- **Benchmark sequencer callback:** Measure execution time under load
- **Audio latency tests:** Ensure <20ms end-to-end latency
- **Memory profiling:** Monitor heap usage during playback

### Functional Testing
- **Playback accuracy:** Verify all notes, envelopes work correctly
- **UI responsiveness:** Test interaction during playback
- **Cross-browser compatibility:** Test on target platforms

### Load Testing
- **Complex songs:** Test with maximum pattern complexity
- **Long sessions:** Monitor performance over extended playback
- **Memory leaks:** Test for memory growth over time

## Success Criteria

1. **Playback performance:** 20-40ms cycles maintained under all conditions
2. **Audio quality:** No dropouts or artifacts during playback
3. **UI responsiveness:** Smooth interaction during playback
4. **Memory stability:** No memory leaks or excessive GC
5. **Code maintainability:** Clear separation of concerns, well-documented optimizations

## Conclusion

This refactoring will transform the DOSOUND Tracker from a functional prototype into a high-performance, professional-grade music application capable of real-time audio synthesis with the demanding timing requirements of chiptune music. The phased approach ensures minimal disruption while delivering substantial performance improvements.

The focus on the sequencer and playback systems addresses the core performance bottlenecks while maintaining the application's unique features and user experience.