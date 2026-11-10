# Memoize the Track Rows During Playback Implementation Plan

## Summary

| Field         | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Intent        | Cut per-tick reconciliation so a playback row change re-renders only the rows that changed        |
| Key decisions | `React.memo` on `TrackLine` with primitive props; class and style derivation moves inside the row |
| Open risks    | none - style derivation moves verbatim                                                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/memoize-track-rows.md`.

## Analysis

Every sequencer row tick sets `sharedCurrentLine`, re-rendering `App` -> `TrackerSection` -> three `TrackPanel`s -> 192 `TrackLine`s, each receiving a fresh `lineStyle` object literal (colored rows) that would defeat shallow comparison. Two rows per panel change per tick; the other 190 reconcile for nothing.

Every prop except `lineStyle` is already memo-stable: `lineIndex`/`volume` primitives, `noteData` a `pattern.step` element reference, `lineClassName` a value-compared string, `noteIsActive`/`volumeIsActive` booleans, `onLineClick` and `formatNoteDisplay` stable callbacks. Passing `isCurrent` and `instrumentColor` as primitives lets the row derive class and style internally - `currentLine` itself must not become a prop, since it changes for every row every tick.

The `current` class condition is `lineIndex === currentLine` (unqualified by `isActive`), so `isCurrent` maps to exactly that. `getTrackLineClass` changes signature from `(lineIndex, currentLine)` to `(lineIndex, isCurrent)` - `TrackPanel` is its only caller and no longer needs it once derivation moves inside the row.

## Documentation Updates

None of `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` requires changes: render-path memoization of a presentational row, no documented contract affected.

## Audio-Critical Requirements

- `React.memo` wraps a pure presentational component - no hook, state, or callback-identity changes on the audio path.
- `useCallback`/`useMemo` dependency arrays elsewhere are untouched.
- Style derivation moves verbatim - identical `track-line-colored` class and `--track-line-color` custom property, so rendered output is unchanged.
- Playback verification: row highlight still tracks playback; colored instrument rows keep their color.

## Step by Step Implementation

**Reshape the class helper**

`getTrackLineClass` takes `(lineIndex: number, isCurrent: boolean)` instead of `(lineIndex, currentLine)`.

File to modify: `src/utils/track/trackRendering.ts`.

**Memoize the row**

`TrackLine` gains `isCurrent: boolean` and `instrumentColor: string | null` props, drops `lineClassName`/`lineStyle`, derives `className` and `style` inside with the verbatim expressions, and exports through `React.memo`.

File to modify: `src/components/TrackLine.tsx`.

**Pass primitives from the panel**

The render loop passes `isCurrent={lineIndex === currentLine}` and `instrumentColor={getInstrumentColorForNote(noteData, instrumentColorMap)}`; the `getLineClass` callback and `getTrackLineClass` import are removed.

File to modify: `src/components/TrackPanel.tsx`.

**Update the row test**

`test/utils/vgmAndTrackLine.test.tsx` swaps the `lineClassName` prop for `isCurrent`/`instrumentColor` primitives.

File to modify: `test/utils/vgmAndTrackLine.test.tsx`.

## Implementation Order

1. Update documentation (none required - recorded above)
2. `getTrackLineClass` signature
3. `TrackLine` memo + derivation
4. `TrackPanel` prop pass
5. Test prop update
6. Run verification loop

## Testing Strategy

**Unit tests**

The existing `vgmAndTrackLine.test.tsx` row suite covers click routing and volume display - updated prop surface, same assertions. `test/components/TrackPanel*.test.tsx` guards the panel path.

**Integration tests**

The e2e playback flow re-renders rows continuously - the smoke suite is the regression net.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the playing-row highlight and instrument colors render identically
