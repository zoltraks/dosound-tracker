# Remember the editor cursor across reloads implementation plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.8/persist-editor-cursor.md`.

## Best Practices

Follow TypeScript and React engineering standards from `standard/ts-react-development.md`:

- Keep parsing, clamping, and validation as pure functions in dedicated utility modules so they are unit testable.
- Reuse the canonical `useLocalStorageState` hook for single-value panel cursors.
- No `any`. Validate unknown input from local storage as `unknown`.
- Centralise every new local storage key in `StorageKeys`.
- Empty catch blocks around local storage access include an `// ignore` comment.
- No abbreviations in identifiers.

## Phasing

The work is delivered in three phases. Each phase leaves the codebase buildable and testable, and the full verification loop runs at the end of each phase. The audio-critical work is isolated in the last phase.

- Phase 1, top-level editor cursor, focused section, selected track, playlist line, track row, and track column.
- Phase 2, selected instrument and single-value panel cursors, song information field, playlist track column, and octave.
- Phase 3, per-panel envelope step cursors for the volume, arpeggio, pitch, noise, and mode panels, independent of the selected instrument.

## Audio-Critical Requirements

Phases 1 and 2 do not touch audio components. They add effects and swap plain local state for persisted local state outside the audio path.

Phase 3 modifies `EnvelopePanel` and `ToneNoisePanel`, which hold audio-critical prop-mirrored state.

- Does this change affect React render timing? Only the step cursor state changes. The mirrored `envelopeData` state, its `useEffect` sync, and the `onChange` path are left untouched.
- Does this modify `useCallback` or `useMemo` dependencies in audio paths? No audio-path dependency arrays change. No new prop is added; only the local `currentPosition` state is swapped for a persisted equivalent.
- Does this change state management patterns in audio paths? No. The envelope value pipeline is unchanged. Only `currentPosition` moves from `useState` to `useLocalStorageState`, keyed per panel and independent of the instrument.
- Does this modify the YM2149 emulator or SoundDriver? No.
- Must audio playback be manually tested after the change? Yes for Phase 3. Verify envelope editing and instrument preview still sound correct and that switching instruments and reloading does not disturb envelope data.

No audio-critical linting exceptions are introduced. The persist effects in `App.tsx` are gated on `sequencerState.isPlaying` for the top-level cursor, so no local storage writes for the sequencer position occur on the audio path.

## Documentation Updates

Update the active documentation set before source changes.

- `PROJECT.md` — add a short behavioural note that the editor cursor, including each panel's internal position and the selected instrument, is remembered across reloads.
- `ARCHITECTURE.md` — no change. Persistence uses existing state domains and the existing local storage mechanism.
- `SPECIFICATION.md` — document the new storage keys, the stored shapes, and the restore-with-clamp behaviour in a session-persistence note.
- `FORMAT.md` — no change. The saved and exported song file formats are not affected.

## Storage Keys

Add the following keys to `StorageKeys` in `src/utils/storageKeys.ts`.

```typescript
static readonly EDITOR_CURSOR = 'dosound-tracker-editor-cursor' as const;
static readonly CURRENT_INSTRUMENT = 'dosound-tracker-current-instrument' as const;
static readonly SONG_INFO_FIELD = 'dosound-tracker-song-info-field' as const;
static readonly PLAYLIST_TRACK = 'dosound-tracker-playlist-track' as const;
static readonly OCTAVE = 'dosound-tracker-octave' as const;
static readonly ENVELOPE_CURSOR_PREFIX = 'dosound-tracker-envelope-cursor-' as const;
```

The envelope cursor key for a panel type is the prefix followed by the type, for example `dosound-tracker-envelope-cursor-volume`.

## Phase 1, Top-Level Editor Cursor

**Type and helpers**

Create a pure module for the top-level cursor.

File to create: `src/utils/editorCursor.ts`.

```typescript
import type { NavigationSection } from '../constants/navigation';

export type CursorTrack = 'A' | 'B' | 'C';
export type CursorColumn = 'note' | 'volume';

export interface EditorCursor {
  section: NavigationSection;
  track: CursorTrack;
  playlistLine: number;
  trackRow: number;
  column: CursorColumn;
}

// Parse and validate raw local storage content. Returns null on any invalid input.
// A missing or invalid section defaults to the selected track's section.
export function parseEditorCursor(raw: string | null): EditorCursor | null;

export function clampEditorCursor(
  cursor: EditorCursor,
  playlistLength: number,
  patternLength: number,
): EditorCursor;

export function serializeEditorCursor(cursor: EditorCursor): string;
```

Validation rejects non-object JSON, non-finite numbers, a `track` outside `A`, `B`, `C`, and a `column` outside `note`, `volume`. A `section` outside `NAVIGATION_ORDER` is replaced with `track${track}`. Numbers are floored. Clamping maps an empty playlist or empty pattern to index 0 and otherwise constrains to the valid range.

**Restore the cursor on mount**

Add a restore effect in `App.tsx` that runs once. It restores the selected track with `setLastTrackId`, the focused section with `setActiveSection`, the playlist line with `setPosition`, the track row with `setSharedCurrentLine`, and the column with `setCurrentTrackColumn`. A ref marks restoration complete so the persist effect does not write before restore.

File to modify: `src/App.tsx`.

```typescript
const hasRestoredCursorRef = useRef(false);

useEffect(() => {
  const stored = parseEditorCursor(localStorage.getItem(StorageKeys.EDITOR_CURSOR));
  if (stored) {
    const clamped = clampEditorCursor(stored, currentSong.line.length, currentSong.length);
    setLastTrackId(clamped.track);
    setActiveSection(clamped.section);
    setPosition(clamped.playlistLine, 0, 0);
    setSharedCurrentLine(clamped.trackRow);
    setCurrentTrackColumn(clamped.column);
  }
  hasRestoredCursorRef.current = true;
}, []);
```

**Persist the cursor when not playing**

Add a persist effect in `App.tsx`, declared after the restore effect. It early-returns until restoration completes and while playback is running, then writes the current cursor.

File to modify: `src/App.tsx`.

```typescript
useEffect(() => {
  if (!hasRestoredCursorRef.current) return;
  if (sequencerState.isPlaying) return;
  const cursor: EditorCursor = {
    section: activeSection,
    track: targetTrackId,
    playlistLine: sequencerState.currentPattern,
    trackRow: sharedCurrentLine,
    column: currentTrackColumn,
  };
  try {
    localStorage.setItem(StorageKeys.EDITOR_CURSOR, serializeEditorCursor(cursor));
  } catch {
    // ignore
  }
}, [
  activeSection,
  targetTrackId,
  sequencerState.currentPattern,
  sequencerState.isPlaying,
  sharedCurrentLine,
  currentTrackColumn,
]);
```

## Phase 2, Selected Instrument and Single-Value Panel Cursors

**Persist and restore the selected instrument**

Extend the mount restore effect to restore the selected instrument, and add a persist effect. On restore, find the instrument in `currentSong.instrument` whose id matches the stored id and apply it with `setCurrentInstrument`. If none matches, keep the default. Persist `currentInstrument.id`.

File to modify: `src/App.tsx`.

```typescript
// In the mount restore effect, after the editor cursor is applied:
const storedInstrumentId = localStorage.getItem(StorageKeys.CURRENT_INSTRUMENT);
if (storedInstrumentId) {
  const match = currentSong.instrument.find((inst) => inst.id === storedInstrumentId);
  if (match) {
    setCurrentInstrument(match);
  }
}

// Persist effect:
useEffect(() => {
  if (!hasRestoredCursorRef.current) return;
  try {
    localStorage.setItem(StorageKeys.CURRENT_INSTRUMENT, currentInstrument.id);
  } catch {
    // ignore
  }
}, [currentInstrument]);
```

**Persist the song information field**

Replace the plain `useState` for `lastFocusedField` with `useLocalStorageState`, validating the stored value against the allowed field names.

File to modify: `src/components/InformationPanel.tsx`.

```typescript
const [lastFocusedField, setLastFocusedField] = useLocalStorageState<SongInfoField>(
  StorageKeys.SONG_INFO_FIELD,
  'title',
  { read: (raw) => (isSongInfoField(raw) ? raw : 'title') },
);
```

**Persist the playlist track column**

Replace the plain `useState` for `currentTrack` with `useLocalStorageState`, validating against `A`, `B`, `C`.

File to modify: `src/components/PlaylistPanel.tsx`.

**Persist the octave in the ui store**

Persist `currentOctave` in `uiStore`, mirroring the existing `channelMutes` persistence. Read the initial octave from local storage and write it in `setCurrentOctave`, clamped to the octave bounds.

File to modify: `src/stores/uiStore.ts`.

## Phase 3, Per-Panel Envelope Step Cursors

The step cursor is remembered per panel and is independent of the selected instrument. Changing the instrument must not move it, which matches the current behaviour where `currentPosition` is not reset on instrument change. No instrument id is threaded into the panels, so there is no second source of truth tied to the instrument.

**Clamp helper for the envelope cursor**

Add a small pure helper that reads a stored position and clamps it to the envelope length. It is used as the `read` serializer for `useLocalStorageState`.

File to modify: `src/utils/envelopePanelUtils.ts`.

```typescript
export function readEnvelopeCursor(raw: string | null): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(ENVELOPE_LENGTH - 1, Math.floor(value)));
}
```

**Persist the step cursor per panel**

Replace `const [currentPosition, setCurrentPosition] = useState(0)` with `useLocalStorageState`, keyed per panel type using `StorageKeys.ENVELOPE_CURSOR_PREFIX + type`. The mirrored `envelopeData` state, its `useEffect` sync, and the `onChange` path are not modified. No new prop is added.

Files to modify: `src/components/EnvelopePanel.tsx`, `src/components/ToneNoisePanel.tsx`.

```typescript
const [currentPosition, setCurrentPosition] = useLocalStorageState<number>(
  StorageKeys.ENVELOPE_CURSOR_PREFIX + type,
  0,
  { read: readEnvelopeCursor, write: (value) => String(value) },
);
```

`ToneNoisePanel` uses a fixed type key, for example `StorageKeys.ENVELOPE_CURSOR_PREFIX + 'mode'`.

## Implementation Order

Execute the phases in order. Within each phase, update documentation first, then code, then tests, then run the verification loop.

1. Phase 1, top-level editor cursor.
2. Phase 2, selected instrument and single-value panel cursors.
3. Phase 3, per-instrument envelope step cursors.

## Testing Strategy

**Unit tests, Phase 1**

Cover the pure cursor utility.

Test file to create: `test/utils/editorCursor.test.ts`.

```typescript
// parseEditorCursor
// - valid JSON with section, track, playlistLine, trackRow, column returns the cursor
// - non-JSON, null, missing or non-finite numbers return null
// - track outside 'A' | 'B' | 'C' returns null
// - column outside 'note' | 'volume' returns null
// - a valid NAVIGATION_ORDER section is preserved; an invalid one defaults to `track${track}`

// clampEditorCursor
// - in-range cursor unchanged; playlistLine and trackRow clamp to bounds; empty playlist and empty pattern clamp to 0
// - section and column pass through unchanged

// serializeEditorCursor round-trips through parseEditorCursor
```

**Unit tests, Phase 2**

- Validators for the song information field and the playlist track column: valid values preserved, invalid values fall back to the default.
- `uiStore` test update: octave persistence reads the initial value and writes on change, clamped to bounds.

Test files to update or create: `test/utils/` for the validators, `test/stores/uiStore.test.ts`.

**Unit tests, Phase 3**

- `readEnvelopeCursor`: parses a valid stored position, clamps out-of-range and negative values to `[0, ENVELOPE_LENGTH - 1]`, floors non-integers, and returns 0 for missing or non-numeric input.

Test file to update: `test/utils/envelopePanelUtils.test.ts`.

**Integration and manual verification**

- Manual reload verification for each phase, confirming the focused section, track position, selected instrument, song information field, playlist track column, octave, and per-panel envelope cursors are all restored.
- Phase 3 manual verification that switching the selected instrument does not move any envelope step cursor.
- Phase 3 manual audio verification, confirming envelope editing and instrument preview still sound correct and that envelope data is unaffected.

## Implementation Deviations

The playlist track column and the envelope step cursors use a plain `useState` with a lazy initializer and a persist effect rather than `useLocalStorageState`. Their setters are captured inside memoized callbacks, and the `useLocalStorageState` setter is not recognised as a stable dispatch by the React Compiler, which breaks manual memoization preservation. The song information field, whose setter is not captured in a memoized callback, uses `useLocalStorageState` as planned.

## Verification

Run the verification loop at the end of each phase, in this order. A phase is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run format`.
- Run `npm run build`.
- Run the targeted tests for the phase during iteration, then the full `npm test` at the end of the phase.
- Manually verify the phase behaviour, and for Phase 3 verify audio playback and envelope editing.
