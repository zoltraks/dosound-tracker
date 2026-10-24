# Refactoring Proposal - 1.3.5

## Problem

The window's App.tsx decomposition left tidy-level debris behind:

- Stale comments in `src/App.tsx` marking removed helpers (`Removed normalizeInstrumentId`,
  `Removed instrumentLookupByNormalizedId`, `Removed updateChannelWithInstrument`) and a
  section comment that describes history rather than code (`Track line playback loop
state (previously pattern playback state)`).
- Two module-level const aliases, `formatNoteKey` and `parseBaseKeyString`, kept only so
  three injection sites could use shorthand property names. The canonical implementations
  live in `src/utils/song/songFormat.ts` as `formatBaseKey` and `parseBaseKey`.

## Goal

`App.tsx` carries no comments that narrate removed code, and every injected helper names
its canonical implementation at the call site. Behaviour is identical; this is a tidy
step only.

## Plan

**Remove dead comments**

Delete the three `Removed ...` comment lines and the `// Handle stop playback with
silence` / `Track line playback loop state` historical comments from `src/App.tsx`.
Keep comments that document constraints still in force (for example the MIDI helper ref
comment).

**Name canonical implementations at injection sites**

Drop the `formatNoteKey` and `parseBaseKeyString` const aliases and write the canonical
names at the three injection objects: `formatNoteKey: formatBaseKey` and
`parseBaseKeyString: parseBaseKey`. Remove the alias declarations.

## Risk

Low. No logic changes; the alias values are reference-identical to the injected
functions. `npm run lint` catches any orphaned import; `tsc -b` catches any typo.

## Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, and `npm test`
  all pass with zero errors and zero warnings.
- Test count unchanged (544 passing).
- No `Removed ...` narration comments remain in `src/App.tsx`.
