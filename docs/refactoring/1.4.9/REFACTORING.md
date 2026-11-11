# Refactoring Proposal - 1.4.9

## Problem

The four sized content modals - `text-display`, `download-modal`,
`midi-modal`, `settings-modal` - each repeat
`display: flex; flex-direction: column` in their own rule. The new mobile
block already groups the same four selectors for the fullscreen sizing,
so the flex-column shell is now declared in five places for one idea.

## Goal

Declare the flex-column shell once for the sized-modal group.

## Plan

**Group the shell declarations**

Add a shared rule beside the dialog rules:

```css
.modal-dialog.text-display,
.modal-dialog.download-modal,
.modal-dialog.midi-modal,
.modal-dialog.settings-modal {
  display: flex;
  flex-direction: column;
}
```

and drop the two declarations from each of the four per-modal rules.
Widths, heights, and `min-width`/`max-width` stay per rule - only the
identical shell declarations move.

**Verify**

Prettier check plus the preview-build geometry probe (dialog bounding
boxes on desktop and mobile viewports) - the rules are selector-equivalent,
so rendered output must not change.

## Risk

Zero behavioral risk: the grouped selector matches the exact same elements
with the same specificity, and the moved declarations are identical in
every rule.
