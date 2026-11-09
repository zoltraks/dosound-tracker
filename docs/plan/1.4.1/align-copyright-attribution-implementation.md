# Align Copyright Attribution Fields Implementation Plan

## Summary

| Field         | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| Intent        | Remove attribution ambiguity in distributed binaries         |
| Key decisions | `build.copyright` carries the `LICENSE` notice text verbatim |
| Open risks    | `none`                                                       |

## Change Request Reference

`change/1.4.1/align-copyright-attribution.md`

## Best Practices

- `COPYRIGHTS.md` owns attribution rules; the aligned field uses the `LICENSE` notice text verbatim so the two surfaces can never drift in entity or year independently.
- The packaging metadata domain is covered by `standard/typescript-electron-development.md`; a manifest-only change needs no Electron code edit.

## Documentation Updates

`COPYRIGHTS.md` gains one line recording that the electron-builder `build.copyright` field mirrors the `LICENSE` notice - the convention was undocumented, which is how the drift occurred.

## Type and State Updates

**Type definitions**

None.

**State store modifications**

None.

## Step by Step Implementation

**Record the mirroring convention**

`COPYRIGHTS.md` describes license policy and third-party attribution but never states what `build.copyright` must say. Add a line under the license statement: the electron-builder `build.copyright` field in `package.json` mirrors the copyright notice in `LICENSE` verbatim.

File to modify: `docs/COPYRIGHTS.md`.

**Align the packaging field**

`package.json` `build.copyright` reads `Copyright © 2024 Filip Golewski` while `LICENSE` reads `Copyright (c) 2025 Zoltar X / New Generation` - both name the same natural person, but distributed artifacts carry ambiguous attribution. Write the `LICENSE` notice verbatim.

File to modify: `package.json`.

```json
    "copyright": "Copyright (c) 2025 Zoltar X / New Generation",
```

Out of scope per the record: `author.name`, `signtoolOptions.publisherName`, per-file headers, and the `LICENSE` text itself stay untouched. The vendored `zx0.ts` BSD-3-Clause notice stays untouched.

**Verify the field diff**

The record's verification hint: a field diff between `LICENSE` and `build.copyright`. Confirm both strings match, then run the loop - a packaging manifest change also earns an `electron-builder --dir` run to prove the builder still parses the `build` block.

## Implementation Order

1. `COPYRIGHTS.md` convention line.
2. `package.json` field edit.
3. Verification loop plus the packaging parse check.

## Testing Strategy

**Unit tests**

`npm test` - no behavioural change, the suite confirms nothing broke.

**Integration tests**

None.

## Verification

- `npm run typecheck` - `tsc -b` across the project graph.
- `npm run lint` - zero errors, zero warnings.
- `npm run format` - applied to the tree.
- `npm run build` - `tsc -b && vite build` clean.
- `npm test` - the full suite green.
- `npx electron-builder --dir` - the packaging config including `build.copyright` parses; the unpacked bundle builds.
