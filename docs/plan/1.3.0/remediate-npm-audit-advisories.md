# Remediate npm audit advisories Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.0/remediate-npm-audit-advisories.md`.

## Best Practices

Follow the dependency management update process from `docs/standard/ts-react-development.md`: update the manifest, reinstall, run the security audit, run the test suite.

## Documentation Updates

Update the named documentation before any source code modifications.

No project documentation requires changes. The audit result is recorded in this plan's verification notes and, where fixes are deferred, in a new change record under a later window per the Deferral rule in `WORKFLOW.md`.

## Step by Step Implementation

**Run npm audit fix**

All five advisories sit in devDependencies: `@vitest/mocker` and its dependents (`vitest`, `@vitest/coverage-v8`, `@vitest/ui`, all at 4.1.10, fixed in 4.1.11+) and `zod` at 4.1.12 (fixed in 4.6.6, transitive via `eslint-plugin-react-hooks` through `zod-validation-error`). The declared ranges (`^4.1.5`) already admit the fixed versions, so `npm audit fix` resolves them without major upgrades.

**Evaluate remaining advisories**

Run `npm audit` again. Any advisory that remains because the fix requires a major upgrade is not forced inside this window - it is recorded as a deferred change record under `docs/change/` for a later window with the reason noted.

## Implementation Order

1. Update documentation
2. Run `npm audit fix`
3. Evaluate remaining advisories and record deferrals
4. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions. The full test suite confirms the upgraded toolchain still passes.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Run `npm audit` and confirm the advisory count
