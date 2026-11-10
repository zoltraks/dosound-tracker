# Play the line from its start with Ctrl+Enter implementation plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.8/ctrl-enter-play-line.md`.

## Best Practices

Follow TypeScript and React engineering standards from `standard/ts-react-development.md`:

- Reuse the existing playback handlers rather than duplicating start and stop logic.
- Thread the new callback through the same prop path as the existing one.
- Props interface named with `Props` suffix, destructured in the signature.
- No abbreviations in identifiers.

## Audio-Critical Requirements

This change adds a keyboard branch and a thin wrapper around existing playback handlers. It does not change playback timing.

- Does this change affect React render timing? No. It adds one conditional in the track key handler and one `useCallback` in `App.tsx` that delegates to existing handlers.
- Does this modify `useCallback` or `useMemo` dependencies in audio paths? The new `handleToggleLineFromStart` has its own dependency array. The `TrackPanel` key handler gains one prop dependency, `onToggleLineFromStart`, mirroring the existing `onToggleLineFromCursor` dependency.
- Does this change state management patterns in audio paths? No. It reuses `handleStartLinePlayback` and `handleStopLinePlayback` unchanged and sets the existing `patternReturnPositionRef`.
- Does this modify the YM2149 emulator or SoundDriver? No.
- Must audio playback be manually tested after the change? Yes. Verify Ctrl+Enter plays the line from the first row, Enter restores the original cursor position, and neither disturbs song playback or line timing.

No audio-critical linting exceptions are introduced.

## Documentation Updates

Update the active documentation set before source changes.

- `PROJECT.md` — no change. This extends the existing keyboard input requirement without adding a new capability class.
- `ARCHITECTURE.md` — no change.
- `SPECIFICATION.md` — document the track play toggles in the Playback shortcuts section: Enter plays the line from the cursor row and toggles with restore, Ctrl+Enter plays the line from its first row and toggles with restore.
- `FORMAT.md` — no change.

## Type and State Updates

No type definitions or stores change. The new handler reuses the existing `patternReturnPositionRef`, `isLinePlaying` state, and the `handleStartLinePlayback` and `handleStopLinePlayback` callbacks.

## Step by Step Implementation

Perform the steps in the order listed.

**Document the shortcuts in SPECIFICATION.md**

Add Enter and Ctrl+Enter to the Playback shortcuts list, before any code change.

File to modify: `docs/SPECIFICATION.md`.

**Add the play-from-start toggle handler in App.tsx**

Add `handleToggleLineFromStart`. If the line is already playing, stop and restore, matching the Enter toggle. Otherwise save the cursor return position, then start the line from its first row through the existing `handleStartLinePlayback`.

File to modify: `src/App.tsx`.

```typescript
const handleToggleLineFromStart = useCallback(
  (lineIndex: number) => {
    if (isLinePlaying && sequencerState.isPlaying) {
      handleStopLinePlayback();
      return;
    }

    const playlistLength = currentSong.line.length;
    if (playlistLength === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(sequencerState.currentPattern, playlistLength - 1));

    // Save the cursor return position so pressing Enter or Ctrl+Enter restores it.
    patternReturnPositionRef.current = { pattern: clampedIndex, line: lineIndex };

    handleStartLinePlayback();
  },
  [
    isLinePlaying,
    sequencerState.isPlaying,
    sequencerState.currentPattern,
    currentSong.line.length,
    handleStopLinePlayback,
    handleStartLinePlayback,
  ],
);
```

`handleStartLinePlayback` does not overwrite `patternReturnPositionRef` in its start-from-stopped branch, so the saved cursor position persists. When a song is already playing, `handleStartLinePlayback` records its own return position, matching the existing PLAY LINE behaviour in that case.

**Thread the callback through TrackerSection**

Add an `onToggleLineFromStart` prop to `TrackerSection` and pass it to each `TrackPanel`, mirroring `onToggleLineFromCursor`.

File to modify: `src/components/TrackerSection.tsx`.

**Handle Ctrl+Enter in the track key handler**

Add the `onToggleLineFromStart` prop to `TrackPanel` and branch the existing Enter handler on the Ctrl modifier.

File to modify: `src/components/TrackPanel.tsx`.

```typescript
} else if (key === 'ENTER') {
  event.preventDefault();
  if (event.ctrlKey) {
    onToggleLineFromStart(currentLine);
  } else {
    onToggleLineFromCursor(currentLine);
  }
}
```

Add `onToggleLineFromStart` to the `handleKeyDown` dependency array, next to `onToggleLineFromCursor`.

**Wire the handler in App.tsx render**

Pass `onToggleLineFromStart={handleToggleLineFromStart}` to `TrackerSection`, next to `onToggleLineFromCursor`.

File to modify: `src/App.tsx`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md`.
2. Add `handleToggleLineFromStart` in `App.tsx`.
3. Thread the prop through `TrackerSection`.
4. Branch the Enter handler in `TrackPanel`.
5. Wire the handler in the `App.tsx` render.
6. Update the component test.
7. Run the verification loop.

## Testing Strategy

**Component tests**

Update `test/components/TrackPanel.test.tsx`.

```typescript
// With the track active and a cursor line set:
// - pressing Enter calls onToggleLineFromCursor with the current line and not onToggleLineFromStart
// - pressing Ctrl+Enter calls onToggleLineFromStart with the current line and not onToggleLineFromCursor
```

The `TrackPanel` test harness must pass the new `onToggleLineFromStart` prop.

**Integration and manual verification**

No new integration test is required. Manual verification covers the playback and restore flow, since the App-level handlers drive the sequencer.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run format`.
- Run `npm run build`.
- Run `npm test test/components/TrackPanel` during iteration, then the full `npm test` at completion.
- Manually verify that Ctrl+Enter plays the line from its first row, that Enter and Ctrl+Enter both stop and restore the original cursor position while playing, and that song playback and line timing are unaffected.
