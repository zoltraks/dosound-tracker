# Evaluate Store Splitting Implementation Plan

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Evaluate whether `useUiStore` should split into domain stores            |
| Key decisions | Evaluation outcome: confirmed single store - the member surface is small |
|               | and Zustand selectors already give per-member re-render granularity      |
| Open risks    | none                                                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/evaluate-store-splitting.md`.

## Evaluation

**Measured surface.** `src/hooks/ui/useUiStore.ts` holds three state members - `currentOctave`, `sharedCurrentLine`, `channelMutes` - and four actions. The only subscriber is `App.tsx`, which selects each member with its own `useUiStore` selector and passes values down as props.

**Re-render granularity.** Zustand selectors already isolate re-renders per member: a subscriber of `state.currentOctave` does not re-render when `channelMutes` changes. Splitting the store cannot reduce re-render scope below what selectors already provide - a split would only exchange one file for three single-field stores and triple the persistence surface for `currentOctave`, `sharedCurrentLine`, and `channelMutes`.

**What a split could buy.** The split's value must come from state that would move into the stores, not from the store itself. Song, instrument, and pattern data stay hook-owned by deliberate design (the song model sits beside the orchestrator), and audio-path state must stay in refs - moving either into a store adds synchronization overhead without shrinking re-render scope. No candidate member justifies a domain store.

**Boundary check.** Persisted members keep their current storage behaviour unchanged under the confirmed single store. Audio-path state remains in refs, not in the store.

Outcome: the single store is confirmed. The architectural decision in `ARCHITECTURE.md` is re-recorded with this evaluation's evidence.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Keep state close to its consumers
- Measure re-render scope before migrating state boundaries

## Documentation Updates

- `ARCHITECTURE.md` - the "Single store vs domain stores" decision entry is updated to record the 1.5.2 re-evaluation and its evidence.

## Type and State Updates

None.

## Step by Step Implementation

**Re-record the store decision**

Update the decision entry with the evaluation evidence: member surface, selector granularity, and the absence of a justified migration candidate.

File to modify: `docs/ARCHITECTURE.md`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `ARCHITECTURE.md` - the only change

## Testing Strategy

Documentation-only change - no tests required. The verification loop does not run per `TESTING.md`.

## Verification

- Re-read the updated decision entry for consistency with `src/hooks/ui/useUiStore.ts`.
- Run `npx prettier --check docs/ARCHITECTURE.md`.
