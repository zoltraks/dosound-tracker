# Instrument Empty-Slot Navigation - Implementation Plan

Change record: `docs/change/1.5.8/instrument-empty-slot-navigation.md`

## Approach

Single-function fix in `src/utils/instrument/instrumentPanelUtils.ts`.

1. `computeVisibleSlotCount` initializes `lastIndex` from
   `instruments.length - 1` instead of scanning for the last non-empty
   entry. The existing `currentIndex` bump and `maxInstruments` clamp stay
   unchanged.
2. The emptiness predicate parameter becomes dead - remove it from the
   signature and from the sole call site in `InstrumentSection`, along with
   the now-unused `isInstrumentEmpty` import.
3. Update `test/utils/instrument/instrumentPanelUtils.test.ts` to the
   three-argument signature and add a case asserting trailing empty entries
   count toward the visible window.

## Reproduction evidence

A scratch vitest harness rendering `InstrumentPanel` with
`[A, B, empty, empty]` showed only rows `00`, `01` before the fix and
ArrowDown clamping at index 1; after the fix all four rows render and
navigation walks 0-3.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format` - clean
- `npm run test` - 1332 tests / 142 files (includes the new case)
- `npm run build` - clean, known chunk-size warning only
