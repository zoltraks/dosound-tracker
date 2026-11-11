# Specification Audit - Add Sound Settings Category

## Document Information

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Change     | `docs/change/1.4.8/add-sound-settings-category.md`     |
| Plan       | `docs/plan/1.4.8/add-sound-settings-implementation.md` |
| Audit Date | 2026-11-10                                             |

## Completeness

| Requirement                                             | Plan step                           |
| ------------------------------------------------------- | ----------------------------------- |
| `SOUND` category in the settings sidebar                | Add the SOUND category to the modal |
| Engine selector with `Internal`/`Ayumi` labels          | Add the SOUND category to the modal |
| Selection persists `dosound-tracker-sound-engine`       | Extend the settings model           |
| Swap applies live on OK without reload                  | Wire the live switch                |
| Silences active sound before disposing the old engine   | Wire the live switch + audio notes  |
| Settings file carries the engine id, version stays 1    | Extend the settings file            |
| Unrecognised stored/loaded values fall back to internal | Extend the settings model           |

Requirements with no covering step: none.

Steps with no stated requirement: none.

## Ambiguity

- Category order in the sidebar: the record is silent; the plan appends
  `sound` after `editor`, preserving existing positions.
- The draft's session restore (`settingsView`) round-trips `sound.engine`
  through `normalizeSettings` automatically - no extra work needed.
- Engine id in the settings file: serialized as the raw id (`internal` /
  `ayumi`), matching how `pasteTrackMode` serializes raw values rather
  than display labels.

## Implementability

- All named integration points exist: `SettingsValues`/`normalizeSettings`/
  `loadSettings`/`writeSettingFlags`, `buildSettingsYaml`, `CATEGORY_LABELS`,
  the `settings-row` select pattern, `useAudioSetup`'s `engineId` parameter,
  and `loadSoundEngineId`.
- The cleanup in `useAudioSetup` already disposes the landed engine and
  nulls `ym2149` on `resolvedEngineId` change - only the mount-frozen
  `useState` initializer needs replacing.

## Fidelity

- The `SOUND` category ships with exactly one control, matching the
  record's Out of Scope.
- No playback-carry behavior is introduced - disposing the old engine
  drops sounding notes by construction.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  |         |                  |
