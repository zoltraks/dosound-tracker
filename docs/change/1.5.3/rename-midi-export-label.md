# Rename MIDI export label

## Summary

- **Status**: shipped
- **Type**: Fix
- **Owner**: user
- **Scope**: `src/modals/ExportModal.tsx`, `test/modals/ExportModal.test.tsx`, `e2e/smoke.spec.ts`

## Request

The export format button read `MID`; the user asked for `MIDI`, while the
`.mid` file extension stays as is.

## Implementation

- Button label and the matching test/e2e expectations updated; filenames
  and the exporter are unchanged.

## Verification

- Modal tests and the e2e export flow pass.
