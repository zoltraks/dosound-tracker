# DOSOUND Tracker Refactoring Proposal - Version 1.1.2

## Overview

The current `App.tsx` file has grown to over 5000 lines and is handling too many responsibilities. This proposal focuses on breaking down the monolithic App component into smaller, more manageable pieces with clear separation of concerns.

## Current Issues

### App.tsx Analysis
- **Total lines**: 5058
- **State variables**: 25+ useState hooks
- **Effects**: 12+ useEffect hooks
- **Event handlers**: 50+ callback functions
- **JSX render**: 500+ lines of nested JSX
- **Responsibilities**: UI rendering, state management, audio, MIDI, file operations, playback control, modal management

### Problems
1. **Maintainability**: Changes in one area risk affecting unrelated functionality
2. **Testability**: Difficult to unit test individual features
3. **Readability**: Hard to understand the component's overall structure
4. **Performance**: Large component re-renders frequently
5. **Developer experience**: Intimidating to work with such a large file

## Refactoring Strategy

### Phase 1: Extract Custom Hooks

#### 1.1 Modal Management Hook (`useModalManager`)
**Purpose**: Centralize all modal state and handlers
**Extracted state**:
- All `is*Open` boolean states (12+ variables)
- Modal data states (transpose settings, instrument delete info, etc.)
- Modal handler functions

**Benefits**:
- Reduces App component state by ~15 variables
- Groups related modal logic together
- Easier to test modal interactions

#### 1.2 Playback Controls Hook (`usePlaybackControls`)
**Purpose**: Handle all playback-related logic
**Extracted functionality**:
- Pattern/song playback start/stop
- Playback state management
- Position tracking and updates
- Sequencer callbacks

**Benefits**:
- Separates audio playback concerns from UI
- Easier to test playback scenarios
- Cleaner App component logic

#### 1.3 File Operations Hook (`useFileOperations`)
**Purpose**: Handle all file load/save/export operations
**Extracted functionality**:
- Song/instrument load/save
- Export to various formats (ASM, BIN, VGM, WAV, dump)
- File input handling
- Export summaries and error handling

**Benefits**:
- Groups all I/O operations together
- Easier error handling and user feedback
- Reduces App component complexity

#### 1.4 Audio Setup Hook (`useAudioSetup`)
**Purpose**: Manage YM2149 audio context and initialization
**Extracted functionality**:
- AudioContext creation and management
- YM2149 initialization
- Audio user interaction handling
- Instrument preview playback

**Benefits**:
- Separates audio concerns from UI logic
- Better audio lifecycle management
- Easier to test audio functionality

#### 1.5 MIDI Handling Hook (`useMidiHandling`)
**Purpose**: Manage all MIDI-related functionality
**Extracted functionality**:
- MIDI device management
- MIDI note input/output
- MIDI configuration
- Live MIDI preview

**Benefits**:
- Isolates MIDI complexity
- Easier MIDI testing and debugging
- Cleaner separation from core app logic

#### 1.6 Track Operations Hook (`useTrackOperations`)
**Purpose**: Handle track-specific operations
**Extracted functionality**:
- Track copy/paste
- Transpose operations
- Pattern manipulation (insert/delete steps)
- Track clipboard management

**Benefits**:
- Groups track editing logic
- Easier to test track operations
- Reduces App component size significantly

### Phase 2: Extract Components

#### 2.1 App Layout Component (`AppLayout`)
**Purpose**: Handle the main UI layout structure
**Structure**:
- HeaderPanel
- CommandPanel
- Main content grid (left/middle/right columns)
- PianoKeyboard
- Hidden file inputs

**Benefits**:
- Separates layout concerns from business logic
- Easier to modify UI structure
- Smaller, focused components

#### 2.2 Modal Container Component (`ModalContainer`)
**Purpose**: Render all application modals
**Contains**:
- All modal components (About, Transpose, MIDI, etc.)
- Modal state management integration

**Benefits**:
- Removes modal JSX from main App render
- Easier modal management
- Better organization of modal-related code

#### 2.3 Main Content Components
**Purpose**: Break down the main content area
- `TracksSection`: Left column with position numbers and track panels
- `InstrumentSection`: Middle column with envelope panels and notes
- `InfoSection`: Right column with song info, playlist, instruments

**Benefits**:
- Smaller, focused components
- Easier to maintain individual sections
- Better code organization

### Phase 3: State Management Improvements

#### 3.1 Context Providers
**Consider using React Context for**:
- Modal state (if Zustand doesn't fit)
- Audio state
- MIDI configuration

#### 3.2 Custom Hooks for Complex State
**Extract complex state logic into custom hooks**:
- `useAppState`: Combine related state variables
- `useKeyboardShortcuts`: Handle global shortcuts
- `useScrollSync`: Manage synchronized scrolling

## Implementation Plan

### Step 1: Create Custom Hooks (Priority: High)
1. Start with `useModalManager` - most straightforward extraction
2. Implement `useFileOperations` - groups related functionality
3. Create `usePlaybackControls` - complex but well-contained
4. Add `useAudioSetup` - audio concerns separation
5. Implement `useMidiHandling` - isolate MIDI complexity
6. Create `useTrackOperations` - track editing logic

### Step 2: Extract Layout Components (Priority: Medium)
1. Create `AppLayout` component
2. Extract `ModalContainer`
3. Break down main content into section components

### Step 3: Optimize State Management (Priority: Low)
1. Review Zustand usage vs Context
2. Consider performance optimizations
3. Add proper TypeScript interfaces

## Expected Outcomes

### Code Quality Improvements
- **App.tsx size reduction**: From 5000+ lines to ~500-800 lines
- **Separation of concerns**: Each hook/component has single responsibility
- **Testability**: Individual hooks and components can be unit tested
- **Maintainability**: Changes isolated to specific areas
- **Readability**: Clear component structure and data flow

### Developer Experience
- **Easier onboarding**: New developers can understand individual pieces
- **Faster development**: Less context switching between concerns
- **Better debugging**: Issues isolated to specific hooks/components
- **Code reuse**: Hooks can be reused across components if needed

### Performance Benefits
- **Reduced re-renders**: Smaller components re-render less frequently
- **Better memoization**: Easier to optimize with React.memo/useMemo
- **Lazy loading**: Components can be code-split if needed

## Migration Strategy

### Gradual Migration
1. **Phase 1**: Extract hooks one by one, testing after each
2. **Phase 2**: Extract components, ensuring UI consistency
3. **Phase 3**: Optimize state management and performance

### Testing Strategy
- **Unit tests**: Test individual hooks and components
- **Integration tests**: Test component interactions
- **E2E tests**: Ensure full application functionality
- **Performance tests**: Monitor bundle size and runtime performance

### Risk Mitigation
- **Incremental changes**: Small, testable changes
- **Feature flags**: Allow rollback if needed
- **Comprehensive testing**: Ensure no regressions
- **Documentation**: Update component documentation

## Success Metrics

### Quantitative
- App.tsx lines: 5000+ → <800
- Number of hooks: 12+ → 6 core hooks
- Number of components: 1 → 8-10 focused components
- Bundle size impact: <5% increase (acceptable for maintainability)

### Qualitative
- Developer feedback on code maintainability
- Time to implement new features
- Bug fix turnaround time
- Test coverage improvement

## Conclusion

This refactoring will transform the monolithic App component into a well-structured, maintainable codebase. By extracting custom hooks and components, we achieve better separation of concerns, improved testability, and enhanced developer experience while maintaining all existing functionality.

The phased approach ensures minimal risk and allows for thorough testing at each step. The result will be a more scalable and maintainable codebase that can evolve with the project's needs.