# Refactoring Proposal - 1.4.0

## Problem

Two leftovers surfaced while the window's own records landed.

- `useSequencer` still accepts a `songSpeed` parameter that no longer feeds
  anything: the only consumer was the removed `ticksPerRow` state field.
  The hook carries a dead positional argument and `usePlaybackControls`
  passes `currentSong.speed` into it.
- `useMidiMessageProcessing.ts` repeats the same `try { output.send(buffer) }
catch (error) { logger.warn('Failed to send MIDI output', error) }` block
  at three send sites, triplicating error handling across note-on,
  note-off, and system paths.

## Goal

A smaller, honest surface: `useSequencer(songLength, frameRate)` with the
speed handled by the existing `updateSpeed` effect, and one shared
`sendBuffer` helper for MIDI output writes.

## Plan

**Remove the dead songSpeed parameter**

Drop the first parameter from `useSequencer` and update the single call
site in `usePlaybackControls`. `updateSpeed(currentSong.speed)` already
runs on mount through an effect, so worker timing is unchanged.

File to modify: `src/hooks/sequencer/useSequencer.ts`,
`src/hooks/playback/usePlaybackControls.ts`.

**Extract the shared send helper**

Introduce `sendBuffer(output, bytes)` beside the send sites performing the
`Uint8Array` allocation, `output.send`, and the warn-on-failure logging.
Replace the three identical blocks with calls to it.

File to modify: `src/hooks/midi/useMidiMessageProcessing.ts`.

## Risk

Low. Both items are mechanical: the parameter has no remaining consumer and
the helper is a verbatim extraction. The full suite (604 tests) plus
typecheck is the regression gate. Audio paths are untouched - `updateSpeed`
already owns live worker speed updates.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` all pass
  with zero errors and zero warnings.
- Export output unchanged (no `src/exports/` edits).
- MIDI send behaviour identical: same buffer bytes, same warn on failure.
