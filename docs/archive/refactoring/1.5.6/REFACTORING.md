# Refactoring Proposal - 1.5.6

## Problem

The 1.5.6 window work - seamless Enter mode switching, disabled-track Enter bindings, and playlist focus preservation - left two duplication clusters in code paths the window touched repeatedly.

**Playlist guards and index clamps repeated across `usePlaybackHandlers.ts`**

`Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1))` appears eight times - in `handleStartSong`, `handleStartLinePlayback`, `handleStartLineFromBeginning`, `handleStartLineFromCurrentLine`, the two line toggles' switch branch, and both song toggles. The playable-line guard the disabled-track fix added, `!currentEntry` followed by `currentEntry.A === '--' && currentEntry.B === '--' && currentEntry.C === '--'`, repeats three times across the line-start functions. The expression encodes a project rule - a playlist line is playable when any channel holds a pattern - and belongs in one place.

File: `src/hooks/playback/usePlaybackHandlers.ts`.

**Enter toggle handlers duplicated in two near-identical pairs**

`handleToggleSongFromCursor` and `handleToggleSongFromStart` differ only in the start row - the cursor clamps `lineIndex`, the start variant passes 0. `handleToggleLineFromCursor` and `handleToggleLineFromStart` share an identical playing branch: same-mode press stops, song playback records the pressed row when no return position exists and delegates to `handleStartLinePlayback`. The blocks grew together during the mode-switch work and now drift independently - a fix to one copy must be mirrored by hand.

File: `src/hooks/playback/usePlaybackHandlers.ts`.

**Line-command button boilerplate in `CommandPanel.tsx`**

The four playlist line buttons each carry the same six-line handler pair - `onMouseDown` preventDefault plus an `onClick` that stops propagation before invoking the command - the pattern the playlist-focus fix introduced this window. Four verbatim copies cross the Rule-of-Three threshold.

File: `src/components/CommandPanel.tsx`.

## Goal

- Module-level pure helpers in `usePlaybackHandlers.ts`: `clampPlaylistIndex(patternIndex, playlistLength)` owns the index clamp and `resolvePlayableLineIndex(song, patternIndex)` owns the empty-playlist, missing-entry, and all-empty-channel guard, returning the clamped index or null. Every call site delegates; guard semantics unchanged.
- One parameterized `toggleSongPlayback(lineIndex, startFromCursor)` behind `handleToggleSongFromCursor` and `handleToggleSongFromStart`, and one shared playing-branch helper behind the two line toggles. Public handler names, signatures, and dispatch order are unchanged.
- One local `keepSectionButtonProps(handler)` in `CommandPanel.tsx` returning the `onMouseDown`/`onClick` pair, spread onto the four line buttons.
- Observable behaviour is identical - the same bindings start, switch, and stop playback the same way, and the same buttons keep section and focus.

## Plan

Execute the steps in order; each step leaves the tree buildable and testable.

1. Tidy: add `clampPlaylistIndex` and `resolvePlayableLineIndex` as module-level pure functions in `usePlaybackHandlers.ts`; mechanically replace the clamp literals and the three guard sequences. No dependency-array changes - module scope keeps the hand-maintained deps stable.
2. Structural, one file: fold `handleToggleSongFromStart`'s body into a parameterized `toggleSongPlayback(lineIndex, startFromCursor)`; `handleToggleSongFromCursor` delegates with `true`, `handleToggleSongFromStart` with `false`. The internal callback joins both public callbacks' dependency arrays.
3. Structural, one file: extract the identical playing branch of the two line toggles into `handleLineToggleWhilePlaying(lineIndex)`; both toggles call it and keep their distinct not-playing tails. The helper joins both dependency arrays.
4. Tidy: extract `keepSectionButtonProps(handler)` in `CommandPanel.tsx` and spread it on ADD LINE, DUPLICATE LINE, CLONE LINE, and DELETE LINE. INSERT STEP, DELETE STEP, MIDI, and EXPORT keep their propagation-only handlers - they have no focus-prevention mousedown and stay untouched.
5. Run the full verification loop.

Step granularity: steps 1 and 4 are tidy mechanical replacements, steps 2 and 3 are the only structural steps and stay inside `usePlaybackHandlers.ts`, and each step is independently verifiable.

## Risk

- The 42 tests in `test/hooks/playback/usePlaybackHandlers.test.tsx` pin every affected path - deferred engine gating, empty-line guards, disabled-track starts, seamless mode switching, and return-position ownership - so a semantic slip surfaces immediately.
- The file maintains dependency arrays by hand under `/* eslint-disable react-hooks/exhaustive-deps */` - a shared callback must be added to each consuming array or referential staleness returns. Module-level helpers in step 1 avoid the risk entirely; steps 2 and 3 update the arrays explicitly.
- `patternReturnPositionRef` ownership semantics (first binding owns the return position) must not move between the switch branch and the not-playing branch of either line toggle - the mode-switch tests pin the ordering.
- The `CommandPanel` helper must preserve handler invocation order - `stopPropagation` runs before the command callback - and must not extend focus prevention to the propagation-only buttons.
- Thin-coverage area: none - the touched code all gained tests this window.

## Acceptance Criteria

- No `Math.max(0, Math.min(sequencerState.currentPattern` literal remains in `usePlaybackHandlers.ts`; the all-empty-line check exists exactly once.
- `handleToggleSongFromCursor`, `handleToggleSongFromStart`, `handleToggleLineFromCursor`, and `handleToggleLineFromStart` keep their public names and `(lineIndex) => void` signatures.
- The four playlist line buttons spread the shared props helper; the propagation-only buttons are byte-identical.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test` pass with zero errors and zero warnings.
- Manual smoke: Enter, Ctrl+Enter, Shift+Enter, and Ctrl+Shift+Enter start, switch, and stop playback identically on enabled and disabled tracks; playlist line commands keep the playlist active and focused - identical behaviour to before the refactor.
