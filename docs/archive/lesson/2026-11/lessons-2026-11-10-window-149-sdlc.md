# Lessons - 1.4.9 Window

## Findings

- **Viewport probes verify CSS intent directly.** Measuring
  `boundingBox()` on the preview build proved both halves of the record -
  content-fit height on desktop and fullscreen promotion under the mobile
  query - without screenshot review. The probe pattern generalizes: any
  sizing or centering change can gate on bounding-box assertions.
- **Probe the real trigger chain.** The About modal opens an
  `InformationModal`, not a `text-display`; the `text-display` surface is
  reached through About → MANUAL/CHANGES. Selector-by-classname guesses
  fail when the feature's entry point is indirect.
