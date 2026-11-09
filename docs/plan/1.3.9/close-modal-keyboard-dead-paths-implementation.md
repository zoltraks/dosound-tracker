# Close Modal Keyboard Dead-Paths Implementation Plan

## Summary

| Field         | Value                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Intent        | Make every modal answer the documented Escape and Enter keyboard contract                             |
| Key decisions | `isQuitConfirmOpen` joins the confirm-modal guard; `instrumentOperationSummary` joins the Enter chain |
| Open risks    | `none`                                                                                                |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.9/close-modal-keyboard-dead-paths.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces.
- Props interface named with `Props` suffix.
- No abbreviations in identifiers.
- Every event listener is removed in cleanup - the hook already does this.
- Minimal, surgical edits consistent with the existing chain style.

## Documentation Updates

Per project guidelines, the project specification update is the first implementation step. Update only the files affected by this change.

- `SPECIFICATION.md` - record the modal keyboard contract under "Keyboard Shortcuts and Input Bindings": Escape cancels or closes the open modal and Enter confirms it.

`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` require no changes - the fix restores already-documented behaviour and touches no format.

## Type and State Updates

**Type definitions**

No type changes. `UseModalManagerOptions` already declares `isQuitConfirmOpen`, `handleCancelQuit`, `handleConfirmQuit`, `instrumentOperationSummary`, and `handleCloseInstrumentOperationSummary`.

**State store modifications**

No store changes. The fix adjusts guard lists and handler chains inside the existing `useEffect` only.

## Step by Step Implementation

**Add `isQuitConfirmOpen` to the confirm-modal guard**

The quit-confirm dialog is a confirm modal but is missing from `hasConfirmModal`, so when it is the only open modal the guard returns early and both keys are dead. Add it to the guard list.

File to modify: `src/hooks/modal/useModalManager.ts`.

```typescript
const hasConfirmModal =
  isTransposeOpen ||
  isOptimizeConfirmOpen ||
  isRenumberConfirmOpen ||
  isNewSongConfirmOpen ||
  isResetConfirmOpen ||
  isQuitConfirmOpen ||
  isInstrumentDeleteOpen ||
  isInstrumentTypeWarningOpen ||
  isExportOpen ||
  isPasteTrackOptionsOpen;
```

**Add `instrumentOperationSummary` to the Enter chain**

The summary dialog sits in the Escape chain but not the Enter chain, so it can be dismissed but never confirmed from the keyboard. Enter applies the same action as its confirmation path - the dialog's single close action. Mirror the Escape ordering: after `renumberSummary`, before `midiLoadError`.

File to modify: `src/hooks/modal/useModalManager.ts`.

```typescript
if (instrumentOperationSummary) {
  handleCloseInstrumentOperationSummary();
  return;
}
```

**Add modal keyboard contract tests**

A new test file exercises the keydown listener the hook installs on `window`: with the quit-confirm as the only open modal, Escape invokes `handleCancelQuit` and Enter invokes `handleConfirmQuit`; with `instrumentOperationSummary` open, Enter invokes `handleCloseInstrumentOperationSummary`; with no modal open, no handler fires.

Test file to create: `test/hooks/modal/useModalManager.test.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md` (first implementation step).
2. Apply the `hasConfirmModal` guard edit.
3. Apply the Enter-chain edit.
4. Add the hook tests.
5. Run the verification loop.

## Testing Strategy

**Unit tests**

`useModalManager` installs a capture-phase `keydown` listener on `window`. The test renders a small harness component that calls the hook with a defaults-plus-overrides options object, then dispatches `KeyboardEvent` on `window` inside `act`.

Test file to create: `test/hooks/modal/useModalManager.test.tsx`.

```typescript
it('answers Escape and Enter when quit-confirm is the only open modal', async () => {
  // options: isQuitConfirmOpen: true, all other flags false
  // dispatch Escape -> expect handleCancelQuit called
  // dispatch Enter -> expect handleConfirmQuit called
});
```

**Integration tests**

The quit-confirm dialog only opens through the Electron close guard, so its live pass is verified manually in the packaged app - the smoke suite substitutes for routine changes per the runnable-artifact convention. The instrument-operation summary is exercised through the same hook test surface.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Confirm Escape and Enter behave on both modals: hook test for the deterministic path, packaged-app quit prompt for the Electron path
