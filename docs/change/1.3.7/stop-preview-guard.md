# Guard Panel stopPreview Calls Behind Live Preview State

**Type:** Change

## Summary

| Field         | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Intent        | Section flips must not zero a channel volume register when no preview ran                        |
| Key decisions | Guard `stopPreview()` behind existing preview state; early return in `handleHardStopLivePreview` |
| Open risks    | None                                                                                             |

## Description

The `[isActive]` effect in `src/components/TrackPanel.tsx` and the
`[isOctaveActive]` effect in `src/components/HeaderPanel.tsx` call
`stopPreview()` unconditionally on mount and on every activation flip.
`stopPreview()` reaches `handleHardStopLivePreview` in
`src/hooks/midi/useMidiActions.ts`, which writes `0x08 + channel = 0x00`
whenever the chip exists - before the `if (!ym2149)` prop guard in the
caller ever runs. Any section flip after initialization therefore silences
a channel that was never previewing. The same path killed the original
register-driven startup test tone.

Stopping must still happen when a real preview is running and the section
flips away or the panel unmounts. Only the init and no-op calls are
suppressed. A MIDI live preview owned by the hook, not the panel, is not
panel preview state and survives a section flip; it still stops on its
normal note-off path.

## Implementation

- `src/components/TrackPanel.tsx`: a `hasPreviewState` check (active preview
  key, running envelope timer, or tracked pressed keys left by a lost
  keyup) guards the `stopPreview()` calls in the `[isActive]` effect body
  and cleanup.
- `src/components/HeaderPanel.tsx`: the `[isOctaveActive]` effect calls
  `stopPreview()` only while `previewTimerRef` holds a running preview
  timer.
- `src/hooks/midi/useMidiActions.ts`: `handleHardStopLivePreview` returns
  early when no live preview timer and no recorded preview exist, so a
  stray stop cannot reach the channel volume register.
- Tests: `test/hooks/midi/useMidiActions.test.tsx` hard-stop cases arm a
  live preview before stopping and gain a no-preview no-write case;
  `test/components/TrackPanel.test.tsx` gains mount and flip cases that
  assert the register is untouched without a preview and still zeroed
  after a real preview.

## Outcome

- Verification loop clean; mounts and section flips without a preview no
  longer write to the chip, while real previews still stop on flip and
  unmount.
