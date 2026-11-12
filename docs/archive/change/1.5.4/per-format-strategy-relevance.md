# Per-format strategy relevance

**Type:** Feature

## Summary

| Field         | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Intent        | Annotate the export modal so the strategy selector's effect is per-format      |
| Key decisions | No selected-format state exists - markers on the format buttons plus a caption |
| Open risks    | Extra UI states to keep honest as formats evolve                               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

A session analysis of `src/exports/` showed the three dump strategies do
not apply uniformly:

- **DATA / BIN** - the only formats with three genuinely distinct tiers.
- **MAX** - `simple` selects the RAW8 stream, `complex` and `tight` the
  REG7 stream (tight adds coalesced delays) - a stream-format choice,
  not a verbosity choice.
- **VGM** - `simple` and `complex` produce byte-identical output; only
  `tight` (delay coalescing) differs.
- **DUMP** - ignores the selector entirely.
- **WAV, MOD, MIDI** - ignore the selector entirely.

Relevance also depends on the What selection: under the instrument scope
only the MAX export consumes the strategy - the instrument paths of DATA,
BIN, and VGM take no strategy parameter.

The user who reads three strategy radios reasonably expects them to
matter for every format.

## Correction

The original sketch assumed a selected-format state ("annotate per
selected format", "disable the radios where the selector has no
effect"). The export modal holds none - the eight format buttons are
actions that fire the export directly with the pending strategy. The
annotation therefore lives at the format buttons and reacts to the What
selection, which is the only scope state the modal has.

## Implementation sketch

- Mark each format button whose export consumes the pending strategy
  under the current What selection with an `aria-hidden` `*` marker -
  keeping the accessible button names unchanged for the e2e selectors.
- Add a caption line under the format grid naming the marker and the
  relevant nuances: MAX selects a stream format, and for VGM only TIGHT
  differs from the other strategies.
- Keep the persisted `exportStrategy` untouched - the annotation is
  display-level.

## Verification

- Modal tests cover the annotation states per format under both scopes.
- `npm run test:e2e` export flows unchanged.
