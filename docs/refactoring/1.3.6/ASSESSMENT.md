# Refactoring Assessment

**Proposal:** `docs/refactoring/1.3.6/REFACTORING.md` - hex formatting consolidation

## Proposed Versus Achieved

All seventeen manual `toString(16)` call sites across nine files were
routed through `Formatter.hex` exactly as planned:

- Padded-uppercase sites became `Formatter.hex(value)`.
- Unpadded-uppercase sites became `Formatter.hex(value, { padWidth: 0 })`.
- Lowercase sites in `songFormat.ts` and `SoundDriver.ts` became
  `Formatter.hex(value, { uppercase: false })` / `{ uppercase: false,
padWidth: 0 }`, preserving the lowercase output DOSOUND assembly
  requires.
- The `Formatter` import was added to the eight files that lacked it;
  `EnvelopePanel.tsx` and `useSequencerIntegration.ts` already carried it.

## Deviations

None. The debug-mode sequencer `console.log` was evaluated and left in
place - it is `isDebugMode`-gated, an intentional feature, not dead code.

## Verification

- `npx tsc -b`: clean.
- `npm run lint`: zero warnings.
- `npm run format`: applied.
- `npm run build`: production bundle emitted.
- `npm test`: 73 files, 544 tests, all pass - output strings are
  byte-identical by construction.

## Remaining Gaps

- `padWidth: 0` expresses "no padding" indirectly; a named `pad: false`
  option on `Formatter.hex` would read better if the pattern recurs.
- Other duplicated formatting idioms (time strings, percent) remain
  candidates for future windows.

## Lessons

- `toString(16)` chains accumulated silently because they work; the
  Rule-of-Three owner is `Formatter` and any future hex site should route
  through it.
