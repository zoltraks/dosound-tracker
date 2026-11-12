# Apply the adopted accessibility baseline

**Type:** Feature

**Source:** AUDIT-1.5 REC-009 (FND-CQY-002)

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Bring interactive surfaces up to the adopted accessibility standard        |
| Key decisions | Roles, labels, focus indicators, and live regions form the baseline scope  |
| Open risks    | Screen-reader verification is attribute-level - no AT session has been run |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The adopted `accessibility-general-development.md` standard is only partially
realized. The audit census found 27 `aria-*` attribute uses across 6 of 28
component files; re-verification on 2026-11-10 counts 17 uses across 6 source
files. Interactive surfaces - command buttons, panels, modals, and the message
rotation - carry little or no assistive-technology semantics, while keyboard
navigation order already exists and covers part of the baseline.

Interactive surfaces meet the adopted baseline:

- Controls carry accessible names and roles so a screen reader announces what
  each element does.
- Focus is visible and follows the documented navigation order.
- The rotating message surface and modal state changes announce themselves
  through `aria-live` regions where the standard requires it.
- Tracker-specific widgets (pattern grid, envelope editors, piano keyboard)
  expose keyboard-equivalent operation consistent with the existing bindings.

## Use Cases

- When a screen-reader user focuses a command button, then its purpose is
  announced.
- When the notes panel rotates a message, then assistive technology receives
  the update through a live region.
- When a modal opens, then focus and role semantics describe it correctly.

## Hints

- Verification is an axe-style census or targeted component tests - the
  attribute census alone does not prove AT usability.
- The UI is deliberately monospaced and DOS-like; the baseline applies without
  visual redesign.
- Audio-critical linting exceptions in `SPECIFICATION.md` still apply - no
  audio-path rework belongs in this change.
