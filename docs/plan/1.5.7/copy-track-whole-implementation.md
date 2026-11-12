# Make COPY TRACK Always Copy the Whole Track Implementation Plan

## Summary

| Field         | Value                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| Intent        | Implement the whole-track COPY TRACK from `docs/change/1.5.7/copy-track-whole.md` |
| Key decisions | Shared clipboard-write helper parameterized by the source range                   |
| Open risks    | none                                                                              |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.7/copy-track-whole.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Keep functions focused on single responsibility
- No abbreviations in identifiers (use full words)
- Preserve existing conventions and prefer minimal, safe changes

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `SPECIFICATION.md` - record that COPY TRACK always copies the whole track regardless of selection.
- `public/MANUAL.md` - the COPY TRACK bullet names the whole-track scope.

`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` require no changes - the clipboard requirement already shares the COPY TRACK format and introduces no new boundary.

## Step by Step Implementation

**Shared clipboard write helper**

Extract the body of `handleCopyTrack` into a helper that takes the resolved track id and an optional range. The clipboard-availability check, pattern lookup, error reporting, and YAML write move unchanged.

File to modify: `src/hooks/song/useTrackOperations.ts`.

```typescript
const copyTrackToClipboard = useCallback(
  async (trackId: 'A' | 'B' | 'C', range?: { start: number; end: number }) => {
    // existing handleCopyTrack body
  },
  [getCurrentPatternForTrack, song.length, formatNoteKey],
);
```

**Split the copy entry points**

`handleCopyTrack` calls the helper with the active track and no range - the button always writes the whole track. `handleCopyTrackShortcut` resolves the selection's track and normalized range when a selection exists and calls the helper while a track section is active - CTRL+C keeps fragment semantics.

File to modify: `src/hooks/song/useTrackOperations.ts`.

```typescript
const handleCopyTrack = useCallback(async () => {
  await copyTrackToClipboard(getActiveTrackId());
}, [getActiveTrackId, copyTrackToClipboard]);

const handleCopyTrackShortcut = useCallback(() => {
  if (isTrackSectionActive) {
    const range = trackSelection ? normalizeTrackSelection(trackSelection) : undefined;
    const trackId = trackSelection ? trackSelection.trackId : getActiveTrackId();
    void copyTrackToClipboard(trackId, range);
  }
}, [isTrackSectionActive, trackSelection, getActiveTrackId, copyTrackToClipboard]);
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update `useTrackOperations`
3. Add or update tests
4. Run verification loop

## Testing Strategy

**Unit tests**

With a seeded selection, `handleCopyTrack` writes whole-track YAML covering rows outside the range, and `handleCopyTrackShortcut` still writes only the selected fragment.

Test file to update: `test/hooks/song/useTrackOperations.test.tsx`.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the specific feature behaviour and confirm no regressions in consumer modules
