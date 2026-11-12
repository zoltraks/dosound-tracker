# Reconcile the MPL-2.0 license policy Implementation Plan

## Summary

| Field         | Value                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| Intent        | Extend the permitted-license list so the declared policy covers the real set  |
| Key decisions | Permit MPL-2.0 scoped to dev-only build tooling; keep the `lightningcss` path |
| Open risks    | none                                                                          |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/reconcile-mpl-license-policy.md`.

## Best Practices

Documentation-only change. No TypeScript or React code is touched.

## Documentation Updates

- `COPYRIGHTS.md` — extend the Dependency Licensing section with MPL-2.0,
  scoped to dev-only build tooling that never ships inside the application
  bundle.

`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` need no
changes: the change is a license-policy statement, not a behavior.

## Step by Step Implementation

**Permit MPL-2.0 for dev tooling**

`COPYRIGHTS.md` Dependency Licensing currently permits MIT, Apache 2.0, BSD
2-Clause, BSD 3-Clause, ISC, Boost, BlueOak-1.0.0, CC-BY-4.0, CC0-1.0, WTFPL,
MIT-0, and Python-2.0. The lockfile carries 12 MPL-2.0 packages from the
`lightningcss` family, all `dev: true`, pulled in by the Vite rolldown
toolchain (`vite@8.3.7` depends on `lightningcss@^1.33.0`). They build the
bundle and never ship inside it.

Add MPL-2.0 as its own bullet directly after the permitted-license list so
the scope limitation travels with the permission.

File to modify: `docs/COPYRIGHTS.md`.

```markdown
- MPL-2.0 is additionally permitted for dev-only build tooling that never
  ships inside the application bundle (currently the `lightningcss` family
  pulled in by the Vite toolchain). MPL-2.0 code may not be included in
  shipped application code.
```

## Implementation Order

1. Update `COPYRIGHTS.md`
2. Run the verification step

## Testing Strategy

None. The change touches documentation only.

## Verification

- Run `npx prettier --check docs/COPYRIGHTS.md`
- Re-run the lockfile license census and confirm every license class present
  is covered by the declared policy.
