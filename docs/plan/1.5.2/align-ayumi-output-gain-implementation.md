# Align Ayumi Output Gain Implementation Plan

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Raise `AYUMI_OUTPUT_GAIN` from `0.5` to the measured parity point `1.2` so |
|               | switching engines is level-neutral for live playback                       |
| Key decisions | The parity gain is followed by a soft-knee limiter - measurement showed    |
|               | the folded peak reaches ~1.33, so a linear `1.2` would clip near `1.8`     |
| Open risks    | Final perceived-loudness confirmation is the owner's listening check -     |
|               | recorded as the record's acceptance note                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/align-ayumi-output-gain.md`.

## Analysis

`src/workers/ayumiWorklet.ts` renders each output sample as `(core.left + core.right) * 0.5 * AYUMI_OUTPUT_GAIN`. Measured on the real core, the folded signal peaks near `1.33` when all three channels run in-phase at full volume (theoretical ceiling `1.5`), and the internal engine's own ceiling is `~0.9` - three channels at `YM_LOG_VOLUME_TABLE[level] * 0.3`. The record's assumed pre-gain ceiling was wrong twice over: the folded peak is `~1.33`, not `~0.75`, so a linear gain of `1.2` peaks near `1.8` and clips hard, while the internal engine never exceeds `0.9`.

The honest mechanism is the recorded parity gain followed by a soft-knee limiter. Below the knee the path is linear, so the measured loudness parity holds for ordinary material; above the knee the output saturates smoothly and stays strictly under `1.0` on worst-case input. A headless `AyumiCore` probe proves both halves of the contract - the pre-limiter signal can exceed `1.0` at maximum output, and the limited signal never does.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- No abbreviations in identifiers (use full words)
- Keep modules focused on single responsibility

## Audio-Critical Requirements

- The change does not affect React render timing, `useCallback`/`useMemo` dependencies, or state management - it is a constant inside the worklet render loop.
- The worklet runs on the audio thread; the multiplier is a scalar on the output sample, so timing cost is unchanged.
- Playback verification: the Ayumi engine is exercised live by the e2e smoke suite; the headroom ceiling is proven by the new unit suite.

## Documentation Updates

- `SPECIFICATION.md` - the Sound Engines section gains one sentence recording the stage gain and its parity rationale beside the Ayumi worklet description.

## Type and State Updates

None.

## Step by Step Implementation

**Raise the stage gain and add the limiter**

Set the constant to the measured parity point, add the soft-knee limiter, and rewrite the comment so the measured peak, the parity evidence, and the limiter rationale are recorded at the definition site.

File to modify: `src/workers/ayumiWorklet.ts`.

```typescript
// Centre-panned YM output folds to a peak near 1.33 at three in-phase
// full-volume channels. Gain 1.2 is the measured loudness-parity point with
// the internal engine; the soft-knee limiter keeps that gain while bounding
// the extreme tail under 1.0 instead of clipping.
const AYUMI_OUTPUT_GAIN = 1.2;
const AYUMI_SOFT_KNEE = 0.9;

const softLimit = (value: number): number => { ... };

channel[i] = softLimit((this.core.left + this.core.right) * 0.5 * AYUMI_OUTPUT_GAIN);
```

The limiter is linear below `AYUMI_SOFT_KNEE` and applies `tanh` saturation
above it, asymptotic to `1.0` with a continuous first derivative at the knee.

**Add the headroom suite**

Drive `AyumiCore` at maximum output - all three channels centre-panned, tone enabled, volume 15 - and measure the emitted peak the way the worklet folds it.

File to create: `test/synth/ayumiOutputGain.test.ts`.

```typescript
// @vitest-environment node
// Prove the folded peak at maximum output exceeds 1.0 under the raw parity
// gain, and that the mirrored limiter output stays strictly under 1.0 while
// leaving the below-knee region exactly linear.
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md`
2. Raise `AYUMI_OUTPUT_GAIN` and update its comment
3. Add the headroom suite
4. Run the verification loop

## Testing Strategy

**Unit tests**

`test/synth/ayumiOutputGain.test.ts` - node-environment suite that renders a worst-case block through `AyumiCore` and asserts the folded peak times the stage gain stays under `1.0`.

**Integration tests**

None - the worklet's render expression is unchanged in shape; only the constant moves.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` under the webkit project for the audio-path slice
