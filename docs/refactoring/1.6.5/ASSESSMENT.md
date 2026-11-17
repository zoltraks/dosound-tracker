# Dual-Chip Window Refactoring Assessment

## Proposal Summary

Own the visible-track projection in `src/utils/song/visibleTracks.ts`,
keep exporter register-stream selection module-local, and normalize
six-entry channel mutes with legacy three-entry compatibility.

## Implementation Summary

- Added `src/utils/song/visibleTracks.ts` with `isDualChipView`,
  `visibleTrackIds`, `CHIP1_TRACK_IDS`, and `CHIP2_TRACK_IDS`; tracker,
  playlist, and focus layers consume the projection.
- `asm.ts`, `vgm.ts`, and `max.ts` each carry a small `regsForChip` /
  `regsForFrame` picker that falls back to `frame.registers` when
  `registers2` is absent; `asm.ts` additionally splits the dump writer
  into `dumpLinesForStream` so the `music2:` section reuses the same
  row format.
- `useUiStore` accepts stored mute arrays of length 3 or 6 and pads to
  six; reset paths emit six entries.
- Added `test/utils/song/visibleTracks.test.ts` covering the projection
  matrix (setting off, single-chip song, six-track mode, chip-group
  switch).

## Gap Analysis

No gaps. Issue 2's recommendation was deliberately inverted during
implementation: the plan proposed shared constants, but the exporters
ship as separate dynamic-import chunks, so module-local helpers were
kept and the divergence is recorded here and in the plan's Refinements.

## Verification Results

- `npm run typecheck` - pass
- `npm run lint` - pass (0 problems)
- `npm run format` - pass
- `npm run build` - pass (entry chunk 598.90 kB, under the 600 kB budget)
- `npm test` - pass (189 files, 1734 tests)
- `npm run test:coverage` - pass (88.46% stmts / 81.38% branch / 86.73% funcs
  / 88.73% lines, all above the 80% gate)
- `npm run test:e2e` - pass (30 Playwright smoke tests, chromium + webkit)
- `npm audit` - 0 vulnerabilities

## Metrics Comparison

| Metric         | Before window | After window |
| -------------- | ------------- | ------------ |
| Entry chunk    | 597.13 kB     | 598.90 kB    |
| Test files     | 187           | 189          |
| Test count     | 1721          | 1734         |
| Coverage stmts | 88.58%        | 88.42%       |

Coverage dipped slightly in absolute terms because the window added
runtime surface faster than tests in a few dense hooks; every axis stays
above the 80% gate and the new `visibleTracks` module is fully covered.
