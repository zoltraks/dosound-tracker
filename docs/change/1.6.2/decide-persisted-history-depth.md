# Decide the persisted undo-history depth explicitly

**Type:** Chore

**Source:** Audit 2026-11-12 REC-11 (DEBT-02)

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | Pick a deliberate persisted history bound instead of an inherited |
|               | one                                                               |
| Key decisions | Keep 20 - the 2026-11-13 measurement shows larger bounds breach   |
|               | the storage quota on large songs                                  |
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

## Measurement

Scripted 100-edit sessions on the bundled repository songs, serialized
through `serializeEditHistory` + `JSON.stringify` exactly as the storage
path does. Worst case fills the redo stack as well.

| Song     | Snapshot | undo@20    | undo@50    | undo@100   | 100+100    |
| -------- | -------- | ---------- | ---------- | ---------- | ---------- |
| Nice     | 10.1 KiB | 195.9 KiB  | 468.4 KiB  | 866.0 KiB  | 865.4 KiB  |
| Warmball | 16.5 KiB | 325.3 KiB  | 793.8 KiB  | 1532.4 KiB | 1531.3 KiB |
| Overload | 59.1 KiB | 1178.3 KiB | 2930.5 KiB | 5806.6 KiB | 5805.3 KiB |

## Decision

Keep `EDIT_HISTORY_PERSIST_LIMIT` at 20. At 100 the largest bundled
song's serialized undo stack alone (~5.8 MB) exceeds the ~5 MiB
localStorage quota, and every commit rewrites the payload synchronously.
At 50 the same session still nears 3 MB. The bound of 20 keeps the worst
measured session near 1.2 MB and is now a measured choice rather than an
inherited one. Decided under the window's autonomous gate mode.

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
