# Move Modifier Chords to Alt and Keep Section Editing off Global Chords Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Rebind the modifier-bearing global shortcuts from Ctrl to Alt, keep Ctrl+digit as deliberate envelope hex entry, and enforce bare-key discipline so section handlers neither mutate nor swallow |
| Key decisions | The matcher gains a strict `alt && !ctrl && !shift` branch; the EnvelopePanel ctrl+digit path runs before the generic modifier guard and consumes the chord; octave swallows drop entirely      |
| Open risks    | AltGr on Windows emits ctrl+alt - the strict guard keeps it inert; the in-flight `manual-refresh` record touches the same MANUAL lines and reconciles at its verification                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.5/alt-modifier-bindings.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)
- Mirror the existing guard shape - `src/components/TrackPanel.tsx` already returns early on `ctrlKey || metaKey || altKey` before note entry, and every new guard follows that pattern rather than inventing a second convention

## Audio-Critical Requirements

This change touches key handling only - no audio-path code changes.

- No React render timing, `useCallback`/`useMemo` dependency, or state-management changes are introduced. The guards only skip work for events the handler never owned.
- The YM2149 emulator, SoundDriver, sequencer worklet, and playback handlers are untouched.
- Note previews and playback keep identical semantics on bare keys - the audible surface does not change. Manual spot check after implementation: bare keys still preview and Alt+5/6/8 still drive playback.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `SPECIFICATION.md` — the navigation shortcut list switches CTRL+1/2/3 to ALT+1/2/3 and CTRL+5/6/8 to ALT+5/6/8, the playlist commit chord is recorded as ALT+ENTER, and the editing section records Ctrl+digit envelope entry plus the bare-key rule for section handlers.
- `public/MANUAL.md` — the Keyboard Navigation list carries the Alt bindings, the envelope table gains a Ctrl+digit row, and the playlist editing description names ALT+ENTER. The `manual-refresh` record covers the same lines - the final text is reconciled at that record's verification.
- `PROJECT.md` — no changes: F-10 names no per-section focus bindings.
- `ARCHITECTURE.md` — no changes: module boundaries and state domains are untouched.
- `FORMAT.md` — no changes: no file format is affected.

## Type and State Updates

**Type definitions**

No new types. `KeyboardShortcut` derives from `KEYBOARD_SHORTCUTS` keys, so the union changes automatically with the constant. `matchKeyboardShortcut` gains an `alt: boolean` parameter.

**State store modifications**

None. No store or persisted state changes.

## Step by Step Implementation

**Rebind the shortcut table**

Replace the Ctrl entries with Alt entries so no Ctrl+digit remains globally bound.

File to modify: `src/constants/navigation.ts`.

```typescript
'ALT+1': 'focusTrackA',
'ALT+2': 'focusTrackB',
'ALT+3': 'focusTrackC',
'ALT+5': 'playLineFromStart',
'ALT+6': 'playLine',
'ALT+8': 'stopPlayback',
```

**Extend the matcher with an Alt branch**

Add an `alt` parameter and a guarded alt branch placed before the ctrl and shift checks. The strict condition keeps AltGr (ctrl+alt) chords inert.

File to modify: `src/utils/keyboard/keyboardShortcutUtils.ts`.

```typescript
if (alt && !ctrl && !shift) {
  switch (keyUpper) {
    case '1':
      return { shortcut: 'ALT+1', preventDefault: true };
    case '2':
      return { shortcut: 'ALT+2', preventDefault: true };
    case '3':
      return { shortcut: 'ALT+3', preventDefault: true };
    case '5':
      return { shortcut: 'ALT+5', preventDefault: true };
    case '6':
      return { shortcut: 'ALT+6', preventDefault: true };
    case '8':
      return { shortcut: 'ALT+8', preventDefault: true };
  }
  return null;
}
```

**Pass altKey to the matcher**

Read `event.altKey` and forward it as the fourth argument.

File to modify: `src/hooks/keyboard/useKeyboardNavigation.ts`.

```typescript
const alt = event.altKey;
const match = matchKeyboardShortcut(key, ctrl, shift, alt);
```

**Move the playlist commit chord to Alt**

The pattern-id input commits on Alt+Enter instead of Ctrl+Enter.

File to modify: `src/components/PlaylistLine.tsx`.

```typescript
if (event.key === 'Enter' && event.altKey) {
```

**Guard the envelope editing keys and add Ctrl+digit entry**

After the existing `ctrlKey && shiftKey` block, run the deliberate ctrl+digit hex path first (it consumes the chord), then return early on any remaining ctrl/meta/alt event. The Space copy additionally requires a bare key, which also excludes Shift+Space.

File to modify: `src/components/EnvelopePanel.tsx`.

```typescript
const digitKey = digitMatch ? digitMatch[1] : null;
const wantsCtrlDigit =
  event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && digitKey !== null;
if (wantsCtrlDigit && (type === 'volume' || type === 'shift' || type === 'noise')) {
  event.preventDefault();
  event.stopPropagation();
  // parse and write digitKey as a hex value, then advance
}

if (event.ctrlKey || event.metaKey || event.altKey) {
  return;
}
// existing branches; the space-copy condition gains && !event.shiftKey
```

**Require bare keys in the playlist panel**

`case ' '` and `case 'ENTER'` fire only when no modifier is held, so Ctrl+Space toggles the piano without mounting the autoFocus input.

File to modify: `src/components/PlaylistPanel.tsx`.

```typescript
const bare = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
// ' ' and 'ENTER' cases gated on bare
```

**Stop the octave selection from swallowing chords**

Return early on any ctrl/meta/alt event in `handleOctaveKeyDown` and `handleOctaveKeyUp`, so the global handler always sees the chord and no preview fires.

File to modify: `src/components/HeaderPanel.tsx`.

```typescript
if (event.ctrlKey || event.metaKey || event.altKey) {
  return;
}
```

**Guard the piano note map**

Skip the note-map lookup when modifiers are held, so global chords never preview notes in the piano section. The guard sits after the Enter branch (which owns its own ctrl/shift combos) and before the note-map lookup.

File to modify: `src/components/PianoKeyboard.tsx`.

```typescript
if (event.ctrlKey || event.metaKey || event.altKey) {
  return;
}
```

**Guard the mode cycle and the instrument rename Enter**

The Tone/Noise space cycle and the instrument list `case 'ENTER'` require bare keys.

Files to modify: `src/components/ToneNoisePanel.tsx`, `src/components/InstrumentSection.tsx`.

```typescript
// key === ' ' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey
// case 'ENTER' gated on the same bare condition
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation (`SPECIFICATION.md`, `public/MANUAL.md`)
2. Rebind `KEYBOARD_SHORTCUTS`, extend `matchKeyboardShortcut`, pass `altKey`
3. Move the playlist input commit chord
4. Guard `EnvelopePanel` and add the Ctrl+digit entry path
5. Guard `PlaylistPanel`, `HeaderPanel` octave keys, `PianoKeyboard`, `ToneNoisePanel`, `InstrumentSection`
6. Add or update tests
7. Run verification loop

## Testing Strategy

**Unit tests**

Update the matcher tests for the new signature and binding set: Alt+1/2/3/5/6/8 match with `preventDefault`, Ctrl+1/2/3/5/6/8 return null, alt+ctrl and alt+shift chords return null.

Test file to update: `test/utils/keyboard/keyboardShortcutUtils.test.ts`.

```typescript
expect(matchKeyboardShortcut('1', false, false, true)).toEqual({
  shortcut: 'ALT+1',
  preventDefault: true,
});
expect(matchKeyboardShortcut('1', true, false, false)).toBeNull();
expect(matchKeyboardShortcut('5', true, false, true)).toBeNull();
```

**Integration tests**

Update the navigation hook tests: Alt+1/2/3 focus the tracks, Cmd+digit no longer focuses, Alt+5/6/8 dispatch the playback actions.

Test file to update: `test/hooks/keyboard/useKeyboardNavigation.test.tsx`.

Component-level coverage for the leak fixes:

- `test/components/` EnvelopePanel suite: Ctrl+digit enters a value and advances; Ctrl+letter and Ctrl+Space leave data untouched; bare Space still copies the last position.
- Playlist suite: Ctrl+Space does not start pattern editing; Alt+Enter commits the pattern id inside the input.
- PianoKeyboard: Ctrl+letter does not preview.
- HeaderPanel octave: Ctrl+Space reaches the global handler - no `preventDefault`, no preview.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify: Alt+1/2/3 focus tracks, Alt+5/6/8 drive playback, Ctrl+Space toggles the piano from every section including playlist and octave with the piano keys immediately playable, Ctrl+digit enters envelope values, and no chord edits envelope or playlist data
- For audio-related changes, manually verify playback timing and audio stability
