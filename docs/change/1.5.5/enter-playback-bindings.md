# Play the song and line with Enter on the piano

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Enter playback bindings work while the piano is the active section, and Enter-started playback restores the playlist position and track row on stop        |
| Key decisions | The four Enter combos apply to tracks as well as the piano; restore is scoped to Enter-started playback; a running Enter playback toggles off with restore |
| Open risks    | none                                                                                                                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

When the on-screen piano is the active section, pressing Enter must start playback just as it does while a track is active. The bindings are shared by the piano and the track sections:

- ENTER plays the current line from the cursor row.
- CTRL+ENTER plays the current line from its first row.
- SHIFT+ENTER plays the song from the cursor row.
- CTRL+SHIFT+ENTER plays the song from its first row.

Today Enter is inert while the piano is active, and SHIFT+ENTER and CTRL+SHIFT+ENTER do nothing in any section.

Every Enter binding toggles: pressed again while its playback is running, it stops playback. Playback stopped after being started with an Enter binding restores the playlist position and the track row to the state held before playback started, no matter which control stops it - the Enter toggle itself, ESC, CTRL+8, or the STOP button.

With the piano active, "the track" resolves through the last used track and the shared cursor row - the same resolution the existing line-playback handlers already apply.

## Use Cases

- With the piano active, the user presses ENTER - the current playlist line loops from the cursor row; pressing ESC stops playback and restores the cursor row.
- With the piano active, the user presses CTRL+SHIFT+ENTER - the song plays from row 0 at the current playlist position; pressing the same combo again stops playback and restores the playlist position and track row.
- With a track active, the user presses SHIFT+ENTER - the song plays from the cursor row; stopping with the STOP button restores the position saved at start.

## Hints

- The line-playback toggles already exist in `src/hooks/playback/usePlaybackHandlers.ts` - the song variants need new handlers there.
- The restore mechanism is `patternReturnPositionRef`, consumed today only by `handleStopLinePlayback`; the generic `handleStop` path (ESC, CTRL+8, STOP button) never restores.
- The piano's own keydown handler in `src/components/PianoKeyboard.tsx` is the dispatch point, mirroring `TrackPanel`'s Enter branch.

## Out of Scope

- Changing the PLAY SONG, PLAY LINE, or STOP buttons, the F2, CTRL+5, and CTRL+6 bindings, or playback behavior in non-piano, non-track sections.
- Restore on stop for playback that was not started with an Enter binding.
