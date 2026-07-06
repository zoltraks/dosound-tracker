# [Short Imperative Title] Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/[version]/[filename].md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- Destructure props in function signature
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Audio-Critical Requirements

This section is mandatory for changes that affect audio playback, timing, or the sequencer. Delete this section if the change does not involve audio.

- Does this change affect React render timing?
- Does this modify `useCallback` or `useMemo` dependencies?
- Does this change state management patterns in audio paths?
- Does this modify the YM2149 emulator or SoundDriver?
- Must audio playback be manually tested after the change?

Consult `GUIDELINES.md` for the audio-critical development principles before making any changes to audio-related code.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications. Update only the files affected by this change.

- `PROJECT.md` — new requirements or behavioural changes
- `ARCHITECTURE.md` — architectural or structural changes
- `SPECIFICATION.md` — implementation-specific details
- `FORMAT.md` — changes to save or export file formats

If none of the above files require changes, state that explicitly here.

## Type and State Updates

**Type definitions**

Specify changes to TypeScript interfaces, type aliases, schemas, or union types.

File to modify: `src/types/[filename].ts`.

```typescript
// Define new types or update existing definitions here

```

**State store modifications**

Specify updates to stores, state properties, and actions. List all subscribing components affected by this state change.

File to modify: `src/stores/[filename].ts`.

```typescript
// Define store state extensions or action implementations here

```

## Step by Step Implementation

Define one bold-headed step per logical unit of change. The two steps below are examples only. Replace them with steps specific to this change — there will typically be more.

**[Step name]**

Describe what changes and why.

File to modify: `src/[path]/[filename].ts`.

```typescript
// Code fragment showing the structural change

```

**[Step name]**

Describe what changes and why.

File to modify: `src/components/[filename].tsx`.

```typescript
// Code fragment showing the structural change

```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update type definitions
3. Update state stores
4. Implement engine or utility logic
5. Implement UI components
6. Add or update tests
7. Run verification loop

## Testing Strategy

**Unit tests**

Specify testing requirements for new utility functions, state actions, and pure modules.

Test file to create or update: `test/[path]/[filename].test.ts`.

```typescript
// Outline specific test cases and expected assertions

```

**Integration tests**

Specify testing requirements for component interactions and complete user flows.

Test file to create or update: `test/components/[filename].test.tsx`.

```typescript
// Outline specific integration test cases

```

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Manually verify the specific feature behaviour and confirm no regressions in consumer modules
- For audio-related changes, manually verify playback timing and audio stability
