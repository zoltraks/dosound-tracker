# Validate persisted state restores against the import parsers

**Type:** Fix

**Source:** AUDIT-1.7 REC-004 — FND-SEC-002

## Summary

| Field         | Value                                                                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Storage restores bypass full validation: undo history loses its entry bound, song/settings snapshots spread raw objects, and the MIDI config version field is never validated |
| Key decisions | Restored history re-applies the in-memory and persisted bounds; snapshots validate shape before restore; the MIDI config version field is validated on parse                  |
| Open risks    | Stricter validation could reject previously tolerated snapshots - a drop-invalid vs reset decision is needed per path                                                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Three restore paths trust partial normalization instead of the full
validation the import parsers apply:

- Persisted undo history restores without the in-memory 100-entry bound
  or per-snapshot shape validation - `editHistory.ts` bounds memory at
  100 entries and persistence at 20, but restored entries are not
  re-bounded (`src/utils/storage/editHistoryStorage.ts`,
  `src/utils/song/editHistory.ts:123-139`).
- localStorage/IndexedDB song and settings restores normalize selected
  fields but spread raw objects rather than running the song parser's
  full validation (`src/hooks/song/useSongManagement.ts:271-300`).
- The MIDI configuration writes a `version` field that is never validated
  on parse (`src/utils/midi/midiConfiguration.ts`).

A corrupted or tampered snapshot could therefore restore malformed state
past the bounds the live paths enforce. Mitigating factors keep this at
medium: an array-shape guard exists, corrupt input already falls back to
an empty history, and the storage is local-only.

## Use Cases

- When a persisted snapshot fails parser-level validation, the restore
  falls back to the same empty/default state a corrupt import produces.
- When restored undo history exceeds the bounds, it is truncated to the
  same limits a live session enforces.
- When a MIDI config carries an unrecognized version field, parse
  rejects or migrates it explicitly instead of ignoring the field.

## Hints

- Reuse the song parser's validation rather than duplicating it - the
  import path already defines what a valid song is.
- The storage layer's reset-epoch machinery already handles versioned
  invalidation; the validation decision should fit that pattern.
- Decide per path whether invalid snapshots drop the bad entries or
  reset the whole store - record the choice in the implementation plan.

## Out of Scope

- Changing the storage backends (localStorage plus IndexedDB mirror) or
  the redundant-persistence design.
- The import-file validation paths themselves - they already validate.
