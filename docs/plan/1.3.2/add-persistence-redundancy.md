# Add a Redundant Persistence Path Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.2/add-persistence-redundancy.md` (AUDIT-1.2 REC-020 / FND-CQY-008).

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- TypeScript strict mode, no `any` types.
- No abbreviations in identifiers.
- Single-responsibility modules: the IndexedDB wrapper owns browser storage, the hook owns recovery orchestration.
- Never swallow errors silently: mirror failures are logged and never propagated into the autosave path.
- Chosen option from the change record: IndexedDB mirroring with restore. It covers every target browser, needs no permission prompt, and cannot interrupt composition flow. Periodic file-save reminders are layered on top through the existing message rotation to satisfy the "surface the risk unobtrusively" use case.

## Audio-Critical Requirements

- **Audio impact assessment**: the mirror write rides the existing idle-scheduled `scheduleJsonSave` path and commits asynchronously, so no render or audio-path timing changes. No `useCallback`/`useMemo` dependency arrays on audio paths are modified; the restore effect runs once on mount.
- **Timing stability verification**: playback simulation is unaffected because the sequencer, SoundDriver, and worker are untouched. No manual playback testing is required.
- **Linting exception documentation**: no new linting exceptions are introduced or preserved.
- **Playback simulation**: not applicable.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `PROJECT.md` — new functional requirement F-16 covering the redundant mirror, restore-on-eviction, and the periodic save reminder.
- `SPECIFICATION.md` — extend the Session Persistence section with the mirror database, the restore flow, the persistence request, and the reset interplay.
- `public/MESSAGES.md` — one new rotation entry reminding composers to keep file copies.

No changes to `ARCHITECTURE.md` or `FORMAT.md` are required; the module stays inside the existing hooks/utils boundaries and no file format changes.

## Type and State Updates

**Type definitions**

The mirror keys are a closed union so only the two persisted roots can be mirrored.

File to create: `src/utils/persistenceMirror.ts`.

```typescript
export type MirrorKey = 'song' | 'instrument';
```

`loadInitialSong`'s normalization pipeline is extracted into an exported helper so the restore path reuses the same schema migration and speed clamping.

File to modify: `src/hooks/useSongManagement.ts`.

```typescript
export function normalizeRestoredSong(rawSong: unknown): Song;
```

**State store modifications**

No store changes. `useDataManagement` gains two pieces of hook-local state: the restore notice string and the once-only mount effect that performs recovery.

## Step by Step Implementation

**Create the IndexedDB mirror module**

A minimal promise wrapper around IndexedDB stores each persisted root under a fixed key in the `snapshots` store of the `dosound-tracker-backup` database. Every function is fire-and-forget safe: missing `indexedDB`, quota failures, and transaction errors degrade to a logged warning and never throw into the app.

File to create: `src/utils/persistenceMirror.ts`.

```typescript
const DATABASE_NAME = 'dosound-tracker-backup';
const STORE_NAME = 'snapshots';

export const mirrorSnapshot = (key: MirrorKey, value: unknown): void => {
  /* async put, errors logged */
};
export const readMirroredSnapshot = async <T>(key: MirrorKey): Promise<T | null> => {
  /* async get */
};
export const removeMirroredSnapshot = (key: MirrorKey): void => {
  /* async delete */
};
export const clearMirroredSnapshots = (): void => {
  /* async store clear */
};
export const requestPersistentStorage = (): void => {
  /* navigator.storage.persist() best-effort */
};
```

**Mirror every scheduled save**

`scheduleJsonSave` in `src/hooks/useStorage.ts` is the single choke point through which the song and the instrument reach localStorage. After a successful `localStorage.setItem`, the same value is mirrored under its mapped key, inside the same idle slot. The JSON value stored is identical to the localStorage payload, so a mirror write failure can never diverge silently: the localStorage write stays authoritative for the current session.

File to modify: `src/hooks/useStorage.ts`.

```typescript
const MIRROR_KEYS: Record<JsonStorageKey, MirrorKey> = {
  [StorageKeys.SONG]: 'song',
  [StorageKeys.INSTRUMENT]: 'instrument',
};

// inside performSave, after setItem succeeds:
mirrorSnapshot(MIRROR_KEYS[key], value);
```

**Keep destructive clears consistent**

Two existing paths empty localStorage outside the save channel: the legacy-schema removal inside `loadInitialSong` and the RESET action in `App.tsx`. Both must drop the mirror as well, or a restored snapshot would resurrect intentionally deleted data.

Files to modify: `src/hooks/useSongManagement.ts`, `src/App.tsx`.

```typescript
// loadInitialSong legacy branch:
localStorage.removeItem(SONG_STORAGE_KEY);
removeMirroredSnapshot('song');

// handleConfirmReset, beside localStorage.clear():
clearMirroredSnapshots();
```

**Restore on startup when localStorage is empty**

`useDataManagement` gains a mount effect: request persistent storage, then when `StorageKeys.SONG` is absent from localStorage, read the `song` mirror. A present snapshot is normalized through the same schema migration `loadInitialSong` uses and becomes `currentSong`; the song is marked dirty so the user knows the restored state differs from the last file save. A notice string is exposed for the message rotation.

File to modify: `src/hooks/useDataManagement.ts`.

```typescript
const [mirrorRestoreNotice, setMirrorRestoreNotice] = useState<string | null>(null);

useEffect(() => {
  requestPersistentStorage();
  if (localStorage.getItem(SONG_STORAGE_KEY)) {
    return;
  }
  let cancelled = false;
  void readMirroredSnapshot<StoredSongForMigration>('song')
    .then((snapshot) => {
      if (cancelled || !snapshot) {
        return;
      }
      setCurrentSong(normalizeRestoredSong(snapshot));
      setIsSongDirty(true);
      setMirrorRestoreNotice(
        'Previous session restored from a local snapshot. Save the song to a file to keep it safe.',
      );
    })
    .catch((error) => logger.warn('Failed to read mirrored snapshot', error));
  return () => {
    cancelled = true;
  };
}, []);
```

**Surface the restore notice and the periodic reminder**

`App.tsx` prepends the restore notice to the rotating messages shown in the notes panel, so the recovery is visible without stealing focus. A new entry in `public/MESSAGES.md` periodically reminds composers that browser storage can be cleared and a file copy is the durable record.

File to modify: `src/App.tsx`.

```typescript
const envelopeMessages = useMemo(
  () => (mirrorRestoreNotice ? [mirrorRestoreNotice, ...messages] : messages),
  [mirrorRestoreNotice, messages],
);
// ... <EnvelopeSection messages={envelopeMessages} ... />
```

File to modify: `public/MESSAGES.md`.

```text
Browser storage can be cleared.
Press CTRL+S to keep a file copy of your song.
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation (`PROJECT.md`, `SPECIFICATION.md`, `public/MESSAGES.md`)
2. Create `src/utils/persistenceMirror.ts`
3. Mirror saves in `src/hooks/useStorage.ts`
4. Keep clears consistent (`useSongManagement.ts`, `App.tsx` reset)
5. Extract `normalizeRestoredSong` and add the restore effect in `useDataManagement.ts`
6. Surface the notice in `App.tsx`
7. Add or update tests
8. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/utils/persistenceMirror.test.ts`.

```typescript
// jsdom exposes no indexedDB: every exported function must degrade
// gracefully - mirrorSnapshot/removeMirroredSnapshot/clearMirroredSnapshots
// never throw, readMirroredSnapshot resolves null, and
// requestPersistentStorage returns without error.
// A minimal in-memory fake of the IDBFactory surface is injected to verify
// write-then-read round-trips and clear semantics.
```

**Integration tests**

Test file to create or update: `test/hooks/useStorage.test.ts` or the existing scheduleJsonSave coverage.

```typescript
// After a scheduled save lands in localStorage, the persistenceMirror
// module (vi.mock'ed) receives mirrorSnapshot with the same key mapping
// and value.
```

Test file to update: `test/hooks/useDataManagement.test.tsx` family.

```typescript
// With localStorage empty and readMirroredSnapshot mocked to return a
// stored song, the hook restores it into currentSong, sets isSongDirty,
// and exposes the restore notice. With localStorage populated, the mirror
// is never read. RESET coverage asserts clearMirroredSnapshots is called.
```

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Manually verify in a browser: compose, reload (restores), clear localStorage only, reload (restores from mirror), RESET (clears both)
