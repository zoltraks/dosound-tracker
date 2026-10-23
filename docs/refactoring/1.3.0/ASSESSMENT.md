# Window 1.3.0 Refactoring Assessment

## Verdict

Delivered as proposed. The volume-nibble clamp consolidation landed: one `clampVolumeNibble`
helper in `src/utils/volumeUtils.ts` now serves eleven files, replacing twelve inline
`Math.max(0, Math.min(0x0f, …))` sites.

## Reconciliation

| Proposed                                            | Delivered | Evidence                                                                           |
| --------------------------------------------------- | --------- | ---------------------------------------------------------------------------------- |
| Add `clampVolumeNibble` helper plus unit tests      | Done      | `volumeUtils.ts`, 5 tests in `volumeUtils.test.ts`                                 |
| Migrate pure utilities (5 files)                    | Done      | `trackUtils`, `songIO`, `songParser`, `trackClipboard`, `trackPanelUtils`          |
| Migrate components, exports, non-audio hooks        | Done      | `TrackLine.tsx`, `asm.ts`, `useMidiHandling.ts`                                    |
| Migrate audio-path sites and `SoundDriver` delegate | Done      | `playbackSimulation` (2 sites), `useSequencerIntegration` (3 sites), `clampVolume` |

## Deviations

`useMidiHandling.ts` kept its `rawVolume` null check but folded the truncation into the
helper call, so `rawVolume` now holds the untruncated value between the two lines - the
combined coercion is identical because `clampVolumeNibble` truncates.

Two sites were deliberately left inline, as the proposal declared: `playbackSimulation.ts`
line 349 clamps without truncation (migrating would change fractional envelope input), and
`SoundDriver.clampVolume` kept its non-finite guard while delegating the numeric clamp.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build` - clean.
- `npm test` - 47 files, 266 tests, zero failures. Baseline was 45 files, 255 tests; the
  delta is the `permissions` suite (6 tests) and the `volumeUtils` suite (5 tests).
- Export fixture suites pass unchanged - `clampVolumeNibble` is a pure function with no
  render, hook, or timing surface, so audio paths are unaffected.

## Remaining Gaps

None from the proposal. The `playbackSimulation.ts:349` non-truncating clamp stays as a
candidate only if envelope values are ever made integral by contract - that would be a
behaviour-visible decision, not refactoring.

## Lessons

The clamp's three truncation dialects (`| 0`, `Math.floor`, none) were equivalent only after
the clamp bound was accounted for; cataloguing every site before writing the helper is what
kept the consolidation behaviour-preserving.
