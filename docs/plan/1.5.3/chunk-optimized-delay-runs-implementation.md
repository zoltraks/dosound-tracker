# Chunk Merged Delays in the Optimized Assembly Strategy Implementation Plan

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Bound `optimized` merged delay commands to the 256-frame single-byte  |
|               | maximum by passing `256` to `combineDelayLines` for every strategy    |
|               | that merges                                                           |
| Key decisions | Byte identity for `optimized` is intentionally broken only for inputs |
|               | that previously emitted an out-of-range delay count                   |
| Open risks    | none                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.3/chunk-optimized-delay-runs.md`.

## Problem

`combineDelayLines` in `src/exports/asm.ts` merges consecutive `DL` lines
and is called with `maxFramesPerCommand: strategy === 'compact' ? 256 : Infinity`.
A merged run longer than 256 frames under `optimized` therefore emits
`dc.b $FF,$<count>` with a count above `$FF` - an out-of-range byte the
assembler truncates or rejects, corrupting the delay on hardware replay.

The `compact` strategy already proves the fix shape: the same call site
splits runs at 256 frames, and `test/exports/exportAssemblyCompact.test.ts`
holds a fixture whose ~318-frame static run produces a `>256` optimized
count today.

## Best Practices

Follow TypeScript engineering standards from `docs/standard/typescript-react-development.md`:

- Keep pure functions pure - the change is a call-site constant, not new logic
- Preserve existing style and conventions
- No abbreviations in identifiers

## Audio-Critical Requirements

- The change is confined to the export pipeline. No React render timing,
  hook dependencies, or audio-path state patterns are touched.
- `simulateSong` output is consumed read-only; the emitted command stream
  must stay replay-equivalent - chunked delays decode to the same frames.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `FORMAT.md` - the **optimized dump** bullet gains the 256-frame split
  contract (the merged delay never exceeds one byte).
- `SPECIFICATION.md` - if it describes optimized merge bounds, align the
  sentence (verify during implementation).

## Step by Step Implementation

**Bound the optimized merge**

File to modify: `src/exports/asm.ts`.

```typescript
asm = combineDelayLines(asm, { maxFramesPerCommand: 256 });
```

The ternary collapses - both merging strategies share the bound. Update
the adjacent comment to describe the bound as applying to every merging
strategy.

**Update the strategy test**

File to modify: `test/exports/exportAssemblyCompact.test.ts`.

The `splits merged delays at the 256-frame command maximum` case asserted
the old unbounded `optimized` behaviour. It now asserts `optimized` splits
like `compact` does: every delay count `<= 256`, chunked counts summing to
the `complex` run total, and replay-equivalence already proven by
`decodeFrames` reuse.

## Testing Approach

- Existing fixtures in `test/exports/` pin `optimized` bytes on songs
  with no run beyond 256 frames - they must stay green untouched, proving
  byte identity holds where the old output was legal.
- The long-run fixture proves the split lands and stays in range.

## Verification

Run the standard verification loop from `TESTING.md`:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format`
4. `npm run build`
5. `npm test`

All steps must pass with zero errors and zero warnings.
