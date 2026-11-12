# Instrument Empty-Slot Navigation

**Type:** Bug fix

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | Make every stored instrument slot render and stay navigable so     |
|               | trailing empty entries can be reached, selected, and edited        |
| Key decisions | `computeVisibleSlotCount` counts through `instruments.length`; the |
|               | now-dead `isInstrumentEmpty` predicate parameter is removed        |
| Open risks    | A cleared last instrument stays visible as an empty row instead of |
|               | vanishing from the list                                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`computeVisibleSlotCount` counted rendered rows only through the last
_non-empty_ instrument entry. Trailing empty entries inside
`song.instrument` - produced by DELETE INST clears, sparse-song padding
beyond the last defined number, or any flow that stores empty slots at the
tail - were never rendered.

The effect: ArrowDown was clamped by `getMovedInstrumentIndex` at
`visibleSlotCount - 1`, so the cursor stopped on the last non-empty row and
the empty slots could not be reached by keyboard, mouse, or the name editor.
Users reported the position snapping back to the row before when trying to
move onto an empty instrument.

The fix counts through `instruments.length` so every stored slot renders as
a row. Emptiness no longer participates in visibility, so the
`isInstrumentEmpty` predicate parameter becomes dead and is removed from
the function signature and its call site.

A second defect surfaced once the rows rendered: clicking an empty row
selected a _different_ instrument. Both position resyncs - the panel's
`findIndex(inst.id === currentInstrument.id)` effect and the
`currentSong.instrument` sync in `useDataManagement` - resolved the
selected instrument by id and returned the first match. Any duplicate id in
the array (producible by loaded data or older write paths) sent the
selection to the earlier entry instead of the clicked row. Both lookups now
prefer object-reference identity - the clicked object is the array's own
entry - and fall back to id matching only when reference lookup fails.

## Use Cases

- When a song contains trailing empty instrument entries, the user can
  arrow down onto them, select them, and rename them in place.
- When the last instrument is cleared by DELETE INST, its row remains
  visible as an empty slot rather than silently disappearing.

## Hints

- `computeVisibleSlotCount` already extends the window through
  `currentIndex`; extending it through `instruments.length` is the same
  mechanism.
- Interior empty slots (sparse padding inside the array) already rendered
  and navigated correctly - only the tail was clipped.

## Out of Scope

- Other id-keyed operations (`handleDeleteInstrument`,
  `cloneInstrumentToNextFreeSlot`, `countInstrumentUsage`) still resolve by
  normalized id; with duplicate ids they act on the first match rather than
  the selected row - deferred.
- Changing which rows count as "empty" in other operations
  (`isInstrumentEmpty` still gates ADD INST slot reuse and clone targets).

## Acceptance Criteria

- [x] Trailing empty entries render as rows in the Instrument panel
- [x] ArrowDown/ArrowUp traverse empty slots; clicks select them
- [x] Empty rows can be renamed/edited once selected
- [x] `computeVisibleSlotCount` no longer takes the emptiness predicate;
      signature and call site updated
- [x] Selection resyncs prefer object reference over id matching, so
      duplicate ids cannot redirect a click to a different row
- [x] New tests assert trailing empties count toward the visible window
      and that clicking a duplicate-id row selects that row
- [x] Full verification loop green (typecheck, lint, format, test, build)
