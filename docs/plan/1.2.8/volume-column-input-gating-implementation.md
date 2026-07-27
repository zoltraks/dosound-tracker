# Gate track note entry to the note column implementation plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.8/volume-column-input-gating.md`.

## Best Practices

Follow TypeScript and React engineering standards from `standard/ts-react-development.md`:

- Functional components only with proper TypeScript interfaces.
- Destructure props in the function signature.
- Keep the change minimal and behaviour-scoped to input routing.
- No abbreviations in identifiers.
- No commented-out code and no debug logging left behind.

## Audio-Critical Requirements

This change is an input-routing fix inside a keyboard event handler. It does not touch audio generation.

- Does this change affect React render timing? No. It adds a single conditional inside an existing `useCallback` handler.
- Does this modify `useCallback` or `useMemo` dependencies? No. `currentColumn` is already present in the `handleKeyDown` dependency array. No dependency is added or removed.
- Does this change state management patterns in audio paths? No. No state mirroring, memoization, or effect is altered.
- Does this modify the YM2149 emulator or SoundDriver? No.
- Must audio playback be manually tested after the change? A light preview check is enough. Confirm that pressing a note key in the note column still previews the note, and that pressing a note key in the volume column produces no preview. No sequencer or export path is touched.

No audio-critical linting exceptions are introduced or affected by this change.

## Documentation Updates

Update the active documentation set before source changes.

- `PROJECT.md` — no change. The requirement is a bug fix within existing F-10 keyboard input behaviour.
- `ARCHITECTURE.md` — no change.
- `SPECIFICATION.md` — add one clarifying line to the input-bindings section stating that piano note keys apply only when the note column is focused, and that the volume column accepts only hex nibbles `0` to `F`.
- `FORMAT.md` — no change. No save or export format is affected.

## Type and State Updates

No type definitions or stores change. The `currentColumn` prop already carries the `'note' | 'volume'` value needed to gate input.

## Step by Step Implementation

Perform the steps in the order listed.

**Clarify the input binding in SPECIFICATION.md**

Add a single sentence to the editing or piano-keyboard input section stating that note keys enter notes only when the note column is focused, and that the volume column accepts only hex nibbles `0` to `F`. This documents the intended state before the code is changed.

File to modify: `docs/SPECIFICATION.md`.

**Gate note entry on the note column in handleKeyDown**

The final branch of `handleKeyDown` in `src/components/TrackPanel.tsx` enters and previews a note for any unhandled key regardless of the active column. Guard the note logic so mapped note keys are swallowed in both columns but only entered and previewed when the note column is focused. Non-mapped keys keep their current early return.

File to modify: `src/components/TrackPanel.tsx`.

```typescript
} else {
  const mapped = getKeyboardMappedNote(key, currentOctave, KEYBOARD_TO_NOTE);
  if (!mapped) {
    return;
  }

  event.preventDefault();

  // Note keys are inert in the volume column; only the note column enters notes.
  if (currentColumn !== 'note') {
    return;
  }

  const { note, octave: finalOctave, keyId } = mapped;
  // existing preview and note-insert logic unchanged
}
```

The dependency array of `handleKeyDown` is unchanged because `currentColumn` is already a dependency.

**Confirm handleKeyUp stays consistent**

No code change is expected in `handleKeyUp`. With note entry blocked in the volume column, a note key pressed there is never added to `pressedNoteKeysRef` and never becomes the active preview key, so the key-up cleanup is a no-op. Verify this during testing and leave `handleKeyUp` untouched unless a stuck preview is observed.

File to review: `src/components/TrackPanel.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md`.
2. Implement the `handleKeyDown` guard.
3. Confirm `handleKeyUp` needs no change.
4. Update and add tests.
5. Run the verification loop.

## Testing Strategy

**Component tests**

Update the existing suite in `test/components/TrackPanel.test.tsx`. One current test encodes the bug and must be inverted.

Test file to update: `test/components/TrackPanel.test.tsx`.

```typescript
// Invert the existing test at line 74.
// Rename 'inserts note input even when volume column is active'
// to 'ignores note keys when volume column is active'.
// With currentColumn="volume", press 'z' (maps to note C):
expect(handlePatternChange).not.toHaveBeenCalled();
expect(handleLineChange).not.toHaveBeenCalled();

// Keep 'sets volume nibble when volume column is active' unchanged.
// With currentColumn="volume", press 'a' (hex 0x0A):
expect(updatedPattern.step[0]?.volume).toBe(10);

// Add a test for the hex-letter case that is also a note key.
// With currentColumn="volume", press 'c' (hex 0x0C, and 'C' is a note key):
// it must set volume, not enter a note.
expect(updatedPattern.step[0]?.volume).toBe(12);
expect(updatedPattern.step[0]?.note).toBeFalsy();

// Add a test confirming note entry still works in the note column.
// With currentColumn="note", press 'z':
expect(updatedPattern.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '00' });
expect(handleLineChange).toHaveBeenCalledWith(1);
```

**Integration tests**

No new integration test is required. The component test exercises the full key-routing decision through the rendered handler.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run format`.
- Run `npm run build`.
- Run `npm test test/components/TrackPanel` during iteration, then the full `npm test` at completion.
- Manually verify that note keys enter and preview notes in the note column, and that note keys do nothing in the volume column while hex nibbles still set volume.
