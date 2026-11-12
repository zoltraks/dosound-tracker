# Fix Alt+Digit Focus and Playback Shortcuts on macOS

**Type:** Fix

## Summary

| Field         | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| Intent        | Make ALT+digit bindings fire on macOS, where Option+digit emits symbol characters |
| Key decisions | Read the physical digit from `event.code` while Alt is held                       |
| Open risks    | none                                                                              |

## Description

`useKeyboardNavigation` matches shortcuts on `event.key`. On macOS, Option+digit produces symbol characters (`¡`, `£`, `ﬁ`, `ﬂ`, `•`), so `ALT+1`, `ALT+2`, `ALT+3`, `ALT+5`, `ALT+6`, and `ALT+8` never match and the track-focus and playback bindings are dead on macOS. `event.code` carries the physical key (`Digit1`, `Numpad1`) regardless of the produced character - while Alt is held, the digit is read from `event.code` instead.

## Use Cases

- The user presses Option+1 on macOS - track A receives focus.
- The user presses Option+5/6/8 on macOS - the playback shortcuts fire.

## Hints

- `handleKeyDown` in `src/hooks/keyboard/useKeyboardNavigation.ts` is the single match point; `matchKeyboardShortcut` stays key-agnostic.
