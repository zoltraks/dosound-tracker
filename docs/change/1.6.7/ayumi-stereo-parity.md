# Ayumi stereo parity with the internal engine

**Type:** Change

## Summary

| Field         | Value                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Intent        | Make the Ayumi engine's stereo image and mono level identical to the internal engine's                        |
| Key decisions | Equal-power pan law (`isEqp = true`) plus a unity-gain bypass while every pan sits at centre                  |
| Open risks    | The restored mono level is 6 dB hotter than the halved signal the linear law produced; the limiter absorbs it |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Ayumi worklet applied pans through `AyumiCore.setPan` with
`isEqp = false` - the linear law `panLeft = 1 - p`, `panRight = p`. Two
defects followed. First, a centred channel weighted each side at 0.5
(-6 dB) where the internal engine's `StereoPannerNode` equal-power taper
gives 0.707 (-3 dB), so identical song data produced a different stereo
image per engine. Second, and worse, the all-centre path folded
`(left + right) * 0.5` over pan-weighted taps that summed to half
amplitude - every centred Ayumi song played 6 dB quieter than the
pre-stereo engine and the internal engine.

The reachable pan values are only 0, 0.5, and 1 (`L`/`R`/`C` and the
`ABC` permutations never produce intermediates), and at exactly those
points the equal-power curve `sqrt(1-p)`/`sqrt(p)` coincides with the
`StereoPannerNode` cos/sin taper - centre and extremes now agree bit
for bit. While every pan sits at centre the worklet calls the new
`AyumiCore.setPanBypass`, which restores unity gains on both sides so
the folded mono sample reproduces the pre-stereo signal exactly; any
off-centre pan switches all three channels to the equal-power law,
matching how the internal engine engages its panner chain only while
stereo is active.

## Use Cases

- When a song sets `stereo.one: ABC` under the Ayumi engine, the centre
  channel lands at -3 dB per side exactly like the internal engine,
  instead of the linear law's -6 dB.
- When every channel is centred - no stereo node, `C` modes, or the
  MONO setting - Ayumi output returns to the pre-stereo level instead
  of playing half amplitude.
- When crosstalk or MONO post-processes the bus, both engines feed it
  at the same programme level so the crossfade behaves identically.

## Hints

`applyCorePans` in `src/workers/ayumiWorklet.ts` picks the law per
render state; `AyumiCore.setPanBypass` in `src/synth/ayumiCore.ts`
writes unity `panLeft`/`panRight`. `configure` routes through
`applyCorePans`, so clock changes, chip switches, and resets preserve
the bypass/pan state. `test/synth/ayumiCore.test.ts` pins the law at
the three reachable values; `ayumiOutputGain.test.ts` mirrors the
bypass path and its limiter bound relaxed to `<= 1.0` because tanh
saturates to exactly 1.0 in float64 at the restored peak (~2.66 folded,
~3.2 after stage gain).

## Out of Scope

- Intermediate pan values: song data cannot produce them, so the
  sqrt-vs-cos/sin taper difference between the two constant-power laws
  never becomes audible.
- The internal engine, already correct through `StereoPannerNode`.
- Loudness re-calibration of `AYUMI_OUTPUT_GAIN`; the restored level is
  the one the gain constant was measured against.
