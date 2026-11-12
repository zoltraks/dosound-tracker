# Decide the persisted undo-history depth explicitly

**Type:** Chore

**Source:** Audit 2026-11-12 REC-11 (DEBT-02)

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | Pick a deliberate persisted history bound instead of an inherited |
|               | one                                                               |
| Key decisions | The chosen depth is the user's call after the measurement         |
| Open risks    | A larger bound grows every snapshot write; a smaller one drops    |
|               | more undo entries across reloads                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The in-memory edit-history limit is 100 entries per stack, but
serialization persists only the newest 20 - a reload silently restores a
shallower history. `SPECIFICATION.md` documents the bound honestly, so
this is not a defect; it is an unmeasured trade-off.

Measure the serialized storage size of realistic sessions at the current
persisted depth and at the full in-memory bound, then choose and
document an intentional limit. The verification exercises the chosen
bound end to end: newest and oldest surviving undo entries, redo-branch
clearing, and reload behavior across a 100-edit session.

## Use Cases

- When the measurement lands, the recorded bound cites real serialized
  sizes, not a guess.
- When a session larger than the bound reloads, the surviving entries
  are exactly the documented newest set.

## Hints

- Sites: `src/utils/song/editHistory.ts` (`EDIT_HISTORY_LIMIT`,
  `EDIT_HISTORY_PERSIST_LIMIT`), `docs/SPECIFICATION.md`.
- Keep the coalescing-does-not-span-reload property whatever the bound
  becomes.

## Out of Scope

- Unbounded persistence or a history schema redesign.
- Changing the in-memory limit as a side effect.
