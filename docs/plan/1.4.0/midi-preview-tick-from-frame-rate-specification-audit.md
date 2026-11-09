# Specification Audit - Derive the MIDI Preview Tick from the Frame Rate

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                       |
| ---------- | --------------------------------------------------------------------- |
| Change     | `docs/change/1.4.0/midi-preview-tick-from-frame-rate.md`              |
| Plan       | `docs/plan/1.4.0/midi-preview-tick-from-frame-rate-implementation.md` |
| Audit Date | 2026-11-09                                                            |

## Verdict

The plan is ready for implementation. The record's literal defect sites aged
out in the 1.3.9 consolidation, but the defect itself is confirmed in the
shared engine at `usePreviewEnvelope.ts` (`nextTickTime: now + 20`), so the
plan repairs it where it actually lives.

## Completeness

- First-tick offset derives from the configured frame interval: covered by
  the engine step - one site now, covering both MIDI call surfaces and every
  other preview consumer.
- 60 Hz boundary lands on the interval: covered by the new fake-timer test.
- 50 Hz timing unchanged: covered by the existing test suite's
  `tickIntervalMs: 20` cases.

## Ambiguity

The record's "at two sites" no longer matches the tree; the plan records the
relocated defect and widens the fix from the two named MIDI surfaces to the
single shared site. That is a scope tightening, not an interpretation fork.

## Implementability

- `usePreviewEnvelope.ts` line 142 initialises `nextTickTime` to `now + 20`;
  `tickIntervalMs` is destructured in the same scope at line 110, so the fix
  is a single-expression change with no new dependencies.
- `useMidiActions.ts` lines 62, 217, and 285 already derive and pass
  `tickIntervalMs` from `currentSong.frame`, confirming the engine site is
  the only remaining hardcoded offset.
- `advancePreviewEnvelopeTick` accepts `tickIntervalMs` with a `20` default;
  the engine always passes the configured value, so no utility change is
  needed.
- The test harness (`EngineHarness`, fake timers, `appliedSteps`) already
  exists in `test/hooks/playback/usePreviewEnvelope.test.tsx` and supports
  fractional intervals.

## Fidelity

- Enumeration fidelity: every preview consumer (`TrackPanel`,
  `PianoKeyboard`, `HeaderPanel`, `useMidiActions`, `useInstrumentActions`)
  shares the one engine site; none carry their own offset. Verified by
  grepping `nextTickTime` and `tickIntervalMs` across `src/`.
- Constants completeness: the 60 Hz interval is `1000 / 60 = 16.66 ms`, the
  50 Hz interval is `20 ms`, matching `DEFAULT_SONG_FRAME` and the
  `SUPPORTED_SONG_FRAMES` pair in `src/constants/song.ts`.
- Boundary decisions: the `advancePreviewEnvelopeTick` default of `20` stays -
  the utility keeps a documented fallback while the engine always supplies
  the configured value.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | -       | -                |
