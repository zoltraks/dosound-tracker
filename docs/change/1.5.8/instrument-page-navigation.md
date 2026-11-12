# Instrument Page Navigation

**Type:** Feature

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Give instrument switching a global page-key chord mirroring the |
|               | SHIFT+PAGEUP/PAGEDOWN song-line navigation                      |
| Key decisions | ALT+PAGEUP/PAGEDOWN wraps around the stored instruments; the    |
|               | declared-but-dead CTRL+-/CTRL+Plus bindings become live through |
|               | the same action names                                           |
| Open risks    | none                                                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

SHIFT+PAGEUP and SHIFT+PAGEDOWN already move the playlist line from any
focused section. Instrument switching had no equivalent global chord - the
`KEYBOARD_SHORTCUTS` table declared CTRL+Minus and CTRL+Plus mappings to
`previousInstrument`/`nextInstrument` actions, but no handler consumed
those actions, so the bindings were dead.

The change adds ALT+PAGEUP and ALT+PAGEDOWN (OPTION on macOS) as global
shortcuts that step the current instrument backward and forward. Stepping
wraps around the stored instrument list: PAGEDOWN on the last instrument
selects the first, PAGEUP on the first selects the last. When the current
instrument is an unsaved empty slot outside the stored array, its slot id
still determines the position the step starts from.

Because the chord is global, the track panel's own PAGEUP/PAGEDOWN
row-stepping must not also fire while ALT is held - section-level page
keys ignore the Alt modifier.

## Use Cases

- When the user presses ALT+PAGEDOWN from any section, the next stored
  instrument becomes current and the instrument list highlights it.
- When the user presses ALT+PAGEUP on instrument 00, the last stored
  instrument becomes current.
- When a track section is focused and the user presses ALT+PAGEDOWN, the
  instrument changes and the track cursor does not page 16 rows.
- When the user presses CTRL+Minus or CTRL+Plus, the instrument steps the
  same way - the previously dead bindings now work.

## Hints

- The `previousInstrument`/`nextInstrument` action names already exist in
  `navigation.ts`; registering them as global shortcuts covers both chord
  sets at once.
- `normalizeInstrumentId` decodes the hex slot id, recovering a position
  even for empty-slot selections outside the instrument array.

## Out of Scope

- Stepping into empty slots beyond the stored array - the wrap set is the
  stored instruments only.
- Changing the instrument panel's own arrow-key navigation.
