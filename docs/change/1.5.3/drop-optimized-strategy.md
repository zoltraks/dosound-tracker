# Drop optimized strategy

## Summary

- **Status**: shipped
- **Type**: Feature removal
- **Owner**: user
- **Scope**: `src/constants/export.ts`, `src/exports/asm.ts`, `src/exports/vgm.ts`, `src/exports/max.ts`, `src/hooks/app/useAppState.ts`, `src/modals/ExportModal.tsx`, export tests, export documentation

## Request

The user reviewed the export strategy ladder and asked to drop `OPTIMIZED`,
keeping `SIMPLE` / `COMPLEX` / `TIGHT` only. `TIGHT` strictly supersedes
`OPTIMIZED` on the DOSOUND assembly family (equal or smaller output on every
input while staying replay-equivalent), and on VGM and MAX the two strategies
already produced byte-identical streams, so the removed level offered nothing
the retained levels do not.

## Implementation

- `ExportStrategy` narrows to `'simple' | 'complex' | 'tight'`.
- `exportToAssembly` drops the `optimized` branches; `tight` keeps the merged
  delay behaviour including the 256-frame per-command bound. `complex` keeps
  the full rewrite behaviour (forced tone rewrites, unconditional END silence).
- VGM and MAX map `tight` to the delay-optimized streams previously shared
  with `optimized` - the emitted bytes are unchanged.
- Persisted settings that stored `optimized` or `compact` resolve to `tight` on load so
  existing users keep the strongest reduction level; other unknown values
  still fall back to `complex`.
- The export modal loses the `OPTIMIZED DUMP` radio. The format button grid
  stays at `repeat(4, minmax(0, 1fr))` columns, and the modal body recovers
  the `1.2rem` line height the pre-1.3 series used, restoring the vertical
  spacing between the radio rows.
- Tests that exercised `optimized` move to `tight` where the emitted bytes
  are identical (VGM, MAX) or are rewritten to assert tight's dominance over
  `complex` (assembly); `exportAssemblyOptimized.test.ts` is removed.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build` clean.
- `npm test` passes with the strategy ladder narrowed to three levels.
- `npm run test:e2e` passes on Chromium and WebKit.
