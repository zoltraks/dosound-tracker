# Make RESET durably delete mirrored data

**Type:** Fix

**Source:** AUDIT-1.4 REC-015 (FND-CQY-005)

## Summary

| Field         | Value                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Intent        | Ensure a song the user explicitly resets cannot resurrect from the mirror                               |
| Key decisions | the mirror clear commits before reload, and the localStorage wipe is scoped to `dosound-tracker-*` keys |
| Open risks    | `none`                                                                                                  |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`useSongLifecycleDialogs.ts` calls `localStorage.clear()` and fire-and-forget `clearMirroredSnapshots()` followed by a synchronous `location.reload()`. The IndexedDB clear may not commit before teardown, so a deleted song can reappear via mirror restore on next load. The `__dosoundTrackerIsResetting` flag set during reset is never consumed by the restore path, and the unscoped `localStorage.clear()` wipes unrelated same-origin keys.

The change awaits the mirror clear - or gates mirror restore on the reset flag - before reload, and replaces the blanket `localStorage.clear()` with removal of the `dosound-tracker-*` prefixed keys.

## Use Cases

- When a user resets the application and the page reloads twice, the deleted song does not reappear through mirror restore.
- When other same-origin keys exist outside the `dosound-tracker-` prefix, they survive a reset.

## Hints

- This record lands before `log-silent-catches-trim-dead-surface` - whether the reset flag gains a consumer or is removed is decided here, and the later record trims only what remains dead.
- Verification is a reset then double-reload with no resurrection.

## Out of Scope

- Restore-path behavior for snapshots that legitimately outlive local storage.
- Persistence-mirror architecture changes.
