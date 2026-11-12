# Preserve Rows After a CTRL+V Fragment Paste Implementation Plan

## Summary

| Field         | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Intent        | Implement the CTRL+V tail-preserving paste from `docs/change/1.5.7/paste-tail-preserve.md` |
| Key decisions | `clearTail` flag on `applyClipboardToLines` defaulting to the offset-zero rule             |
| Open risks    | none                                                                                       |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.7/paste-tail-preserve.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Keep functions focused on single responsibility
- No abbreviations in identifiers (use full words)
- Preserve existing conventions and prefer minimal, safe changes

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `SPECIFICATION.md` - record that CTRL+V preserves rows after the fragment while PASTE TRACK clears them.
- `PROJECT.md` - the clipboard requirement names the tail behaviour of both paste paths.
- `public/MANUAL.md` - the paste descriptions name the tail behaviour.

`ARCHITECTURE.md` and `FORMAT.md` require no changes.

## Step by Step Implementation

**Tail flag in the clipboard merge**

`applyClipboardToLines` gains a `clearTail` parameter defaulting to `startOffset === 0`, which reproduces the current behaviour for every existing caller. Under `replace` mode a row past the fragment is cleared only when the flag holds - rows before the fragment are always preserved.

File to modify: `src/utils/track/trackClipboard.ts`.

```typescript
export function applyClipboardToLines(
  existingLines: Step[],
  steps: TrackClipboardStep[],
  mode: TrackPasteMode,
  patternLength: number,
  parseBaseKeyString: (value?: string) => { note: string; octave: number } | null,
  startOffset = 0,
  clearTail = startOffset === 0,
): Step[] {
  // ...
  if (mode === 'replace') {
    if (rawStep && typeof rawStep === 'object') {
      newLines.push(applyClipboardStepToLine(baseLine, rawStep, i));
    } else if (clearTail && i >= startOffset) {
      newLines.push({ ...baseLine, note: null, volume: undefined });
    } else {
      newLines.push({ ...baseLine });
    }
  }
```

**Thread the flag through the paste handler**

`handlePasteTrack` gains an optional `clearTail` parameter forwarded to `applyClipboardToLines`. `handlePasteTrackFromStart` passes `true` - PASTE TRACK stays a whole-track replace. `handlePasteTrackAtCursor` passes `false` - CTRL+V overwrites only the fragment span.

File to modify: `src/hooks/song/useTrackOperations.ts`.

```typescript
const handlePasteTrack = useCallback(
  async (anchorRow?: number, cursorRow?: number, clearTail?: boolean) => {
    // ...applyClipboardToLines(..., startOffset, clearTail)
  },
  [...],
);

const handlePasteTrackAtCursor = useCallback(() => {
  void handlePasteTrack(sharedCurrentLine, undefined, false);
}, [handlePasteTrack, sharedCurrentLine]);

const handlePasteTrackFromStart = useCallback(() => {
  void handlePasteTrack(0, 0, true);
}, [handlePasteTrack]);
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update `applyClipboardToLines`
3. Update `handlePasteTrack` and its wrappers
4. Add or update tests
5. Run verification loop

## Testing Strategy

**Unit tests**

`applyClipboardToLines` under `replace` mode preserves rows after the fragment when `clearTail` is false at offset zero, and still clears them under the default and under an explicit true.

Test file to update: `test/utils/track/trackClipboard.test.ts`.

**Integration tests**

`handlePasteTrackAtCursor` at row zero leaves rows after the pasted fragment untouched; `handlePasteTrackFromStart` still clears them.

Test file to update: `test/hooks/song/useTrackOperations.test.tsx`.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the specific feature behaviour and confirm no regressions in consumer modules
