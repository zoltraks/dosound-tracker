# Trim Documented Dead Exports Implementation Plan

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Remove dead exports whose removal is a spec-level decision                             |
| Key decisions | `ExportFormat` and `asTrackId` removed; `LogEntry` kept as the documented log contract |
| Open risks    | `none`                                                                                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/trim-documented-dead-exports.md`.

## Analysis

Verified on 2026-11-09. `ExportFormat` (`src/constants/export.ts`),
`asTrackId` (`src/types/branded.ts`), and `LogEntry`
(`src/utils/log/logger.ts`) each have zero references outside their
declarations across `src/`, `test/`, `e2e/`, `electron/`, and `scripts/`.

Per-item decision. `SPECIFICATION.md` describes the `export.ts` union types
and the four branded constructors as current state, so removing
`ExportFormat` and `asTrackId` and syncing those descriptions is honest.
`docs/feature/LOGGER.md` records `LogEntry` as the intended log-entry
contract - a design document, not a state description - so `LogEntry` stays
as documented API surface.

## Documentation Updates

- `SPECIFICATION.md` — the `export.ts` line drops `ExportFormat` - the branded
  types paragraph names three constructors.

## Step by Step Implementation

**Update SPECIFICATION.md**

Sync the two descriptions before the code change.

File to modify: `docs/SPECIFICATION.md`.

**Remove ExportFormat**

Delete the union type from `src/constants/export.ts`.

**Remove asTrackId**

Delete the constructor from `src/types/branded.ts` - `TrackId` itself stays -
it is used across the tree.

## Testing Strategy

Typecheck is the removal proof: zero references means a clean `tsc -b`.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
