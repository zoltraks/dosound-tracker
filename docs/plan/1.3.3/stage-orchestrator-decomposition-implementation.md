# Stage the Orchestrator Decomposition Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.3/stage-orchestrator-decomposition.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Destructure props in function signature
- Keep hooks focused on a single responsibility and name what they do, not how
- No abbreviations in identifiers (use full words)
- Apply the parallel-change pattern: introduce each extracted hook alongside the existing code, migrate its call sites, and keep every slice buildable and testable
- Add unit tests for every new hook's pure helper surfaces where they exist

## Audio-Critical Requirements

This change extracts playback orchestration in its final slice, so the audio-critical review applies.

- Does this change affect React render timing? Extracted hooks keep their `useCallback`/`useMemo`/`useEffect` bodies and dependency arrays verbatim. Hook call order inside each new hook mirrors the original relative order in `App.tsx`, so effect execution order is unchanged.
- Does this modify `useCallback` or `useMemo` dependencies? No. Every moved callback keeps its recorded dependency array byte-for-byte. The file-level `eslint-disable react-hooks/exhaustive-deps` is replicated in each extracted hook file that receives audio-path callbacks.
- Does this change state management patterns in audio paths? No. Prop mirroring, sparse dependency arrays, direct `setState` calls, and ref-held audio state move unchanged.
- Does this modify the YM2149 emulator or SoundDriver? No.
- Must audio playback be manually tested after the change? Yes. After the playback slice lands, manual playback verification covers song play, line-loop play from cursor and from start, stop, and the Enter/Ctrl+Enter toggle paths.

A slice that cannot move without altering render timing is re-scoped or dropped and recorded in the plan, per the change record.

## Documentation Updates

Per project guidelines, update the active documentation set as part of this change. The affected files are:

- `ARCHITECTURE.md` — the "App.tsx as central orchestrator" decision, the `hooks` module-boundary entry, and the Known Limitations entry citing the App.tsx line count are updated to describe the bounded hook containers once the slices land.
- `SPECIFICATION.md` — the "App.tsx monolith" Known Limitations entry is updated to the post-slice state.

`PROJECT.md` and `FORMAT.md` require no changes: no requirements change and no file format changes.

Documentation edits land in the same change set as the code, before the final verification loop.

## Type and State Updates

**Type definitions**

No changes to shared type definitions. Each extracted hook declares its own parameter and return interfaces in its file, following the existing `useXxx({...})` convention in `src/hooks/`.

**State store modifications**

No store changes. `uiStore` subscriptions stay at the top of `App.tsx` and are passed into extracted hooks as values.

## Step by Step Implementation

Each step extracts one bounded concern from `App.tsx` into a dedicated hook under `src/hooks/`. The hook is called at the position where its statements used to sit, preserving declaration order and effect execution order. Every step ends with a targeted verification run and leaves the tree green.

**Extract useAppInfoDialogs**

Move the About, Changelog, Manual, and Quit dialog concerns: `aboutRuntimeLabel`/`aboutRuntimeDetails` state, the runtime-info `useEffect`, and `handleShowAbout`, `handleShowChangelog`, `handleCloseChangelog`, `handleShowManual`, `handleCloseManual`, `handleConfirmQuit`, `handleCancelQuit`.

Blast-radius win: removes the Electron runtime-info probe and the bundled-markdown fetch chain from the orchestrator; no audio-path inputs.

File to create: `src/hooks/useAppInfoDialogs.ts`. File to modify: `src/App.tsx`.

**Extract useSongLifecycleDialogs**

Move the new-song, reset, and demo-song flows: `pendingNewSongAction`, `isDemoSongPickerOpen`, `handleRequestNewSong`, `handleConfirmNewSong`, `handleCancelNewSong`, `handleRequestReset`, `handleConfirmReset`, `handleCancelReset`, `openDemoSongPicker`, `handleDemoSongClick`, `handlePickDemoSong`.

Blast-radius win: the reset/reload and demo-song fetch logic leaves the render path; consumers only see stable handlers and the picker-open flag.

File to create: `src/hooks/useSongLifecycleDialogs.ts`. File to modify: `src/App.tsx`.

**Extract useInstrumentFileLoading**

Move `instrumentFileInputRef`, `isRepositoryInstrumentOpen`, `handleLoadInstrumentClick`, `handleOpenRepositoryInstrumentPicker`, `handleInstrumentFileContent`, `handleConfirmInstrumentTypeWarning`, `handleCancelInstrumentTypeWarning`, and `handlePickRepositoryInstrument`.

Blast-radius win: YAML sniffing and the instrument type-warning flow are bounded to one hook; `App.tsx` stops importing `js-yaml` directly.

File to create: `src/hooks/useInstrumentFileLoading.ts`. File to modify: `src/App.tsx`.

**Extract usePasteTrackOptions**

Move `pasteTrackMode`, `pasteTrackPendingMode`, `isPasteTrackModalOpen`, `pasteTrackModalResolveRef`, the `PASTE_TRACK_MODE` persistence effect, `getPasteTrackMode`, `handleConfirmPasteTrackModal`, and `handleCancelPasteTrackModal`. The hook is called before `useTrackOperations`, which consumes `getPasteTrackMode`.

Blast-radius win: the promise-resolver modal pattern is isolated and becomes testable in isolation.

File to create: `src/hooks/usePasteTrackOptions.ts`. File to modify: `src/App.tsx`.

**Extract useInstrumentDialogs**

Move `instrumentMidiTarget`, `instrumentColorTarget`, `handleInstrumentSelect`, `handleOpenInstrumentMidi`, `handleCloseInstrumentMidi`, `handleSaveInstrumentMidi`, `handleOpenInstrumentColor`, `handleCloseInstrumentColor`, `handleSaveInstrumentColor`, `handleClearInstrumentColor`, and `handleChangeBaseKey`.

Blast-radius win: the duplicated map-and-update instrument mutation pattern lives in one place instead of three near-identical handlers in the orchestrator.

File to create: `src/hooks/useInstrumentDialogs.ts`. File to modify: `src/App.tsx`.

**Extract useSongToolDialogs**

Move `handleToggleDebugMode`, `handleOptimizeSong`, `handleConfirmOptimize`, `handleCancelOptimize`, `handleCloseOptimizeSummary`, `handleRenumberSong`, `handleConfirmRenumber`, `handleCancelRenumber`, `handleCloseRenumberSummary`, and `handleCloseInstrumentOperationSummary`.

Blast-radius win: summary-dialog plumbing for the song tools leaves the orchestrator; each handler is a thin confirm/cancel pair with no audio-path reach.

File to create: `src/hooks/useSongToolDialogs.ts`. File to modify: `src/App.tsx`.

**Extract useExportModal**

Move `pendingExportType`, `pendingExportStrategy`, `handleOpenExport`, `handleCancelExport`, `handleConfirmExport`, `handleExportTypeChange`, `handleExportStrategyChange`, `buildExportContext`, and the six `handleExport*FromModal` handlers.

Blast-radius win: the export-context assembly and the six format fan-out handlers collapse into one hook; `App.tsx` no longer knows the export-modal pending-state protocol.

File to create: `src/hooks/useExportModal.ts`. File to modify: `src/App.tsx`.

**Extract useTransposeDialog**

Move `handleOpenTranspose`, `handleCancelTranspose`, `handleConfirmTranspose`, `handleTransposeAmountChange`, and `handleCloseTransposeSummary`.

Blast-radius win: the semitone parsing and summary-string assembly move out of the render path; the transpose scope setters stay in `useAppState` untouched.

File to create: `src/hooks/useTransposeDialog.ts`. File to modify: `src/App.tsx`.

**Extract useMidiDialog**

Move `handleLiveMidiConfigChange`, `handleShowMidi`, `handleCloseMidi`, `handleSaveMidiConfig`, `handleClearMidiMonitors`, `handleRescanMidiDevices`, and `handleMidiSystemReset`. The hook consumes the `useMidiHandling` return value.

Blast-radius win: the MIDI modal handler cluster is bounded; `App.tsx` wires `useMidiHandling` once and passes the result through.

File to create: `src/hooks/useMidiDialog.ts`. File to modify: `src/App.tsx`.

**Extract useResponsivePanels**

Move `isMobileViewport`, `isCommandPanelMobileCollapsed`, the resize/mount `useEffect`, and the `COMMAND_PANEL_MOBILE` persistence effect.

Blast-radius win: viewport probing and its localStorage mirror leave the orchestrator; the effect order is preserved by calling the hook where the effects stood.

File to create: `src/hooks/useResponsivePanels.ts`. File to modify: `src/App.tsx`.

**Extract useEditorPersistence**

Move `hasRestoredCursorRef`, the editor-cursor restore effect, the current-instrument persist effect, the editor-cursor persist effect, and the small storage-persist effects for `EQ_MUTES`, `INSTRUMENT_OCTAVES`, and `TRACK_BACKGROUND_ENABLED`.

Blast-radius win: all localStorage read/write plumbing for editor state is bounded to one hook, keeping persist writes off the audio path documented in one place.

File to create: `src/hooks/useEditorPersistence.ts`. File to modify: `src/App.tsx`.

**Extract usePlaybackHandlers**

Audio-critical slice, executed last. Move `isLinePlaying`, `patternReturnPositionRef`, `handleStop`, `handleStopLinePlayback`, `handleStartSong`, `handleStartLinePlayback`, `handleStartLineFromBeginning`, `handleStartLineFromCurrentLine`, `handleToggleLineFromCursor`, `handleToggleLineFromStart`, and the playback-bounds safety `useEffect`. The hook is called where the handler block stood, before `useKeyboardShortcuts` consumes `handleStartSong`, `handleStartLineFromBeginning`, `handleStartLinePlayback`, and `handleStop`.

Blast-radius win: the line-loop return-position protocol (`patternReturnPositionRef` plus `lastSequencerPositionRef` clearing) is owned by one hook instead of being reproduced across six callbacks in the orchestrator.

Constraint: every moved `useCallback` keeps its dependency array verbatim and the safety effect keeps its position relative to neighbouring effects. If any handler cannot move without touching the sparse-dependency contract, that handler stays in `App.tsx` and the deviation is recorded.

File to create: `src/hooks/usePlaybackHandlers.ts`. File to modify: `src/App.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation sections listed under Documentation Updates
2. Extract `useAppInfoDialogs`, run targeted verification
3. Extract `useSongLifecycleDialogs`, run targeted verification
4. Extract `useInstrumentFileLoading`, run targeted verification
5. Extract `usePasteTrackOptions`, run targeted verification
6. Extract `useInstrumentDialogs`, run targeted verification
7. Extract `useSongToolDialogs`, run targeted verification
8. Extract `useExportModal`, run targeted verification
9. Extract `useTransposeDialog`, run targeted verification
10. Extract `useMidiDialog`, run targeted verification
11. Extract `useResponsivePanels`, run targeted verification
12. Extract `useEditorPersistence`, run targeted verification
13. Extract `usePlaybackHandlers`, run targeted verification
14. Run the full verification loop

The slices run lowest-risk first; the audio-critical playback slice lands last so any timing problem is attributable to that single step.

## Testing Strategy

**Unit tests**

The extracted hooks are wiring containers rather than pure functions, so there is no new utility surface to unit-test. Existing hook tests continue to apply unchanged; no test file changes are planned unless a slice exposes a pure helper worth lifting into `src/utils/`, in which case a matching `test/utils/` file is added in the same step.

**Integration tests**

No new integration tests. The existing suite (`test/`, 544 tests at baseline) exercises the moved handlers through their consumers; any regression in wiring fails the targeted runs after each slice.

Manual verification after the playback slice: play the demo song, run line-loop playback from cursor and from start, stop, and confirm the Enter/Ctrl+Enter cursor-restore behaviour still holds.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- After each slice: `npm run typecheck`, `npm run lint`, `npm run format` on touched files, `npm run build`, `npm test -- test/hooks test/components`
- After the final slice: `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`
- Manually verify playback timing and audio stability after the `usePlaybackHandlers` slice
- Confirm `src/App.tsx` ends substantially below its current 2620 lines with the orchestration concerns bounded in `src/hooks/`
