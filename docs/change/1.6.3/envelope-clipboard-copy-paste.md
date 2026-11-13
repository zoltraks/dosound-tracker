# Add envelope copy and paste to the clipboard

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | CTRL+C copies the active envelope section's data; CTRL+V pastes it into the same envelope type                                             |
| Key decisions | System clipboard carries the instrument-file YAML dialect - `volume:`/`shift:`/`pitch:`/`noise:`/`mode:` lists, plus `sustain:` for volume |
| Open risks    | Track clipboard already uses CTRL+C/V - dispatch must keep track and envelope operations mutually exclusive on the active section          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The envelope panels (mode, volume, arpeggio, pitch, noise) become clipboard
sources and targets. With an envelope section active, CTRL+C writes the
current instrument's envelope for that section to the system clipboard, and
CTRL+V reads it back - so an envelope built on one instrument can be pasted
onto the same envelope type of another instrument after switching instruments
with CTRL+MINUS/PLUS or the instrument list.

The clipboard text uses the same field names and array shape as the
instrument YAML files, so a copied envelope also pastes correctly from a
hand-edited instrument snippet. Volume copies include the sustain index;
pasting a volume envelope that carries one applies it to the destination
instrument.

The existing CTRL+C/X/V bindings route through `useKeyboardNavigation` to
handlers registered by `useKeyboardShortcuts`; today they only act when a
track section is active. Envelope sections dispatch to new copy/paste
handlers instead - the active section makes the two operations mutually
exclusive.

Clipboard failures (API unavailable, unreadable text, or an envelope of a
different type) report through the existing clipboard-error modal, retitled
from "Track Clipboard Error" to "Clipboard Error" since it now serves both
domains.

## Use Cases

- When the user focuses the volume envelope and presses CTRL+C, the
  instrument's volume envelope and sustain point are written to the system
  clipboard.
- When the user selects another instrument and presses CTRL+V with the
  volume envelope active, the clipboard's volume envelope (and its sustain
  point when present) replaces the instrument's volume data; undo restores
  the previous state.
- When the clipboard holds a pitch envelope but the volume section is active,
  CTRL+V reports a type-mismatch error and changes nothing.
- When a track section is active, CTRL+C/V behave exactly as before.

## Hints

- `EnvelopePanelType` values are the literal `Instrument` field names
  (`volume`, `shift`, `pitch`, `noise`, `mode`), so the active section name
  selects the instrument field directly.
- `clampEnvelopeValue` bounds pasted values per type; `expandEnvelope`
  extends short lists to 32 steps by repeating the last value, matching
  instrument-file semantics.
- `updateInstrument` records edit history, so pastes are undoable.
- `getClipboardApiOrReport` wraps `navigator.clipboard` availability with
  error reporting, shared with the track clipboard.

## Out of Scope

- No cut operation for envelopes - CTRL+X stays track-only.
- No cross-type paste - the destination must be the same envelope type.
- No changes to the track clipboard format or behavior.
- No paste-mode prompt - envelope paste is a straight replace.
