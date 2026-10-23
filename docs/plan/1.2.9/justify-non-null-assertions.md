# Add REASON comments or remove non-null assertions Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.9/justify-non-null-assertions.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`.

## Documentation Updates

Update the named documentation before any source code modifications.

- src/main.tsx, src/utils/zx0.ts is the file to modify.

If only documentation changes, state it in the plan - several window items are docs-only.

## Step by Step Implementation

**Apply the change**

Add REASON comments at src/main.tsx:5, src/utils/zx0.ts:124, src/utils/zx0.ts:184.

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
