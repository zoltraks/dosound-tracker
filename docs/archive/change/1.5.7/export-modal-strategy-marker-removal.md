# Remove the Strategy Marker and Note from the Export Modal

**Type:** Fix

## Summary

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Intent        | The export modal shows plain format buttons and no strategy caption          |
| Key decisions | The `exportStrategy.ts` relevance map is presentational only - it is deleted |
| Open risks    | none                                                                         |

## Description

The export modal marks each strategy-honoring format button with a `*` suffix and captions the marker with a `* uses the strategy...` note under the format grid. Both the marker and the caption should go - the format buttons read plain DATA, DUMP, BIN, VGM, MAX, WAV, MOD, and MIDI.

The `exportStrategyApplies` and `buildExportStrategyNote` helpers exist only to feed the marker and the caption. With both removed, `src/utils/export/exportStrategy.ts` has no callers and is deleted together with its test file. The `.export-strategy-note` style rule loses its consumer and is removed as well.

## Use Cases

- The user opens the export modal - every format button carries only its label, no `*` suffix.
- The user reads the format grid - no strategy caption sits below it.
- The strategy radios and the strategy semantics stay untouched - the chosen strategy still reaches the formats that consume it.

## Hints

- `ExportModal.tsx` line 133 renders the `*` span and line 137 renders the note div - both are removed along with the helper import.
- `SCOPE_STRATEGY_FORMATS` in `exportStrategy.ts` only drives the marker - the actual export paths take the strategy without consulting it.
- The scope-specific strategy semantics remain documented in `SPECIFICATION.md` and `MANUAL.md` - only the `*` marking phrasing leaves.
