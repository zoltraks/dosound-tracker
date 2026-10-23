# Reconcile the license whitelist with the resolved set Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.9/reconcile-license-whitelist.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`.

## Documentation Updates

Update the named documentation before any source code modifications.

- docs/COPYRIGHTS.md is the file to modify.

If only documentation changes, state it in the plan - several window items are docs-only.

## Step by Step Implementation

**Apply the change**

Extend the permitted-license list in COPYRIGHTS.md to cover the resolved permissive classes and require review for undeclared packages.

## Implementation Order

1. Update documentation
2. Apply the change
3. Run verification loop

## Testing Strategy

Documentation-only changes bypass the verification loop. Code-touching changes run typecheck, lint, build, and test.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
