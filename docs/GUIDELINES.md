# Code Generation Guidelines

## Audio-Critical Development Principles

This document outlines guidelines for code generation and development in this real-time audio application. The primary consideration is **audio performance stability over React best practices**.

### ⚠️ Critical: Audio Performance Trade-offs

This is a **real-time audio application** where timing is critical. Some React "anti-patterns" are intentionally maintained for audio stability:

#### 🚫 DO NOT Apply These Linting Fixes:

1. **Dependency Array Additions** - Adding missing dependencies to `useCallback` or `useMemo` can cause re-renders during audio processing
   - Example: `currentInstrumentData?.id`, `onHardStopLivePreview` in dependency arrays
   - Reason: Re-renders interrupt audio timing and cause glitches

2. **useCallback Wrapping** - Wrapping functions in `useCallback` for dependency arrays can affect render timing
   - Example: Wrapping `stopPreview` in `useCallback`
   - Reason: Memoization changes render cycle timing

3. **State Synchronization Removal** - Removing prop mirroring (local state syncing with props) can break audio timing
   - Example: EnvelopePanel local `envelopeData` state, TrackPanel local `currentInstrument` state
   - Reason: Local state provides stable timing vs prop-driven updates

4. **setState-in-effect "Fixes"** - Using `setTimeout` to defer setState in effects causes race conditions
   - Example: `setTimeout(() => setState(value), 0)`
   - Reason: Async state updates cause stale data during audio rendering

#### ✅ SAFE to Apply:

1. **Type Safety Fixes**
   - Replacing `any` types with proper TypeScript types
   - Adding explicit type annotations
   - Example: `Record<string, unknown>` instead of `any`

2. **Unused Code Removal**
   - Removing unused imports
   - Removing unused variables
   - Removing dead code

3. **Non-Functional Improvements**
   - Code formatting
   - Comment improvements
   - Test setup fixes

### 🎯 Development Workflow

1. **Always Test Audio After Changes**
   - Any change to React hooks, state management, or component lifecycle must be audio-tested
   - Use git stash to isolate changes and test incrementally

2. **Prefer Manual Reverts Over Automated Fixes**
   - If audio glitches occur, revert changes manually rather than applying more "fixes"
   - The original codebase was carefully tuned for audio performance

3. **Accept Linting Warnings**
   - React hooks dependency warnings are acceptable
   - setState-in-effect warnings are acceptable
   - These warnings indicate intentional performance optimizations

4. **Focus on Audio-First Development**
   - Audio stability is the highest priority
   - React best practices are secondary to performance
   - Test with real audio playback, not just visual rendering

### 🔍 Red Flags for Audio Issues

If you encounter these after applying linting fixes:
- Audio glitches, pops, or timing issues
- Stuttering or delayed audio response
- Inconsistent envelope or instrument behavior

**Immediate Action**: Revert the changes using git stash or git checkout.

### 📝 Code Review Checklist

When reviewing changes, ask:
- [ ] Does this affect React render timing?
- [ ] Does this change useCallback/useMemo dependencies?
- [ ] Does this modify state management patterns?
- [ ] Does this wrap functions in useCallback?
- [ ] Does this remove local state (prop mirroring)?
- [ ] **Has this been audio-tested?**

### 🎛️ Architecture Notes

The codebase uses several patterns that may appear "wrong" from a React perspective but are essential for audio:

- **Prop mirroring**: Local state synced with props for stable timing
- **Sparse dependency arrays**: Minimal dependencies to prevent unnecessary re-renders
- **Direct setState calls**: Synchronous state updates for predictable timing
- **Manual memoization**: Carefully controlled memoization vs React's automatic optimizations

These patterns ensure that audio processing occurs at consistent intervals without interruption from React's render cycle.

---

**Remember**: In real-time audio applications, performance trumps purity. The "wrong" way that works is better than the "right" way that glitches.
