# Export Modal Strategy Marker Removal - Implementation Plan

**Change Request Reference:** `docs/change/1.5.7/export-modal-strategy-marker-removal.md`

## Steps

1. **Update `docs/SPECIFICATION.md`** - the export paragraph drops the marker sentence while keeping the per-scope strategy semantics.
2. **Update `public/MANUAL.md`** - the "formats marked `*`" phrasing becomes plain prose naming the consuming formats.
3. **Update `src/modals/ExportModal.tsx`** - remove the `*` span, the note div, and the `exportStrategy.ts` import.
4. **Delete `src/utils/export/exportStrategy.ts`** - no callers remain.
5. **Delete `test/utils/export/exportStrategy.test.ts`** - it tests the deleted helper.
6. **Update `test/modals/ExportModal.test.tsx`** - drop the marking and caption tests; keep the accessible-names guard.
7. **Update `src/App.css`** - remove the unused `.export-strategy-note` rule.
8. **Run the verification loop** - typecheck, lint, format, build, test.

## Affected Files

| File                                       | Change                                |
| ------------------------------------------ | ------------------------------------- |
| `docs/SPECIFICATION.md`                    | Marker sentence removed               |
| `public/MANUAL.md`                         | `*` phrasing removed                  |
| `src/modals/ExportModal.tsx`               | Marker span, note div, import removed |
| `src/utils/export/exportStrategy.ts`       | Deleted                               |
| `test/utils/export/exportStrategy.test.ts` | Deleted                               |
| `test/modals/ExportModal.test.tsx`         | Marker and caption tests removed      |
| `src/App.css`                              | `.export-strategy-note` rule removed  |

## Risks and Mitigations

| Risk                                                | Mitigation                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| The relevance map was load-bearing for export logic | Grep shows no export path reads it - strategy flows through modal handlers |
| Users lose which formats consume the strategy       | The semantics stay documented in SPECIFICATION and MANUAL prose            |

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm test`
