# Measure the Audio, Platform, and Performance Targets Implementation Plan

**Change Request Reference:** `docs/change/1.8.0/measure-audio-platform-performance-targets.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Field measurements behind every promised timing and platform     |
|               | target                                                           |
| Key decisions | Sample sizes and thresholds are written into the plan before any |
|               | run                                                              |
| Open risks    | Unavailable targets - MIDI hardware, Firefox/Edge, mobile,       |
|               | Windows/Linux - narrow their claims rather than stay silent      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md` performance and
testing sections: distributions over single runs; assertions about
sound output, never about playback indicators.

## Audio-Critical Requirements

The work measures the audio path - it does not change it. Capture
harnesses run against the production build so measurements describe
shipped timing, not dev-mode behavior.

## Documentation Updates

- `PROJECT.md` - targets annotated with measured results or narrowed
  where a platform cannot be obtained.
- `TESTING.md` - the measurement procedures become repeatable runs.

## Type and State Updates

None.

## Step by Step Implementation

**State the acceptance budgets**

Before any run: sample sizes, jitter and load-time thresholds, and the
platform matrix - written into this plan so results answer a stated
question.

**Capture audio and tick-to-output jitter**

Render playback on Chromium and WebKit at 50 and 60 Hz on both engines;
capture output and compute the tick-to-output jitter distribution.

**Exercise real-device and platform surfaces**

MIDI start/suspend/resume with attached hardware where available;
Firefox and Edge playback checks; a mobile viewport pass; Windows and
Linux desktop builds with launch checks.

**Collect load and size distributions**

Cold-load timing traces and a representative song-file size study;
compare against the two-second and 100 KB targets.

**Record or narrow**

Each target resolves to measured-with-numbers or a documented narrowed
claim in `PROJECT.md`.

## Implementation Order

1. Acceptance budgets into the plan.
2. Audio/jitter capture.
3. Device and platform runs.
4. Load and size distributions.
5. `PROJECT.md` resolution.

## Testing Strategy

**Unit tests**

Harness-side helpers (trace parsing, distribution math) carry unit
tests; product code is untouched.

**Integration tests**

Playwright-based capture runs extend the `E08` isolated-preview pattern;
each run reports the distribution it produced.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean for harness code.
- Every promised target carries either a measured distribution or a
  documented narrowed claim.
