# Resync Format and State Documentation Implementation Plan

**Change Request Reference:** `docs/change/1.6.2/resync-format-and-state-documentation.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Settings example and state-domain prose match the implementation |
| Key decisions | Documentation-only - the emitted format is the authority         |
| Open risks    | none                                                             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: none applicable -
a documentation-only change. `STYLE.md` governs the edits.

## Documentation Updates

- `FORMAT.md` - the settings YAML example gains `contrast` as a theme
  value and `general.textScale`.
- `SPECIFICATION.md` - the "single store" limitation describes the three
  state domains `ARCHITECTURE.md` records.

## Type and State Updates

None.

## Step by Step Implementation

**Correct the settings contract**

Update the root-structure example and any member list that omits
`textScale` or the `contrast` theme; check the result against
`test/fixtures/emission/settings-nondefault.yaml` and
`src/utils/settings/settingsYaml.ts` so the documented contract is what
the saver emits.

File to modify: `docs/FORMAT.md`.

**Correct the state limitation**

Rewrite the "single store" bullet to describe the domain split the
architecture document defines - hook-owned domains plus the Zustand UI
store.

File to modify: `docs/SPECIFICATION.md`.

## Implementation Order

1. `FORMAT.md` settings contract.
2. `SPECIFICATION.md` limitation rewrite.
3. Document format check.

## Testing Strategy

**Unit tests**

None - documentation only, the verification loop is bypassed per
`TESTING.md`.

**Integration tests**

Manual cross-check: the documented example parses under
`parseSettingsFromYaml` semantics - confirmed against the existing
golden fixture rather than a new suite.

## Verification

- `prettier --check` clean on both edited documents.
- Examples verified against the emission fixture and saver source.
