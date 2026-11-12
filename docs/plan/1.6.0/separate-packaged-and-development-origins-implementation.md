# Separate Packaged and Development Origins Implementation Plan

**Change Request Reference:** `docs/change/1.6.0/separate-packaged-and-development-origins.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Package-aware origin and MIDI permission checks                  |
| Key decisions | One flag threads into `isAppOrigin`; callers pass                |
|               | `app.isPackaged`                                                 |
| Open risks    | `test/electron/` suite shape constrains how the flag is injected |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: pure decision
functions stay pure - `isPackaged` arrives as a parameter, not a global.

## Documentation Updates

- `SPECIFICATION.md` or `DEPLOYMENT.md` - whichever records the Electron
  permission surface states the packaged-only trust rule.

## Type and State Updates

None - CommonJS module signature change only.

## Step by Step Implementation

**Thread the packaged flag into the origin check**

`isAppOrigin(url, isPackaged)` trusts `http://localhost:8008` only when
`isPackaged` is false; the bundled-index `file:` check is unchanged.
`isMidiAllowed(permission, url, isPackaged)` forwards the flag.

File to modify: `electron/permissions.cjs`.

**Pass the real packaged state at the call sites**

Permission handlers, the `will-navigate` guard, and any other caller
pass `app.isPackaged`.

File to modify: `electron/main.cjs`.

## Implementation Order

1. Update documentation.
2. `permissions.cjs` signatures.
3. `main.cjs` call sites.
4. Tests.
5. Verification loop.

## Testing Strategy

**Unit tests**

Update `test/electron/permissions.test.ts`: bundled index allowed in
both modes; localhost allowed unpackaged, denied packaged; foreign
`file:` page denied; `isMidiAllowed` mirrors the same matrix.

**Integration tests**

Manual packaged-build probe mirroring the audit's `E13`:
`isMidiAllowed('midi', 'http://localhost:8008/')` returns false for the
packaged entry point.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- Manual: unpacked packaged app denies the dev origin per the `E13`
  probe shape.
