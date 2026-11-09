# Close modal keyboard dead-paths

**Type:** Fix

**Source:** AUDIT-1.4 REC-005 (FND-CQY-002)

## Summary

| Field         | Value                                                                                   |
| ------------- | --------------------------------------------------------------------------------------- |
| Intent        | Make every modal answer the documented Escape and Enter keyboard contract               |
| Key decisions | quit-confirm joins the modal guards; instrument-operation summary joins the Enter chain |
| Open risks    | `none`                                                                                  |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`useModalManager.ts` handles `isQuitConfirmOpen` in its Escape and Enter branches but omits it from the `hasInfoModal`/`hasConfirmModal` guards, so when the quit-confirm dialog is the only open modal both keys are dead. Separately, `instrumentOperationSummary` is present in the Escape chain but missing from the Enter chain, so that dialog can be dismissed but not confirmed from the keyboard.

The change adds `isQuitConfirmOpen` to both guard lists and `instrumentOperationSummary` to the Enter chain, restoring the documented keyboard contract on both modals.

## Use Cases

- When the quit-confirm dialog is the only open modal and the user presses Escape, the dialog closes; Enter confirms.
- When the instrument-operation summary is open, Enter applies the same action as its confirmation path.

## Hints

- Verification is an e2e Escape and Enter pass on both modals.
- Mouse dismissal and window close already work and must keep working.

## Out of Scope

- Keyboard contract changes for any other modal.
- Visual or layout changes to the dialogs.
