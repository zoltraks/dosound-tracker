# Make Reset and Mirror Clearing Transactional Implementation Plan

**Change Request Reference:** `docs/change/1.5.9/transactional-reset-and-mirror-clearing.md`

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Transaction-complete mirror clearing plus reset-time save       |
|               | invalidation                                                    |
| Key decisions | Failure surfaces as a boolean - the dialog decides blocking vs  |
|               | reporting                                                       |
| Open risks    | Faking IndexedDB transaction timing in tests needs a controlled |
|               | deferred-commit harness                                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`:

- No floating promises - new async paths are awaited or explicitly voided.
- Strict typing for the reset-generation and clear-result plumbing.
- Hooks stay focused; reset orchestration stays in the lifecycle dialog
  hook rather than spreading across components.

## Audio-Critical Requirements

`useStorage` defers saves to idle callbacks or timeouts precisely so saves
never block real-time audio callbacks. The change keeps that scheduling:

- Save cancellation must not reintroduce synchronous writes on the
  playback path - it invalidates pending work, it does not flush it.
- No `useCallback`/`useMemo` dependency changes in audio paths.
- Manual playback check after the change: start playback, trigger RESET,
  confirm audio keeps running until the reload.

## Documentation Updates

- `SPECIFICATION.md` - the reset-guarantee section describes the
  transactional ordering once it exists.
- `PROJECT.md` - `F-16` wording stays; no requirement change.

## Type and State Updates

**Type definitions**

- A clear result type distinguishing success from failure in
  `persistenceMirror.ts` (`Promise<boolean>` or a small result union).

**State store modifications**

- None - the reset generation lives in module scope, not the UI store.

## Step by Step Implementation

**Resolve clears on transaction completion**

Change `withStore` so the clear path resolves on
`IDBTransaction.oncomplete` and reports abort/error, so
`clearMirroredSnapshots` returns a real success signal instead of
resolving on the request alone.

File to modify: `src/utils/storage/persistenceMirror.ts`.

**Cancel or invalidate pending saves at reset**

Expose a cancellation/invalidation path for scheduled song, instrument,
and history saves and call it during RESET before `localStorage` is
cleared; stamp mirror writes with a monotonic reset generation so a
queued write from the old generation cannot land after clearing.

Files to modify: `src/hooks/storage/useStorage.ts`,
`src/hooks/song/useDataManagement.ts`,
`src/utils/storage/persistenceMirror.ts`.

**Fail reset visibly on unsuccessful clear**

Replace the unconditional `.finally()` reload: a failed clear surfaces
to the user and does not reload into a half-cleared state.

File to modify: `src/hooks/song/useSongLifecycleDialogs.ts`.

## Implementation Order

1. Update documentation.
2. Transaction-complete clear plus result type.
3. Save invalidation and reset generation.
4. Dialog failure path.
5. Tests.
6. Verification loop.

## Testing Strategy

**Unit tests**

Test file to update: `test/utils/storage/persistenceMirror.test.ts` -
deferred-commit transaction harness asserting the clear resolves only on
`oncomplete`, and abort/error produces a failure result.

**Integration tests**

Reset flow tests around `useSongLifecycleDialogs` and the scheduled-save
hooks: pending idle save plus reset plus reload leaves no resurrected
state; failed clear blocks the reload.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- Manual: populated snapshot, RESET, reload - no stale state; playback
  running during RESET stays stable until reload.

## Refinements

Recorded as the implementation landed.

- Mirror writes serialize through a shared `writeQueue` tail promise in
  `persistenceMirror.ts`, so a clear issued at RESET cannot be overtaken by a
  put queued earlier - the plan named a generation alone; ordering plus
  generation together is what closes the race.
- `withStore` now resolves every operation on `IDBTransaction.oncomplete`
  carrying the request result, and reports failure on `onerror`/`onabort`
  through a `{ ok, result }` shape - `clearMirroredSnapshots()` returns
  `Promise<boolean>` instead of `Promise<void>`.
- The generation lives in `persistenceMirror.ts` as `resetEpoch` plus a
  `resetPending` flag (`beginResetEpoch`, `getResetEpoch`,
  `isResetInProgress`): scheduled saves are refused during a pending reset
  and skipped when their captured epoch is stale, and mirror writes carry
  the same two checks so a post-reset put cannot resurrect cleared data.
- The reload became an injectable `reloadPage` param on
  `useSongLifecycleDialogs` because jsdom's `location.reload` is
  non-configurable - the default still calls `window.location.reload()`.
- The fake IndexedDB harness gained controllable transactions (held,
  abort, error modes) so the clear's commit ordering is asserted
  deterministically instead of by timing.
