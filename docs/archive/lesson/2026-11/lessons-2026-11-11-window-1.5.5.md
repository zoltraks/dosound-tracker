# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### jsdom gaps crash panel mounts

Observed symptom: a new `PlaylistPanel` test suite failed all four cases with `TypeError: window.matchMedia is not a function`.

Root cause: the panel's scroll-into-view effect reads `window.matchMedia`, which jsdom does not implement - and the matched path would hit the equally unimplemented `scrollIntoView`.

Preventing rule: see "jsdom lacks matchMedia and scrollIntoView" in docs/TESTING.md.

### Transition reads report mid-flight colors

Observed symptom: the section-background probe asserted a hover color and read the un-hovered normal color.

Root cause: section backgrounds transition over 0.6 s - the computed read lands inside the animation window and reports the in-flight value, verified by re-probing with transitions disabled.

Preventing rule: see "Computed-style probes must disable transitions" in docs/TESTING.md.

### color-mix serializes outside the rgb form

Observed symptom: the same probe reported both compared colors as `-1` luminance and marked a correct state as failed.

Root cause: Chrome serializes `color-mix()` results as `color(srgb r g b)` and `oklab(...)` - the rgb-only parser matched neither and returned null for both sides.

Preventing rule: see "color-mix resolves to modern color notation in computed style" in docs/TESTING.md.
