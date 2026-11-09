# Reconcile Documentation With Implementation Implementation Plan

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | apply the verified doc-vs-code corrections from the change record |
| Key decisions | fix docs to match implementation; `MAX.md` is never edited        |
| Open risks    | `none`                                                            |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.8/reconcile-docs-with-implementation.md`.

## Documentation Updates

This change is documentation-only - every edit below is the documentation update itself.

**Correct the MAX format description**

`ARCHITECTURE.md` describes `max.ts` as producing output for "Max/MSP" and the "Max visual programming environment". The format is Music Assembly eXchange per `FORMAT.md` and `MAX.md`.

File to modify: `docs/ARCHITECTURE.md`.

**Correct the Electron version**

`ARCHITECTURE.md` and `README.md` say "Electron 42" - `package.json` pins `electron` at 45.x. Update both to Electron 45.

Files to modify: `docs/ARCHITECTURE.md`, `README.md`.

**Document the constants module**

`SPECIFICATION.md` lists five constants files - `src/constants/` has six. Add `modal.ts` (modal titles and confirmation texts).

File to modify: `docs/SPECIFICATION.md`.

**Correct the navigation block order**

`PROJECT.md` Navigation Block Order lists "Theme mode" and a sequence that diverges from `NAVIGATION_ORDER` in `src/constants/navigation.ts`. Rewrite the list to match the code: piano, octave, commands, track A, track B, track C, mode, volume, shift, pitch, noise, song information, playlist, instrument list. The "do not focus" note keeps Dump, EQ, logo, title, and theme.

File to modify: `docs/PROJECT.md`.

**Document the instrument-octaves persistence key**

`SPECIFICATION.md` Session Persistence omits `INSTRUMENT_OCTAVES` (`dosound-tracker-instrument-octaves`), persisted by `src/hooks/instrument/useInstrumentOctaves.ts`. Add it to the persisted-state list.

File to modify: `docs/SPECIFICATION.md`.

**Correct the user manual**

`public/MANUAL.md` edits:

- "MAX specification v1.6" becomes v1.7.
- Remove the invented "Buffer size: 256 samples, latency <10ms, CPU <5%" metrics - keep a qualitative real-time statement.
- Correct "per-instrument MIDI configuration with note range assignment" - the model carries `channel` and `program` only - reword to match.
- Generalize the versioned `.dmg` example filename so it does not pin an old release.

File to modify: `public/MANUAL.md`.

## Out of Scope

- `MAX.md` - externally managed.
- Source code, tests, configuration - untouched.
- Restricted-directory contents.

## Verification

Documentation-only change - the verification loop is bypassed per `GUIDELINES.md`. Run `npx prettier --check` on the touched files and re-read each edited paragraph to confirm the text states only verified facts.
