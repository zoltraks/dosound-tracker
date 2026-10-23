# Adopt the @/ alias or remove it from configuration Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.9/resolve-unused-path-alias.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`.

## Documentation Updates

Update the named documentation before any source code modifications.

- tsconfig.app.json, vitest.config.ts, docs/standard/ts-react-development.md is the file to modify.

If only documentation changes, state it in the plan - several window items are docs-only.

## Step by Step Implementation

**Apply the change**

Remove the unused @/ alias from tsconfig.app.json and vitest.config.ts and amend the standard to state relative imports as the convention.

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
