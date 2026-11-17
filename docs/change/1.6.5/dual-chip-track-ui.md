# Add two-chip settings and the six-channel track view with an A-F channel switcher

**Type:** Feature

**Blocked by:** `docs/change/1.6.4/dual-chip-song-data.md` (six-channel model) and `docs/change/1.6.5/dual-engine-audio-panning.md` (dual-engine playback) - the view edits and plays what those records define.

## Summary

| Field         | Value                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | User-facing control of dual-chip songs: program settings gain an enable-two-chips option and a three-or-six visible-tracks option; when a two-chip song is shown with three tracks, a switcher selects which chip's channels (A-F) are on screen. |
| Key decisions | Visibility is a view concern layered on the song's chip declaration; the A-F switcher selects the active three-channel group without mutating song data. Settings persist through the existing settings session and storage keys.                 |
| Open risks    | Track focus, selection persistence, keyboard navigation, scroll sync, and the playlist columns all assume three channels; the responsive layout must stay usable with six panels or the switcher.                                                 |

## Description

Program settings gain two options:

- Enable two AY/YM chips - allows songs to use the six-channel model and dual-engine playback.
- Visible tracks - three or six. Three keeps the current compact layout; six shows all channels at once.

Track display rules:

- A single-chip song always shows three tracks (A-C); the six-track option has no effect until two chips are enabled and the song uses them.
- A two-chip song with the three-track view shows one chip's three channels at a time; a switcher selects between the A-C group (chip 1) and the D-F group (chip 2). The switcher is labelled by channel letter so the user can reach any of A-F.
- A two-chip song with the six-track view shows all six channels simultaneously, grouped by chip.
- Editing, playback position, mutes, and keyboard navigation apply to whichever channels are visible; hidden channels keep playing.
- Panning adjustments for the dual-chip layout live in the sound and panning options alongside the existing stereo controls.

Persistence and state:

- The new settings persist through the settings session like existing options and restore on boot.
- Track selection, cursor, scroll position, and view state remain valid for six channels and degrade gracefully for stored three-channel state.
- Playlist columns, track headers, focus order, and the on-screen keyboard follow the visible channel set.

## Use Cases

- When the user enables two chips and opens a two-chip song in the three-track view, the switcher defaults to chip 1 (A-C) and can flip to chip 2 (D-F).
- When the user selects six visible tracks, all six channel panels render grouped by chip and editing targets the focused channel directly.
- When the user disables two chips, two-chip songs fall back to their chip-1 channels and the UI returns to three tracks.
- When settings are saved and the app reloads, the chip enable, track-count, and panning choices restore.

## Hints

- `src/types/settings.ts` and `src/utils/settings/` own the settings shape; `src/modals/settings/SettingsModal.tsx` renders categories including `sound`.
- `src/components/tracker/` (`TrackerSection`, `TrackPanel`, `TrackLine`) and `src/components/playlist/` render the channels; `src/hooks/ui/useTrackFocus.ts`, `useScrollSync.ts`, and `src/utils/track/` own selection, focus, and rendering helpers.
- `src/constants/song.ts` holds the channel/pan vocabulary this record extends visually.
- The A-F switcher is a view selector only - it must not rewrite playlist entries or pattern data.

## Out of Scope

- Export modal chip selection and per-format export output - a later record.
- DUMP and EQ panel changes for two chips - a later record.
- Changes to the song file format itself (owned by the data record).
