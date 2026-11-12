# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Dead Utility Classes Silently Inflated the Scroll Area

Observed symptom: a 3px gap of dead scrollable space below the last
instrument row survived padding, margin, transform, scroll-snap, and
wheel-handler fixes - every guess made it worse until geometry was
measured.

Root cause: lucide `ChevronUp`/`ChevronDown` icons carried
`className="h-3 w-3 rotate-90"` - Tailwind tokens with no matching rule
in the project - so the icons rendered at the 24px library default inside
16px buttons, overflowing the row and propagating into the scrollable
area. The same dead classes sat in the playlist and number spinner.

Preventing rule: see "Forbidden Patterns" in
`docs/standard/typescript-react-development.md` - utility-framework class
names in a non-utility project silently no-op; size icon components
through their own API (`size={n}`). A guard test scans className
attributes for utility tokens - `test/guard/utilityClasses.test.ts`.

### Scroll Overflow Was Debugged by Guess Instead of Measurement

Observed symptom: roughly a dozen candidate fixes for the phantom bottom
gap - negative margins, padding shifts, flex conversion, scroll snapping,
a wheel handler - were applied and reverted before the real cause (the
24px icons above) surfaced.

Root cause: no measurement was taken. One console dump comparing
`scrollHeight` against the last child's bottom edge and walking the
descendants' boxes identified the overflowing element immediately.

Preventing rule: see "Scrollable Regions and Sticky Positioning" in
`docs/standard/css-general-development.md` - a scrollable area larger
than its content means a descendant overflows; transforms, baseline
form controls, and oversized children all extend the bounds, so measure
before patching margins or padding.

### Fractional Scroll Maximum Made Wheel Positioning Dance

Observed symptom: wheel scrolling to the instrument list's bottom bounced
1px back up, and a wheel-pinning handler produced visible oscillation.

Root cause: the container's parent-derived height was fractional
(185.21875px), so the maximum `scrollTop` was fractional and wheel deltas
plus programmatic writes fought over it. `scroll-snap` failed the same
way - the snap point and the maximum disagreed by a pixel.

Preventing rule: see "Scrollable Regions and Sticky Positioning" in
`docs/standard/css-general-development.md` - exact-end scroll containers
need integer heights (floored via `ResizeObserver`), and `scroll-snap`
is never a scroll-bounds repair.

### Scrollport Padding Leaked Into the Scrollable Area

Observed symptom: `padding-right` added to the scroll container for a
row-to-scrollbar gap was suspected of contributing to the phantom bottom
space.

Root cause: scroll containers can fold their own padding into the
scrollable area on the block axis too - container padding is not a safe
place for content-to-scrollbar gaps. The same gap lived safely on the
items as `margin-right`.

Preventing rule: see "Scrollable Regions and Sticky Positioning" in
`docs/standard/css-general-development.md` - content-to-scrollbar space
belongs on the items as `margin`, not on the scroll container as
`padding`.

### Alt Modifier Leaked Into the Track's Page Step

Observed symptom: ALT+PAGEDOWN switched instrument globally and also
paged the track cursor 16 rows when a track was focused.

Root cause: `TrackPanel` guarded its page step against Ctrl, Meta, and
Shift but not Alt - the bare-key rule was applied incompletely.

Preventing rule: `docs/SPECIFICATION.md` already records "section
editing keys require bare keys" - the guard must exclude every modifier
(`ctrlKey || metaKey || shiftKey || altKey`), not a subset.
