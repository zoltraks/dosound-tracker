# Add Clone Track Command Implementation Plan

## Summary

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Intent        | Implement CLONE TRACK from `docs/change/1.5.7/clone-track.md`                          |
| Key decisions | Steps-parameterized track creator shared with ADD TRACK, clone resolution in track ops |
| Open risks    | none                                                                                   |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.7/clone-track.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `SPECIFICATION.md` - record the CLONE TRACK command beside the selection and clipboard rules it composes.
- `public/MANUAL.md` - add the CLONE TRACK bullet to the Track Operations list.

`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` require no changes - the command introduces no new requirement, boundary, or format.

## Step by Step Implementation

**Steps-parameterized track creator**

Extract the body of `handleCreateNewTrack` into a shared creator that accepts the new pattern's initial steps. `handleCreateNewTrack` delegates with empty steps; a new `handleCreateTrackFromSteps` passes a prepared `step` array. Both keep the single `updateSong` call so pattern creation and playlist assignment stay one history entry.

File to modify: `src/hooks/song/usePlaylistOperations.ts`.

```typescript
const createTrackWithSteps = useCallback((steps: Step[]) => {
  // existing handleCreateNewTrack body, newPattern built with steps
}, [...]);

const handleCreateNewTrack = useCallback(() => {
  createTrackWithSteps(emptySteps);
}, [createTrackWithSteps]);
```

`handleCreateTrackFromSteps` joins the result interface and the returned object.

**Clone resolution in track operations**

`useTrackOperations` gains a `createTrackFromSteps` argument and returns `handleCloneTrack`. The handler resolves the source track through `trackSelection` and `getActiveTrackId`, reads its pattern, deep-copies the selected range or the whole track, and delegates to `createTrackFromSteps`. A missing pattern reports the same `trackClipboardError` message COPY TRACK uses.

File to modify: `src/hooks/song/useTrackOperations.ts`.

```typescript
const handleCloneTrack = useCallback(() => {
  const trackId = trackSelection ? trackSelection.trackId : getActiveTrackId();
  const pattern = getCurrentPatternForTrack(trackId);
  if (!pattern) {
    setTrackClipboardError('No pattern is assigned for the current track at this position.');
    return;
  }
  const range = trackSelection ? normalizeTrackSelection(trackSelection) : undefined;
  const source = pattern.step || [];
  const fragment = range ? source.slice(range.start, range.end + 1) : source;
  createTrackFromSteps(fragment.map(deepCopyStep));
}, [...]);
```

**Command panel button**

`CommandPanel` gains the `onCloneTrack` prop and a `CLONE TRACK` button between `ADD TRACK` and `COPY TRACK`, using the plain `onClick` convention of the neighbouring track commands.

File to modify: `src/components/CommandPanel.tsx`.

```typescript
<button onClick={onNewTrack} className="command-button">
  ADD TRACK
</button>
<button onClick={onCloneTrack} className="command-button">
  CLONE TRACK
</button>
<button onClick={onCopyTrack} className="command-button">
  COPY TRACK
</button>
```

**Application wiring**

`App.tsx` destructures `handleCreateTrackFromSteps` from `usePlaylistOperations`, passes it to `useTrackOperations` as `createTrackFromSteps`, destructures `handleCloneTrack`, and wires `onCloneTrack={handleCloneTrack}` on `CommandPanel`. The hook call order already places `usePlaylistOperations` before `useTrackOperations`.

File to modify: `src/App.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update `usePlaylistOperations` with the shared creator
3. Update `useTrackOperations` with `handleCloneTrack`
4. Update `CommandPanel` and `App.tsx`
5. Add or update tests
6. Run verification loop

## Testing Strategy

**Unit tests**

`handleCloneTrack` copies the whole track with no selection, copies only the selected range into the first rows of a new pattern with a selection, reports the missing-pattern error, and produces one `updateSong` call.

Test file to update: `test/hooks/song/useTrackOperations.test.tsx`.

`handleCreateTrackFromSteps` assigns a new unique pattern to the target track at the current line and focuses the section.

Test file to update: `test/hooks/song/usePlaylistOperations.test.tsx`.

**Integration tests**

`CommandPanel` renders `CLONE TRACK` between `ADD TRACK` and `COPY TRACK` and clicking it fires `onCloneTrack`.

Test file to update: `test/components/CommandPanel.test.tsx`.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the specific feature behaviour and confirm no regressions in consumer modules
