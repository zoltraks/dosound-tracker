# Refresh the manual for recent features

**Type:** Documentation

## Summary

| Field         | Value                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | `public/MANUAL.md` documents this session's input and repository changes plus the 1.5.x features it never covered                                   |
| Key decisions | Playback and navigation shortcuts join the existing Keyboard Navigation list; note-off gets its binding named; settings, stereo, and the sound engine get their first manual coverage |
| Open risks    | none                                                                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The manual is stale on several points:

- The quick tip still says ENTER "starts playing current pattern" - it documents none of the four Enter bindings, the piano support, the stop-on-press toggle, or the position restore.
- The Keyboard Navigation list lacks the playback shortcuts (F2, CTRL+5/6/8, ESC), the new section-focus shortcuts (CTRL+1/2/3, CTRL+SPACE), and names no key for note-off.
- SHIFT+SPACE inserts `===` and clears it again on a note-off position - the manual never named the note-off key at all.
- The bundled instrument repository behind Pick Instrument is undocumented, including the Warmball set and its role colors.
- Version 1.5.x features never covered: the settings dialog (GENERAL, EDITOR, SOUND categories), the third High Contrast theme and Text size scaling, the selectable sound engine (Internal / Ayumi), and the song `stereo` node for channel layouts and panning.
- The section-frame colors changed behavior: hover tints the frame, and an active section shows a distinct frame color on hover (lime in the dark theme).

## Use Cases

- A composer reads Keyboard Navigation and finds every shortcut the session added.
- A composer opens Pick Instrument after reading Instrument Operations and knows the bundled set exists and what its colors mean.
- A coder reads the song root list and finds `stereo` documented.

## Hints

- The stale quick tip sits near line 106 of `public/MANUAL.md`; the Keyboard Navigation list near line 241; song root keys near line 561.
- Palette families for the repository instruments: red drums, blue bass, green lead, yellow effect.
- Keep the manual's voice - short declarative bullets, composer-and-coder split preserved.

## Out of Scope

- `public/CHANGELOG.md` - version entries are written by the release procedure.
- Rewriting sections that already cover MOD, MIDI, TIGHT, undo, or the AY chip.
- Code changes.
