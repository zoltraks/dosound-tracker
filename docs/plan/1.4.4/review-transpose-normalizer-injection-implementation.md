# Review the Transpose Normalizer Injection Implementation Plan

## Summary

| Field         | Value                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Intent        | Resolve whether `TransposeOptions.normalizeInstrumentId` stays an injected dependency                          |
| Key decisions | Remove the injection and route through the canonical function - the seam is unused and stubs a looser contract |
| Open risks    | none - no test assertion depends on the stub's divergent behavior                                              |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/review-transpose-normalizer-injection.md`.

## Analysis

`TransposeOptions.normalizeInstrumentId` is a required option with no default, and the only production call site - `useTransposeDialog` - always injects the canonical `normalizeInstrumentId` from `instrumentSelection.ts`. The injection is a test-only seam.

The seam is worse than unused: the test stub `(value) => String(value ?? '00').toUpperCase()` diverges from the canonical contract on `$` stripping, hex padding, and nullish input. Under the stub, a note carrying instrument `'5'` never matches selected id `'05'`; under the real contract it does. Any future assertion written against the stub's behavior would silently mis-specify production.

The 1.4.3 alignment already removed the same injection from `instrumentOperations.ts` - removing it here continues that direction. `transposeUtils.ts` imports the canonical function under the same name, so the two call sites in `performTranspose` need no rewriting. No existing test assertion depends on the stub's divergent cases, so the suite keeps passing while now exercising the real contract.

`useTransposeDialog` still needs its own `normalizeInstrumentId` import for the `selectedInstrumentId` option value; only the injected property leaves the options literal.

## Documentation Updates

None of `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` requires changes: this removes an internal injection seam and does not alter any documented contract. The keep-or-align decision resolves to align, recorded here and in the window review.

## Step by Step Implementation

**Route through the canonical contract**

Import `normalizeInstrumentId` from `../instrument/instrumentSelection.ts` in `transposeUtils.ts`, remove the field from `TransposeOptions`, and drop it from the options destructure - the two call sites bind the import under the same name unchanged.

File to modify: `src/utils/transpose/transposeUtils.ts`.

**Drop the injected property**

Remove `normalizeInstrumentId` from the `applyTranspose` options literal in `useTransposeDialog.ts`; the module import stays for the `selectedInstrumentId` normalization.

File to modify: `src/hooks/modal/useTransposeDialog.ts`.

**Drop the stub**

Remove the `normalizeInstrumentId` stub from the `options()` helper in the transpose suite so tests exercise the canonical contract.

File to modify: `test/utils/transpose/transposeUtils.test.ts`.

## Implementation Order

1. Update documentation (none required - recorded above)
2. Route `transposeUtils.ts` through the canonical import
3. Remove the option at the call site
4. Remove the test stub
5. Run verification loop

## Testing Strategy

**Unit tests**

`test/utils/transpose/transposeUtils.test.ts` is the coverage - the selected-instrument filter case now exercises `normalizeInstrumentId` itself, which is the fidelity the record asks the review to secure.

**Integration tests**

No new integration coverage needed - the modal wiring is unchanged apart from the dropped property.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Confirm the transpose suite passes against the canonical contract
