# Expand End-to-End Coverage

**Type:** Chore

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Grow the Playwright smoke suite beyond its six flows to cover the       |
|               | critical user paths added since it was written                          |
| Key decisions | New specs follow the one-flow-per-test convention in `e2e/` with shared |
|               | helpers - chromium and webkit projects stay the matrix                  |
| Open risks    | Audio-path flows are only meaningful under webkit (suspended-context    |
|               | behaviour) - suite growth must not flake the pipeline                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The e2e suite covers six flows: first launch, note entry with playback,
instrument creation with preview, assembly export, save/load, and theme
switching. Features landed since - the settings modal with its session
restore, the Ayumi engine switch, modal coverage, and additional export
formats - have no end-to-end coverage.

Candidate new flows, each one independent `test`:

- Settings modal: open, change a value, OK, verify persistence across a
  reload.
- Sound engine: switch to Ayumi, play, verify audible context state.
- Export formats: VGM and MAX download assertions alongside the existing
  assembly flow.
- Modal flows: an About-document modal opens and renders content.

Flows touching the audio path are asserted on the audible outcome (gain
values, context state, `currentTime` progression) per `TESTING.md`, and
run under the webkit project where suspended-context behaviour
reproduces.

## Use Cases

- When the suite runs, each new flow exercises its path end to end in a
  real browser.
- When a flaky file-input or timing case appears, the test is made
  deterministic rather than retried.

## Hints

- `e2e/helpers.ts` holds the shared interactions - extend it rather
  than duplicating setup per spec.
- The known webkit save/load flake is timing-dependent, documented in
  `TESTING.md` - new file flows should use the deterministic patterns
  already there.
- `vite preview` serves `dist/` on port 8008 and a stale dev server can
  shadow it - see the `WORKFLOW.md` tooling note before judging a
  failure.

## Out of Scope

- Visual-regression or screenshot-diff infrastructure.
- Firefox - headless launch fails under the current macOS sandbox, as
  recorded in `TESTING.md`.
