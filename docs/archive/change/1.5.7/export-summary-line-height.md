# Match the Export Summary Line Height to the Export Dialog

**Type:** Fix

## Summary

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Intent        | The export summary modals render their text at the export dialog's line height           |
| Key decisions | A scoped `export-summary-modal` class carries the height - other info modals keep theirs |
| Open risks    | none                                                                                     |

## Description

The export dialog renders its body text at `line-height: 1.2rem` through `.modal-dialog.export-modal .modal-body`. The export summary modals are shared `InformationModal` instances, whose `.modal-body` inherits the default `line-height: 0.8rem` - the same message density looks cramped next to the dialog that produced it.

The two export summaries - `soundExportSummary` and `dumpExportSummary` - should read at the export dialog's `1.2rem` height. Other information modals keep the default height.

## Use Cases

- The user exports a sound or dump file and reads the summary - the text sits at the same line height as the export dialog.
- The user opens any other information modal - the line height stays `0.8rem` as before.

## Hints

- `DialogFrame` already accepts a `className` that lands on `.modal-dialog` - the same hook `ExportModal` uses for its height rule.
- `InformationModal` does not forward a class today - an optional prop plus a `className` field on `InfoModalDescriptor` threads the marker from `buildInfoModals` through `ModalContainer`.
- Reusing the `export-modal` class would also pull its 396px width - a dedicated class carries only the line-height rule.
