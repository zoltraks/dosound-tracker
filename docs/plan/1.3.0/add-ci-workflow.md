# Add a CI workflow for the documented verification loop Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.0/add-ci-workflow.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`: ESLint and Prettier must run in CI, and every project must be verifiable with a single command path.

## Documentation Updates

Update the named documentation before any source code modifications.

- `TESTING.md` — record the CI pipeline that runs the canonical verification loop on every push.

## Step by Step Implementation

**Create the CI workflow**

Create `.github/workflows/ci.yml`. It runs on every push and on pull requests against `main`: checkout, `actions/setup-node` with Node 22 matching the documented deployment toolchain and npm caching, `npm ci`, then the canonical order from `TESTING.md` - `npm run typecheck`, `npm run lint`, `npx prettier --check .`, `npm run build`, `npm test`. The format step uses `--check` because CI verifies rather than rewrites. A failed step marks the run failed, which blocks the change visibly in the pull request and push status.

## Implementation Order

1. Update documentation
2. Create `.github/workflows/ci.yml`
3. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions. The workflow file is configuration; its correctness is verified by YAML shape and by matching the documented loop commands exactly.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Confirm the workflow file passes Prettier and its steps mirror the `TESTING.md` order
