# Derive the MIDI Preview Tick from the Frame Rate Implementation Plan

## Summary

| Field         | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Intent        | Keep live-preview first-tick timing accurate at both supported frame rates                           |
| Key decisions | the offset lives in the shared engine now - fix `now + 20` to `now + tickIntervalMs` once, not twice |
| Open risks    | `none`                                                                                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.4.0/midi-preview-tick-from-frame-rate.md`.

## Analysis

The record describes two `nowTick + 20` sites in `useMidiActions.ts`. The
1.3.9 preview-envelope consolidation removed those sites: `useMidiActions`
now derives `tickIntervalMs` from `currentSong.frame` and passes it into
`usePreviewEnvelope.start` at both call surfaces (track-focused and
unfocused). The defect survived the move inside the shared engine -
`usePreviewEnvelope.ts` initialises `nextTickTime` to `now + 20` while the
interval timer runs at `tickIntervalMs`. At 60 Hz the first envelope
boundary lands one interval late - at 50 Hz the constant happens to equal
the interval. Fixing the engine site repairs every consumer - TrackPanel,
PianoKeyboard, HeaderPanel, `useMidiActions`, and `useInstrumentActions` -
not only the MIDI paths the record named.

## Best Practices

Follow TypeScript engineering standards from
`docs/standard/typescript-general-development.md` and the real-time audio
standard `docs/standard/typescript-audio-development.md`:

- Derive timing constants from the configured interval, never a literal.
- Keep the change single-line - audio timing paths favour minimal diffs.
- Prove the fix with a deterministic timer test before touching the code.

## Audio-Critical Requirements

This change touches an audio-adjacent timing path.

- The change does not affect React render timing, `useCallback` or
  `useMemo` dependencies, or state management patterns.
- It modifies the preview-envelope scheduling inside `usePreviewEnvelope`,
  which drives instrument previews on the YM2149 registers.
- Verification is the fake-timer unit test proving the first boundary lands
  at the configured interval, plus the existing envelope test suite.

## Documentation Updates

Per project guidelines, update the active documentation set before any source
code modifications. Update only the files affected by this change.

- `SPECIFICATION.md` — the `usePreviewEnvelope` shared-utility entry records
  that the first tick derives from the configured frame interval.

`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` are unaffected.

## Type and State Updates

None. The change touches no types, stores, or application state.

## Step by Step Implementation

**Update SPECIFICATION.md**

Extend the `usePreviewEnvelope` entry so the first-tick derivation is
documented behaviour.

File to modify: `docs/SPECIFICATION.md`.

**Add the failing timing test**

Extend `test/hooks/playback/usePreviewEnvelope.test.tsx` with a case that
starts a voice at `tickIntervalMs: 10` - an interval different from the
hardcoded `20` - and asserts the second apply call advances after two
interval advances. Under the current `now + 20` offset the first timer
callback sees `now < nextTickTime`, so the envelope stalls and the test
fails before the fix. Fake timers quantize `performance.now` on fractional
delays, so the test uses an integer interval rather than `1000 / 60`.

File to modify: `test/hooks/playback/usePreviewEnvelope.test.tsx`.

**Derive the offset from the configured interval**

Replace the literal offset with the per-start interval.

File to modify: `src/hooks/playback/usePreviewEnvelope.ts`.

```typescript
nextTickTime: now + tickIntervalMs,
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md`.
2. Add the failing test and confirm it fails.
3. Apply the engine fix.
4. Run verification loop.

## Testing Strategy

**Unit tests**

The new case covers the 60 Hz boundary - the existing suite keeps the 50 Hz
shape (`tickIntervalMs: 20`) green, proving unchanged behaviour at the
default rate.

Test file to update: `test/hooks/playback/usePreviewEnvelope.test.tsx`.

**Integration tests**

None beyond the hook suite. The record's manual 60 Hz preview check is a
device-level verification the automated test approximates through fake
timers.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test -- test/hooks/playback/`
- Confirm the new test fails on the pre-fix code and passes after the fix
