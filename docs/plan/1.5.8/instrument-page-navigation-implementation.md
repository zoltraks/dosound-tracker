# Instrument Page Navigation Implementation Plan

**Change Request Reference:** `docs/change/1.5.8/instrument-page-navigation.md`

## Summary

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Goal          | Global ALT+PAGEUP/PAGEDOWN instrument stepping with wrap-around      |
| Scope         | `navigation.ts`, `keyboardShortcutUtils.ts`, `useKeyboardShortcuts`, |
|               | `App.tsx`, `TrackPanel.tsx`                                          |
| Key decisions | Reuse the existing `previousInstrument`/`nextInstrument` actions -   |
|               | wiring them globally revives the dead CTRL+-/CTRL+Plus bindings      |
| Risks         | none                                                                 |

## Approach

Mirror the song-line path exactly: a matched chord maps to an action name,
and `useKeyboardShortcuts` registers a global callback for that action,
keeping the section callbacks untouched. Stepping wraps around the stored
`currentSong.instrument` array - the accepted bounds decision.

## Implementation Steps

1. `src/constants/navigation.ts`: add `'ALT+PAGEUP': 'previousInstrument'`
   and `'ALT+PAGEDOWN': 'nextInstrument'` beside the song-line entries.
2. `src/utils/keyboard/keyboardShortcutUtils.ts`: match `PAGEUP` and
   `PAGEDOWN` inside the Alt-only branch (`alt && !ctrl && !shift`), each
   with `preventDefault: true`, so Alt+Shift+PgUp stays free.
3. `src/hooks/keyboard/useKeyboardShortcuts.ts`: extend
   `GlobalShortcutName` and the args with
   `handleNavigateInstrument: (delta: number) => void`; register
   `previousInstrument` -> `handleNavigateInstrument(-1)` and
   `nextInstrument` -> `handleNavigateInstrument(1)`.
4. `src/App.tsx`: add `handleNavigateInstrument` - locate the current
   index by object identity, then by `inst.id`, then decode the hex slot
   id via `normalizeInstrumentId` for unsaved empty-slot selections;
   step with `((index + delta) % count + count) % count`; select the
   target through `setCurrentInstrument`. Pass the handler into
   `useKeyboardShortcuts`.
5. `src/components/TrackPanel.tsx`: the section-level PAGEUP/PAGEDOWN
   16-row step must not fire under Alt - extend the modifier guard with
   `!event.altKey`.
6. Update `SPECIFICATION.md` navigation shortcuts and `public/MANUAL.md`
   keyboard list.
7. Run the verification loop.

## Documentation

- `SPECIFICATION.md`: add the ALT+PAGEUP/PAGEDOWN bullet to the
  navigation shortcuts and scope the bare PAGEUP/PAGEDOWN line so the
  16-row step reads as modifier-free.
- `public/MANUAL.md`: add the ALT+PG UP/PG DOWN line to Keyboard
  Navigation; the CTRL+Minus/Plus alternates join the same bullet since
  they are now functional.
- `PROJECT.md`: no requirement change - instrument navigation is an
  interaction detail the specification owns.

## Test Strategy

- No new tests - the shortcut matcher is exercised by the existing
  keyboard utility and TrackPanel suites; behavior verified manually.
- Existing suite must stay green.

## Definition of Done

- ALT+PAGEUP/PAGEDOWN steps the current instrument globally and wraps at
  the ends; CTRL+-/CTRL+Plus step it too.
- A focused track no longer pages 16 rows under the Alt chord.
- Verification loop clean (typecheck, lint, format, build, tests).

## Refinements

The plan was recorded alongside the landed implementation under the
immediate-mode workflow rather than before the first code edit.

Review found one defect after the initial wiring: `TrackPanel` guarded
its 16-row page step against Ctrl, Meta, and Shift but not Alt, so
ALT+PAGEDOWN inside a focused track both switched instrument and paged
the cursor. The guard now includes `!event.altKey`, matching the pattern
the neighbouring selection-modifier check already uses.
