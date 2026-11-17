# Version 1.6.4 Review

## Document Information

|             |                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version     | 1.6.4                                                                                                                                                                                     |
| Review Date | 2026-11-17                                                                                                                                                                                |
| Commands    | `git log`, `git status --short`, `git diff`, `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm audit` |

## Scope

This review closes the 1.6.4 window. The window's change group holds one
record - `dual-chip-song-data` - which extends the song model, YAML
format, playlist types, stereo resolution, playback simulation, and pure
song utilities to six channels (A-F) across two AY/YM chips. Three
companion records filed during intake (`dual-engine-audio-panning`,
`dual-chip-track-ui`, `dual-chip-exports-panels`) are deferred to the
1.7.0 window by design: live two-engine audio, the six-track interface,
EQ/dump panels, and per-chip export selection are explicitly out of this
window's scope.

## Recorded Work

| Document                                                  | Kind        | Status | Result                                                         |
| --------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------- |
| `docs/change/1.6.4/dual-chip-song-data.md`                | Change      | Done   | Implemented and verified this run                              |
| `docs/plan/1.6.4/dual-chip-song-data-implementation.md`   | Plan        | Done   | Written before source edits per the pipeline                   |
| `docs/refactoring/1.6.4/REFACTORING.md` + `ASSESSMENT.md` | Refactoring | Done   | Pass - channel-key literals consolidated into shared constants |
| `docs/change/1.7.0/dual-engine-audio-panning.md`          | Change      | Filed  | Deferred to the 1.7.0 window by design                         |
| `docs/change/1.7.0/dual-chip-track-ui.md`                 | Change      | Filed  | Deferred to the 1.7.0 window by design                         |
| `docs/change/1.7.0/dual-chip-exports-panels.md`           | Change      | Filed  | Deferred to the 1.7.0 window by design                         |

## Repository Analysis

- **Confirmed** - the record's acceptance surface is implemented:
  `Line`/`SongStereo`/`Song` carry optional `D`/`E`/`F` and `chipCount`;
  `songChips.ts` owns the effective-count derivation (explicit field wins,
  otherwise any D/E/F playlist reference means two chips); the parser
  reads `chipCount`, second-chip keys, and widened stereo members; the
  serializer emits `chipCount` only for two-chip songs and D/E/F row keys
  only when they name a pattern; `playbackSimulation` emits an additive
  `registers2` stream for chip 2 with six channel states; renumber,
  optimize, transpose, stored-song migration, and the playable-row check
  all carry second-chip references; `FORMAT.md` and `SPECIFICATION.md`
  document the extended model.
- **Unconfirmed** - none.
- **Undocumented** - the `dual` stereo layout's exact pan curve
  (`[0, 0.25, 0.5, 0.5, 0.75, 1]`) is a design choice recorded only in
  `src/constants/song.ts` and `FORMAT.md`'s layout list; acceptable as a
  data-layer default pending the panning record's engine work.
- **Deviations** - `TrackSelectionTrackId` stayed three-channel after the
  widening attempt cascaded into UI-coupled consumers; the plan's
  "keyboard-section mapping stays three-channel" boundary held. The
  stored-song migration site (`useSongManagement`) was added to scope
  beyond the plan's file list after audit showed it rebuilt `{A,B,C}`
  rows and would have dropped second-chip data on restore.

## Findings

| Severity | Finding                                                                                        | Evidence                             | Action                                                        |
| -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Minor    | `usePlaylistOperations.handleCloneLine` duplicates A/B/C patterns but shares D/E/F references  | `usePlaylistOperations.ts` ~line 300 | Recorded for the track-UI record; data is preserved, not lost |
| Info     | Exporters read `frame.registers` only, so two-chip songs export chip 1 until the export record | `src/exports/*.ts`                   | By design - deferred to `dual-chip-exports-panels`            |
| Info     | Engines slice pans to three channels; the six-tuple is forward-compatible                      | `YM2149.ts`, `AyumiEngine.ts`        | By design - deferred to `dual-engine-audio-panning`           |

## Verification Evidence

- `npm run typecheck` - `tsc -b`, zero errors.
- `npm run lint` - zero errors and zero warnings.
- `npm run format` - applied.
- `npm run build` - production entry 597.13 kB, below the 600 kB limit.
- `npm test` - 187 files, 1721 tests, all passing.
- `npm run test:coverage` - 88.58 / 81.93 / 87.39 / 88.89 percent
  statements/branches/functions/lines, all above the 80 percent thresholds.
- `npm run test:e2e` - 30 smoke tests on chromium and webkit, all passing.
- `npm audit` - see release gate output.

## Unable to Verify

- Audible two-chip playback - no second engine or UI exists yet; the
  `registers2` stream is verified at the simulation level only. Manual
  audio testing is deferred to the 1.7.0 engine record.

## Decision

- **Decision:** bump - the window delivered its single change record end
  to end (model, format, simulation, utilities, docs, tests) with the
  verification loop clean on every axis and the deferred scope explicitly
  recorded. Owner authorization recorded: the bump was explicitly
  requested for this run.
- **Decided by:** the project owner - confirmed by the run request.
- **Conditions:** none.
- **Accepted risks:** two-chip songs are data-complete but not yet
  audible or editable in the interface; export output for a two-chip
  song covers chip 1 only until the deferred records land.
