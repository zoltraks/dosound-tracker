# Trim documented dead exports

**Type:** Refactor

**Source:** 1.3.9 refactoring window

## Summary

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Intent        | Remove dead exports that are documented surface before deleting them                        |
| Key decisions | `ExportFormat`, `asTrackId`, and `LogEntry` are unreferenced but named in shipped documents |
| Open risks    | `none`                                                                                      |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

The 1.3.9 refactoring window's dead-export census found six exports with zero references across `src/`, `test/`, `e2e/`, `electron/`, `scripts/`, and `docs/`. Three were undocumented and removed in the window (`ARPEGGIO_MIN`, `ARPEGGIO_MAX`, `TrackKey`). Three more are named in shipped documents, so their removal is a spec-level decision rather than a silent tidy:

- `ExportFormat` (`src/constants/export.ts`) - documented in `SPECIFICATION.md` as part of the export.ts union-type surface.
- `asTrackId` (`src/types/branded.ts`) - documented in `SPECIFICATION.md` as one of the four branded-type constructor functions.
- `LogEntry` (`src/utils/log/logger.ts`) - documented in `LOGGER.md` as the log-entry contract.

The change removes each export and updates the naming document in the same change set, or decides per item that the documented surface is intentional and keeps it.

## Hints

- Deleting `asTrackId` breaks the four-helper symmetry the spec describes - decide whether the spec documents intended API or current state before removing.
- `LogEntry` is referenced by `LOGGER.md` design fragments; sync that document if the interface is removed.
- Complements `log-silent-catches-trim-dead-surface`, which enumerates different dead items on the MIDI and sequencer paths.

## Out of Scope

- Behaviour changes to logging, export formats, or branded-type usage.
- The dead items already enumerated by `log-silent-catches-trim-dead-surface`.
