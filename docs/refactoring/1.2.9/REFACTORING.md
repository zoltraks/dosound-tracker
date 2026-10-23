# Window 1.2.9 Refactoring Proposal

## Scope

Version window 1.2.9 delivers eleven change records: eight documentation-only items and three
small code-touching items. One real refactoring target exists.

## Analysis

- `src/App.tsx` decomposition is scheduled for window 1.3.3 and is out of scope here.
- Comment-level fixes in `src/` need no restructuring.
- `test/utils/exportMaxChunks.test.ts`, revived by the dead-test record, is a stale duplicate of
  `exportMax.test.ts`: all eleven surviving case names exist in the sibling with newer
  assertions, and the sibling carries three additional cases. Keeping both runs the same suite
  twice.

## Proposed Work

**Retire the superseded test duplicate**

Merge the revived file into the canonical suite by deleting `exportMaxChunks.test.ts`; every
unique assertion it carried is either duplicated or superseded by `exportMax.test.ts`. This is
the `merge` option of the dead-test change record, applied at the file level.

## Rejected

- Decomposing `App.tsx` - scheduled for window 1.3.3.
- Stripping the explanatory comments in `zx0.ts` and `useSequencerIntegration.ts` - they carry
  non-obvious rationale, not boilerplate.
