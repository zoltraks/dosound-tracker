# Refactoring Proposal - 1.4.8

## Problem

The sound-engine id validation `(SOUND_ENGINE_IDS as readonly string[]).includes(value)`
appears twice - `loadSoundEngineId` in `src/utils/storage/soundEngine.ts` and
`normalizeSettings` in `src/utils/settings/settingsState.ts` - and both
implement "unrecognised value falls back to the default engine". A future
change to the vocabulary must land in both places to stay correct.

`writeSettingFlags` also lies a little: it writes `STARTUP_TONE`,
`RESTORE_CURSOR`, `RESTORE_VIEW` and now `SOUND_ENGINE`, which is not a flag.

## Goal

One normalization helper for the engine id, used by both readers, and a
function name that describes what it writes.

## Plan

**Extract `normalizeSoundEngineId`**

Add `normalizeSoundEngineId(raw: unknown, fallback: SoundEngineId = DEFAULT_SOUND_ENGINE_ID)`
to `src/utils/storage/soundEngine.ts` beside `loadSoundEngineId`, which then
delegates to it. `normalizeSettings` calls it for `sound.engine` with the
base value as fallback.

**Rename `writeSettingFlags`**

Rename to `writeSettingKeys` - it writes the settings-only storage keys
(three flags plus the engine id), while theme, background, and paste mode
remain written by their owning setters. Update the `App.tsx` call site and
the existing test imports.

**Verify**

Extend `test/utils/storage/soundEngine.test.ts` with normalization cases.
Run the verification loop.

## Risk

Low. Pure extraction plus a private-name rename; behavior, storage keys,
and file formats are unchanged.

## Acceptance Criteria

- Both readers produce identical results for valid, missing, and corrupt
  values.
- No behavior change; all existing tests pass unmodified apart from the
  rename import.
- Verification loop clean: zero errors, zero warnings.
