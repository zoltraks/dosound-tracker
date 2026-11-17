# Dual-Chip UI Completion Implementation Plan

## Status

**Applied retroactively** - the change record
`docs/change/1.6.6/dual-chip-ui-completion.md` was filed after the work
landed; this document records what was implemented rather than planning
it.

## Change Request References

- `docs/change/1.6.6/dual-chip-ui-completion.md`

## What Landed

- `dualChip` setting alone enables the six-channel authoring model; the
  three-track window slides with the focused channel via
  `nextTrackWindowStart`, derived during render to eliminate header
  flicker; playlist ArrowLeft/Right cycle all enabled channels through
  `onTrackChannelChange`.
- All A-C-only playlist/track paths index the six-channel `PlaylistEntry`
  generically: pattern creation, track create/clone/paste/delete,
  INSERT/DELETE STEP focus, `songRenumber`, `addPlaylistEntryToSong`, and
  `InstrumentSection` focus via `isTrackNavigationSection`.
- `EQPanel` takes `channelCount`, polls six slots, renders three or six
  A-F meters; hover tints extended to bars 4-6.
- `DumpPanel` CHIP 1/CHIP 2 buttons are corner-anchored overlays; selected
  and hover states refined; register values display as plain hex.

## Files

`src/App.tsx`, `src/App.css`, `src/components/song/SongSection.tsx`,
`src/components/song/EQPanel.tsx`, `src/components/song/DumpPanel.tsx`,
`src/components/playlist/PlaylistPanel.tsx`,
`src/components/playlist/PlaylistLine.tsx`,
`src/hooks/playlist/usePlaylistOperations.ts`,
`src/hooks/track/useTrackOperations.ts`,
`src/utils/song/songRenumber.ts`,
`src/utils/song/songPlaylist.ts`,
`src/components/instrument/InstrumentSection.tsx`,
`docs/SPECIFICATION.md`, plus regression tests.

## Verification

- `npm test` - 191 files, 1771 tests passing (regression cases added for
  D/E/F pattern creation, track ops, renumber, playlist entry append,
  playlist channel cycling, empty-cell editing, and EQ six-bar render).
- typecheck, lint, prettier - clean.
- `npm run build` - entry bundle ~592.4 kB, under the 600 kB budget.
- `npm run test:e2e` - 30 Playwright smoke tests passing.

## Commits

- `7a9a959` - visible-track gate fix.
- `ccc3077` - window, navigation, playlist editing, EQ, and styling work.
