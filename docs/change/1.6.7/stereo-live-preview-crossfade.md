# Normalized crosstalk crossfade and live sound preview

**Type:** Change

## Summary

| Field         | Value                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Make crosstalk a constant-level crossfade and apply the draft's sound settings to playback in realtime while settings is open          |
| Key decisions | Dry bus paths ease to `1 - c/2` while bleed paths rise to `c/2`; the settings draft's `mono`, `crosstalk`, and `dualChip` preview live |
| Open risks    | The stereo selects write song data, so CANCEL does not revert them - they are song edits, not draft values                             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The first crosstalk bus summed the dry signal at unity plus a symmetric
bleed (`L_out = L + c*R`), which boosted correlated content by up to 6 dB
at 100 percent - listeners compensated by lowering the volume, so the
control read as a level change rather than a crossfade. The bus now runs
a normalized crossfade: four gains form `L_out = (1 - c/2)*L + (c/2)*R`
and `R_out = (c/2)*L + (1 - c/2)*R`, converging both outputs on `(L+R)/2`
at 100 percent - monophonic at constant level.

The `MONO`, `CROSSTALK`, and `DUAL_CHIP` draft values previously reached
the audio pipeline only on commit. `useSettingsSession` now pushes the
draft's sound triple through `onSoundPreviewChange` while the modal is
open; App resolves the live values ahead of `useChannelPans`,
`useAudioSetup`, and the playback bridge's channel count. Closing the
modal drops the preview so committed values resume - CANCEL reverts
everything, OK commits what was already audible. The per-song stereo
selects already wrote `song.stereo` directly and keep doing so; they are
song-data edits, so CANCEL does not restore the previous modes.

## Use Cases

- When the user drags the crosstalk slider during playback, the stereo
  image crossfades toward mono without a level jump in either direction.
- When the user toggles MONO or dual-chip in the open settings dialog,
  the running engines re-route immediately - pans recenter, the second
  chip joins or leaves, and the bleed gains follow the slider per tick.
- When the user cancels the dialog, mono, crosstalk, and dual-chip snap
  back to the committed settings while the song's stereo modes remain.

## Hints

`busGainsRef` holds the four bus `AudioParam`s in creation order - dry
left, dry right, bleed to right, bleed to left - and the crosstalk effect
ramps all four with `setTargetAtTime`. The preview state lives in App
(`settingsSoundPreview`) because the audio hooks are instantiated above
`useSettingsSession`; the session only reports the draft triple and
clears it on close.

## Out of Scope

- Crossfading the engine selector or other non-sound settings live.
- Reverting song-data stereo edits on CANCEL; they follow the tracker's
  ordinary edit semantics.
- Per-channel or frequency-dependent crossfeed; the bus stays a single
  symmetric matrix.
- Export formats, which still carry no pan data.
