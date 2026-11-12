# Consolidate the DATA-format export strategies

**Type:** Refactoring

**Status:** Abandoned

**Abandonment reason:** The project owner discarded the record at the
plan gate during the 1.5.9 window run. The strategy branches in
`src/exports/asm.ts` stay as separate emission paths - consolidation
is not wanted work in this window.

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Deduplicate the `tight` and `complex` branches of the assembly export |
| Key decisions | One frame walk parameterized by per-strategy write policies           |
| Open risks    | Export byte streams must stay identical - verification is             |
|               | stream-level, not just unit-level                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`formatFramesToAssembly` in `src/exports/asm.ts` carries two near-parallel
branches: `complex` emits every register diff, full four-byte tone pairs,
separate `DL 2` delays, and unconditional end silence; `tight` reuses the same
frame walk with split tone writes, inaudible-mixer gating, merged delays, and
selective end silence. The branches grew apart inside one function and now
drift independently - a serializer fix must be mirrored by hand.

The 1.5.7 refactoring assessment identified the duplication and deferred it:
consolidating the serializer is too behaviour-critical for a window-close
tidy and deserves its own record with dedicated verification.

## Use Cases

- When the record is implemented, one frame iteration drives both strategies
  and the emitted bytes for existing exports stay identical to the
  pre-refactor streams.

## Hints

- The stream comparison written for the Overload export analysis expands a
  `.s` export into per-frame register states and compares the audible
  projection - reuse it (or an equivalent harness) as the acceptance check:
  every fixture song exported before and after the change must expand to the
  same frame sequence under each strategy.
- The `tight`-only behaviours - split tone writes, mixer gating by audible
  volume, delay merging, boundary cache retention, selective end silence -
  read naturally as strategy policies over a shared diff walk.
- `ExportModal` strategy selection and the summary output are unaffected -
  the change is internal to `asm.ts`.

## Out of Scope

- Changing the emitted bytes of either strategy.
- New export formats or strategies.
- Touching the player-side DATA decoding.
