# Refactoring Assessment - 1.5.6

## Summary

| Field  | Value                                                               |
| ------ | ------------------------------------------------------------------- |
| Result | complete                                                            |
| Scope  | `docs/refactoring/1.5.6/REFACTORING.md` - all proposed items landed |

| Metric                                    | Proposed | Achieved |
| ----------------------------------------- | -------- | -------- |
| Playlist clamp literals removed           | 8        | 8        |
| Playable-line guard copies removed        | 3 -> 1   | 3 -> 1   |
| Song Enter toggle bodies merged           | 2 -> 1   | 2 -> 1   |
| Line Enter toggle playing branches merged | 2 -> 1   | 2 -> 1   |
| Line-command button prop copies removed   | 4 -> 1   | 4 -> 1   |

## Proposal vs Implementation

| Step                                                      | Status    | Notes                                                                                          |
| --------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| `clampPlaylistIndex` + `resolvePlayableLineIndex` helpers | completed | Module-level pure functions in `usePlaybackHandlers.ts`; all eight clamp sites migrated        |
| Parameterized `toggleSongPlayback`                        | completed | Public `handleToggleSongFromCursor`/`handleToggleSongFromStart` delegate; signatures unchanged |
| Shared `handleLineToggleWhilePlaying`                     | completed | Both line toggles call it and keep their distinct not-playing tails                            |
| `keepSectionButtonProps` in `CommandPanel`                | completed | Spread on the four line buttons; propagation-only buttons untouched                            |
| Full verification loop                                    | completed | All checks clean                                                                               |

## Deviations and Rationale

- The shared line-toggle helper returns `boolean` instead of splitting on playback state inside each toggle - the not-playing tails differ between the cursor and start variants, so a predicate kept each tail in its own handler rather than adding a second parameter.
- `resolvePlayableLineIndex` folds the empty-playlist, missing-entry, and all-empty-channel guards into one helper rather than exposing a separate `lineHasAnyPattern` - the three call sites always needed the full sequence, so splitting it would have reintroduced a shared preamble.
- `handleStartLineFromCurrentLine` had already been reformatted by the window's disabled-track fix (multi-line guard), so its migration landed as a second edit rather than part of the mechanical replacement - same end state.

## Verification Results

| Check               | Result                  |
| ------------------- | ----------------------- |
| `npm run typecheck` | clean                   |
| `npm run lint`      | clean                   |
| `npm run format`    | clean                   |
| `npm run build`     | clean                   |
| `npm test`          | 1319 passed (unchanged) |

Test count is unchanged - no new behavior was added. The 42 playback-handler tests and the command-panel focus tests pass against the consolidated shapes, confirming identical behavior.

## Remaining Gaps

none - every proposal item landed in full.

## Lessons Learned

- The window's incremental Enter-binding work produced duplication that only became obvious once all four chords worked on disabled tracks - refactoring at window close, when the semantic shape has settled, avoids churning tests mid-feature.
- Module-level pure helpers are the right extraction for hook files that maintain dependency arrays by hand - they carry no referential-identity risk and need no array edits.
