# Specification Audit - Undo and Redo Commands with Persistent Edit History

## Document Information

|            |                                               |
| ---------- | --------------------------------------------- |
| Change     | `docs/change/1.5.6/undo-redo.md`              |
| Plan       | `docs/plan/1.5.6/undo-redo-implementation.md` |
| Audit Date | 2026-11-11                                    |

## Completeness

| Requirement                                             | Covering plan step                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| UNDO and REDO buttons before ADD INST                   | Command buttons                                                                                |
| UNDO enabled on undoable state, REDO on redo branch     | Command buttons (`canUndo`/`canRedo` props)                                                    |
| Note, title (coalesced), envelope, base-octave subjects | Existing recording boundary - verified, doc updates only                                       |
| Selection range and header octave excluded              | Existing boundary - verified, doc updates only                                                 |
| History persists across reload                          | Serialize and clear history, Load the persisted history, Commit and clear inside the data hook |
| NEW SONG, LOAD SONG, DEMO SONG, RESET destroy history   | Commit and clear inside the data hook (`clearHistory`), RESET via `clearApplicationStorage`    |
| Shortcut set (CTRL+Z, CTRL+Y, CMD+SHIFT+Z on macOS)     | Shortcut conformance                                                                           |

Requirements with no covering step: none.

Steps with no stated requirement: none - disabled styling serves the enabled/disabled requirement, and the storage-key step serves persistence.

## Ambiguity

- "Persists across reload" admitted any depth - resolved to the newest 20 entries per stack through `EDIT_HISTORY_PERSIST_LIMIT`; larger depths are silently truncated on save, never on read.
- "Both stacks restore" admitted keeping the coalescing cursor across reload - resolved against it: `deserializeEditHistory` resets `lastKey`/`lastTime`, so coalescing never spans a reload.
- "Enabled" admitted either hiding or disabling the buttons - resolved to disabled buttons, matching the command-panel convention of stable controls.

## Implementability

- `src/utils/song/editHistory.ts` exists and is generic over `T` - the new helpers fit its contract.
- `src/utils/storage/storageKeys.ts` carries the `dosound-tracker-` prefix convention; `PRESERVED_KEYS` in `applicationStorage.ts` holds only THEME, TEXT_SCALE, and DEBUG_MODE, so RESET clears the new key with no code.
- `src/hooks/storage/useStorage.ts` types `MIRROR_KEYS` as `Record<JsonStorageKey, MirrorKey>` - widening the union requires the `Partial<Record<...>>` and guarded mirror call the plan names; both compile against the current file.
- `useDataManagement.ts` verified: `recordHistory()` sites in `createNewSong` and `applyParsedSong`, direct `setHistorySize` writes in `recordHistory`, `undo`, and `redo` - all reachable by `commitHistory`.
- `applyParsedSong` is the single funnel for LOAD SONG, the pending-import confirmation, and `handlePickDemoSong` - clearing there covers every listed lifecycle operation.
- `CommandPanel` props list and the `App.tsx` render site verified; the roving-focus handler queries `.command-button`, so the new buttons join focus navigation unmodified.
- `useKeyboardNavigation.ts` folds `metaKey` into `ctrl`, so the CMD+SHIFT+Z requirement needs a test, not code.

## Fidelity

- Constants enumerated: `EDIT_HISTORY_LIMIT` (100, existing), `EDIT_HISTORY_PERSIST_LIMIT` (20, new), `StorageKeys.EDIT_HISTORY` value, scheduled-save delay default (300 ms, existing).
- Serialized vocabulary fixed once: `SerializedEditHistory<T>` = `{ undo: T[]; redo: T[] }` - writer and reader share the type.
- Boundary decision recorded: persisted history is not mirrored (undo depth is not song data), and a pending scheduled save rewriting after RESET's storage clear is the same window the song save already exposes - accepted, not new.
- Post-restore snapshots are plain JSON objects identical in shape to the live `Song`/`Instrument` types, since the song itself round-trips through JSON storage.

## Findings Returned to Planning

none
