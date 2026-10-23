# Align test naming and the declared convention Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.9/align-test-naming-convention.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`.

## Documentation Updates

Update the named documentation before any source code modifications.

- docs/standard/ts-react-development.md is the file to modify.

If only documentation changes, state it in the plan - several window items are docs-only.

## Step by Step Implementation

**Apply the change**

Amend the test-file naming rule in the standard to camelCase, matching the tree and GUIDELINES.md; no renames needed.

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
