# Root-cause the WebKit playback e2e failures

**Type:** Fix

**Source:** AUDIT-1.7 REC-005 — FND-TST-002

## Summary

| Field         | Value                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Two WebKit e2e specs fail reproducibly - `.play-song-button` never gains `.playing` - while Chromium is fully green; the failure is environmental-suspect but never root-caused in-tree |
| Key decisions | Open: outcome is either an initialization fix or an explicit environment-expected annotation in the suite and docs                                                                      |
| Open risks    | Windows headless WebKit may never start an AudioContext - if confirmed, honest marking reduces e2e coverage on that project; a macOS/Linux run discriminates                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`npm run test:e2e` fails two WebKit specs: "enters a note in track A and
plays the song" (`e2e/smoke.spec.ts:22`) and "switches the sound engine
to Ayumi and plays" (`e2e/smoke.spec.ts:151`). Both assert the
`.play-song-button` gains the `playing` class after click; it never
does. Chromium passes all playback specs, and every non-playback WebKit
spec passes.

The failure reproduces identically on a clean baseline worktree at
`263cb00` across Node 22 and Node 26, so it is not a regression from the
1.6.7 window - but "environmental" is currently an inference, not a
demonstrated root cause. The audit flags it as a readiness condition:
either find the actual cause (headless WebKit preserving the suspended
`AudioContext` startup state, an autoplay-policy flag, or an
initialization ordering issue) or mark the specs environment-expected so
the suite reports honestly.

## Use Cases

- When `npm run test:e2e` runs on this host, the two WebKit playback
  specs either pass or are explicitly skipped/annotated as
  environment-expected with the reason recorded.
- When the suite runs on macOS or Linux, playback assertions execute for
  real and any genuine initialization defect surfaces there.

## Hints

- Check the Playwright WebKit launch flags and autoplay policy
  configuration before touching application code - a headless browser
  that never resumes its audio context produces exactly this signature.
- The suspended-context behavior is already documented in `TESTING.md`
  and the window review; this record turns the classification into a
  verified fact or a fix.
- An environment-expected annotation should name the platform
  condition, not silently skip - the coverage gap stays visible.

## Out of Scope

- Chromium playback behavior - fully green.
- Audio engine internals, unless the root cause demonstrably lands there.
