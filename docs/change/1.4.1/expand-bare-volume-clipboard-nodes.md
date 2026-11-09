# Expand bare volume nodes on clipboard import

**Type:** Fix

**Source:** 1.4.0 window coverage characterization

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Make clipboard YAML round-trip idempotent for volume-only lines                            |
| Key decisions | bare `{volume: N}` nodes expand to a wait row carrying the volume, matching `{wait:1,...}` |
| Open risks    | `none`                                                                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`generateClipboardData` emits a single volume-only row as a bare
`{volume: N}` node, but `parseClipboardData` does not expand that shape -
it passes through as `{volume: N}` rather than `{wait: true, volume: N}`.
`applyClipboardToLines` tolerates both shapes today, so behaviour is
equivalent, but the serialized YAML is not idempotent: a copy/paste round
trip changes the document form.

The change teaches the parser to treat a bare `volume`-only node like the
`{wait: 1, volume: N}` form, restoring round-trip idempotence.

## Hints

- Characterization tests in `test/utils/track/trackClipboard.test.ts`
  already document both shapes; extend them for the expansion.
- Verify against `src/utils/yaml/runLength.ts` semantics before editing.

## Out of Scope

- Changing which rows the generator emits.
- Behaviour changes inside `applyClipboardToLines` beyond accepting the
  already-tolerated shape.
