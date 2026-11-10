# Wire the quit-confirm modal into the Electron close path Implementation Plan

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Open the existing quit-confirm modal on the Electron close handshake    |
| Key decisions | Prompt only when `isSongDirty` is true; clean songs confirm immediately |
| Open risks    | none                                                                    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/wire-quit-confirm-modal.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- No abbreviations in identifiers (use full words)
- Keep hook signatures typed and minimal

## Audio-Critical Requirements

The close-guard handler runs once per close request, never on the audio path.
No render-timing, `useCallback`/`useMemo` dependency, or state-pattern changes
in audio paths. The hook's `isSongDirty` dependency re-registers the IPC
listener only on dirty-flag transitions, not on renders.

## Documentation Updates

- `SPECIFICATION.md` — add a short note to the Electron section recording that
  the window-close handshake prompts the quit-confirm modal only when the song
  is dirty and confirms immediately otherwise.

`PROJECT.md`, `ARCHITECTURE.md`, `FORMAT.md` need no changes: the behavior is
already implied by the modal constants and the guard's own comment.

## Step by Step Implementation

**Gate the close handler on the dirty flag**

`useElectronCloseGuard` currently confirms every `app-close-requested`
unconditionally. Change its signature to accept the dirty state and the modal
setter, and branch the handler.

File to modify: `src/hooks/app/useElectronCloseGuard.ts`.

```typescript
export const useElectronCloseGuard = ({
  isSongDirty,
  onQuitRequested,
}: {
  isSongDirty: boolean;
  onQuitRequested: (open: boolean) => void;
}) => {
  useEffect(() => {
    // ...existing api lookup...
    const handler = () => {
      if (isSongDirty) {
        onQuitRequested(true);
        return;
      }
      api.confirmAppClose?.();
    };
    api.onAppCloseRequested(handler);
    return () => {
      api.removeAppCloseRequestedListener?.(handler);
    };
  }, [isSongDirty, onQuitRequested]);
};
```

`onQuitRequested` receives the stable `setIsQuitConfirmOpen` dispatch, so the
effect re-registers only on dirty transitions.

**Wire the call site**

File to modify: `src/App.tsx`.

```typescript
useElectronCloseGuard({ isSongDirty, onQuitRequested: setIsQuitConfirmOpen });
```

**Add the hook test**

New file: `test/hooks/app/useElectronCloseGuard.test.tsx`. Assert:

- Dirty song + close request → `onQuitRequested(true)` called, `confirmAppClose` not called.
- Clean song + close request → `confirmAppClose` called, `onQuitRequested` not called.
- No `electronAPI` → listener never registered, no errors.
- Unmount → `removeAppCloseRequestedListener` called with the same handler.

## Implementation Order

1. Update documentation
2. Implement `useElectronCloseGuard` signature change
3. Wire the `App.tsx` call site
4. Add the hook test
5. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/hooks/app/useElectronCloseGuard.test.tsx`.

Mock `window.electronAPI` with `onAppCloseRequested`, `confirmAppClose`,
`cancelAppClose`, `removeAppCloseRequestedListener` spies; capture the
registered handler and invoke it under both dirty states.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Modal cancel path calls `cancelAppClose` (already wired via
  `handleCancelQuit`), confirm path calls `confirmAppClose` (already wired via
  `handleConfirmQuit`) - only the open trigger is new.
