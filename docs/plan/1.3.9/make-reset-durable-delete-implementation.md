# Make RESET Durably Delete Mirrored Data Implementation Plan

## Summary

| Field         | Value                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Ensure a song the user explicitly resets cannot resurrect from the mirror                                                          |
| Key decisions | the mirror clear is awaited before reload; the local storage wipe is scoped to `dosound-tracker-*` keys; the reset flag is removed |
| Open risks    | `none`                                                                                                                             |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.9/make-reset-durable-delete.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- No floating promises - the async tail of the reset handler is explicitly `void`ed.
- Pure logic lives in `src/utils/` and is independently testable.
- The `localStorage` enumeration uses the `length`/`key(index)` API surface - the installed test mock is a plain object whose own enumerable keys are method names, not data keys.

## Documentation Updates

Per project guidelines, the project specification update is the first implementation step. Update only the files affected by this change.

- `SPECIFICATION.md` - update the "Mirror invalidation" paragraph: the RESET action removes every `dosound-tracker-*` key except the preserved theme and debug settings, awaits the mirror clear, and reloads only after the clear commits.

`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` require no changes - requirement F-16 already demands mirror clearing on full reset, and no file format changes.

## Type and State Updates

**Type definitions**

`clearMirroredSnapshots` changes signature from `(): void` to `(): Promise<void>` so the reset path can await the clear. It still never rejects - every failure resolves to `undefined` after a logged warning.

`__dosoundTrackerIsResetting` is removed from `ExtendedWindow` in `src/types/electronApi.ts`. The flag has no consumer, and a window-global flag cannot survive `location.reload()`, so it could never gate the restore path. Removal is the recorded decision - the awaited clear is the durable mechanism.

File to modify: `src/types/electronApi.ts`.

**State store modifications**

No store changes.

## Step by Step Implementation

**Make `clearMirroredSnapshots` awaitable**

Return the `withStore` promise so callers can wait for the `clear()` request to commit. Failures keep their current behavior: a logged warning and a resolved promise.

File to modify: `src/utils/storage/persistenceMirror.ts`.

```typescript
export const clearMirroredSnapshots = (): Promise<void> =>
  withStore('readwrite', (store) => store.clear())
    .then(() => undefined)
    .catch((error) => logger.warn('Failed to clear mirrored snapshots', error));
```

**Add the scoped application-storage clear**

A new utility enumerates keys through `localStorage.length` and `localStorage.key(index)` - the Storage API the mock honors - collects `dosound-tracker-*` keys, and removes all of them except the preserved theme and debug-mode keys. Collecting before removing avoids index shift during enumeration. The prefix is exported from `storageKeys.ts` so the key vocabulary stays centralized.

File to create: `src/utils/storage/applicationStorage.ts`.
File to modify: `src/utils/storage/storageKeys.ts` (add `APPLICATION_STORAGE_PREFIX`).

```typescript
export const clearApplicationStorage = (): void => {
  const preserved = new Set<string>([StorageKeys.THEME, StorageKeys.DEBUG_MODE]);
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key !== null && key.startsWith(APPLICATION_STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => {
    if (!preserved.has(key)) {
      localStorage.removeItem(key);
    }
  });
};
```

**Rewire `handleConfirmReset` to the durable delete**

Replace the preserve-then-blanket-clear with `clearApplicationStorage()`, drop the dead `__dosoundTrackerIsResetting` flag, and reload only after the mirror clear resolves. The UI resets keep their current order and run before the awaited tail.

File to modify: `src/hooks/song/useSongLifecycleDialogs.ts`.

```typescript
const handleConfirmReset = useCallback(() => {
  try {
    clearApplicationStorage();
  } catch {
    // ignore
  }
  setChannelMutes([false, false, false]);
  setCurrentOctave(3);
  void clearMirroredSnapshots().finally(() => {
    window.location.reload();
  });
}, [setChannelMutes, setCurrentOctave]);
```

**Add scoped-clear tests**

`clearApplicationStorage` gets a dedicated unit test: prefixed keys are removed, `THEME` and `DEBUG_MODE` survive, and foreign same-origin keys survive.

Test file to create: `test/utils/storage/applicationStorage.test.ts`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md` (first implementation step).
2. Make `clearMirroredSnapshots` awaitable.
3. Add `APPLICATION_STORAGE_PREFIX` and `clearApplicationStorage`.
4. Rewire `handleConfirmReset` and remove the reset flag.
5. Add the unit tests.
6. Run the verification loop.

## Testing Strategy

**Unit tests**

Test file to create: `test/utils/storage/applicationStorage.test.ts`.

```typescript
it('removes every prefixed key except theme and debug', () => {
  localStorage.setItem('dosound-tracker-song', '{}');
  localStorage.setItem('dosound-tracker-theme', 'light');
  localStorage.setItem('dosound-tracker-debug-mode', '1');
  localStorage.setItem('other-app-key', 'x');
  clearApplicationStorage();
  expect(localStorage.getItem('dosound-tracker-song')).toBeNull();
  expect(localStorage.getItem('dosound-tracker-theme')).toBe('light');
  expect(localStorage.getItem('dosound-tracker-debug-mode')).toBe('1');
  expect(localStorage.getItem('other-app-key')).toBe('x');
});
```

The existing `persistenceMirror.test.ts` keeps passing - it flushes microtasks rather than awaiting, and the new return value is ignored there.

**Integration tests**

No new integration test - the reset path is exercised manually per the record's verification hint (reset, then double-reload, no resurrection).

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Manually verify reset then double-reload shows no song resurrection and foreign same-origin keys survive
