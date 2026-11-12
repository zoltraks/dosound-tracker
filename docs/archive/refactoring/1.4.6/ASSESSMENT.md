# 1.4.6 Refactoring Assessment

## Proposal Summary

`docs/refactoring/1.4.6/REFACTORING.md` proposed deleting three dead or
no-op constructs: the identity `formatPatternDisplay` helper in
`src/components/PlaylistLine.tsx`, and the dead `useEffect` plus two identity
`useMemo` wrappers in `src/modals/MidiModal.tsx`.

## Implementation Summary

All three proposed items landed exactly as planned.

- `PlaylistLine.tsx` - `formatPatternDisplay` removed; the call site renders
  `patternValue` directly. `Formatter` import retained for the line number.
- `MidiModal.tsx` - the empty `useEffect(() => { if (!isOpen) return; },
[isOpen])` removed; `effectiveInputId` and `effectiveOutputId` are now
  direct reads of `localConfig.inputId` and `localConfig.outputId`; the
  `useMemo` import removed.

One additional no-op surfaced during the window's comment sweep and was
fixed in the same spirit: the `.then(() => {})` link left inside
`useAudioContextResume.ts` was collapsed to `audioContext.resume().catch(...)`.

## Gap Analysis

No proposal items were missed or changed. One item beyond the proposal was
added (the `.then()` cleanup) - a comment-sweep artifact of the same dead-
code kind, reported by the delegated sweep.

A latent inconsistency noted during the window and deliberately deferred:
`YM2149`'s constructor builds its initial `YMState` literal with
`noiseEnabled: false`, while `deriveYmState` on an all-zero register file
yields `noiseEnabled: true` (hardware bits are active-low). Reconciling the
initial state is observable through `getState()` before the first write, so
it is a behaviour change and belongs in a future `docs/change/` record, not
in a refactoring.

## Verification Results

| Check               | Result | Evidence                   |
| ------------------- | ------ | -------------------------- |
| `npm run typecheck` | pass   | tsc -b, zero errors        |
| `npm run lint`      | pass   | zero errors, zero warnings |
| `npm run format`    | pass   | Prettier applied           |
| `npm run build`     | pass   | dist emitted               |
| `npm test`          | pass   | 108 files, 842 tests       |

## Metrics Comparison

- `PlaylistLine.tsx` - one module-level function removed (5 lines).
- `MidiModal.tsx` - one dead effect removed, two `useMemo` calls removed
  (14 lines net), one import specifier removed.
- `useAudioContextResume.ts` - four lines collapsed to one.

## Output Fidelity

No export module was touched; export outputs are unchanged. The suite's
export-fixture assertions (VGM, MAX, WAV, ASM) pass byte-identical.

## Behaviour Smoke Check

Presentation-layer only - `PlaylistLine` renders the same `patternValue`
string, `MidiModal` reads the same config fields and fires one fewer no-op
effect per toggle. The smoke suite and unit suite cover both surfaces;
842 tests pass.

## Conclusion

Pass. All proposed items implemented, one compatible addition, one
behaviour-sensitive finding deferred to a future change record.
