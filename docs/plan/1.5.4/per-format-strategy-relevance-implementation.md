# Per-Format Strategy Relevance Implementation Plan

## Summary

| Field         | Value                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| Intent        | Mark the export formats that honor the strategy selector in the export modal  |
| Key decisions | `aria-hidden` markers keep accessible button names; caption names the nuances |
| Open risks    | `none`                                                                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.4/per-format-strategy-relevance.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `SPECIFICATION.md` - the Export Formats section records the strategy
  relevance per format and the modal annotation convention.
- `public/MANUAL.md` - the export dialog description records the marker
  and caption so the bundled manual matches the rendered modal.

`PROJECT.md` and `ARCHITECTURE.md` require no changes - a display-level
annotation introduces no requirement or structure change. `FORMAT.md` is
untouched - no file format changes.

## Type and State Updates

**Type definitions**

Add an `ExportFormat` union type naming the eight format buttons.

File to modify: `src/constants/export.ts`.

```typescript
export type ExportFormat = 'data' | 'dump' | 'bin' | 'vgm' | 'max' | 'wav' | 'mod' | 'midi';
```

**State store modifications**

None - no store or persisted state changes. The annotation is derived
from the existing `exportType` prop and a constant map.

## Step by Step Implementation

**Strategy relevance helper**

Encode which formats consume the strategy per export scope. Under the
instrument scope only MAX takes a strategy parameter (verified in
`src/hooks/file/useFileOperations.ts` - `exportInstrumentToAssembly`,
`exportInstrumentToVgm`, `exportInstrumentToWav`, `exportInstrumentToMod`,
and `exportInstrumentToMidi` take none). Under the song and pattern
scopes DATA, BIN, VGM, and MAX consume it.

File to create: `src/utils/export/exportStrategy.ts`.

```typescript
const SCOPE_STRATEGY_FORMATS: Record<ExportType, ReadonlySet<ExportFormat>> = {
  song: new Set(['data', 'bin', 'vgm', 'max']),
  pattern: new Set(['data', 'bin', 'vgm', 'max']),
  instrument: new Set(['max']),
};

export function exportStrategyApplies(format: ExportFormat, scope: ExportType): boolean;
export function buildExportStrategyNote(scope: ExportType): string;
```

`buildExportStrategyNote` returns the caption text - the song and
pattern scopes get `* uses the strategy - MAX selects a stream format;
for VGM only TIGHT differs`, the instrument scope gets `* uses the
strategy - MAX selects a stream format`.

**Format button markers and caption**

Render an `aria-hidden` `*` marker inside each format button whose
format consumes the strategy under the current `exportType`, and a
caption line under the format grid. The marker hides from the
accessibility tree, so the accessible button names (`DATA`, `VGM`,
`MAX`, ...) and the e2e selectors matching them stay unchanged.

File to modify: `src/modals/ExportModal.tsx`.

```tsx
<button type="button" className="command-button" style={{ width: '100%' }} onClick={handleDataClick}>
  DATA
  {exportStrategyApplies('data', exportType) && <span aria-hidden="true">*</span>}
</button>
...
<div className="export-strategy-note">{buildExportStrategyNote(exportType)}</div>
```

**Caption styling**

Add a muted caption style matching the modal's 10px body scale.

File to modify: `src/App.css`.

```css
.export-strategy-note {
  color: var(--text-dim);
  font-size: 9px;
  margin-top: 4px;
}
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md` and `public/MANUAL.md`
2. Add `ExportFormat` to `src/constants/export.ts`
3. Create `src/utils/export/exportStrategy.ts`
4. Update `src/modals/ExportModal.tsx` and `src/App.css`
5. Add or update tests
6. Run verification loop

## Testing Strategy

**Unit tests**

Cover the relevance map and the caption text per scope.

Test file to create: `test/utils/export/exportStrategy.test.ts`.

```typescript
// exportStrategyApplies: data/bin/vgm/max true under 'song' and
// 'pattern'; only 'max' true under 'instrument'; dump/wav/mod/midi
// false under every scope.
// buildExportStrategyNote: returns the scope-specific caption.
```

**Integration tests**

Extend the existing modal suite with the annotation states per format
under both scopes and the marker's hidden accessibility.

Test file to update: `test/modals/ExportModal.test.tsx`.

```typescript
// song scope: DATA, BIN, VGM, MAX buttons render the marker span;
// DUMP, WAV, MOD, MIDI render none.
// instrument scope: only MAX renders the marker.
// The marker span carries aria-hidden="true".
// The caption shows the scope-specific note text.
// Accessible button names stay unchanged (getByRole name lookups).
```

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test test/modals/ExportModal.test.tsx test/utils/export/exportStrategy.test.ts`
- Run the full `npm test` suite at completion
- Manually verify the export modal shows markers and caption per scope
