# Persist Pattern Name Implementation Plan

## Summary

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Intent        | write `Pattern.name` into the saved YAML so custom names survive a round-trip        |
| Key decisions | `name` is emitted only when it differs from the generated `Pattern <number>` default |
| Open risks    | `none`                                                                               |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.8/persist-pattern-name.md`.

## Best Practices

Follow TypeScript engineering standards from `docs/standard/typescript-general-development.md`:

- Strict typing, no `any`.
- Minimal, safe change matching the existing saver style.
- Unit tests for the changed utility.

## Documentation Updates

`FORMAT.md` - the pattern-node section gains a saver note: `name` is written when it differs from the generated `Pattern <number>` default.

No other documentation file changes - `PROJECT.md`, `ARCHITECTURE.md`, and `SPECIFICATION.md` are unaffected.

## Step by Step Implementation

**Emit `name` on the pattern node**

`buildSongYamlForExport` builds `patternNode` with `number` and `step` only. Add `name` when the pattern's trimmed name is non-empty and differs from `Pattern <number>` where `<number>` is the emitted pattern number - the same default the parser and the three creation sites generate.

File to modify: `src/utils/song/songIO.ts`.

```typescript
const defaultName = `Pattern ${number}`;
const trimmedName = typeof pattern.name === 'string' ? pattern.name.trim() : '';
if (trimmedName && trimmedName !== defaultName) {
  patternNode.name = trimmedName;
}
```

**Extend the round-trip tests**

Add cases to the existing `buildSongYamlForExport` suite: a custom name is written, a default name is not, and a saved-and-reloaded pattern keeps its custom name.

File to modify: `test/utils/song/songIO.test.ts`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `FORMAT.md`.
2. Emit `name` on the pattern node in `songIO.ts`.
3. Extend `songIO.test.ts`.
4. Run the targeted verification loop.

## Testing Strategy

**Unit tests**

Test file to update: `test/utils/song/songIO.test.ts`.

- Pattern named `Verse` (number `00`) emits `name: Verse`.
- Pattern named `Pattern 00` (number `00`) emits no `name` key.
- Saved YAML reparsed through `parseSongFromYaml` returns the custom name.

## Verification

Run the targeted verification loop. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test -- test/utils/song/songIO.test.ts`
