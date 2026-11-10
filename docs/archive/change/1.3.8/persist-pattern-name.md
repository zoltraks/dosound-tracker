# Persist Pattern.name on save

**Type:** Fix

**Source:** AUDIT-1.4 REC-004 (FND-CQY-001)

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | Stop the silent loss of custom pattern names on save              |
| Key decisions | `name` is written only when it differs from the generated default |
| Open risks    | `none`                                                            |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`buildSongYamlForExport` never writes `Pattern.name`, while the loader already parses a `name` key and falls back to `Pattern NN` when it is absent. A user who renames a pattern loses the custom name on every save/load round-trip.

The change writes `name` into the pattern node when the stored name differs from the generated default, so custom names survive the round-trip and default names keep the file clean.

## Use Cases

- When a user renames a pattern to `Verse`, saves the song, and reloads it, the pattern is still named `Verse`.
- When a pattern keeps its generated `Pattern 02` name, the saved file carries no redundant `name` key.

## Hints

- `FORMAT.md` already documents `name` as an optional pattern-node key - the saver rules section is updated to describe when it is emitted, per the documentation-first rule.
- Verification is a rename, save, load round-trip test.

## Out of Scope

- Loader behavior - it already handles `name` correctly.
- Pattern renaming UI changes.
