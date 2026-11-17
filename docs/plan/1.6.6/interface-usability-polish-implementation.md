# Interface Usability Polish Implementation Plan

## Status

**Applied retroactively** - the change record
`docs/change/1.6.6/interface-usability-polish.md` was filed after the work
landed; this document records what was implemented rather than planning
it.

## Change Request References

- `docs/change/1.6.6/interface-usability-polish.md`

## What Landed

- `useFocusedElementPersistence` captures the focused element on page
  hide, persists a scoped ref, and restores focus after the persisted view
  settles under the shared restore-cursor gate, with section-panel focus
  as fallback; `focusedElement.ts` utils added under `src/utils/cursor/`.
- `editingPattern` is `string | null` so Enter opens an editor on empty
  `--` playlist cells; `.pattern-input` inherits cell typography, uses
  `min-width: 0` and `var(--active-bg)`, and keeps the global focus
  outline as the single frame.
- `.command-button` vertical padding `4px` -> `3.5px`; settings modal
  fixed at `height: min(80vh, 26rem)` with a flex body.
- MIDI modal moved behind a `React.lazy` boundary with the other modals.

## Files

`src/App.tsx`, `src/App.css`,
`src/hooks/ui/useFocusedElementPersistence.ts`,
`src/utils/cursor/focusedElement.ts`,
`src/components/playlist/PlaylistPanel.tsx`,
`src/components/playlist/PlaylistLine.tsx`,
`src/components/modal/ModalManager.tsx`, plus tests.

## Verification

- `npm test` - 191 files, 1771 tests passing.
- typecheck, lint, prettier - clean.
- `npm run build` - entry bundle ~592.4 kB, under the 600 kB budget.

## Commits

- `ccc3077` - focus persistence, empty-cell editing, pattern-input and
  density styling, lazy MIDI modal (the command-button padding line is
  the remaining uncommitted change in `src/App.css`).
