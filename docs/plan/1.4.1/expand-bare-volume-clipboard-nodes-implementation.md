# Expand Bare Volume Nodes on Clipboard Import Implementation Plan

## Summary

| Field         | Value                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Intent        | Make clipboard YAML round-trip idempotent for volume-only lines                                     |
| Key decisions | a bare `{volume: N}` node expands to a wait row carrying the volume inside `expandRunNodes`         |
| Open risks    | the expansion helper is shared with the song loader - verified equivalent downstream before editing |

## Change Request Reference

`change/1.4.1/expand-bare-volume-clipboard-nodes.md`

## Best Practices

- `FORMAT.md` is updated before the code changes, per the format-specification-first rule: the loader gains a documented expansion rule.
- `src/utils/yaml/runLength.ts` semantics per `standard/typescript-general-development.md`: the new branch reuses the existing `makeWait` factory and the bounded-capacity loop.
- Behaviour parity is verified downstream of both `expandRunNodes` callers before the edit, not assumed.

## Documentation Updates

`FORMAT.md` gains the bare-volume expansion rule in both loader blocks: the `SAVE SONG` step loader and the `COPY TRACK` import block. The saver sections need no change - emitted shapes are unchanged.

## Type and State Updates

**Type definitions**

None - `RunLengthNode` already carries `volume?: number`.

**State store modifications**

None.

## Step by Step Implementation

**Document the expansion rule in FORMAT.md**

The `SAVE SONG` loader block lists the run expansion at "Loader behaviour" and the `COPY TRACK` import block mirrors it. Add one bullet to each: a bare `volume`-only node (`{volume: V}` with no `wait`, `space`, `off`, or `note` sibling) expands like `wait: 1` carrying the volume - one empty row that keeps the volume nibble.

File to modify: `docs/FORMAT.md`.

**Expand the bare volume node in runLength.ts**

`expandRunNodes` currently passes a bare `{volume: N}` through unchanged, so `parseClipboardData` yields a different node shape than the documented `wait: 1` equivalent and the serialized form is not idempotent. Add a branch before the fall-through push: a node whose only key is `volume` expands once through `makeWait`, matching the `wait: 1` path.

File to modify: `src/utils/yaml/runLength.ts`.

```typescript
if (hasVolume && keys.length === 1) {
  expanded.push(makeWait(ln.volume));
  continue;
}
```

Both callers produce equivalent results downstream - `songParser` applies `parseVolumeNibble` to either shape and `applyClipboardToLines` tolerates both - so the change is node-form normalization, not a behaviour change.

**Extend the characterization tests**

`test/utils/track/trackClipboard.test.ts` documents both shapes - the two pass-through assertions that expect `{volume: N}` now expect the expanded `{wait: true, volume: N}` form, and the bare-node test gains a round-trip idempotence assertion.

File to modify: `test/utils/track/trackClipboard.test.ts`.

```typescript
const round = parseClipboardData(yaml);
expect(round[0]).toEqual({ wait: true, volume: 5 });
```

## Implementation Order

1. `FORMAT.md` loader rules.
2. `runLength.ts` branch.
3. `trackClipboard.test.ts` expectation updates and idempotence assertion.
4. Verification loop.

## Testing Strategy

**Unit tests**

Targeted run of the clipboard characterization suite plus the song-parser suite that shares the helper.

```bash
npm test -- test/utils/track/trackClipboard.test.ts test/utils/song/songParser.test.ts test/utils/song/songIO.test.ts
```

**Integration tests**

None - the paste flow tolerates both shapes already - the hook-level tests prove it.

## Verification

- `npm run typecheck` - `tsc -b` across the project graph.
- `npm run lint` - zero errors, zero warnings.
- `npm run format` - applied to the tree.
- `npm run build` - `tsc -b && vite build` clean.
- `npm test` - the full suite green - copy/paste round-trip is node-idempotent.
