# Move modifier chords to Alt and keep section editing off global chords

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Move every modifier-bearing global shortcut from Ctrl to Alt, keep Ctrl+digit for envelope value entry, and stop section key handlers from mutating data or swallowing global chords                                                  |
| Key decisions | Alt/Option carries the track-focus and playback digits; Ctrl+Enter playback stays on Ctrl; Ctrl+digit is intentional hex entry in the Volume, Arpeggio, and Noise envelopes; editing keys need bare keys; no section swallows a chord |
| Open risks    | AltGr emits ctrl+alt on Windows - the matcher must require Alt alone so AltGr chords never fire the bindings                                                                                                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Every global shortcut that carries a modifier today uses Ctrl, and section key
handlers answer chords without checking modifiers. The leaks run both ways:

- Envelope panels write values on Ctrl+1/2/3, CTRL+S, and every Ctrl+letter chord that matches a hex digit or a mode key, and the sustain toggle and Space copy fire on chords.
- The playlist starts pattern editing on CTRL+SPACE and mounts an `autoFocus` input, which steals DOM focus from the piano after the toggle - the piano shows active but the keys land in the input.
- The octave selection calls `stopPropagation` on Space and on every piano-mapped letter: from that section CTRL+SPACE never toggles the piano, and CTRL+Z/N/O/S/I never reach the global handler - a preview note plays instead.
- The on-screen piano maps note letters without checking modifiers, so CTRL+Z previews a note while it also undoes.
- The Tone/Noise panel cycles the mode value on CTRL+SPACE, and the instrument list focuses its name input on CTRL+ENTER and CTRL+SHIFT+ENTER.

The global modifier family moves to Alt - the Option key on macOS - so the
bindings stay one-handed and Ctrl is free for in-context entry:

- ALT+1 focuses track A, ALT+2 focuses track B, ALT+3 focuses track C.
- ALT+5 plays the song from the start of the current line, ALT+6 plays the current line, ALT+8 stops playback.
- ALT+ENTER inside the playlist pattern-id input finishes editing and focuses the track.
- CTRL+1/2/3 and CTRL+5/6/8 become unbound. CTRL+SPACE, CTRL+ENTER, and CTRL+SHIFT+ENTER keep their current actions.

Envelope value entry gains a deliberate Ctrl path:

- CTRL+digit inside a Volume, Arpeggio, or Noise envelope enters the hex value and advances to the next step, exactly like the bare digit.
- The envelope consumes the chord, so no global binding can fire on the same keypress.

Section editing keys stop answering global chords:

- Branches that mutate data require bare keys. Hex digits, the T/N/B mode keys, the sustain S key, the Space value copy and mode cycle, the playlist's pattern-edit start, and the instrument list's name-input Enter all ignore events that carry Ctrl, Cmd, or Alt.
- The Space copy requires a bare Space, so SHIFT+SPACE and CTRL+SPACE keep their global meanings - note-off and the piano toggle - without touching the envelope.
- No section handler swallows a chord it does not own. The octave's Space preview and note map skip events that carry modifiers instead of calling `stopPropagation`, so global chords always reach the window handler. The playlist's pattern edit does not start on a chord, the piano keeps DOM focus after CTRL+SPACE, and its keys play without a click.

## Use Cases

- With the playlist focused, the user presses CTRL+SPACE - the piano becomes active and its keys play immediately; the pattern input does not appear.
- With the octave selection focused, the user presses CTRL+SPACE - the piano toggles and no preview note sounds; pressing CTRL+Z undoes the last edit instead of previewing a note.
- With the Volume envelope focused, the user presses CTRL+1 - value 1 lands on the current step and the cursor advances; pressing ALT+1 focuses track A and changes nothing.
- With the playlist pattern-id input open, the user presses ALT+ENTER - the id commits and the track gains focus.
- With the Arpeggio envelope focused, the user presses ALT+5 - line playback starts and the envelope is unchanged.

## Hints

- `src/constants/navigation.ts` holds `KEYBOARD_SHORTCUTS`; `src/utils/keyboard/keyboardShortcutUtils.ts` matches key events and gains an alt branch that requires `alt && !ctrl && !shift` so AltGr chords never match.
- `src/hooks/keyboard/useKeyboardNavigation.ts` passes `event.altKey` to the matcher.
- `src/components/PlaylistLine.tsx` switches its commit chord from `event.ctrlKey` to `event.altKey` on Enter.
- `src/components/EnvelopePanel.tsx` returns early on `metaKey || altKey || ctrlKey` after the Ctrl+Shift block, except the ctrl+digit hex path, which runs first and calls `preventDefault` plus `stopPropagation`. The Space copy branch also checks `!event.shiftKey`.
- `src/components/PlaylistPanel.tsx` `case ' '` and `case 'ENTER'` require bare keys so pattern editing never starts on a chord.
- `src/components/HeaderPanel.tsx` `handleOctaveKeyDown` and `handleOctaveKeyUp` skip `preventDefault` and `stopPropagation` when modifiers are held.
- `src/components/PianoKeyboard.tsx` guards the note map with bare keys - the Space preview is already guarded.
- `src/components/ToneNoisePanel.tsx` Space cycle and `src/components/InstrumentSection.tsx` `case 'ENTER'` require bare keys.
- `src/components/TrackPanel.tsx` already guards note entry with `ctrlKey || metaKey || altKey` - the same shape applies here.
- Pinned behaviour lives in `test/utils/keyboard/keyboardShortcutUtils.test.ts` and `test/hooks/keyboard/useKeyboardNavigation.test.tsx` - the Cmd-as-Ctrl track-focus case retires.
- `docs/SPECIFICATION.md` navigation shortcuts and the `public/MANUAL.md` Keyboard Navigation list carry the new bindings, and the MANUAL envelope table gains the Ctrl+digit row. The in-flight `manual-refresh` record touches the same lines - whichever lands second reconciles the final text.

## Out of Scope

- CTRL+SPACE (piano toggle), CTRL+ENTER and CTRL+SHIFT+ENTER playback, F2, ESC, CTRL+N/O/S/I, and CTRL+Z/Y - all keep their current bindings.
- TrackPanel and PianoKeyboard Enter handling.
- The instrument list's local Ctrl+Arrow and Ctrl+M chords.
- New bindings beyond the listed set.
