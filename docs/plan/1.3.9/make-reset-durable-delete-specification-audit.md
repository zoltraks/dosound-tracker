# Specification Audit - Make RESET Durably Delete Mirrored Data

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                               |
| ---------- | ------------------------------------------------------------- |
| Change     | `docs/change/1.3.9/make-reset-durable-delete.md`              |
| Plan       | `docs/plan/1.3.9/make-reset-durable-delete-implementation.md` |
| Audit Date | 2026-11-09                                                    |

## Verdict

The plan is ready for implementation. Every claim in the record was verified against the tree: `clearMirroredSnapshots` returns `void` and wraps `withStore` in `void` (`src/utils/storage/persistenceMirror.ts` lines 111-115), `handleConfirmReset` calls `localStorage.clear()` and then `location.reload()` synchronously (`src/hooks/song/useSongLifecycleDialogs.ts` lines 91-118), and `__dosoundTrackerIsResetting` is written once and read nowhere.

## Completeness

| Requirement                                                   | Plan step                                           |
| ------------------------------------------------------------- | --------------------------------------------------- |
| Mirror clear commits (or restore is gated) before reload      | Awaitable `clearMirroredSnapshots` + handler rewire |
| Local storage wipe scoped to `dosound-tracker-*` keys         | `clearApplicationStorage` utility                   |
| Reset flag gains a consumer or is removed - decision recorded | Flag removal, decision recorded in the plan         |

No requirement lacks a covering step.

## Ambiguity

The record offers "awaits the mirror clear - or gates mirror restore on the reset flag". Awaiting is selected because the flag cannot gate anything: `window.location.reload()` creates a fresh window context, so a value set on the old `window` never reaches the restore path in `useDataManagement.ts` (lines 165-186). The flag is removed rather than given a dead consumer.

## Implementability

- `withStore` already resolves on `request.onsuccess` for request-returning actions, so awaiting `clear()` waits for the commit - no new machinery needed.
- `clearMirroredSnapshots` has exactly one caller (`useSongLifecycleDialogs.ts` line 98) - the signature change has no hidden callers.
- The localStorage enumeration must use `length`/`key(index)`: the test mock in `test/setup-localstorage.ts` is a plain object with a closed-over store, so `Object.keys(localStorage)` yields method names. Verified.
- `StorageKeys` constants all carry the `dosound-tracker-` prefix, including `ENVELOPE_CURSOR_PREFIX`-derived keys - prefix removal covers them.
- `__dosoundTrackerIsResetting` appears only in `src/types/electronApi.ts` (declaration) and the reset handler (assignment) - safe to remove.

## Fidelity

- Preservation parity: today THEME and DEBUG_MODE are read before `clear()` and re-set after; the plan preserves them by exclusion - same observable outcome.
- Ordering fidelity: `setChannelMutes` runs after the wipe today and re-writes the UI-state key; the plan keeps that order.
- Boundary decision: reload moves inside `.finally()` on the clear promise, which always resolves - reload is guaranteed even when IndexedDB is absent or the clear fails.
- Constants completeness: the `dosound-tracker-` prefix becomes a single exported constant rather than a string literal.

## Findings Returned to Planning

`none`
