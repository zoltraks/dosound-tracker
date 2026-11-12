# Settings Modal Implementation Plan

## Summary

| Field         | Value                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Intent        | Settings dialog with GENERAL and EDITOR categories, opened from a header gear button                |
| Key decisions | Draft commit on OK - session snapshot restores open flag, category, and draft - new per-key toggles |
| Open risks    | Enter confirms while a select holds focus - accepted, consistent with existing modals               |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.6/settings-modal.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces.
- Props interface named with `Props` suffix.
- Destructure props in function signature.
- Maintain accessibility with proper ARIA attributes.
- Keep components focused on single responsibility.
- No abbreviations in identifiers (use full words).
- Mirror the `MidiModal` draft pattern: a local settings copy edited in place, committed only by the confirm action.
- Keep the modal presentational. Seeding, session persistence, and YAML round-trip live in `src/utils/settings/` helpers with unit tests.

## Audio-Critical Requirements

The change does not touch the sequencer, the YM2149 emulator, `SoundDriver`, or any playback callback. The only audio-adjacent surface is the startup test tone: the new STARTUP_TONE flag gates the existing `playTestTone` call in `useStartupRestore`. Gating reads a localStorage flag once at mount. No render timing, dependency arrays, or audio-path state management change. Manual playback verification after the change: start the app with the flag on and off and confirm the tone plays or stays silent.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `PROJECT.md` — add F-17 covering the settings modal, and record the stateful restore rule as an application-wide convention: application state, including open views, restores on page reload.
- `SPECIFICATION.md` — extend the Session Persistence section with the explicit stateful-restore convention, the `settingsView` snapshot member, the three new storage keys, and the gating behaviour of the new toggles.
- `FORMAT.md` — add a `SETTINGS` section describing the `settings.yaml` file the modal SAVE and LOAD actions produce.

`ARCHITECTURE.md` needs no change: the modal joins the existing modal pipeline and introduces no new module boundary.

## Type and State Updates

**Type definitions**

New file `src/types/settings.ts`. `TrackPasteMode` is imported from `src/utils/track/trackClipboard.ts`, its existing owner.

```typescript
import type { TrackPasteMode } from '../utils/track/trackClipboard.ts';

export type SettingsCategory = 'general' | 'editor';

export interface SettingsValues {
  general: {
    theme: 'dark' | 'light';
    trackBackground: boolean;
    startupTone: boolean;
  };
  editor: {
    restoreCursor: boolean;
    restoreView: boolean;
    pasteTrackMode: TrackPasteMode;
  };
}

export interface SettingsSession {
  category: SettingsCategory;
  draft: SettingsValues;
}

export const SETTINGS_CATEGORIES: readonly SettingsCategory[] = ['general', 'editor'];

export const DEFAULT_SETTINGS: SettingsValues = {
  general: {
    theme: 'dark',
    trackBackground: true,
    startupTone: true,
  },
  editor: {
    restoreCursor: true,
    restoreView: true,
    pasteTrackMode: 'replace',
  },
};
```

**State store modifications**

`useUiStore` is not touched. The new state lives in three places:

- `useModalState` gains `isSettingsOpen` and `setIsSettingsOpen`, following the existing flag convention.
- `UiState` in `src/utils/storage/uiState.ts` gains `settingsView: SettingsSession | null`, persisted inside the existing `UI_STATE` snapshot.
- `StorageKeys` gains three new keys for the new toggles.

```typescript
static readonly STARTUP_TONE = 'dosound-tracker-startup-tone' as const;
static readonly RESTORE_CURSOR = 'dosound-tracker-restore-cursor' as const;
static readonly RESTORE_VIEW = 'dosound-tracker-restore-view' as const;
```

## Step by Step Implementation

**Update project documentation**

Apply the documentation updates listed above first. `PROJECT.md` gains F-17. `SPECIFICATION.md` records the stateful-restore convention and the new persistence members. `FORMAT.md` gains the `SETTINGS` format section.

**Extend the view-state snapshot**

File to modify: `src/utils/storage/uiState.ts`.

Add `'settings'` to `RestorableModal` and `RESTORABLE_MODALS`. Add `settingsView: SettingsSession | null` to `UiState`, defaulting to `null`. `loadUiState` validates the stored member: `category` must be a known `SettingsCategory`, otherwise it falls back to `'general'`; `draft` is carried opaquely and normalized by the settings layer at seed time. Add an `updateSettingsView` read-modify-write helper beside `updateMarkdownScroll` and `updateWindowScroll`.

```typescript
export const updateSettingsView = (settingsView: SettingsSession | null): void => {
  const state = loadUiState();
  saveUiState({ ...state, settingsView });
};
```

**Add the new storage keys**

File to modify: `src/utils/storage/storageKeys.ts`.

Add `STARTUP_TONE`, `RESTORE_CURSOR`, and `RESTORE_VIEW` under the UI preferences group. All three use `'on'` and `'off'` values and default to on when absent, matching `DEBUG_MODE` conventions. The full RESET clears them automatically through the `dosound-tracker-` prefix sweep in `applicationStorage.ts` - no change needed there.

**Create the settings state helpers**

New file `src/utils/settings/settingsState.ts`.

```typescript
export const normalizeSettings = (raw: unknown): SettingsValues => {
  /* merge raw onto DEFAULT_SETTINGS, member by member */
};
export const loadSettings = (): SettingsValues => {
  /* read the six keys, tolerant defaults */
};
export const writeSettingFlags = (settings: SettingsValues): void => {
  /* write STARTUP_TONE, RESTORE_CURSOR, RESTORE_VIEW */
};
```

`loadSettings` reads `THEME`, `TRACK_BACKGROUND_ENABLED`, `PASTE_TRACK_MODE`, `STARTUP_TONE`, `RESTORE_CURSOR`, and `RESTORE_VIEW`. Corrupt or absent values fall back to `DEFAULT_SETTINGS` members.

**Create the settings YAML helpers**

New file `src/utils/settings/settingsYaml.ts`, mirroring `midiConfiguration.ts` conventions.

```typescript
export class SettingsFormatError extends Error {
  /* */
}
export const buildSettingsYaml = (settings: SettingsValues): string => {
  /* */
};
export const parseSettingsFromYaml = (text: string, fallback: SettingsValues): SettingsValues => {
  /* */
};
```

The file carries root key `settings`, a `version: 1` field, and `general` and `editor` maps. `parseSettingsFromYaml` throws `SettingsFormatError` on non-YAML input, on a missing `settings` root, and on a wrong `version`. Unknown or missing members normalize through `normalizeSettings`.

**Extend the modal state and keyboard pipeline**

File to modify: `src/hooks/modal/useModalState.ts`. Add `isSettingsOpen` and `setIsSettingsOpen`.

File to modify: `src/hooks/keyboard/useNavigationSuspension.ts`. Destructure `isSettingsOpen` from `modalState` and include it in the aggregate flag.

File to modify: `src/hooks/modal/useModalManager.ts`. Add `isSettingsOpen`, `handleCancelSettings`, and `handleConfirmSettings` to the options. Include the flag in `hasConfirmModal`. In the Escape chain, `handleCancelSettings` runs first - the settings modal is the topmost surface when open. In the Enter chain, `handleConfirmSettings` runs first for the same reason.

**Extend the view-state persistence hook**

File to modify: `src/hooks/ui/useUiStatePersistence.ts`.

Add `isSettingsOpen` to `UiStatePersistenceFlags` and `if (f.isSettingsOpen) return 'settings';` to `deriveOpenModal`. Preserve the session member in the throttled snapshot write.

```typescript
saveUiState({
  openModal: deriveOpenModal(flags),
  sharedCurrentLine,
  markdownScroll: current.markdownScroll,
  windowScroll: window.scrollY,
  settingsView: current.settingsView,
});
```

**Wire restore and the new toggle gates**

File to modify: `src/hooks/app/useStartupRestore.ts`. Destructure `isSettingsOpen` and `setIsSettingsOpen` from `modalState`, pass the flag into `useUiStatePersistence`, and add `settings: () => setIsSettingsOpen(true)` to `openHandlers`. Gate the whole `restoreView` call on `RESTORE_VIEW` not reading `'off'`. Gate `playTestTone` on `STARTUP_TONE` not reading `'off'`.

File to modify: `src/hooks/storage/useEditorPersistence.ts`. Gate the cursor and instrument restore effect on `RESTORE_CURSOR` not reading `'off'`. The cursor persist effect keeps running - the toggle governs restoration, not recording.

**Expose committed setters**

File to modify: `src/hooks/ui/useTrackFocus.ts`. Add `setTrackBackgroundEnabled` to the returned object so the settings commit can write an explicit value rather than toggling.

File to modify: `src/hooks/modal/usePasteTrackOptions.ts`. Add `setPasteTrackMode` to `UsePasteTrackOptionsResult` and return the existing state setter - the persist effect already writes `PASTE_TRACK_MODE` on change.

**Own the draft in a settings dialog hook**

New file `src/hooks/modal/useSettingsDialog.ts`.

The draft and the active category live in a dedicated hook rather than inside the component - the global Enter handler in `useModalManager` must be able to commit the current draft, which it cannot reach inside a self-owned modal. The hook seeds from `settingsView` when a session exists and from the committed settings otherwise, and mirrors every change back into `settingsView` while the modal is open.

```typescript
export function useSettingsDialog(
  isOpen: boolean,
  committedSettings: SettingsValues,
): UseSettingsDialogResult {
  // category + draft state, seed effect on isOpen, session-write effect
}
```

**Create the settings modal component**

New file `src/modals/SettingsModal.tsx`. The modal is presentational and mounts only while open.

```typescript
interface SettingsModalProps {
  category: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
  draft: SettingsValues;
  onDraftChange: (draft: SettingsValues) => void;
  onCommit: () => void;
  onCancel: () => void;
  onLoadError?: (message: string) => void;
}
```

The component renders a `DialogFrame` with class `settings-modal` and a `SETTINGS` title. The body is a two-column layout: `.settings-categories` holds one button per `SETTINGS_CATEGORIES` entry with an `active` class on the selected one, and `.settings-pane` holds the label and control rows of the active category. Controls are checkboxes for booleans, a `dark`/`light` select for theme, and a three-option select for paste mode.

The footer follows `MidiModal` arrangement: `CANCEL` and `RESET` on the left, `LOAD`, `SAVE`, and `OK` on the right. RESET flips a `confirmingReset` state that swaps the pane for the reset message and the footer for a `CANCEL`/`RESET` pair - no nested dialog, so no overlay stacking concerns. SAVE serializes the draft through `buildSettingsYaml` and `downloadFile`. LOAD feeds a hidden `.yaml` file input through `parseSettingsFromYaml` under the `MAX_IMPORT_BYTES` cap, replaces the draft, and surfaces errors through `onLoadError` - pass `setSongError` down as the error channel like `MidiModal` uses `onLoadError`.

**Style the modal**

File to modify: `src/App.css`.

```css
.modal-dialog.settings-modal {
  width: 80vw;
  max-width: 720px;
  height: 80vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
```

Add `.settings-layout`, `.settings-categories`, `.settings-category-btn` with `.active`, `.settings-pane`, `.settings-row`, `.settings-label`, and `.settings-actions` reusing the existing theme variables and `command-btn` styling. The category column stays fixed width around 140px and the pane scrolls vertically, so no mobile breakpoint is required.

**Add the header gear button**

File to modify: `src/components/HeaderPanel.tsx`. Add `onShowSettings: () => void` to `HeaderPanelProps` and render the gear button directly after the theme toggle in `header-right`.

```tsx
<button className="theme-toggle" onClick={onShowSettings} title="Settings" aria-label="Settings">
  ⚙
</button>
```

**Wire the modal through the pipeline**

File to modify: `src/components/ModalContainer.tsx`. Import `SettingsModal`, add the settings props, and render it gated on `isSettingsOpen` with the existing modal ordering - after `MidiModal`, before `DownloadModal`.

File to modify: `src/components/ModalManager.tsx`. Thread the same props through to `ModalContainer`.

File to modify: `src/hooks/modal/useAppModals.tsx`. Accept the new params, pass them to `ModalManager`, and pass `isSettingsOpen`, `handleCancelSettings`, and `handleConfirmSettings` into `useModalManager`.

File to modify: `src/App.tsx`. Assemble the committed snapshot through `loadSettings()` memoized on the live mirrors, seed `useSettingsDialog` with it, wire `onShowSettings` to the header gear, and implement the commit and cancel handlers.

```typescript
const committedSettings = useMemo(
  () => loadSettings(),
  [isDarkMode, trackBackgroundEnabled, pasteTrackMode, modalState.isSettingsOpen],
);
const { settingsCategory, setSettingsCategory, settingsDraft, setSettingsDraft } =
  useSettingsDialog(modalState.isSettingsOpen, committedSettings);

const handleCommitSettings = () => {
  const next = settingsDraft;
  setIsDarkMode(next.general.theme === 'dark');
  setTrackBackgroundEnabled(next.general.trackBackground);
  writeSettingFlags(next);
  setPasteTrackMode(next.editor.pasteTrackMode);
  updateSettingsView(null);
  modalState.setIsSettingsOpen(false);
};

const handleCancelSettings = () => {
  updateSettingsView(null);
  modalState.setIsSettingsOpen(false);
};
```

`readFlag` lands in `settingsState.ts` as the single-key reader used by both `loadSettings` and the toggle gates.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update type definitions
3. Update storage keys and the `UiState` snapshot
4. Implement `src/utils/settings/` helpers
5. Extend the modal-state, suspension, persistence, and restore hooks
6. Expose the committed setters
7. Implement `SettingsModal` and its styles
8. Wire the header button and the modal pipeline in `App.tsx`
9. Add or update tests
10. Run verification loop

## Testing Strategy

**Unit tests**

Test file to create: `test/utils/settings/settingsState.test.ts`.

```typescript
// loadSettings returns DEFAULT_SETTINGS when storage is empty
// loadSettings maps THEME 'light' to theme 'light', garbage to 'dark'
// writeSettingFlags writes 'on'/'off' under the three new keys
// normalizeSettings merges partial input onto defaults member by member
```

Test file to create: `test/utils/settings/settingsYaml.test.ts`.

```typescript
// buildSettingsYaml then parseSettingsFromYaml round-trips all values
// parse throws SettingsFormatError on missing root, wrong version, non-YAML
// parse normalizes unknown members and preserves known ones
```

Test file to update: `test/utils/storage/uiState.test.ts`. Cover `'settings'` in the `RestorableModal` round-trip and `settingsView` load validation: unknown category falls back to `'general'`, absent member yields `null`.

**Integration tests**

Test file to create: `test/modals/SettingsModal.test.tsx`. Register `afterEach(() => cleanup())` per the component-test hygiene rule. Wrap debug output in try-catch around assertions per the test-output rule.

```typescript
// renders both categories and switches the active pane
// edits stay in the draft until OK calls onCommit with them
// Cancel calls onCancel without committing
// RESET shows the confirm state and the second RESET restores defaults in the draft
// opening with a stored settingsView session restores category and draft
// clearing session data happens through updateSettingsView(null) on close paths
// LOAD rejects oversize and malformed files through the error callback
```

Component tests run on the jsdom environment with the existing localStorage mock - no `node` pragma.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Manually verify the specific feature behaviour and confirm no regressions in consumer modules: gear opens the modal, edits commit on OK, ESC discards, reload restores open modal with category and draft intact
- Manually verify the startup tone honours its toggle and playback stays stable
