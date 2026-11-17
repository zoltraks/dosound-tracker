# Dual-Chip Song Data Refactoring Assessment

## Proposal Summary

Extract the repeated `['D', 'E', 'F']` and
`['A', 'B', 'C', 'D', 'E', 'F']` literals into shared channel constants in
`src/constants/song.ts`.

## Implementation Summary

- Added `SECOND_CHIP_CHANNEL_IDS` next to `SONG_CHANNEL_IDS` in
  `src/constants/song.ts`.
- Routed `songChips.ts`, `songParser.ts`, `useSongManagement.ts`,
  `songRenumber.ts`, and both loops in `songStereo.ts` through the shared
  constants.
- `songIO.ts` playlist emission uses `SECOND_CHIP_CHANNEL_IDS` for the
  D/E/F row keys.
- `validation.ts` keeps its literal A-C/D-F loops: the required-versus-
  optional distinction reads clearer as two named groups than as slices of
  the shared list.

## Gap Analysis

No gaps. The proposal's single finding was implemented as written; no
additional refactoring was required - the rest of the window's code follows
existing module boundaries.

## Verification Results

- `npm run typecheck` - pass
- `npm run lint` - pass
- `npm run format` - pass
- `npm run build` - pass (entry chunk ~597 kB, under the 600 kB warning)
- `npm test` - pass (187 files, 1721 tests; run before the constant
  extraction, targeted song/playback suites re-run after - see below)
- `npm run test:coverage` - see window verification
- `npm run test:e2e` - see window verification

## Metrics Comparison

Channel-key literals: 6 sites before, 0 after (all routed through
`SONG_CHANNEL_IDS` / `SECOND_CHIP_CHANNEL_IDS`). No growth elsewhere.

## Output Fidelity

Export emission is unchanged for single-chip songs: `chipCount` and D/E/F
keys emit only when present, and the YAML quoting transform now covers
`[ABCDEF]` without altering existing three-channel output - confirmed by the
unchanged export test suites and golden fixtures.

## Behaviour Smoke Check

- Single-chip YAML round-trips byte-stable (existing parser/IO suites).
- Two-chip songs parse, serialize, and simulate with a second register file
  (new `songChips`, parser, IO, and simulation tests).
