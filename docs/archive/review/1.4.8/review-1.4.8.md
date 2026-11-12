# Version 1.4.8 Review

## Document Information

|             |                                                                          |
| ----------- | ------------------------------------------------------------------------ |
| Version     | 1.4.8 (window closing into 1.4.9)                                        |
| Review Date | 2026-11-10                                                               |
| Commands    | git status, npm run typecheck, lint, format, build, test, headless probe |

## Scope

The single active change record under `docs/change/1.4.8/` - the `SOUND`
settings category that surfaced the Ayumi engine selection in the UI -
plus the window's own refactoring cycle. The record closed the gap the
`ayumi-sound-engine` record explicitly deferred ("the settings surface and
the `Sound` category - delivered by a separate change record").

## Recorded Work

| Document                                         | Kind        | Result                                                                         |
| ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| change/1.4.8/add-sound-settings-category.md      | Feature     | `SOUND` category, engine select, live swap on OK, settings file carries the id |
| refactoring/1.4.8/REFACTORING.md + ASSESSMENT.md | Refactoring | `normalizeSoundEngineId` shared; `writeSettingFlags` renamed; assessment pass  |

## Repository Analysis

The window's work is uncommitted by rule - reconciliation is against the
working tree.

- **Confirmed** - the record and the refactoring pair are present in the
  tree.
- **Unconfirmed** - none.
- **Undocumented** - none.
- **Deviations** - none. The settings file stayed at version 1 as planned;
  the sidebar order appends `SOUND` after `EDITOR`, the plan's recorded
  resolution.

## Findings

| Severity | Finding | Evidence | Action |
| -------- | ------- | -------- | ------ |
| `none`   |         |          |        |

## Verification Evidence

- Full verification loop clean: typecheck, lint, format, build, 110 files /
  856 tests (4 new `useAudioSetup` cases, 1 new modal case, extended
  settings and storage suites).
- Headless production probe on `vite preview`: engine defaults to
  `internal`, the draft does not persist before OK, OK persists the key,
  the engine swaps to `AyumiEngine` live without a reload, the reopened
  draft seeds from the committed selection, and switching back works.
- Settings file round-trip covers `sound.engine`; a file without the
  `sound` section keeps the fallback.

## Unable to Verify

Subjective listening checks comparing the two engines' timbre remain a
manual task for the owner, as in the previous window.

## Decision

The go or no-go record for the version bump.

- **Decision:** go
- **Decided by:** the project owner - the named window request is the recorded bump authorization
- **Conditions:** none
- **Accepted risks:** subjective audio comparison deferred to the owner's manual listening check
