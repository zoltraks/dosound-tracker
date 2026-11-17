# Complete the dual-chip track interface

**Type:** Fix

## Summary

| Field         | Value                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Finish the two-chip interface shipped in 1.6.6: second-chip tracks must be reachable, navigable, and editable before a song references D/E/F, and both panels must present both chips.         |
| Key decisions | The Three/Six-tracks setting alone exposes all six channels; the three-track window slides with the focused channel instead of fixed chip groups; playlist arrows cycle every enabled channel. |
| Open risks    | None - all changes are view-layer or already-covered code paths; no song-format or audio-engine changes.                                                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Version 1.6.6 shipped dual-engine playback, the six-channel song model, and
the settings switches, but several interface paths still assumed three
channels or required song content that cannot be authored without the very
tracks being fixed.

**Visible-track gate.** The six-track view and channel navigation were gated
on `songChipCount(song) === 2`, which only becomes true once a playlist
entry references D/E/F - references the user cannot create while the tracks
are hidden. The `dualChip` sound setting alone now enables the six-channel
model for authoring; the song's chip count still decides how many engines
run during playback.

**Track window.** The fixed A-C/D-F chip-group switcher is replaced by a
sliding three-channel window that follows the focused channel, so moving
focus from C to D shifts the visible set to B,C,D with hysteresis. The
window start is derived during render so the first commit already frames
the focused channel; the effect only persists the anchor. Playlist
ArrowLeft/ArrowRight now cycle all enabled channels (A-F with two chips,
A-C without) and report the pick so the window slides in the same commit;
pattern-cell clicks keep the header highlight in sync.

**Second-chip playlist editing.** Seven code paths still handled only
channels A-C and silently dropped or misrouted D/E/F: pattern creation on
'N', track creation/clone/paste, track deletion, INSERT/DELETE STEP focus,
song renumbering (patterns referenced only via D/E/F were dropped), playlist
entry append, and instrument focus stealing. All now index the six-channel
`PlaylistEntry` generically.

**EQ panel.** The meter count followed second-engine presence, so it showed
three bars until the song actually used chip 2. `EQPanel` now takes the
enabled channel count, always polls six slots (a missing engine contributes
zeros), and renders three or six A-F meters accordingly; D/E/F mutes work
immediately because `channelMutes` is already normalized to six entries.
Hover tints extended to bars 4-6.

**DUMP panel.** CHIP 1/CHIP 2 buttons are absolutely positioned at the
panel's top corners so the centered Dump header keeps its natural position.
The selected button carries a distinct fill and frame, hover swaps in the
lime active-section frame color, click does not leave a focus ring, and
register values display as plain hex without the `$` prefix.

## Use Cases

- When the user enables Two chips on a fresh single-chip song, all six
  tracks are reachable and the three-track window can slide to D-F for
  authoring before any D/E/F playlist reference exists.
- When the user presses N on an empty D/E/F playlist cell, the pattern is
  created and assigned to that channel instead of staying `--`.
- When the user renumbers a song whose patterns are referenced only through
  D/E/F, those patterns survive the remap.
- When the user opens EQ with Two chips enabled but single-chip song
  content, six A-F meters render; D/E/F bars read zero until chip 2's
  engine exists, then show live levels.
- When the user clicks a Dump register value, the copied text matches the
  displayed plain-hex value.

## Hints

- `songChipCount` (explicit `chipCount` or derived from D/E/F references)
  decides playback engines; `trackChannelCount`/`dualChipEnabled` decides
  the editable model - keep the two gates distinct.
- `nextTrackWindowStart` provides hysteresis so small focus moves inside
  the window do not reshuffle columns.
- `isTrackNavigationSection` already covers `trackA`-`trackF`; prefer it
  over A-C ternaries when touching focus routing.

## Out of Scope

- No changes to the song YAML format, simulation, or export paths - those
  shipped in 1.6.5/1.6.6.
- No pan/stereo editing UI - deferred to the 1.7.0 records.
- No adaptive piano octave work - separate 1.7.0 record.
