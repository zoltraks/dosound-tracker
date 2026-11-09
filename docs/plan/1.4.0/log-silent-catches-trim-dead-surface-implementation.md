# Log Silent Catches and Trim Dead Surface Implementation Plan

## Summary

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Intent        | Make MIDI and sequencer failures diagnosable and remove verified dead surface            |
| Key decisions | every silent catch logs through `logger.warn`; eight dead `useSequencer` members removed |
| Open risks    | `none`                                                                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/log-silent-catches-trim-dead-surface.md`.

## Analysis

Verified against the tree on 2026-11-09.

- Nineteen silent `catch` blocks in `src/hooks/midi/useMidiMessageProcessing.ts`:
  three `output.send` sites, `input.open`/`output.open` promise catches,
  listener attach/detach sites, device `close()` calls, `inputs.get`/
  `outputs.get` lookups, and the `localStorage` debug-flag read. `logger` is
  already imported in the file.
- `useSequencer` returns nineteen members; eight have zero consumers outside
  the hook: `start`, `setBPM`, `setTicksPerRow`, `setTickCallback`,
  `getCurrentTime`, `jumpToLine`, `nextLine`, `previousLine`. The record's
  "seven" aged by one - `start` joined the dead set.
- `debugTimestamp` is declared on `SequencerWorkerTickData` but the worker
  never emits it.
- `bpm` and `ticksPerRow` in `SequencerState` are read only by the dead
  `getCurrentTime` member; after its removal both are write-only fields and
  join the trim.
- `__dosoundTrackerIsResetting` has no occurrence in `src/`, `test/`, or
  `electron/` - already absent, nothing to trim.
- The empty `if (!pattern) {}` block does not exist in `src/` - already
  absent, nothing to trim.

## Best Practices

- Match the existing `logger.warn('Failed to ...', error)` convention used in
  `persistenceMirror.ts`.
- MIDI hot-path rule honoured: the catches sit in send/open/close/listener
  paths, not in the per-message handler; `logger.warn` passes the error
  object with no per-event allocation.
- Persistence-mirror degradation logging stays untouched per the record.

## Audio-Critical Requirements

- No render timing, dependency array, or state-management change.
- The trim removes uncalled code only; the worker message shape keeps every
  emitted field.

## Documentation Updates

- `ARCHITECTURE.md` - none required; the hook's return surface is not
  itemized there.
- `SPECIFICATION.md` - none required; removed members were not documented.

Both files are verified to carry no reference to the removed members.

## Type and State Updates

`SequencerState` loses `bpm` and `ticksPerRow`;
`SequencerWorkerTickData` loses `debugTimestamp`. `useSequencer`'s return
object drops the eight dead members and `tickCallbackRef` is removed with
`setTickCallback`.

## Step by Step Implementation

**Convert silent catches to logger.warn**

Each `catch { /* ignore */ }` and empty `result.catch(() => {})` becomes a
`catch (error)` logging `logger.warn('<operation> failed', error)` with a
context string naming the MIDI operation (send, input open, output open,
listener attach, listener detach, input close, output close, device lookup,
debug-flag read).

File to modify: `src/hooks/midi/useMidiMessageProcessing.ts`.

**Remove dead useSequencer members**

Delete `start`, `setBPM`, `setTicksPerRow`, `setTickCallback`,
`getCurrentTime`, `jumpToLine`, `nextLine`, `previousLine` from the return
object and their definitions. Remove `tickCallbackRef` and its invocation in
the message handler. Remove `bpm` and `ticksPerRow` from `SequencerState`
and both initial state objects; `updateSpeed` keeps its worker post but
drops the state write. Remove `debugTimestamp` from
`SequencerWorkerTickData`.

File to modify: `src/hooks/sequencer/useSequencer.ts`.

## Implementation Order

1. Convert the silent catches.
2. Trim the dead surface.
3. Run verification loop.

## Testing Strategy

**Unit tests**

Existing suites cover the hook surfaces that remain; no new tests - this is
removal and logging only.

**Integration tests**

Typecheck proves no consumer referenced the removed members; the full suite
confirms no behaviour change.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Confirm zero remaining silent `catch {}` blocks in the MIDI file
