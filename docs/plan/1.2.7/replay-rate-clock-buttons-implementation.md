# Replay Rate and Chip Clock Toggle Buttons Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.2.7/replay-rate-clock-buttons.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

This change does not affect audio playback, timing, the sequencer, or the YM2149 emulator in this iteration. The buttons only modify song metadata fields (`frame` and `clock`). No audio path code is modified.

- Does this change affect React render timing? No.
- Does this modify `useCallback` or `useMemo` dependencies? No.
- Does this change state management patterns in audio paths? No.
- Does this modify the YM2149 emulator or SoundDriver? No.
- Must audio playback be manually tested after the change? No, because no audio path is touched. The buttons are metadata-only in this iteration.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

**Pre-existing documentation discrepancies fixed during analysis**

The following discrepancies between documentation and implementation were found and fixed before starting this feature:

- `FORMAT.md` — The SAVE SONG root structure was missing the `chip` and `frame` fields, even though both the saver writes them and the parser reads them. Added `chip` and `frame` to the root structure YAML example and documented loader and saver rules for both fields.
- `SPECIFICATION.md` — The Source Directory Structure table listed `src/utils` as 42 files; the actual count is 43. Corrected the count.

**Feature documentation updates**

- `PROJECT.md` — add a new functional requirement for replay rate and chip clock selection.
- `ARCHITECTURE.md` — no structural change. The InformationPanel already renders song metadata. State domain unchanged.
- `SPECIFICATION.md` — document the new `clock` field on the Song model, the new constants, and the supported values for `frame` and `clock`.
- `FORMAT.md` — add the `clock` key to the SAVE SONG root structure and document loader and saver behaviour for `clock`.

## Type and State Updates

**Type definitions**

Add a `clock` field to the `Song` interface. The `frame` field already exists.

File to modify: `src/synth/SoundDriver.ts`.

```typescript
export interface Song {
  title: string;
  author: string;
  year: number;
  speed: number;
  length: number;
  loop?: number | null;
  chip?: string;
  frame?: number;
  clock?: number;
  pattern: Pattern[];
  line: Line[];
  instrument: Instrument[];
}
```

**State store modifications**

No store changes. The song state lives in App.tsx local state and flows through `updateSong` from `useDataManagement`. The `updateSong` callback already merges any `Partial<Song>` patch via `{ ...prev, ...updates }`, so adding `frame` and `clock` to a patch requires no changes to the update mechanism.

## Constants Updates

Add clock constants and extend the supported frame rates.

File to modify: `src/constants/song.ts`.

```typescript
export const DEFAULT_SONG_CHIP = 'YM';
export const DEFAULT_SONG_FRAME = 50;
export const DEFAULT_SONG_CLOCK = 2000000;

export const SUPPORTED_SONG_CHIPS = [DEFAULT_SONG_CHIP];
export const SUPPORTED_SONG_FRAMES = [50, 60];
export const SUPPORTED_SONG_CLOCKS = [2000000, 1000000];
```

## Step by Step Implementation

**Update project documentation**

Update `PROJECT.md`, `SPECIFICATION.md`, and `FORMAT.md` as listed in the Documentation Updates section before any code change.

Files to modify: `docs/PROJECT.md`, `docs/SPECIFICATION.md`, `docs/FORMAT.md`.

**Add clock field to Song interface**

Add the optional `clock?: number` field to the `Song` interface, placed after `frame`.

File to modify: `src/synth/SoundDriver.ts`.

```typescript
export interface Song {
  // ...existing fields...
  frame?: number;
  clock?: number;
  // ...existing fields...
}
```

**Add clock constants and extend supported frames**

Add `DEFAULT_SONG_CLOCK` and `SUPPORTED_SONG_CLOCKS`. Add `60` to `SUPPORTED_SONG_FRAMES`.

File to modify: `src/constants/song.ts`.

```typescript
export const DEFAULT_SONG_CHIP = 'YM';
export const DEFAULT_SONG_FRAME = 50;
export const DEFAULT_SONG_CLOCK = 2000000;

export const SUPPORTED_SONG_CHIPS = [DEFAULT_SONG_CHIP];
export const SUPPORTED_SONG_FRAMES = [50, 60];
export const SUPPORTED_SONG_CLOCKS = [2000000, 1000000];
```

**Update song parser to read clock**

Add `clock` to `SongYamlNode`. Parse the `clock` field with the same numeric handling as `frame`. Default to `DEFAULT_SONG_CLOCK` when missing or invalid. Extend `SongParseMetadata` with `hasClockField`, `providedClockValue`, `normalizedClock`, and `isClockSupported`.

File to modify: `src/utils/songParser.ts`.

```typescript
interface SongYamlNode {
  // ...existing fields...
  clock?: unknown;
}

export interface SongParseMetadata {
  // ...existing fields...
  hasClockField: boolean;
  providedClockValue: unknown;
  normalizedClock: number;
  isClockSupported: boolean;
}

// Inside parseSongFromYaml:
const clockRaw = Number(songNode.clock);
const normalizedClock = Number.isFinite(clockRaw) ? Math.floor(clockRaw) : DEFAULT_SONG_CLOCK;

const song: Song = {
  // ...existing fields...
  chip: normalizedChip,
  frame: normalizedFrame,
  clock: normalizedClock,
};
```

**Update song saver to write clock**

Write the `clock` field to the YAML song node alongside `chip` and `frame`. Normalise to `DEFAULT_SONG_CLOCK` when missing.

File to modify: `src/utils/songIO.ts`.

```typescript
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';

// Inside buildSongYamlForExport:
const normalizedClock = currentSong.clock ?? DEFAULT_SONG_CLOCK;
songNode.clock = normalizedClock;
```

**Update default song creation**

Add `clock: DEFAULT_SONG_CLOCK` to the new song objects in `createNewSong` and `createDefaultSong`.

Files to modify: `src/hooks/useDataManagement.ts`, `src/hooks/useSongManagement.ts`.

```typescript
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';

const newSong: Song = {
  // ...existing fields...
  chip: DEFAULT_SONG_CHIP,
  frame: DEFAULT_SONG_FRAME,
  clock: DEFAULT_SONG_CLOCK,
};
```

Also update `normalizeStoredSongToCurrentSchema` in `src/hooks/useSongManagement.ts` to normalise `clock` the same way it normalises `frame`. This function handles localStorage migration of saved songs and must default `clock` to `DEFAULT_SONG_CLOCK` when missing.

The `normalizeSongForExport` function in `src/exports/core.ts` does not need changes. It spreads `...song` which already includes `clock` when present.

**Create the ToggleValueButton component**

Create a small presentational component that displays a value and toggles between two values on click. It receives the current value, the list of supported values, a display formatter, and an onChange callback.

File to create: `src/components/ToggleValueButton.tsx`.

```typescript
interface ToggleValueButtonProps {
  value: number;
  values: number[];
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
}
```

The button cycles to the next value in `values` on click, wrapping back to the first value after the last.

**Add toggle button styling**

Add a CSS class for the toggle button that matches the combined width of the two `number-spinner-button` buttons. Each `number-spinner-button` is 18px wide with a 2px column gap, so two buttons span 38px. The toggle button width is 38px and height 20px to match.

File to modify: `src/App.css`.

```css
.toggle-value-button {
  width: 38px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
  font-family: var(--font-mono);
  font-size: 10px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
}

.toggle-value-button:hover {
  border-color: var(--active-border);
}

.toggle-value-button:focus-visible {
  outline: none;
  border-color: var(--active-border);
}
```

**Add Rate and Clock buttons to InformationPanel**

Add the Rate button to the Title row and the Clock button to the Author row, both aligned to the right. The buttons call `onChange` with the updated `frame` or `clock` patch.

File to modify: `src/components/InformationPanel.tsx`.

```typescript
import { DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK, SUPPORTED_SONG_FRAMES, SUPPORTED_SONG_CLOCKS } from '../constants/song';
import { ToggleValueButton } from './ToggleValueButton';

const formatFrame = (frame: number) => `${frame} Hz`;
const formatClock = (clock: number) => `${clock / 1000000} MHz`;

const handleFrameToggle = useCallback((next: number) => {
  handleFieldChange('frame', next);
}, [handleFieldChange]);

const handleClockToggle = useCallback((next: number) => {
  handleFieldChange('clock', next);
}, [handleFieldChange]);
```

The Title row becomes a flex row with the existing label and input on the left and the Rate button on the right. The Author row follows the same pattern with the Clock button.

```tsx
<div className="information-field information-field-with-toggle">
  <label>Title:</label>
  <input ... className="information-input" />
  <ToggleValueButton
    value={song.frame ?? DEFAULT_SONG_FRAME}
    values={SUPPORTED_SONG_FRAMES}
    formatValue={formatFrame}
    onChange={handleFrameToggle}
    ariaLabel="Replay rate"
    className="toggle-value-button"
  />
</div>
```

Add a CSS helper class `information-field-with-toggle` so the row lays out the input and the right-aligned toggle button.

File to modify: `src/App.css`.

```css
.information-field-with-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}

.information-field-with-toggle .information-input {
  flex: 1;
}

.information-field-with-toggle .toggle-value-button {
  flex: 0 0 auto;
}
```

**Add unit tests for the ToggleValueButton component**

Test that the button displays the formatted current value, cycles to the next value on click, wraps to the first value after the last, and calls onChange with the new value.

Test file to create: `test/components/ToggleValueButton.test.tsx`.

**Add unit tests for song parser clock handling**

Test that the parser reads `clock` from YAML, defaults to `DEFAULT_SONG_CLOCK` when missing, and reports metadata correctly.

Test file to update: `test/utils/songParser.test.ts`.

**Add unit tests for song saver clock writing**

Test that the saver writes `clock` to the YAML output and that the field ordering test in `test/utils/instrumentColor.test.ts` is extended to verify `clock` appears after `frame` and before `speed`.

Test file to update: `test/utils/instrumentColor.test.ts`.

The existing test `orders chip/frame between year and speed when exporting song YAML` verifies `chip` > `year`, `frame` > `chip`, `speed` > `frame`. Extend it to also verify `clock` > `frame` and `speed` > `clock`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation (`PROJECT.md`, `SPECIFICATION.md`, `FORMAT.md`)
2. Add `clock` field to `Song` interface
3. Add clock constants and extend supported frames in `src/constants/song.ts`
4. Update song parser to read `clock`
5. Update song saver to write `clock`
6. Update default song creation in `useDataManagement` and `useSongManagement`
7. Create `ToggleValueButton` component
8. Add toggle button CSS
9. Add Rate and Clock buttons to `InformationPanel`
10. Add tests
11. Run verification loop

## Testing Strategy

**Unit tests**

Test the `ToggleValueButton` component in isolation.

Test file to create: `test/components/ToggleValueButton.test.tsx`.

```typescript
// Renders the formatted current value
// Cycles to the next value on click
// Wraps to the first value after the last
// Calls onChange with the new value
```

Test the song parser clock handling.

Test file to update: `test/utils/songParser.test.ts`.

```typescript
// Reads clock from YAML
// Defaults to DEFAULT_SONG_CLOCK when missing
// Reports hasClockField and isClockSupported in metadata
```

Test the song saver clock writing.

Test file to update: `test/utils/instrumentColor.test.ts`.

```typescript
// Writes clock to YAML output
// Extends the existing chip/frame ordering test to verify clock appears after frame and before speed
```

**Integration tests**

No new integration tests required for this iteration. The buttons are metadata-only and do not affect audio or export flows.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Manually verify the Rate and Clock buttons appear in the Title and Author rows, toggle between their two values, and reset to defaults on new song
