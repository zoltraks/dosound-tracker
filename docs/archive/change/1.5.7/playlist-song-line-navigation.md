# Navigate Song Lines with SHIFT+PAGEUP/PAGEDOWN from Any Section

**Type:** Fix

## Summary

| Field         | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Intent        | SHIFT+PAGEUP and SHIFT+PAGEDOWN navigate song lines from any focused section              |
| Key decisions | The chord moves to the global keyboard-shortcut layer - the TrackPanel binding is removed |
| Open risks    | none                                                                                      |

## Description

CTRL+PAGEUP and CTRL+PAGEDOWN change the song position only while a track section is active. The binding lives in `TrackPanel` alone, so pressing the chord while the playlist or any other section is focused does nothing at all.

The chord should work from whatever section holds focus. The global keyboard layer already routes chords like CTRL+Z and CTRL+V through `KEYBOARD_SHORTCUTS` and `setGlobalShortcut` - song-line navigation joins that layer and calls the existing `handleNavigateSongLine`.

The modifier is SHIFT rather than CTRL. Browsers reserve CTRL+PAGEUP/PAGEDOWN for tab switching, and the key event may never reach the page. SHIFT+PAGEUP/PAGEDOWN carries no browser meaning.

## Use Cases

- The user presses SHIFT+PAGEDOWN while the playlist, a track, or any other section is focused - the song position moves to the next line, and the playlist cursor follows.
- The user presses SHIFT+PAGEUP anywhere - the song position moves to the previous line.
- The chord stays clamped at the first and last playlist entries and keeps the shared track row, matching the previous track-section behavior.
- Plain PAGEUP and PAGEDOWN keep their existing meaning - the 16-row jump inside a focused track pattern.
- SHIFT+ARROWUP and SHIFT+ARROWDOWN keep extending the track fragment selection - the chord does not disturb them.
- The chord does not fire while an editable field holds focus, matching every other global chord.

## Hints

- `matchKeyboardShortcut` maps PAGEUP/PAGEDOWN under the shift branch to `SHIFT+PAGEUP`/`SHIFT+PAGEDOWN` entries in `KEYBOARD_SHORTCUTS`.
- `useKeyboardShortcuts` registers named global actions - two new names wrap `handleNavigateSongLine(-1)` and `handleNavigateSongLine(1)`.
- `TrackPanel` drops its local modifier branch - the 16-row jump skips on ctrl, meta, and shift so the window listener owns every modified page key.
- The `onNavigateSongLine` prop becomes unused on `TrackPanel` and `TrackerSection` - the prop unwinds; `PlaylistPanel` and `SongSection` need no changes.
- The playlist's `currentPlaybackPosition` sync effect already moves its cursor - no extra state work is needed.
