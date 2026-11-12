# Fix Sequencer Parameters Dropped Before the Audio Context Lands

**Type:** Fix

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Stop dropping sequencer `setParams` messages posted while the audio   |
|               | context is still null - after a reload the worklet kept its default   |
|               | `ticksPerRow` of 3 and played twice as fast for speed-6 songs         |
| Key decisions | `postRef` is assigned eagerly with a hook-level pending queue, so the |
|               | queue exists from the first render regardless of context timing       |
| Open risks    | none                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The AudioWorklet sequencer migration gave `useSequencer` an
`audioContext` dependency: the worklet effect returns early while the
context is null, and `postRef.current` was assigned inside that effect.
Every mount-time param post issued by `usePlaybackControls` -
`updateSpeed`, `updatePatternLength`, `updateFrameRate`, `updateSongLoop`

- ran before the context landed and fell through the optional-chained
  `postRef.current?.()` with nothing behind it.

`speed` is the audible victim: the worklet's default `ticksPerRow` is 3,
a speed-6 song plays its rows at half length until the next `speed`
change re-posts the param - exactly the reported twice-as-fast
behaviour after a reload. The queued path only covered messages posted
between `postRef` assignment and node land, never the pre-context window.

The fix moves the queue to hook level: `postRef` holds a stable post
function from the first render that pushes to `pendingMessagesRef`
whenever no node exists, and the worklet effect flushes that shared
queue when the node lands. Arrival ordering is preserved.

## Use Cases

- When the page reloads with a speed-6 song, the first play runs at six
  frames per row without needing a speed re-entry.
- When the audio context never lands, queued messages simply stay
  queued - no work, no errors.

## Hints

- `test/hooks/sequencer/useSequencer.test.tsx` proves delivery of params
  posted while the context is null, and direct posting once the node has
  landed.

## Out of Scope

- The worklet's tick generation, reschedule parity, and message
  protocol - only the posting path changed.
