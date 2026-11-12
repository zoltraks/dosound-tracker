# Refactoring Proposal - 1.5.7

## Problem

The 1.5.7 window work - CLONE TRACK, the whole-track COPY TRACK split, the
tail-preserving paste, and the Shift+PageUp/PageDown navigation rebind -
left repetition in the track-operation paths the window edited.

**Clipboard and pattern guards repeated across `useTrackOperations.ts`**

The Clipboard-API availability guard
`typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText/readText`
followed by `setTrackClipboardError('Clipboard API is not available in this
browser.')` appears three times - in `copyTrackToClipboard`, `handleCutTrack`,
and `handlePasteTrack`, differing only in the checked method. The missing-
pattern guard `if (!pattern) { setTrackClipboardError('No pattern is assigned
for the current track at this position.'); return; }` appears four times in the
same file. Both encode fixed messages and belong in one place each.

File: `src/hooks/song/useTrackOperations.ts`.

**Step copy and empty-step literals duplicated across the two hooks**

The deep-copy literal `{ note: step.note ? { ...step.note } : null,
...(step.volume !== undefined ? { volume: step.volume } : {}) }` appears in
`handleCloneTrack` (`useTrackOperations.ts`) and in `duplicateTrack` inside
`handleCloneLine` (`usePlaylistOperations.ts`) - the window added the second
copy. The empty-step literal `({ note: null } as Step)` pads both
`handleCloneTrack`'s map and `handleCreateTrackFromSteps`. Both literals encode
the Step shape and drift independently.

Files: `src/hooks/song/useTrackOperations.ts`, `src/hooks/song/usePlaylistOperations.ts`.

**`song.length || PATTERN_LENGTH` repeated nine times**

The fallback `song.length || PATTERN_LENGTH` appears nine times across the two
hooks. It encodes the project rule that an unset song length means the default
64-row pattern and belongs behind a named helper.

Files: `src/hooks/song/useTrackOperations.ts`, `src/hooks/song/usePlaylistOperations.ts`.

**TrackPanel PAGEUP/PAGEDOWN branches differ only in direction**

The two `else if` branches added modifier guards this window and now repeat the
same six-line body with only the step sign flipped.

File: `src/components/TrackPanel.tsx`.

## Goal

- Module-level pure helpers in `src/utils/track/trackUtils.ts`:
  `resolvePatternLength(songLength)` owns the length fallback,
  `cloneTrackStep(step)` owns the deep copy, `emptyTrackStep()` owns the empty
  Step literal, and `getClipboardApiOrReport(kind, onError)` owns the
  Clipboard-API guard and message. Every call site delegates; semantics
  unchanged.
- One `useCallback` `getCurrentPatternOrReport(trackId)` inside
  `useTrackOperations.ts` owning the missing-pattern guard and message; the
  four guard sites delegate.
- One combined PAGEUP/PAGEDOWN branch in `TrackPanel.tsx` deriving direction
  from the key.
- Observable behaviour is identical - same clipboard errors, same copies, same
  row jumps.

## Plan

Execute the steps in order; each step leaves the tree buildable and testable.

1. Tidy: add `resolvePatternLength`, `cloneTrackStep`, `emptyTrackStep`, and
   `getClipboardApiOrReport` to `src/utils/track/trackUtils.ts`; mechanically
   replace the nine length fallbacks, the two step-copy literals, the
   empty-step literals, and the three clipboard guards. Dependency arrays are
   unaffected - module scope and `setTrackClipboardError` already in scope.
2. Tidy, one file: add `getCurrentPatternOrReport` as a `useCallback` in
   `useTrackOperations.ts` depending on `getCurrentPatternForTrack`; migrate
   the four guard sites and swap `getCurrentPatternForTrack` for
   `getCurrentPatternOrReport` in each migrated callback's dependency array.
3. Tidy, one file: fold `TrackPanel.tsx`'s PAGEUP and PAGEDOWN branches into a
   single `key === 'PAGEUP' || key === 'PAGEDOWN'` branch with the direction
   derived from the key.
4. Run the full verification loop.

Step granularity: all steps are tidy mechanical replacements, each confined to
a small file set, and each independently verifiable.

## Risk

- The 180+ tests in `test/hooks/song/useTrackOperations.test.tsx` and
  `test/hooks/song/usePlaylistOperations.test.tsx` pin every affected path -
  copy/cut/paste guards, clone semantics, CLONE LINE duplication, and cursor
  movement - so a semantic slip surfaces immediately.
- `getClipboardApiOrReport` must preserve the read/write asymmetry: copy and
  cut check `writeText`, paste checks `readText` - a unified guard that always
  checked one method would change behaviour in partial-API environments.
- `cloneTrackStep` must keep the `volume !== undefined` conditional spread -
  copying an explicit `undefined` into the step would change YAML
  serialisation.
- `getCurrentPatternOrReport` is a hook-level callback, not module scope - its
  consuming callbacks must list it (or keep `getCurrentPatternForTrack` when
  they use it for more than the guard) in their dependency arrays or
  referential staleness returns.
- Thin-coverage area: the `TrackPanel` branch merge is pinned by
  `TrackPanelInput` tests asserting the modified-key skip; the direction
  derivation is a two-value ternary, low risk.
