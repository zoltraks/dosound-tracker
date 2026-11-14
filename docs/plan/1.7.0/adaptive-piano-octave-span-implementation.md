# Adapt the On-Screen Piano Octave Span to the Available Width Implementation Plan

## Summary

| Field         | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Intent        | Drive the piano octave span from the measured keyboard width instead of a fixed breakpoint   |
| Key decisions | `ResizeObserver` on `.piano-keyboard`; pure `octaveSpanForContentWidth` helper in pianoUtils |
| Open risks    | none                                                                                         |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.7.0/adaptive-piano-octave-span.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Pure, testable utility functions for the span math in `src/utils/panel/pianoUtils.ts`
- A single `useEffect` owning the observer lifecycle in the component
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

None - the change re-derives which keys are rendered. Note preview, envelope
timers, and the monophonic preview channel are untouched, and `octaveSpan` state
updates only on real width changes.

## Documentation Updates

- `SPECIFICATION.md` - record the adaptive octave-span rule beside the piano
  keyboard mapping under Keyboard Shortcuts and Input Bindings.

`PROJECT.md` and `ARCHITECTURE.md` are unaffected - no requirement or structure
changes. `public/MANUAL.md` documents no fixed octave count, so it needs no edit.

## Type and State Updates

No type definitions or store changes. `PianoKeyboard` replaces its local
`isCompactLayout` state with a local `octaveSpan` number state.

## Step by Step Implementation

**Add the span constants and width helper**

In `src/utils/panel/pianoUtils.ts` add the pixel metrics mirrored from
`.piano-keyboard`, `.piano-keys`, and `.piano-key` in `src/App.css`, plus a pure
helper that maps the keyboard's content-box width to a clamped octave span.

File to modify: `src/utils/panel/pianoUtils.ts`.

```typescript
export const PIANO_MIN_OCTAVE_SPAN = 2;
export const PIANO_MAX_OCTAVE_SPAN = MAX_OCTAVE - MIN_OCTAVE + 1;
export const PIANO_KEY_PITCH_PX = 25;
export const PIANO_KEYBOARD_PADDING_PX = 14;
export const PIANO_KEYS_PADDING_PX = 8;
export const PIANO_OCTAVE_WIDTH_PX = 7 * PIANO_KEY_PITCH_PX;

export function octaveSpanForContentWidth(contentWidthPx: number): number {
  const usable = contentWidthPx - PIANO_KEYS_PADDING_PX;
  const span = Math.floor(usable / PIANO_OCTAVE_WIDTH_PX);
  return Math.max(PIANO_MIN_OCTAVE_SPAN, Math.min(PIANO_MAX_OCTAVE_SPAN, span));
}
```

**Change generatePianoKeys to take the span**

Replace the `isCompactLayout` boolean parameter with `octaveSpan`, clamp it to
the same bounds, and keep the existing centering math. While touching the
function, skip the extra top C when the span already reaches `MAX_OCTAVE` - the
current `Math.min(MAX_OCTAVE, highest + 1)` would emit a C with a duplicate
`keyId` at full span once `PIANO_SHOW_EXTRA_TOP_C` is enabled.

File to modify: `src/utils/panel/pianoUtils.ts`.

```typescript
export function generatePianoKeys(octaveSpan: number, currentOctave: number): PianoKeyConfig[] {
  const span = Number.isFinite(octaveSpan)
    ? Math.max(PIANO_MIN_OCTAVE_SPAN, Math.min(PIANO_MAX_OCTAVE_SPAN, Math.floor(octaveSpan)))
    : PIANO_MIN_OCTAVE_SPAN;
  const maxStartOctave = MAX_OCTAVE - (span - 1);
  const startOctave = Math.max(MIN_OCTAVE, Math.min(maxStartOctave, currentOctave - 1));
  // ...octave loop unchanged...
  if (PIANO_SHOW_EXTRA_TOP_C && highestDisplayedOctave < MAX_OCTAVE) {
    // append extra C unchanged
  }
}
```

**Measure the keyboard width in the component**

In `src/components/piano/PianoKeyboard.tsx` replace the `isCompactLayout`
state and the `window.resize` effect with an `octaveSpan` state and a
`ResizeObserver` on the `.piano-keyboard` element. Measure synchronously once
from `clientWidth` minus the element's horizontal padding so the first frame
already renders the right span, then let the observer drive resizes and
text-scale changes. Without `ResizeObserver` (jsdom, SSR) the state keeps the
two-octave floor.

File to modify: `src/components/piano/PianoKeyboard.tsx`.

```typescript
const [octaveSpan, setOctaveSpan] = useState(PIANO_MIN_OCTAVE_SPAN);
const pianoKeys = generatePianoKeys(octaveSpan, currentOctave);

useEffect(() => {
  const element = pianoRef.current;
  if (!element) return;
  setOctaveSpan(octaveSpanForContentWidth(element.clientWidth - PIANO_KEYBOARD_PADDING_PX));
  if (typeof ResizeObserver === 'undefined') return;
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      setOctaveSpan(octaveSpanForContentWidth(entry.contentRect.width));
    }
  });
  observer.observe(element);
  return () => observer.disconnect();
}, []);
```

**Update the unit suite**

Update `test/utils/panel/pianoUtils.test.ts` to the numeric signature and add
coverage for the clamp bounds, `octaveSpanForContentWidth` boundaries, the
full eight-octave render, and the extra-top-C suppression at the range edge.

File to modify: `test/utils/panel/pianoUtils.test.ts`.

## Refinements

- `docs/TOOLING.md` gained an `EBADENGINE` note beside the install note - the
  session's `node_modules` was a stale partial install and `npm ci` under an
  older Node failed the `engine-strict` floor, so the reusable repair path
  (switch to the `.nvmrc` Node first) was folded into the owning document
  under improvement mode.

## Implementation Order

1. Update documentation
2. Implement the utility span math and signature change
3. Implement the component measurement
4. Update tests
5. Run verification loop

## Testing Strategy

**Unit tests**

Test file to update: `test/utils/panel/pianoUtils.test.ts`.

- `generatePianoKeys(2, octave)` renders two octaves; `generatePianoKeys(8, octave)` renders octaves `MIN_OCTAVE` through `MAX_OCTAVE`
- Out-of-range and non-finite spans clamp to the bounds
- `octaveSpanForContentWidth` returns 2 below one extra octave of width, grows by one octave per 175px, and caps at 8
- With `PIANO_SHOW_EXTRA_TOP_C` enabled no duplicate `keyId` is emitted at full span

**Integration tests**

The existing `test/components/piano/PianoKeyboard.test.tsx` modifier cases keep
passing under the two-octave jsdom fallback. A `ResizeObserver` mock adds value
only if the harness supports it cheaply; the span math itself is covered by the
unit suite.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manual: resize the window - the piano gains an octave per ~175px of width and
  shows all eight octaves on a wide display; check text scale 125% and 150%
