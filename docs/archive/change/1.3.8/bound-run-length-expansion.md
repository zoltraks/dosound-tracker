# Bound run-length expansion and cap import size

**Type:** Fix

**Source:** AUDIT-1.4 REC-001 (FND-SEC-001)

## Summary

| Field         | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Intent        | Close the unbounded expansion path that lets a crafted or pasted file freeze or OOM the renderer |
| Key decisions | expansion bounded to remaining pattern length; imported content carries a byte cap               |
| Open risks    | `none`                                                                                           |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

The `space`, `wait`, and `off:N` run-length fields expand through loops bounded only by `count > 0` in `src/utils/song/songParser.ts` and `src/utils/track/trackClipboard.ts`. Post-parse clamping bounds the resulting pattern length, but the allocation precedes the clamp, so a crafted value such as `space: 100000000` allocates on the order of 10^8 step objects before any limit applies.

The change bounds every expansion loop to the remaining pattern length and adds a byte cap on the file and clipboard import paths. Oversized or malicious input is rejected through the existing error-modal path rather than hanging the tab or the packaged application.

**Edge cases**

- Run counts that are zero, negative, non-numeric, or larger than the remaining pattern length.
- A file just over the byte cap and a clipboard paste over the byte cap.
- Songs whose legitimate run-length data sits at exactly the remaining-length boundary.

## Use Cases

- When a user opens a `.yaml` containing `space: 1e8`, expansion stops at the remaining pattern length and the song loads or rejects cleanly.
- When a user pastes track data larger than the byte cap, the paste is rejected with an error message instead of freezing the renderer.

## Hints

- The same bound applies at both expansion sites - they should share one limit constant rather than duplicating a magic number.
- The byte cap covers `FileReader.readAsText`, fetch-based song loads, and the clipboard import path.

## Out of Scope

- Schema or key-name changes to the file format.
- Changes to `MAX.md` or export formats.
