# Continue App Decomposition Implementation Plan

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | Move the next bounded `App.tsx` slices into orchestration hooks              |
| Key decisions | Extract the store-selector bundle (`useAppUiState`), the stereo pan          |
|               | cluster (`useChannelPans`), and the settings session (`useSettingsSession`); |
|               | derive `patternsById` inside `usePlaybackBridge`; keep the JSX prop map      |
|               | as the visible composition table                                             |
| Open risks    | `useSettingsSession` carries a wide parameter object - mirroring the         |
|               | established orchestration-hook convention                                    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/continue-app-decomposition.md`.

## Analysis

Every cluster the earlier stages named (dialog groups, persistence, playback
handlers, modal layer, navigation suspension, startup restore) already lives in
`src/hooks/`. `App.tsx` remains the largest file in the tree. The remaining
inline logic, verified against the current file, is:

- Seven `useUiStore` selector calls - the shell's store slice (three members,
  four actions).
- `patternsById` memo - its sole consumer is the `usePlaybackBridge` call.
- `channelPans` memo and `handleChannelPanChange` - the stereo pan routing
  cluster. `soundEngineId` state stays in place as composition-root state
  consumed by `useAudioSetup` and the settings session.
- The settings session block: `committedSettings` memo, the `useSettingsDialog`
  call, `closeSettingsSession`, `handleCommitSettings`, `handleCancelSettings`.
  This is the largest embedded handler logic left.
- Small derived values (`envelopeMessages`, `previewTickIntervalMs`,
  `handleLineChange`, `isDarkMode`) - too small to carry a slice, the same
  verdict the previous stage recorded.
- The JSX prop map stays. It is the composition table the record asks to keep
  visible - wrapping each section in a pass-through component would move the
  wiring rather than reduce it, and extracting the whole map would produce the
  opaque shell the record rules out.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- A hook extracted out of the orchestrator is called before the earliest
  consumer of its returned values (`WORKFLOW.md` wound rule).
- Extraction parameters are typed to the producing hook's real signatures.
- Hooks name what they do and live in a domain subdirectory.
- Moved code travels verbatim: same dependency arrays, same memoization, same
  call order. The settings-session file carries the
  `/* eslint-disable react-hooks/exhaustive-deps */` header if the moved
  committed-settings memo needs the suppression - lint decides.
- `useSettingsSession` receives only the two `modalState` fields it needs
  (`isSettingsOpen`, `setIsSettingsOpen`) - `App.tsx` keeps destructuring
  `modalState` for existing consumers.

## Audio-Critical Requirements

- Does this change affect React render timing? No - every moved fragment keeps
  its `useMemo`/`useCallback` semantics and the hook call sequence stays static.
- Does this modify `useCallback` or `useMemo` dependencies? No - dependency
  arrays travel verbatim; `useChannelPans` renames `currentSong.stereo` to the
  `stereo` parameter inside the same arrays.
- Does this change state management patterns in audio paths? No - `patternsById`
  derives from `currentSong.pattern` inside `usePlaybackBridge` with the same
  memoization, and no ref, mirror, or callback identity changes.
- Does this modify the YM2149 emulator or SoundDriver? No.
- Must audio playback be manually tested? The `test:e2e` smoke suite covers
  play/stop flows and substitutes for the manual check per `TESTING.md`.

## Directory Tree

The structural result after the slices.

```
src/
  App.tsx                        composition root - hook wiring + JSX prop map
  hooks/
    ui/
      useAppUiState.ts           new - uiStore member and action bundle
      useUiStore.ts              unchanged - single Zustand store
    song/
      useChannelPans.ts          new - stereo pan resolution and pan-cycle handler
    modal/
      useSettingsSession.ts      new - committed settings, dialog session,
                                 commit and cancel handlers
      useSettingsDialog.ts       unchanged - dialog working state
    playback/
      usePlaybackBridge.ts       modified - derives patternsById internally
```

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `ARCHITECTURE.md` - add `useAppUiState`, `useChannelPans`, and
  `useSettingsSession` to the orchestration-hook list, record their roles, and
  update the store-subscription sentence and the wiring limitation.
- `SPECIFICATION.md` - refresh the `App.tsx` orchestrator limitation, name
  `useSettingsSession` in the modal working-state note, and repair the stale
  single-chip limitation found during analysis (the `AY` variant is supported).
- `PROJECT.md` - no changes; the change is behaviour-preserving.
- `TESTING.md` - no changes.

## Type and State Updates

No new shared types or store members. The new hooks declare parameter and
result interfaces only, using existing exported types: `UiStore`, `Song`,
`SongStereo`, `UpdateSongOptions`, `ThemeVariant`, `TextScale`,
`TrackPasteMode`, `SoundEngineId`, `SettingsValues`, `UseSettingsDialogResult`.

## Step by Step Implementation

**Extract the store-selector bundle**

Create `src/hooks/ui/useAppUiState.ts` - runs the seven verbatim `useUiStore`
selector calls and returns `currentOctave`, `sharedCurrentLine`,
`channelMutes`, `setCurrentOctave`, `setSharedCurrentLine`, `setChannelMutes`,
and `toggleChannelMute`. `App.tsx` destructures the bundle where the selectors
sit today, at the top of the component.

File to create: `src/hooks/ui/useAppUiState.ts`.
File to modify: `src/App.tsx`.

**Extract the stereo pan cluster**

Create `src/hooks/song/useChannelPans.ts` - owns the `channelPans` memo
(`resolveChannelPans`) and the `handleChannelPanChange` callback, verbatim with
their comment and dependency arrays. Params: `{ stereo, updateSong }`, where
`stereo` is `currentSong.stereo` and `updateSong` keeps its
`(updates: Partial<Song>, options?: UpdateSongOptions) => void` signature.
Called where the memo sits today - after the `soundEngineId` state, before
`useAudioSetup` consumes `channelPans`. The callback registers earlier than its
old position; the sequence is static, so hook order stays consistent and no
effect timing changes.

File to create: `src/hooks/song/useChannelPans.ts`.
File to modify: `src/App.tsx`.

**Derive `patternsById` inside `usePlaybackBridge`**

Move the memo body into `usePlaybackBridge`, computed from the `currentSong`
param it already receives, placed before the `useSequencerIntegration` call
that consumes it. Drop `patternsById` from the params interface, the
destructure, and the `App.tsx` call site.

File to modify: `src/hooks/playback/usePlaybackBridge.ts`.
File to modify: `src/App.tsx`.

**Extract the settings session**

Create `src/hooks/modal/useSettingsSession.ts` - owns the `committedSettings`
memo (`loadSettings()` with the verbatim trigger dependency list), calls
`useSettingsDialog(isSettingsOpen, committedSettings)` at the same point in the
hook sequence, and returns the dialog result plus the verbatim
`closeSettingsSession`-backed `handleCommitSettings` and `handleCancelSettings`
handlers. Params: `isSettingsOpen`, `setIsSettingsOpen`, the five watched
values (`theme`, `textScale`, `trackBackgroundEnabled`, `pasteTrackMode`,
`soundEngineId`), and their setters (`setTheme`, `setTextScale`,
`setTrackBackgroundEnabled`, `setPasteTrackMode`, `setSoundEngineId`). Called
where `useSettingsDialog` sits today, after `useScrollSync`.

File to create: `src/hooks/modal/useSettingsSession.ts`.
File to modify: `src/App.tsx`.

**Drop orphaned imports**

After the slices: `useUiStore`, `UiStore`, `useSettingsDialog`,
`loadSettings`, `writeSettingKeys`, `updateSettingsView`, `DEFAULT_SETTINGS`,
`SettingsValues`, `resolveChannelPans`, `nextChannelPan`, and the `Pattern`
type leave `App.tsx`. `useMemo`, `useCallback`, `useState`,
`loadSoundEngineId`, and `SoundEngineId` stay.

File to modify: `src/App.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `ARCHITECTURE.md` and `SPECIFICATION.md`.
2. `useAppUiState` - lint both files, typecheck.
3. `useChannelPans` - lint both files, typecheck.
4. `patternsById` inside `usePlaybackBridge` - lint both files, typecheck.
5. `useSettingsSession` - lint both files, typecheck.
6. Full verification loop plus `npm run test:e2e` (App wiring changed).

## Testing Strategy

No new tests - pure moves behind the same interfaces. The existing hook,
component, and `test/exports/` suites are the regression net, and the
Playwright smoke suite verifies the rewired composition root end to end.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e`
