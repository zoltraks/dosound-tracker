# Evaluate Store Splitting

**Type:** Refactor

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Evaluate splitting the single Zustand store into domain stores and land |
|               | the split where it tightens responsibilities                            |
| Key decisions | Evaluation precedes migration - `ARCHITECTURE.md` records the single    |
|               | store as a deliberate trade-off, so the record revises it only on       |
|               | evidence                                                                |
| Open risks    | A poorly bounded split adds synchronization overhead without reducing   |
|               | re-render scope                                                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

All store-held application state lives in one Zustand store,
`useUiStore` in `src/hooks/ui/`. It currently carries a small surface -
cross-component UI state such as the current octave, the shared current
line, and channel mutes - while song, instrument, and pattern data stay
in hook-owned state wired from `App.tsx`.

`ARCHITECTURE.md` documents the single store as a deliberate choice:
domain data stays close to the orchestrator and avoids multi-store
synchronization. This record asks for an evaluation of whether that
boundary still holds, and for a split into domain stores (for example
song, instrument, playback, UI) only where the evaluation shows real
benefit - tighter responsibilities and reduced re-render scope, not
uniformity for its own sake.

The outcome may be a confirmed single store with the decision re-recorded,
or a migration plan executed in the window. Either way the decision log
in `ARCHITECTURE.md` is updated to match.

## Use Cases

- When a component subscribes to store state after the change, it
  re-renders only for the domain it reads.
- When the evaluation concludes the single store is still right, the
  architectural decision records why, and no code moves.

## Hints

- Measure before migrating: the store's current surface is small, so the
  split's value must come from the state that would move into it, not
  from the store itself.
- Persisted members (`currentOctave` and restored values) keep their
  storage behaviour under any split.
- Audio-path state must stay in refs, not migrate into a store that
  re-renders at frame rate.

## Out of Scope

- Moving hook-owned song or instrument state into stores as a blanket
  migration - only what the evaluation justifies.
- Undo/redo history state - handled under its own record.
