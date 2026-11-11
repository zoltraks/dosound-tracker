# Add Undo and Redo Commands with Persistent Edit History Implementation Plan

## Summary

| Field         | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Intent        | UNDO and REDO command buttons, reload-persistent edit history, lifecycle clears  |
| Key decisions | Persisted depth 20 per stack, meta-fold kept, clear replaces record on lifecycle |
| Open risks    | Scheduled-save rewrite window after RESET - shared with the existing song save   |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.6/undo-redo.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces.
- Props interface named with `Props` suffix.
- Destructure props in function signature.
- Maintain accessibility with proper ARIA attributes.
- Keep components focused on single responsibility.
- No abbreviations in identifiers (use full words).
- `src/utils/song/editHistory.ts` stays pure - persistence lives in a separate storage utility and in the hook boundary.
- History work adds no render-time cost - stacks stay in a ref and serialization runs on the scheduled-save path, never in render.

## Audio-Critical Requirements

- React render timing is unaffected: the buttons subscribe only to `canUndo`/`canRedo` flags and history serialization runs inside the existing idle-debounced `scheduleJsonSave` machinery.
- `useCallback` dependencies on the audio path are untouched: `commitHistory` is a new stable callback consumed by the history boundary only.
- No state management pattern changes in audio paths - stacks remain ref-held.
- The YM2149 emulator and SoundDriver are untouched.
- Manual check after implementation: start playback, edit a note, undo - the sequencer must re-sync through the existing `usePlaybackControls` effects with no glitch or callback recreation, exactly as documented in `SPECIFICATION.md`.

## Documentation Updates

Update the active documentation set before any source code modifications.

- `PROJECT.md` - F-20 revises: the history persists across application reload, gains UNDO and REDO command buttons, and is destroyed by NEW SONG, LOAD SONG, DEMO SONG, and RESET instead of surviving a song switch.
- `SPECIFICATION.md` - Edit History section: the mutator list drops `createNewSong` and `applyParsedSong` as recording sites and names them as clearing sites; session-state claims become persisted-stack claims with the storage key and persisted depth; the History shortcuts list gains the CMD+SHIFT+Z macOS wording and the command buttons; the session-only limitation entry is replaced by the persisted-depth limitation.
- `ARCHITECTURE.md` - the state-domain paragraph and the snapshot-history decision update "session-scoped" to persisted-across-reload and record the lifecycle-clear rule.
- `public/MANUAL.md` - the command list gains UNDO and REDO entries; the shortcuts section gains the binding set where shortcuts are listed.
- `FORMAT.md` - no change: the persisted key is application storage, not the song or instrument file format.

## Type and State Updates

**Type definitions**

`EditSnapshot` moves from `useDataManagement.ts` into `src/utils/song/editHistory.ts` as its canonical home; the hook re-exports it so existing imports keep working.

File to modify: `src/utils/song/editHistory.ts`.

```typescript
export const EDIT_HISTORY_PERSIST_LIMIT = 20;

export interface EditSnapshot {
  song: Song;
  instrument: Instrument;
}

export interface SerializedEditHistory<T> {
  undo: T[];
  redo: T[];
}
```

**State store modifications**

A new storage key persists the serialized stacks. `StorageKeys` gains one member.

File to modify: `src/utils/storage/storageKeys.ts`.

```typescript
static readonly EDIT_HISTORY = 'dosound-tracker-edit-history' as const;
```

The scheduled-save union in `src/hooks/storage/useStorage.ts` widens to admit the new key, and the mirror lookup becomes optional since history is not mirrored.

```typescript
type JsonStorageKey = SongStorageKey | InstrumentStorageKey | typeof StorageKeys.EDIT_HISTORY;
// MIRROR_KEYS becomes Partial<Record<JsonStorageKey, MirrorKey>> and
// performSave mirrors only when the key resolves an entry.
```

`useDataManagement` gains `historySaveTimeoutRef` and initializes `historyRef` and `historySize` from the restored stacks instead of always starting empty.

## Step by Step Implementation

**Serialize and clear history**

Add the pure helpers the persisted lifecycle needs: `clearEditHistory` empties both stacks and resets the coalescing cursor, `serializeEditHistory` caps each stack to the newest `EDIT_HISTORY_PERSIST_LIMIT` entries for storage, and `deserializeEditHistory` validates a parsed value into an `EditHistory` with a cleared cursor - invalid input returns an empty history. `EditSnapshot` moves here from the hook.

File to modify: `src/utils/song/editHistory.ts`.

```typescript
export const serializeEditHistory = <T>(
  history: EditHistory<T>,
  limit: number = EDIT_HISTORY_PERSIST_LIMIT,
): SerializedEditHistory<T> => ({
  undo: history.undo.slice(-limit),
  redo: history.redo.slice(-limit),
});
```

**Load the persisted history**

New storage utility reads `StorageKeys.EDIT_HISTORY`, parses it, and returns the deserialized history - absent or corrupt payloads produce an empty history. No mirror and no fallback: losing persisted history only loses undo depth.

File to create: `src/utils/storage/editHistoryStorage.ts`.

```typescript
export const loadPersistedEditHistory = (): EditHistory<EditSnapshot> => {
  try {
    const raw = localStorage.getItem(StorageKeys.EDIT_HISTORY);
    return raw === null ? createEditHistory() : deserializeEditHistory(JSON.parse(raw));
  } catch {
    return createEditHistory();
  }
};
```

**Commit and clear inside the data hook**

`useDataManagement` gets a `commitHistory` helper that refreshes `historySize` and schedules the serialized stacks through `scheduleJsonSave`, plus a `clearHistory` that clears the stacks and commits. `recordHistory`, `undo`, and `redo` route through `commitHistory` instead of touching `historySize` directly. `createNewSong` and `applyParsedSong` replace `recordHistory()` with `clearHistory()`, which covers NEW SONG, LOAD SONG, the pending-import confirmation, and DEMO SONG. The unmount cleanup also clears the history save handle. RESET needs no code - `clearApplicationStorage` removes the new key because it is not in `PRESERVED_KEYS`.

File to modify: `src/hooks/song/useDataManagement.ts`.

```typescript
const [initialEditHistory] = useState(loadPersistedEditHistory);
const historyRef = useRef<EditHistory<EditSnapshot>>(initialEditHistory);
const [historySize, setHistorySize] = useState({
  undo: initialEditHistory.undo.length,
  redo: initialEditHistory.redo.length,
});
```

**Command buttons**

`CommandPanel` gains `onUndo`, `onRedo`, `canUndo`, and `canRedo` props and renders UNDO and REDO before ADD INST in the third command row. `App` passes the values `useDataManagement` already returns. The mobile-collapsed row is unchanged.

Files to modify: `src/components/CommandPanel.tsx`, `src/App.tsx`.

```tsx
<button onClick={onUndo} disabled={!canUndo} className="command-button undo-button">
  UNDO
</button>
<button onClick={onRedo} disabled={!canRedo} className="command-button redo-button">
  REDO
</button>
```

**Disabled button styling**

Add a disabled state for command buttons consistent with the theme - muted text and border, no hover shine.

File to modify: `src/App.css`.

```css
.command-button:disabled {
  opacity: 0.45;
  cursor: default;
}
```

**Shortcut conformance**

No binding changes: `CTRL+Z` undoes, `CTRL+Y` and `CTRL+SHIFT+Z` redo, and the `metaKey` fold in `useKeyboardNavigation` makes CMD+Z undo and CMD+SHIFT+Z redo on macOS. A test asserts the fold so the macOS contract is pinned.

File to modify: `test/hooks/keyboard/useKeyboardNavigation.test.tsx`.

## Implementation Order

1. Update documentation (`PROJECT.md`, `SPECIFICATION.md`, `ARCHITECTURE.md`, `public/MANUAL.md`).
2. Add `StorageKeys.EDIT_HISTORY` and move `EditSnapshot` into `editHistory.ts`.
3. Implement `clearEditHistory`, `serializeEditHistory`, and `deserializeEditHistory`.
4. Create `src/utils/storage/editHistoryStorage.ts` and widen the `scheduleJsonSave` union.
5. Wire restore, `commitHistory`, and `clearHistory` in `useDataManagement`.
6. Add the CommandPanel buttons, the App props, and the disabled styling.
7. Add or update tests.
8. Run the verification loop.

## Testing Strategy

**Unit tests**

Extend the existing history suite and add a storage suite.

Test file to update: `test/utils/song/editHistory.test.ts`.

```typescript
// clearEditHistory empties both stacks and resets the cursor
// serializeEditHistory caps each stack to the newest N entries
// deserializeEditHistory round-trips a serialized history
// deserializeEditHistory returns empty history on corrupt input
```

Test file to create: `test/utils/storage/editHistoryStorage.test.ts`.

```typescript
// loadPersistedEditHistory returns empty history when the key is absent
// loadPersistedEditHistory restores stored stacks
// loadPersistedEditHistory returns empty history on invalid JSON
```

**Hook tests**

Extend the existing data-management history suite: a restored storage payload hydrates `canUndo`/`canRedo` on mount, `createNewSong` and `applyParsedSong` empty both stacks instead of recording, and a scheduled save writes the serialized stacks.

Test file to update: `test/hooks/song/useDataManagement.history.test.tsx`.

**Component tests**

New `CommandPanel` test renders the panel with stubbed props and asserts UNDO and REDO sit before ADD INST, `disabled` follows `canUndo`/`canRedo`, and clicks fire the callbacks.

Test file to create: `test/components/CommandPanel.test.tsx`.

**Keyboard tests**

Assert `metaKey + shiftKey + Z` reaches the redo action through the modifier fold in `useKeyboardNavigation`.

Test file to update: `test/hooks/keyboard/useKeyboardNavigation.test.tsx`.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run format`.
- Run `npm run build`.
- Run `npm test`.
- Manually verify: edit notes, UNDO restores and REDO re-applies; reload the page and undo still reverts; NEW SONG, LOAD SONG, DEMO SONG, and RESET leave both buttons disabled; a title typed character by character undoes in one step.
- Audio check: undo during playback re-syncs the sequencer with no glitch.

## Refinements

Decisions and adjustments recorded while implementing.

- **`EditSnapshot` is imported, not re-exported.** The plan had `useDataManagement` re-export the moved type so existing imports keep working - no consumers existed beyond the local definition, so the hook imports it from `editHistory.ts` like every other consumer.
- **The storage union widened in place.** `scheduleJsonSave` gained the `EDIT_HISTORY` key directly rather than a parallel helper, with `MIRROR_KEYS` made partial and the mirror call guarded - the fragment implied this but named no mechanics.
- **The data hook keeps a `commitHistory` funnel.** `recordHistory`, `undo`, and `redo` route through it so stack mutations always pair the size flags with the scheduled save - the plan described the helper, and the implementation folded every direct `setHistorySize` call into it.
