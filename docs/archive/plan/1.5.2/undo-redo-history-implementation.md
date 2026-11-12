# Add Undo and Redo History Implementation Plan

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Give composers a way to reverse and re-apply edits instead of re-entering |
|               | lost work by hand                                                         |
| Key decisions | State snapshots of the song-plus-instrument pair, recorded inside         |
|               | `useDataManagement` at the single mutation boundary; pure stack logic in  |
|               | `editHistory.ts`; CTRL+Z undo, CTRL+Y and CTRL+SHIFT+Z redo               |
| Open risks    | none                                                                      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/undo-redo-history.md`.

## Analysis

Every composition edit funnels through `useDataManagement`: `updateSong`,
`updateInstrument`, `createNewSong`, `createNewInstrument`, `loadInstrument`,
`createNewPattern`, `addPlaylistEntry`, `optimizeSong`, `renumberSong`, and
`applyParsedSong`. Panels and sibling hooks never write song state directly.
This makes the hook the single history boundary the record asks for.

All mutation helpers produce fresh objects through spreads
(`updatePatternStep`, `applyClipboardToLines`, `performTranspose`,
`optimizeSongData`, `renumberSongData`, the instrument operations) - nothing
mutates a pattern, step, or instrument in place. A snapshot holding object
references is therefore safe and cheap, and no deep copy or command layer is
needed. The command-pattern alternative is rejected: it would rewrite every
mutation site for no gain over snapshots at this single boundary.

Two gaps exist between the record's composite-operation rule and the tree.
`handleCreatePatternAt` and `handleCreateNewTrack` in `usePlaylistOperations`
run `createNewPattern` plus `updateSong` as two mutations; they merge into one
`updateSong` call carrying both `pattern` and `line`. And
`getCurrentPatternForTrack` lazily materializes a missing pattern through
`updateSong` - an implicit fix-up, not an edit, so it moves to a
non-recording option.

Keyboard gaps verified against the tree. `matchKeyboardShortcut` returns null
for every CTRL+SHIFT combination, so CTRL+SHIFT+Z needs the matcher extended.
The final note-entry branch of `TrackPanel.handleKeyDown` ignores `ctrlKey`,
so CTRL+Z in a focused track would enter a note while undoing - a modifier
guard goes in front of the note mapping. Song information fields are real
`<input>` elements, and the window handler already skips editable targets, so
text fields keep native text undo instead of triggering song undo.

Snapshot granularity follows one entry per recorded mutation, which matches
note entry, playlist edits, and all composite commands. The only
high-frequency surface is the song information inputs - text typing produces
one `updateSong` call per keystroke - so `updateSong` accepts an optional
coalescing key: a second edit carrying the same key inside a one-second
window joins the previous entry instead of pushing a new one.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- No abbreviations in identifiers (use full words)
- Keep components focused on single responsibility

## Audio-Critical Requirements

- The change adds no dependencies to existing `useCallback`/`useMemo`
  arrays on audio paths and introduces no new effect or ref into the
  playback pipeline.
- Undo and redo only call the existing `setCurrentSong`,
  `setCurrentInstrument`, and `setIsSongDirty` setters - the same
  mechanism a normal edit uses, so a restore during playback re-syncs the
  sequencer through the existing `usePlaybackControls` effects and never
  touches the engine, the worker, or an audio callback.
- The history stacks live in a `useRef`, so recording and restoring add no
  render-time work and no state churn at tick rate.
- Playback verification: the note-entry undo path is covered by the new
  hook tests, and live playback by the existing e2e smoke suite under the
  webkit project.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `PROJECT.md` - new requirement F-20 for undo/redo edit history and a
  matching use case C-06.
- `ARCHITECTURE.md` - the state-domain paragraph and the decision log gain
  the snapshot history; the "No undo/redo" limitation is removed and the
  "No Command pattern" entry revised.
- `SPECIFICATION.md` - input bindings gain the three history shortcuts and
  a new Edit History section records the model, scope, bounds, and silent
  paths.
- `TESTING.md` - the e2e flow list gains the undo/redo case and the unit
  list gains the history stack.
- `public/MANUAL.md` - the keyboard navigation list gains the undo/redo
  bindings.
- `FORMAT.md` - no change; the history is session state and never enters a
  file format.

## Type and State Updates

**Type definitions**

New types for the snapshot and the recording options, defined beside the
modules that own them.

File to create: `src/utils/song/editHistory.ts`.

```typescript
export interface EditHistory<T> {
  undo: T[];
  redo: T[];
  lastKey: string | null;
  lastTime: number;
}
```

File to modify: `src/hooks/song/useDataManagement.ts`.

```typescript
export interface EditSnapshot {
  song: Song;
  instrument: Instrument;
}

export interface UpdateSongOptions {
  record?: boolean;
  coalesceKey?: string;
}
```

**State store modifications**

None. History is session state held in a ref inside `useDataManagement` -
it does not join the UI store and never persists.

## Step by Step Implementation

**Add the history stack utility**

Pure functions holding the two stacks, the depth bound, and the coalescing
window, so the logic is unit-testable without React.

File to create: `src/utils/song/editHistory.ts`.

```typescript
export const EDIT_HISTORY_LIMIT = 100;
export const EDIT_COALESCE_MS = 1000;

export const createEditHistory = <T>(): EditHistory<T> => ({
  undo: [],
  redo: [],
  lastKey: null,
  lastTime: 0,
});

export const recordEdit = <T>(
  history: EditHistory<T>,
  snapshot: T,
  coalesceKey?: string,
): boolean;

export const takeUndoSnapshot = <T>(
  history: EditHistory<T>,
  current: T,
): T | null;

export const takeRedoSnapshot = <T>(
  history: EditHistory<T>,
  current: T,
): T | null;
```

`recordEdit` pushes the snapshot, drops the oldest entry beyond
`EDIT_HISTORY_LIMIT`, clears `redo`, and returns `false` without pushing
when `coalesceKey` repeats the last key inside `EDIT_COALESCE_MS`.
`takeUndoSnapshot` pops `undo`, pushes `current` onto `redo`, and resets the
coalescing marker; `takeRedoSnapshot` mirrors it.

**Record snapshots inside the data management hook**

Hold the history in a ref, record one snapshot before every recorded
mutation, and expose `undo`, `redo`, `canUndo`, `canRedo`.

File to modify: `src/hooks/song/useDataManagement.ts`.

```typescript
const historyRef = useRef<EditHistory<EditSnapshot>>(createEditHistory());
const [historySize, setHistorySize] = useState({ undo: 0, redo: 0 });

const recordHistory = useCallback(
  (coalesceKey?: string) => {
    recordEdit(
      historyRef.current,
      { song: currentSong, instrument: currentInstrument },
      coalesceKey,
    );
    setHistorySize({
      undo: historyRef.current.undo.length,
      redo: historyRef.current.redo.length,
    });
  },
  [currentSong, currentInstrument],
);
```

Every recorded mutator calls `recordHistory()` before applying its change:
`createNewSong`, `createNewInstrument`, `applyParsedSong`, `loadInstrument`,
`updateInstrument`, `createNewPattern`, `addPlaylistEntry`, `optimizeSong`,
and `renumberSong`. `undo` pops through `takeUndoSnapshot` with the live
pair as the redo entry, restores both setters, and marks the song dirty;
`redo` mirrors it. `canUndo`/`canRedo` derive from `historySize`.

`updateSong` gains `UpdateSongOptions`: `{ record: false }` skips recording
and `coalesceKey` feeds `recordHistory`. An update whose provided keys are
all `Object.is`-identical to the current song skips recording but still
applies, preserving the existing normalization side effects.

`setCurrentInstrument` stays unrecorded - it is instrument selection, not
a composition edit. The startup mirror restore and the instrument-sync
effect also stay unrecorded.

**Merge the two-call playlist composites**

Rewrite `handleCreatePatternAt` and `handleCreateNewTrack` to build the new
pattern through `createPatternForSong` and apply `pattern` plus `line` in a
single `updateSong` call. The `createNewPattern` parameter leaves the hook
signature.

File to modify: `src/hooks/song/usePlaylistOperations.ts`.

```typescript
const { newPattern } = createPatternForSong(song, patternId);
updateSong({
  line: mapPlaylistEntriesToSongLine(newPlaylist),
  pattern: [...song.pattern, newPattern],
});
```

**Make the lazy pattern materialization silent**

The fix-up branch of `getCurrentPatternForTrack` calls `updateSong` with
`{ record: false }`. The hook's `updateSong` parameter type widens to
accept `UpdateSongOptions`.

File to modify: `src/hooks/song/useTrackPattern.ts`.

**Coalesce song information edits**

`handleFieldChange` forwards `coalesceKey: 'song-info:' + field` so a
typing burst or a toggle cycle in one field merges into one entry.

File to modify: `src/components/InformationPanel.tsx`.

The `onChange` prop widens to
`(updates: Partial<Song>, options?: UpdateSongOptions) => void`.

**Bind the undo and redo shortcuts**

Register the three combinations in the shortcut vocabulary and extend the
matcher for CTRL+SHIFT.

Files to modify: `src/constants/navigation.ts`, `src/utils/keyboard/keyboardShortcutUtils.ts`.

```typescript
'CTRL+Z': 'undo',
'CTRL+Y': 'redo',
'CTRL+SHIFT+Z': 'redo',
```

```typescript
if (ctrl && shift) {
  if (keyUpper === 'Z') {
    return { shortcut: 'CTRL+SHIFT+Z', preventDefault: true };
  }
  return null;
}
```

`Z` and `Y` join the CTRL-only switch with `preventDefault` set.

**Route the actions through the global shortcut channel**

`GlobalShortcutName` gains `'undo' | 'redo'`, and `useKeyboardShortcuts`
registers the two handlers from `useDataManagement`.

Files to modify: `src/hooks/keyboard/useKeyboardShortcuts.ts`, `src/App.tsx`.

**Guard modifier keys in track note entry**

Bail out of the note-entry branch when `ctrlKey`, `metaKey`, or `altKey` is
held, so CTRL+Z and the other control combinations can never enter a note.

File to modify: `src/components/TrackPanel.tsx`.

```typescript
} else {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
  ...
}
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Add the history stack utility
3. Record snapshots inside `useDataManagement`
4. Merge the playlist composites and silence the lazy materialization
5. Coalesce song information edits
6. Bind the shortcuts and wire `App.tsx`
7. Guard modifier keys in `TrackPanel`
8. Add or update tests
9. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/utils/song/editHistory.test.ts`.

- `recordEdit` pushes, clears `redo`, and evicts the oldest entry at
  `EDIT_HISTORY_LIMIT`.
- A repeated `coalesceKey` inside the window does not push; a different
  key or an expired window does.
- `takeUndoSnapshot`/`takeRedoSnapshot` move the current pair across
  stacks and reset the coalescing marker.

Test file to create: `test/hooks/song/editHistory.test.tsx`.

- `updateSong` records and `undo`/`redo` restore the song; `canUndo` and
  `canRedo` track the stacks.
- `updateInstrument` restores the instrument pair.
- A new edit after undo discards the redo branch; a paste-style single
  `updateSong` reverts as one step.
- `{ record: false }` records nothing; a `coalesceKey` burst records once;
  `setCurrentInstrument` alone records nothing.

Test file to update: `test/utils/keyboard/keyboardShortcutUtils.test.ts`.

- CTRL+Z, CTRL+Y, and CTRL+SHIFT+Z match with `preventDefault`; other
  CTRL+SHIFT combinations still return null.

**Integration tests**

- `e2e/smoke.spec.ts` - one flow enters a note in track A, undoes it,
  verifies the cell clears, redoes, and verifies the note returns.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` under the webkit project for the keyboard-flow slice
- Manually verify undo during playback leaves audio timing stable
