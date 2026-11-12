# Measure the audio, platform, and performance targets

**Type:** Chore

**Source:** Audit 2026-11-12 REC-13 (RISK-02)

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Replace unmeasured playback and platform promises with evidence |
| Key decisions | Sample sizes and thresholds are stated before measuring         |
| Open risks    | Needs real devices and target platforms - MIDI hardware,        |
|               | Firefox/Edge, mobile viewport, Windows/Linux builds             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`PROJECT.md` promises glitch-free sub-millisecond playback, all four
browser families, mobile and three desktop targets, sub-two-second load,
and typical files under 100 KB. The browser smoke suite checks playback
progression, not audible sample timing, and none of the platform or
performance surfaces have field measurements.

Capture rendered audio and tick-to-output jitter on Chromium and WebKit
at both frame rates and both engines; exercise start, suspend, and
resume with a real MIDI device where available; collect cold-load and
representative song-size distributions; and repeat browser, mobile, and
desktop-target checks on the actual target platforms. Sample sizes and
acceptance thresholds are written down before the runs so the results
answer a stated question. Playback-indicator assertions never substitute
for sound output.

## Use Cases

- When the jitter measurement lands, `N-01`-adjacent claims cite a
  distribution, not a smoke assertion.
- When a target cannot be obtained, the affected claim is narrowed in
  `PROJECT.md` rather than left as silent unknown.

## Hints

- The audit's `E08` harness pattern - an isolated preview on a spare
  port with `reuseExistingServer: false` - is the reusable starting
  point for capture runs.
- Recordings feed distributions; single runs prove nothing about
  jitter.
- Sites: `docs/PROJECT.md` targets, `docs/TESTING.md` verification
  surfaces, `playwright.config.ts` browser matrix.

## Out of Scope

- Weakening the promised targets to match whatever is measured - a
  narrowed claim is a documented decision, not drift.
- Purchasing hardware or devices within this record.
