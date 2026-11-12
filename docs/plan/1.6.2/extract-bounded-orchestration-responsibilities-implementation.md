# Extract Bounded Orchestration Responsibilities Implementation Plan

**Change Request Reference:** `docs/change/1.6.2/extract-bounded-orchestration-responsibilities.md`

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | One verified responsibility extraction per move from the measured |
|               | hotspots                                                          |
| Key decisions | Start with the most self-contained seam, not `App.tsx` and not    |
|               | `asm.ts`                                                          |
| Open risks    | Any move that alters hook wiring on the audio path risks timing - |
|               | verification gates every move                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md` hooks and
component-organisation sections: one responsibility per hook, explicit
return types, no abbreviation in identifiers. `REFACTORING.md` governs -
a refactoring proposal lands in `docs/refactoring/1.6.2/` before the
first structural edit.

## Audio-Critical Requirements

The broad `react-hooks/exhaustive-deps` suppression in `src/App.tsx` is
documented as intentional for the audio path and stays. Every extraction
is mechanical: no `useCallback`/`useMemo` dependency changes, no state
pattern changes in audio paths. Manual audio validation plus the browser
playback smoke runs after each move, before the next begins.

## Documentation Updates

- `ARCHITECTURE.md` - only if an extraction moves a recorded module
  boundary.
- `docs/refactoring/1.6.2/` - the proposal before edits, the assessment
  after.

## Type and State Updates

**Type definitions**

- Props/return types for each extracted hook or module, placed per the
  domain's existing convention.

**State store modifications**

- None expected - extractions move logic, not state ownership.

## Step by Step Implementation

**Characterize the first seam**

Pick the most self-contained responsibility in the hotspot list
(`useMidiMessageProcessing.ts`, `useDataManagement.ts`,
`useSongManagement.ts`, `asm.ts`, `App.tsx`), map its inputs/outputs,
and write it into the refactoring proposal.

**Move one responsibility**

Extract to a dedicated hook or module under the domain's existing
directory; update call sites; nothing else moves in the same pass.

**Verify, then repeat**

Byte-identical export fixtures for any `asm.ts` move, browser playback
smoke, and manual audio validation gate each extraction; the next seam
starts only on a clean tree.

## Implementation Order

1. Refactoring proposal in `docs/refactoring/1.6.2/`.
2. First extraction plus verification.
3. Iterate one seam at a time.
4. Assessment document per `REFACTORING.md`.

## Testing Strategy

**Unit tests**

New unit tests for each extracted utility/hook; export-fixture suites
must stay byte-identical across any `asm.ts` change.

**Integration tests**

Browser playback smoke after every move; manual audio validation for
any move touching playback-adjacent wiring.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - clean after every single move, not just at the end.
- Byte-identical export fixtures where exports are touched.
