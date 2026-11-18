# Show the Viewport Size and Zoom in the About Dialog Implementation Plan

## Summary

| Field         | Value                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Intent        | Add a live `View: WxH` line with an optional zoom suffix to the About dialog, fed by a resize-aware hook.       |
| Key decisions | `useViewportSize` hook under `src/hooks/ui/`; zoom factor passed as `viewZoomFactor` through the documents slice. |
| Open risks    | None - additive display change with a unit-tested hook and an optional prop.                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.6/about-view-size-readout.md`.

## Best Practices

Follow TypeScript and React engineering standards from
`docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Hooks prefixed with `use`
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

This change does not affect audio playback, timing, the sequencer, render
hot paths, or state management in audio paths. The About modal is
presentational; the new hook subscribes to `window.resize` only.

## Documentation Updates

- `SPECIFICATION.md` - no update required; the About dialog's content lines
  are a presentation detail not tracked at that granularity.
- `PROJECT.md`, `ARCHITECTURE.md`, `FORMAT.md` - unaffected.

## Type and State Updates

**Type definitions**

No new shared types. `TextScale` already exists in `src/types/settings.ts`
and is not modified.

**State store modifications**

None. The hook keeps component-local state; no store or subscribing
component is affected.

## Step by Step Implementation

**Add the viewport-size hook**

Create a resize-aware hook returning the window viewport dimensions,
SSR-safe, mirroring the subscription pattern in `useResponsivePanels`.

File to create: `src/hooks/ui/useViewportSize.ts`.

```typescript
export interface ViewportSize {
  width: number;
  height: number;
}

export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

**Render the View line in the About modal**

Call the hook inside `AboutModal` and render `View: <width>x<height>` after
the version line. Append ` @ <factor>x` only when `zoomFactor` is a finite
number, keeping the component usable without the prop.

File to modify: `src/modals/information/AboutModal.tsx`.

```tsx
interface AboutModalProps {
  isOpen: boolean;
  version: string;
  onClose: () => void;
  onShowChangelog: () => void;
  onShowManual: () => void;
  runtimeLabel?: string | null;
  runtimeDetails?: string[];
  zoomFactor?: number | null;
}
```

```tsx
const { width, height } = useViewportSize();
const zoomSuffix =
  typeof zoomFactor === 'number' && Number.isFinite(zoomFactor)
    ? ` @ ${zoomFactor}x`
    : '';
```

```tsx
Version: <b>{version}</b>
<br />
<br />
View: {width}x{height}
{zoomSuffix}
<br />
<br />
```

**Carry the zoom factor through the modal pipeline**

Add `viewZoomFactor: number | null` to `DocumentModalGroupParams` (inherited
by `DocumentModalGroupProps`), forward it to `AboutModal` as `zoomFactor`,
and supply `Number(textScale) / 100` in the `App.tsx` documents literal.
`UseAppModalsParams.documents` picks the field up automatically because it
is typed as `DocumentModalGroupParams`.

Files to modify:

- `src/components/modal/DocumentModalGroup.tsx` - params field plus
  `zoomFactor={viewZoomFactor}` on `AboutModal`.
- `src/App.tsx` - `viewZoomFactor: Number(textScale) / 100` inside the
  `documents` literal of the `useAppModals` call.

**Unit-test the hook**

Cover the initial dimensions, a `resize` event update, listener cleanup,
and the undefined-window guard following the conventions in
`test/hooks/ui/useResponsivePanels.test.tsx`.

File to create: `test/hooks/ui/useViewportSize.test.tsx`.

## Implementation Order

1. Update documentation - none required per above.
2. Create `src/hooks/ui/useViewportSize.ts`.
3. Add `zoomFactor` to `AboutModal` and render the View line.
4. Add `viewZoomFactor` to `DocumentModalGroupParams` and forward it.
5. Supply `viewZoomFactor` in the `App.tsx` documents literal.
6. Add `test/hooks/ui/useViewportSize.test.tsx`.
7. Run the verification loop.

## Testing Strategy

**Unit tests**

`test/hooks/ui/useViewportSize.test.tsx` asserts:

- initial `{ width, height }` matches `window.innerWidth/innerHeight`;
- dispatching a `resize` event after changing the mocked dimensions updates
  the returned size;
- the listener is removed on unmount.

**Integration tests**

None required - the prop is optional and the rendering is a static line;
existing modal and e2e coverage exercises the About dialog open path.

## Verification

Run the verification loop in this order. The implementation is complete only
when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually open the About dialog, confirm the `View:` line shows the
  viewport pixels and the zoom suffix, resize the window, and confirm the
  line updates in real time
