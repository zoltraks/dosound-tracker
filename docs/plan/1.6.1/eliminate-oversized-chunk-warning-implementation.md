# Eliminate the Oversized-Chunk Build Warning Implementation Plan

**Change Request Reference:** `docs/change/1.6.1/eliminate-oversized-chunk-warning.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Warning-free build via attributed bytes and a real split - not a |
|               | raised limit                                                     |
| Key decisions | Split only a proven cold-path boundary                           |
| Open risks    | The entry may have no clean cold-path seam - the fallback is a   |
|               | documented budget decision, never a silent raise                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md` build section:
deterministic chunk naming stays; `manualChunks` groups are explicit and
named for what they contain.

## Audio-Critical Requirements

A chunk split changes module load order at startup. The worklet
registration, engine selection, and first-render hooks stay on the entry
path unless a measured trace proves the split does not delay audio
startup - manual playback verification after the build confirms it.

## Documentation Updates

- `DEPLOYMENT.md` - the bundle-size budget and its enforcement
  mechanism.

## Type and State Updates

None.

## Step by Step Implementation

**Attribute the entry chunk**

Produce a module-level attribution of `dist/js/index.js` (bundle
visualizer or a `manualChunks` probe build) and list the largest
contributors.

**Split a proven cold-path boundary**

If the attribution shows a coherent cold-path family - modal surfaces or
an export family the startup path never touches - move it behind a named
`manualChunks` group and measure initial JS bytes plus cold-load time
before and after.

File to modify: `vite.config.ts`.

**Decide the residual budget**

If no clean seam exists, record the explicit size-budget decision with
the attribution as evidence; if a seam exists, the 600 kB limit stays
and the build passes under it.

## Implementation Order

1. Update documentation.
2. Chunk attribution.
3. Split or documented budget decision.
4. Verification loop.

## Testing Strategy

**Unit tests**

None - build configuration only.

**Integration tests**

`npm run build` with zero warnings; a representative load trace on a
target device confirms startup is not regressed; `npm test` stays green.

## Verification

- `npm run build` exits 0 with no chunk-size warning.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm test` -
  all clean.
- Manual playback startup check after the split.
