# Add Sound Settings Category

**Type:** Feature

## Summary

| Field         | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| Intent        | Add the `SOUND` category to the settings surface so the sound engine is selectable in-UI |
| Key decisions | Engine selection rides the existing draft-commit model; switching applies on OK live     |
| Open risks    | Live swap disposes the old engine - sounding notes must be silenced before disposal      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The `ayumi-sound-engine` record added the `internal`/`ayumi` engine
vocabulary and the persisted `dosound-tracker-sound-engine` selection, but
deliberately left the settings surface out of scope - the engine is
currently selectable only by writing the storage key by hand.

This record adds a `SOUND` category to the settings modal containing a
sound-engine selector offering `Internal` and `Ayumi`. The selection
participates in the existing draft-commit model: choosing an engine updates
the draft, committing with OK persists the `dosound-tracker-sound-engine`
key and applies the swap immediately, without a reload. The settings
SAVE/LOAD file carries the engine id alongside the other settings.

Switching engines disposes the old engine, silences any active sound, and
creates the new one - the playback contract stays as recorded for the
engine feature: playback does not carry over, and the user starts playback
again after the switch.

## Use Cases

- When the user opens Settings, the sidebar shows a `SOUND` category
  alongside `GENERAL` and `EDITOR`.
- When the user selects `Ayumi` under `SOUND` and confirms with OK, the
  selection persists and the Ayumi engine takes over live audio - the next
  preview or playback uses it.
- When the user selects `Internal` and confirms, the engine returns to the
  built-in Web Audio implementation.
- When the user saves settings to a file and loads them on another
  machine, the engine selection travels with the file; a file without a
  `sound` section keeps the current selection.
- When a stored or loaded value is unrecognised, the application behaves
  as if `internal` were selected.

## Hints

- The engine vocabulary, labels (`Internal`, `Ayumi`), and the persisted
  key already exist in `src/constants/sound.ts`,
  `src/utils/storage/storageKeys.ts`, and `src/utils/storage/soundEngine.ts`.
- `useAudioSetup` already accepts an `engineId` parameter and re-runs its
  creation effect when it changes; the resolved id is currently frozen at
  mount, so the hook must derive it per render.
- `SettingsValues`, `normalizeSettings`, `loadSettings`, `writeSettingFlags`,
  `buildSettingsYaml`, and `parseSettingsFromYaml` own the committed-shape
  contract - the `sound` group joins them.
- The settings file version stays `1`; older files normalize the missing
  section to the fallback.

## Out of Scope

- Additional `SOUND` options (output device, sample rate, volume) - the
  category ships with the engine selector only.
- Carry-over playback across an engine switch - playback never resumes on
  the new engine automatically.
- Changing the engine selection while the settings modal is still open -
  the draft model already defers it to OK.
