# Refactoring Proposal - 1.5.0

## Problem

The session-write path for the settings modal was restructured inside the
record already: the previous `useSettingsDialog` kept a mirror effect that
re-wrote the whole session on every category/draft change, which produced
a transient clobber on open (the mirror fired with pre-seed state before
the seeded values committed). The record replaced it with explicit
per-setter `patchSettingsView` calls - each mutation writes exactly the
member it owns.

Two residual candidates were considered and rejected:

- **Scroll-debounce extraction** - `MarkdownModal` and `SettingsModal`
  each carry a ~10-line `setTimeout` debounce around a scroll write.
  Two call sites is below the extraction threshold and the surrounding
  code differs (markdown reads `bodyRef`, settings reads the event
  target).
- **Session-member defaults** - `loadUiState` normalizes each member
  inline. The member count is five; a schema table would cost more than
  it saves at this size.

## Goal

No further work: the record-internal restructure already covered the
meaningful refactor for this window.

## Plan

**Assess only**

Verify the verification loop and the reload probes remain green with the
per-setter patch structure.

## Risk

None - no additional code changes are proposed.
