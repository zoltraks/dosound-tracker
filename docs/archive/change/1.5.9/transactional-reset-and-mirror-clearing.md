# Make reset and mirror clearing transactional

**Type:** Fix

**Source:** Audit 2026-11-12 REC-01 (FND-01)

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | Close the reset race so cleared data cannot resurrect after reload |
| Key decisions | none                                                               |
| Open risks    | Blocking reset on a failed clear adds a failure surface the        |
|               | dialog does not have today                                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`clearMirroredSnapshots` resolves on the `IDBRequest.onsuccess` of
`store.clear()`, not on the transaction's `oncomplete`, and transaction
errors only log through `withStore`. RESET reloads in `.finally()`, so a
failed or incomplete clear still reloads. Song, instrument, and history
saves scheduled on idle or timeout handles are cancelled only on unmount,
so a pending save can rewrite `localStorage` after RESET cleared it.

The declared guarantee is that a full reset leaves no resurrectable state.
This change makes the clear path transactional end to end: the mirror
clear resolves on transaction completion and distinguishes failure, RESET
blocks or visibly fails when the clear is unsuccessful, and pending saves
are cancelled or invalidated before `localStorage` is cleared. A
monotonically increasing reset generation keeps already queued mirror
writes from reviving a pre-reset generation.

## Use Cases

- When the IndexedDB clear fails or aborts, RESET reports the failure and
  does not reload into a half-cleared state.
- When a song, instrument, or history save is pending at RESET time, no
  stale snapshot reappears after the reload.
- When RESET succeeds, a reload starts from empty mirrored state.

## Hints

- Verify with deterministic delayed-transaction and idle-callback tests
  rather than timing luck, then reset and reload in both browser engines
  with a populated snapshot.
- Saves are deferred to idle slots on purpose - the scheduling protects
  real-time audio callbacks and stays; only the reset-time invalidation
  is new.
- Sites: `src/utils/storage/persistenceMirror.ts`,
  `src/hooks/song/useSongLifecycleDialogs.ts`,
  `src/hooks/storage/useStorage.ts`,
  `src/hooks/song/useDataManagement.ts`.

## Out of Scope

- Changing the mirror schema, autosave cadence, or storage keys.
- Replacing IndexedDB persistence with another backend.
