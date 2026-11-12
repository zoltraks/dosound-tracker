# Decide the Persisted Undo-History Depth Implementation Plan

**Change Request Reference:** `docs/change/1.6.2/decide-persisted-history-depth.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Measured persisted-depth decision plus matching tests and docs   |
| Key decisions | The bound changes only after the size numbers exist and the user |
|               | picks                                                            |
| Open risks    | Measurement depends on representative song shapes - fixtures     |
|               | define "realistic"                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: constants carry
the bound once, in `editHistory.ts`; serialization stays pure and
testable.

## Documentation Updates

- `SPECIFICATION.md` - the persisted-history bullet records the chosen
  bound and its rationale.

## Type and State Updates

**Type definitions**

- None - `EDIT_HISTORY_PERSIST_LIMIT` is a constant, not a type.

**State store modifications**

- None.

## Step by Step Implementation

**Measure realistic serialized sizes**

A measurement script under `work/` serializes representative sessions
(fixture songs driven through a scripted edit sequence) at 20 and 100
entries per stack and reports localStorage payload sizes.

**Present the decision**

Report the size comparison; the user picks the persisted bound - keep
20, raise toward 100, or choose a documented intermediate.

**Apply and document**

Set `EDIT_HISTORY_PERSIST_LIMIT` to the chosen value and update the
`SPECIFICATION.md` limitation with the bound and rationale.

File to modify: `src/utils/song/editHistory.ts`,
`docs/SPECIFICATION.md`.

## Implementation Order

1. Measurement script and size report.
2. User picks the bound.
3. Constant and documentation update.
4. Tests.
5. Verification loop.

## Testing Strategy

**Unit tests**

Update `test/utils/song/editHistory.test.ts`: serialization keeps
exactly the newest N per stack at the chosen bound; a 100-edit session
reload restores the documented surviving set; redo-branch clearing and
coalescing behavior unchanged.

**Integration tests**

Reload-level check through `editHistoryStorage`: persisted then restored
history matches the chosen bound end to end.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- Measurement output and the chosen bound recorded in the record.
