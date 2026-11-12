# Align tests with their own documented rules

**Type:** Chore

**Source:** AUDIT-1.4 REC-020 (FND-CQY-006)

## Summary

| Field         | Value                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Intent        | Remove the two latent violations of the suite's own testing rules                                                        |
| Key decisions | the spy targets the `localStorage` object; the fixture dependency moves inside `test/`; the MIDI key joins `StorageKeys` |
| Open risks    | `none`                                                                                                                   |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Description

`test/hooks/storage/useLocalStorageState.test.tsx` spies `Storage.prototype.getItem`, forbidden by `docs/TESTING.md` because the installed mock is a plain object outside the prototype chain - the spy silently never intercepts. `test/utils/song/useDataManagement.test.ts` reads `src/assets/song.yaml`, violating the `test/` confinement rule. Separately, the MIDI storage key lives in `midiUtils.ts` instead of the centralized `StorageKeys` module.

The change repoints the spy at the `localStorage` object itself, copies the needed fixture inside `test/`, and centralizes the MIDI key under `StorageKeys`.

## Hints

- Verification is `npm test` green under both storage paths.
- `remove-dead-dependency-fixtures` prunes unreferenced fixtures - the fixture this record introduces must survive that pruning - reconcile in whichever lands second.

## Out of Scope

- New test coverage - this is convention alignment only.
- `TESTING.md` rule text, which already states the rules correctly.
