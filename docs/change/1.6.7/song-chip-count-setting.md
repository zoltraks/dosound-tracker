# Song chip count as the two-chips setting

**Type:** Change

## Summary

| Field         | Value                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | Store the two-chips state in song data and synchronize the settings checkbox with it                                                 |
| Key decisions | `song.chipCount` is the single source of truth; `dualChip` leaves the app settings; explicit `chipCount: 1` survives parse/serialize |
| Open risks    | Authoring D/E/F now requires the song to be two-chip first; the orphaned `DUAL_CHIP` storage key is ignored                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

"Two chips" was an application-level sound setting (`sound.dualChip`,
`dosound-tracker-dual-chip`) that gated both playback and the six-track
editing surface, so it could disagree with the song's own `chipCount` -
a two-chip song with the setting off ran one centred engine and sounded
mono. The state is song data, not a preference: the song's resolved
`chipCount` already drove playback after the song-driven playback
change, and this change completes the move by deleting the app-level
setting entirely.

The settings SOUND category keeps a "Two chips" checkbox, but it is now
a song-data control like the stereo selects: checked reflects
`songChipCount(currentSong) === 2` and toggling writes
`updateSong({ chipCount: 2 | 1 }, { record: false })` immediately. The
song parser preserves an explicit `chipCount: 1` so a song whose
playlist references D/E/F can still be forced single-chip, and the
serializer writes the explicit value back so the override survives a
save/load round trip.

## Use Cases

- When the user checks "Two chips" on a single-chip song, the song
  becomes two-chip at once - six tracks appear, the second engine spins
  up silent until D/E/F content exists, and the choice persists in the
  song file as `chipCount: 2`.
- When the user unchecks it on a two-chip song, `chipCount: 1` keeps the
  song single-chip even though its playlist still references D/E/F -
  the dormant second-chip data stays in the file.
- When a two-chip song loads, the checkbox shows on without any app
  setting involved; songs synchronize in both directions.

## Hints

`songTwoChip = songChipCount(currentSong) === 2` in `App.tsx` replaces
`effectiveDualChip` for the track UI; `effectiveChipCount` stays
`songChipTotal`. `SettingsSoundPreview` shrinks to `{ mono, crosstalk }`
and `useSettingsSession` loses the `dualChipEnabled` pair. The modal
receives `songTwoChip`/`onSongTwoChipChange` alongside `songStereo`.

## Out of Scope

- Migrating the orphaned `dosound-tracker-dual-chip` localStorage value;
  it is simply no longer read.
- Changing `visibleTracks` (3|6), which still applies to two-chip songs.
- Undo history for the toggle - it records like the stereo selects,
  without a history entry.
