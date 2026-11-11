# Add Sound Settings Category Implementation Plan

## Summary

| Field         | Value                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| Intent        | Wire the persisted engine selection into the settings surface with live engine swap   |
| Key decisions | `sound` group rides the draft-commit model; `useAudioSetup` derives the id per render |
| Open risks    | Engine disposal during swap must silence first; settings file stays at version 1      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.8/add-sound-settings-category.md`.

## Best Practices

Follow TypeScript and React engineering standards from `standard/typescript-react-development.md`:

- The engine selector uses the existing `settings-row` + `<select>` pattern
  from the Theme row.
- No abbreviations in identifiers (use full words).

## Audio-Critical Requirements

- The swap path disposes the old engine through the existing
  `useAudioSetup` effect cleanup - it calls `silenceAll` before `dispose`
  per the engine record's switch contract.
- No render-timing, dependency-array, or prop-mirroring pattern changes in
  the playback path - the only change is that `resolvedEngineId` derives
  from the `engineId` prop instead of a mount-time `useState`.
- Manual verification after the change: switch engine in Settings, hear
  previews and playback on both engines, confirm no stale audio.

## Documentation Updates

- `PROJECT.md` - the settings feature records the `SOUND` category and the
  selectable engine option.
- `SPECIFICATION.md` - the settings surface lists the `sound` group and the
  live-switch semantics; the settings file schema gains the `sound` section.
- `FORMAT.md` - the settings YAML structure gains `sound.engine` under the
  `settings` root, still version 1.
- `ARCHITECTURE.md` - the settings surface paragraph names the new category.

## Type and State Updates

**Type definitions**

`src/types/settings.ts` - `SettingsCategory` gains `'sound'`,
`SettingsValues` gains `sound: { engine: SoundEngineId }`,
`SETTINGS_CATEGORIES` and `DEFAULT_SETTINGS` gain the matching entries.

```typescript
export type SettingsCategory = 'general' | 'editor' | 'sound';

export interface SettingsValues {
  general: { theme: 'dark' | 'light'; trackBackground: boolean; startupTone: boolean };
  editor: { restoreCursor: boolean; restoreView: boolean; pasteTrackMode: TrackPasteMode };
  sound: { engine: SoundEngineId };
}
```

**State changes**

`useAudioSetup` derives `resolvedEngineId` from the `engineId` prop per
render (the persisted key becomes a mount-time fallback only). `App.tsx`
holds `soundEngineId` state seeded from `loadSoundEngineId()` and passes it
to `useAudioSetup`; `handleCommitSettings` writes the selection back.

## Step by Step Implementation

**Extend the settings model**

`src/types/settings.ts` gains the `sound` group and category.
`normalizeSettings` validates `sound.engine` against `SOUND_ENGINE_IDS` with
fallback to the base value. `loadSettings` composes `sound.engine` through
`loadSoundEngineId()`. `writeSettingFlags` writes
`StorageKeys.SOUND_ENGINE` with the selected id.

**Extend the settings file**

`buildSettingsYaml` emits `sound.engine` inside `settings`.
`parseSettingsFromYaml` picks it up through `normalizeSettings` unchanged -
version stays `1` and files without `sound` keep the fallback.

**Add the SOUND category to the modal**

`CATEGORY_LABELS` gains `sound: 'SOUND'`. The pane renders a
`settings-row` select for `draft.sound.engine` listing `Internal` and
`Ayumi` from `SOUND_ENGINE_LABELS`.

**Wire the live switch**

`App.tsx` adds `soundEngineId` state seeded from `loadSoundEngineId()`,
passes it to `useAudioSetup`, recomputes `committedSettings` when it
changes, and sets it in `handleCommitSettings`. `useAudioSetup` derives
`resolvedEngineId` per render and the effect cleanup silences the landed
engine before `dispose`.

## Testing Strategy

**Unit tests**

- `settingsState` tests gain: `loadSettings` composes `sound.engine`,
  `normalizeSettings` validates and falls back, `writeSettingFlags` writes
  the key.
- `settingsYaml` tests gain: `sound.engine` round-trips; a file without
  `sound` keeps the fallback.
- `SettingsModal` tests gain: the `SOUND` category renders the engine
  select and routes edits through `onDraftChange`.
- New `useAudioSetup` test: changing the `engineId` prop disposes the old
  engine and creates the new one (mocked `createSoundEngine`).

**Verification**

Run the verification loop in this order.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
