# Export Summary Line Height - Implementation Plan

**Change Request Reference:** `docs/change/1.5.7/export-summary-line-height.md`

## Steps

1. **Extend `src/modals/InformationModal.tsx`** - add an optional `className` prop forwarded to `DialogFrame`.
2. **Extend `src/utils/panel/modalRendering.ts`** - `InfoModalDescriptor` gains `className?`; the `soundExportSummary` and `dumpExportSummary` descriptors carry `'export-summary-modal'`.
3. **Update `src/components/ModalContainer.tsx`** - pass `className={modal.className}` to `InformationModal`.
4. **Update `src/App.css`** - add `.modal-dialog.export-summary-modal .modal-body { line-height: 1.2rem; }` beside the export-modal rule.
5. **Update `test/modals/InformationModal.test.tsx`** - cover the `className` forwarding onto `.modal-dialog`.
6. **Run the verification loop** - typecheck, lint, format, build, test.

## Affected Files

| File                                    | Change                                     |
| --------------------------------------- | ------------------------------------------ |
| `src/modals/InformationModal.tsx`       | Optional `className` prop                  |
| `src/utils/panel/modalRendering.ts`     | Descriptor field plus two tagged summaries |
| `src/components/ModalContainer.tsx`     | Prop forwarding                            |
| `src/App.css`                           | Scoped line-height rule                    |
| `test/modals/InformationModal.test.tsx` | Class-forwarding coverage                  |

## Risks and Mitigations

| Risk                                               | Mitigation                                                 |
| -------------------------------------------------- | ---------------------------------------------------------- |
| Other information modals pick up the taller height | The class is set only on the two export summaries          |
| The `export-modal` class leaks its width rule      | A dedicated class carries only the line-height declaration |

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm test`
