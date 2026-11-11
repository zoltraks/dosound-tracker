# Remove the EQ Panel Pan Buttons

**Type:** Fix

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Remove the per-channel pan buttons the stereo record added under the   |
|               | EQ channel labels - shipped                                            |
| Key decisions | The song `stereo` node, its layouts, pan resolution, and engine wiring |
|               | all stay - the control, its prop chain, the dead helpers, and the      |
|               | styles went away                                                       |
| Open risks    | none                                                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The 1.5.2 stereo-output window added a per-channel pan button under each
EQ channel label, cycling a channel through left, centre, and right
positions and persisting the override into the song's `stereo` node. The
control is premature - the owner does not want stereo panning buttons in
the interface yet.

The removal is a surface revert, not a feature revert. The `stereo` node
in the song format, the named layouts and their Song-information toggle,
pan resolution through `resolveChannelPans`, and engine routing on both
engines all stay: a song file can still declare free `A`/`B`/`C` pan
overrides and they apply on playback. What goes away is only the button
control, its prop chain (`EQPanel` <- `SongSection` <- `App`), the
`useChannelPans` click handler, the now-unused `formatChannelPan` and
`nextChannelPan` helpers with their `CHANNEL_PAN_STEPS` catalog, the
`.channel-pan-button` styles, and the e2e pan assertion.

## Use Cases

- When the EQ panel renders, each channel shows its mute bar and label
  only - no pan button sits beneath.
- When a song file declares `A`/`B`/`C` pan overrides, playback honours
  them unchanged.
- When the Stereo layout toggle cycles, the named layouts work exactly
  as before.

## Hints

- `src/hooks/song/useChannelPans.ts` keeps the `channelPans` memo that
  feeds `useAudioSetup`; only `handleChannelPanChange` becomes dead.
- The e2e spec `switches the stereo layout and pans a channel` drops its
  pan assertions and becomes a layout-only flow.

## Out of Scope

- The `stereo` node schema, layouts, persistence, and engine routing.
- The Stereo layout toggle in the Song information panel.
