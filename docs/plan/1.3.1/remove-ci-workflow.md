# Remove the CI Workflow Implementation Plan

## Change Request Reference

Direct user instruction, not a change record: remove `.github/` and the CI workflow added in the 1.3.0 window, and record the decline so future audits do not re-propose it.

## Documentation Updates

Update the named documentation before any source code modifications.

- `TESTING.md` — remove the Continuous Integration section.
- `GUIDELINES.md` — drop "CI" from the `TESTING.md` purpose cell and the Testing section, and record the decline in Recorded conventions.
- `README.md` — align the `TESTING.md` purpose cell.

## Step by Step Implementation

**Remove the workflow**

Delete `.github/workflows/ci.yml` and the now-empty `.github/` directory.

**Record the decline**

Add a recorded convention in `GUIDELINES.md` mirroring the community-files precedent: the CI pipeline was evaluated and declined, the verification loop is enforced locally, and no `.github/workflows/` is planned.

## Implementation Order

1. Update documentation
2. Remove `.github/`
3. Run verification loop

## Testing Strategy

Documentation-only change beside deleting a CI config file - the verification loop is bypassed per the documentation-only rule; Prettier check covers the edited documents.

## Verification

- `npx prettier --check` on the edited documents
- Confirm no remaining references to `.github` or CI in the active documentation set
