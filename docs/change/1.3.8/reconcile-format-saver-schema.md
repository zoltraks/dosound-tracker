# Reconcile FORMAT.md with the emitted saver schema

**Type:** Chore

**Source:** AUDIT-1.4 REC-003 (FND-ARC-002)

## Summary

| Field         | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Intent        | Align the format specification and architecture document with emitted behavior |
| Key decisions | documentation is corrected to match the shipped saver, not the reverse         |
| Open risks    | the audit leaves open whether to update the schema text or version the format  |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`FORMAT.md` documents saver keys `playlist`/`steps`/`space`/`arpeggio` and a clipboard root `steps`, while the shipped writer in `src/utils/song/songIO.ts` emits `line`/`step`/`wait`/`shift` and `src/utils/track/trackClipboard.ts` writes clipboard root `step`. An external importer following the specification produces a dialect the saver never emits, even though the parser accepts the wider documented set inbound.

The same audit found three stale claims in `ARCHITECTURE.md`: that components own no business logic, that the store persists channel mutes, and that song data lives in `App.tsx` useState. Each claim is verified against the current implementation and corrected.

The change updates `FORMAT.md` so every saver key matches emitted output - or the document carries a format version marker - and corrects the `ARCHITECTURE.md` claims. This is a documentation-only change; `MAX.md` is externally managed and must not be edited.

## Hints

- Land this record after `persist-pattern-name` so the documented pattern schema already includes the emitted `name` key.
- Verification is a doc-to-emitter diff: every key the saver writes appears in the documented schema.

## Out of Scope

- Code changes to the saver, parser, or clipboard paths.
- Loader-side documentation of keys the parser accepts but the saver never emits, beyond noting the asymmetry.
- `MAX.md`.
