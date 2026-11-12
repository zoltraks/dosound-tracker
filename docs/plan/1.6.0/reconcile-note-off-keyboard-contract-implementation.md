# Reconcile the Note-Off Keyboard Contract Implementation Plan

**Change Request Reference:** `docs/change/1.6.0/reconcile-note-off-keyboard-contract.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | One canonical note-off binding across code, tests, and documents |
| Key decisions | Shift+Space is canonical - `F-10` corrects, no code moves        |
| Open risks    | none - the piano-focus binding is untouched                      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: navigation map
entries stay declarative; handler behavior lives in the component
handlers the map routes to.

## Documentation Updates

- `PROJECT.md` - `F-10` names the canonical binding (documentation-first).
- `SPECIFICATION.md` and `public/MANUAL.md` - same binding in the same
  change set.

## Type and State Updates

None.

## Step by Step Implementation

**Resolve the canonical binding**

Present the two options: keep tested Shift+Space note-off and correct
`F-10` (implementation, tests, spec, and manual already agree), or
implement Ctrl+Space note-off and redesign the focus shortcut. The user
picks; the plan's remaining steps apply that pick.

**Update the requirement and documents first**

`F-10`, the specification binding table, and `MANUAL.md` all state the
chosen binding before code moves.

Files to modify: `docs/PROJECT.md`, `docs/SPECIFICATION.md`,
`public/MANUAL.md`.

**Align the code if the binding changes**

Only on the Ctrl+Space pick: remap `CTRL+SPACE`/`SHIFT+SPACE` in
`src/constants/navigation.ts`, adjust the `TrackPanel` handler, and
assign the displaced focus action a deliberate replacement - never an
accidental free key.

Files to modify: `src/constants/navigation.ts`,
`src/components/tracker/TrackPanel.tsx`.

## Implementation Order

1. User picks the canonical binding.
2. Documentation updates.
3. Code changes if required.
4. Tests.
5. Verification loop.

## Testing Strategy

**Unit tests**

Update `test/hooks/keyboard/useKeyboardNavigation.test.tsx` so the map
asserts the canonical binding; extend `TrackPanel` key handling coverage
for the chosen note-off and modifier precedence.

**Integration tests**

Browser check: real track input, editable targets, modifier precedence -
Shift+Space versus Ctrl+Space behave exactly as documented.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- `npm run test:e2e` passes on Chromium and WebKit.

## Refinements

- The Shift+Space pick resolves the record to a documentation-only fix -
  `F-10` in `PROJECT.md` was the lone outlier; `SPECIFICATION.md`,
  `MANUAL.md`, the navigation map, and the keyboard tests already
  described the canonical binding, so no code or test edits were needed.
- Documentation-only change - the verification loop is bypassed per
  `TESTING.md`.
