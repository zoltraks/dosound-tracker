# Rename compact strategy to tight

## Summary

- **Status**: shipped
- **Type**: Refactor
- **Owner**: user
- **Scope**: `src/constants/export.ts`, `src/exports/asm.ts`, `src/exports/vgm.ts`, `src/exports/max.ts`, `src/hooks/app/useAppState.ts`, `src/modals/ExportModal.tsx`, export tests, export documentation

## Request

The user asked to rename the `COMPACT` dump strategy to `TIGHT`, including the
identifiers in the source code.

## Implementation

- `ExportStrategy` value `'compact'` becomes `'tight'`; every strategy-related
  identifier, local variable, comment, test name, and UI label follows
  (`TIGHT DUMP`, `exportAssemblyTight.test.ts`, `tightDelays`, and so on).
- Persisted settings that stored `compact` resolve to `tight` on load, joining
  the existing `optimized` to `tight` migration - saved user preferences keep
  their meaning.
- Unrelated `compact` usages are untouched: the piano keyboard's compact
  layout flag, the color-picker comment, generic prose ("for compactness"),
  and historical changelog entries.
- Documentation updated in `FORMAT.md`, `SPECIFICATION.md`, `PROJECT.md`,
  `MANUAL.md`, and this window's pending CHANGELOG entry.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build` clean.
- `npm test` and `npm run test:e2e` pass on Chromium and WebKit.
