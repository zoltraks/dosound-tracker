# Adopt a per-change AI-disclosure convention Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.9/adopt-ai-disclosure-convention.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`.

## Documentation Updates

Update the named documentation before any source code modifications.

- docs/WORKFLOW.md is the file to modify.

If only documentation changes, state it in the plan - several window items are docs-only.

## Step by Step Implementation

**Apply the change**

Update WORKFLOW.md to define the disclosure convention for AI-assisted authorship; documentation-only, no code change.

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
