# Consolidate the DATA-Format Export Strategies Implementation Plan

**Change Request Reference:** `docs/change/1.5.9/consolidate-asm-export-strategies.md`

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | One frame walk drives `simple`, `complex`, and `tight` via      |
|               | per-strategy write policies                                     |
| Key decisions | Policy record replaces the `tight` flag and the `simple` else   |
|               | branch; emitted bytes stay identical per strategy               |
| Open risks    | Byte-identical verification must cover every strategy, not just |
|               | tight and complex                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: pure functions,
explicit policy types, no new exports beyond what the walk needs.

## Documentation Updates

- `SPECIFICATION.md` - the assembly export description states the single
  policy-driven frame walk once it exists.

## Type and State Updates

**Type definitions**

- `AsmWritePolicy` in `src/exports/asm.ts` - per-strategy emission rules:
  marker tone rewrite, mixer gating mode, tone write form, silent-channel
  tone skip, change-only volume/noise, end-silence selectivity, delay
  merging.

**State store modifications**

- None.

## Step by Step Implementation

**Capture baseline exports**

Before touching the walk, a work-directory script exports every fixture
and representative song shape under all three strategies into `work/` so
post-refactor output diffs byte for byte against a real baseline.

**Define the policy table**

One `AsmWritePolicy` record per strategy: `simple` = always-emit
everything, unconditional end silence, no merge; `complex` = marker tone
rewrite, mixer on change, pair tone writes, unconditional silence;
`tight` = marker comment only, audible-gated mixer, split tone writes,
selective silence, delay merge capped at 256 frames.

File to modify: `src/exports/asm.ts`.

**Collapse to one frame walk**

A single iteration applies the policy: marker comment always emitted,
tone-cache clearing only under the marker-rewrite policy; mixer by
gating mode; tone writes by form (always, pair, split); volume and noise
by change-only flag; end silence by selectivity; final `combineDelayLines`
only under the merge policy. `formatAsmLine`, `buildToneComment`, and
`getRegisterComment` stay untouched.

**Diff against the baseline**

Re-run the export script and compare streams - identical output under
each strategy is the acceptance check, per the record's harness hint.

## Implementation Order

1. Update documentation.
2. Baseline capture into `work/`.
3. Policy table plus unified walk.
4. Baseline diff plus unit tests.
5. Verification loop.

## Testing Strategy

**Unit tests**

Existing `test/exports/` strategy tests must pass unchanged - they are
the semantic contract. The baseline diff script is the byte-level net.

**Integration tests**

The golden YAML export fixtures (`exportAssemblyTight.test.ts` and the
strategy suites) exercise the emitted streams end to end.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- Baseline diff: byte-identical assembly per strategy across the fixture
  set.
