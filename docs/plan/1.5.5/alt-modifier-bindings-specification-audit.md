# Specification Audit - Move Modifier Chords to Alt

## Document Information

|            |                                                           |
| ---------- | --------------------------------------------------------- |
| Change     | `docs/change/1.5.5/alt-modifier-bindings.md`              |
| Plan       | `docs/plan/1.5.5/alt-modifier-bindings-implementation.md` |
| Audit Date | 2026-11-11                                                |

## Completeness

Every requirement in the change record maps to a plan step:

| Requirement                                                         | Plan step                                                             |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ALT+1/2/3 focus tracks A/B/C                                        | Rebind the shortcut table + matcher alt branch + altKey pass          |
| ALT+5/6/8 playback bindings                                         | Same steps                                                            |
| ALT+ENTER commits the playlist pattern-id input                     | Move the playlist commit chord to Alt                                 |
| CTRL+1/2/3 and CTRL+5/6/8 unbound                                   | Rebind removes every Ctrl+digit entry from the table                  |
| CTRL+SPACE, CTRL+ENTER, CTRL+SHIFT+ENTER unchanged                  | Out of Scope - untouched code and tests                               |
| CTRL+digit deliberate hex entry, consumed                           | EnvelopePanel ctrl+digit path (preventDefault + stopPropagation)      |
| Editing branches require bare keys across all sections              | EnvelopePanel, PlaylistPanel, ToneNoisePanel, InstrumentSection steps |
| Space copy requires bare Space                                      | EnvelopePanel `!event.shiftKey` addition                              |
| No section handler swallows a chord (octave, playlist, piano focus) | HeaderPanel octave guards, PlaylistPanel bare-key gating              |
| Documentation updates (SPECIFICATION, MANUAL)                       | Documentation Updates section                                         |

No requirement lacks a covering step and no step lacks a stated requirement.

## Ambiguity

- "The envelope consumes the chord" resolves to `preventDefault` plus `stopPropagation` - recorded explicitly in the plan step and required so no future Ctrl+digit global binding can double-fire.
- Ctrl+digit inside the Mode or Pitch envelope has no hex entry target - it falls through to the early return and stays inert, matching the record's Volume/Arpeggio/Noise wording.
- Ctrl+Shift+digit: `wantsCtrlDigit` excludes `shiftKey`, so the chord reaches the early return and does nothing. The record states Ctrl+digit only - consistent.
- The PianoKeyboard guard placement is fixed: after the Enter branch (which owns its ctrl/shift combos), before the note-map lookup.

## Implementability

- `digitMatch` already exists in `EnvelopePanel.handleKeyDown` (`event.code.match(/^Digit([0-9])$/)`) - the ctrl+digit path reuses it rather than re-matching.
- `matchKeyboardShortcut` has one production call site (`useKeyboardNavigation`) plus its test file - the added `alt` parameter is safe to add at the end.
- All target files exist and the referenced branches were verified in the current tree: `PlaylistLine.tsx` ctrlKey commit, `PlaylistPanel.tsx` `case ' '`/`case 'ENTER'`, `HeaderPanel.tsx` `handleOctaveKeyDown`/`handleOctaveKeyUp` stopPropagation sites, `PianoKeyboard.tsx` unguarded note map, `ToneNoisePanel.tsx` space cycle, `InstrumentSection.tsx` `case 'ENTER'`.
- The `useKeyboardNavigation` matcher call passes `event.altKey` - no signature collision, `ctrl` already folds `event.metaKey`.

## Fidelity

- Enumeration fidelity: every binding named in the record (1, 2, 3, 5, 6, 8, ENTER) has a matcher entry or an explicit unbound outcome; every leaking section in the record's audit list (envelopes, playlist, octave, piano, mode, instrument list) has a guard step.
- Vocabulary freeze: `ALT+1/2/3/5/6/8` keys appear identically in `KEYBOARD_SHORTCUTS` and the matcher switch.
- Cross-party parity: the window-level matcher and the component-level guards agree - Alt chords dispatch globally, Ctrl chords reach no section edit, bare keys keep all existing editing behavior.
- Constants completeness: the six digit bindings and their `preventDefault` flags are enumerated; no new constants are introduced.
- Boundary decisions: Ctrl+Enter-family playback and the piano toggle stay on Ctrl (record decision), so the PianoKeyboard guard must sit after its Enter branch - recorded above under Ambiguity.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
