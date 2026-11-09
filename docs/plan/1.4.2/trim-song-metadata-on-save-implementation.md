# Trim Song Metadata Values on Save Implementation Plan

## Summary

| Field         | Value                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Intent        | Persist the trimmed song title and author values the saver already computes                                        |
| Key decisions | write `trimmedTitle` and `trimmedAuthor`, matching the `trimmedName` pattern used for instrument and pattern names |
| Open risks    | none                                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.2/trim-song-metadata-on-save.md`.

## Best Practices

Follow TypeScript engineering standards from `docs/standard/typescript-general-development.md`:

- Keep the established local style of `buildSongYamlForExport` - pre-computed trimmed values written into a `Record<string, unknown>` node before `yaml.dump`.
- Preserve the `trimmedName` precedent already used for instrument names and pattern names in the same function.
- No abbreviations in identifiers beyond the existing file convention.
- No `any` types and no new unchecked assertions.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `FORMAT.md` — extend the saver rules under `SAVE SONG` so they record that `title` and `author` are written only when non-empty after trimming and are stored trimmed.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md` — no changes required - the change aligns emitted output with the values the format intends.

## Type and State Updates

None. The `Song` interface and all stores are unchanged - the fix only alters which already-computed value is written.

## Step by Step Implementation

**Write the trimmed title**

`buildSongYamlForExport` computes `trimmedTitle` for the non-empty guard but writes the untrimmed `currentSong.title`. Write the trimmed value so the guard and the stored value agree.

File to modify: `src/utils/song/songIO.ts`.

```typescript
const trimmedTitle = (currentSong.title || '').trim();
if (trimmedTitle) {
  songNode.title = trimmedTitle;
}
```

**Write the trimmed author**

Same pattern for `trimmedAuthor`.

File to modify: `src/utils/song/songIO.ts`.

```typescript
const trimmedAuthor = (currentSong.author || '').trim();
if (trimmedAuthor) {
  songNode.author = trimmedAuthor;
}
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `FORMAT.md` saver rules.
2. Apply both assignment changes in `src/utils/song/songIO.ts`.
3. Add the whitespace-padding test case.
4. Run verification loop.

## Testing Strategy

**Unit tests**

Extend the existing characterization surface in the same describe block that holds the blank-metadata case. A padded title must round-trip trimmed - a padded author must be asserted on the raw YAML text because a `yaml.load` round-trip strips plain-scalar padding and would mask the defect.

Test file to update: `test/utils/song/songIO.test.ts`.

```typescript
it('trims padded title and author on save', () => {
  try {
    const s = song({ title: '  Padded  ', author: '  Writer  ' });
    const text = buildSongYamlForExport(s);
    const doc = yaml.load(text) as { song: Record<string, unknown> };
    expect(doc.song.title).toBe('Padded');
    expect(text).toContain('author: Writer');
  } catch (error) {
    console.log('metadata trim mismatch');
    throw error;
  }
});
```

**Integration tests**

None required - the saver is a pure function covered at unit level - the save flow already exercises it end to end.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test test/utils/song/songIO.test.ts` targeted, then the full `npm test`
- Confirm a padded title no longer emits surrounding whitespace in saved YAML
