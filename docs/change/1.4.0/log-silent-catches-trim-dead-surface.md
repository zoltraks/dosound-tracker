# Log silent catches and trim dead surface

**Type:** Refactor

**Source:** AUDIT-1.4 REC-014 (FND-CQY-004)

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | Make MIDI and sequencer failures diagnosable and remove dead surface                          |
| Key decisions | every previously silent catch logs through `logger.warn`; dead exports and fields are removed |
| Open risks    | `none`                                                                                        |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

Around 19 silent catch blocks in `useMidiMessageProcessing.ts` swallow send, open, close, and listener failures, hiding MIDI degradation. Dead surface includes seven unused `useSequencer` exports, the never-emitted `debugTimestamp` field, the set-but-unconsumed `__dosoundTrackerIsResetting` flag, and an empty `if (!pattern) {}` block.

The change converts each silent catch to a `logger.warn` with context and removes the dead exports, fields, and blocks. Persistence-mirror degradation is documented behavior and keeps its current logging contract.

## Hints

- The `__dosoundTrackerIsResetting` flag is trimmed only if `make-reset-durable-delete` did not land first and give it a real consumer.
- The MIDI path is a hot path; logging stays outside per-event allocation patterns per `SPECIFICATION.md`.

## Out of Scope

- New error-reporting UI.
- Behavior changes to MIDI send/open/close semantics.
