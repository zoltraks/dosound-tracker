# Adopt the Engineering Standard Library

**Type:** Chore

AI-assisted: Devin (SWE-2)

## Summary

Reorganise `docs/standard/` to the compass standard-library layout: a `README.md` index, the standard-authoring template, the `<language-or-domain>-<category>-development.md` naming convention, and the applicable standard set adopted from the canonical library, reconciled and mined against the current implementation.

## Description

The standard directory today holds a single `ts-react-development.md`. The change adopts the applicable set - typescript-react, typescript-electron, typescript-general, css-general, html-vanilla, accessibility-general, performance-budgets - plus the index and the authoring template. The existing React standard is replaced by the canonical document with every project-specific section carried forward into a clearly separated project-conventions part, and each adopted file receives deltas mined from the current implementation: the directories-only layout rule, the entry-file exception, direct imports without barrels, the Zustand store patterns, the Electron `.cjs` testability pattern, the Vitest and Playwright conventions, and the real-time audio timing budget.

## Out of Scope

- Standards outside the applicable set.
- Content changes to `GUIDELINES.md` audio-critical principles, which stay the owning document.
- Behaviour changes to source code - this is a documentation-only change.
