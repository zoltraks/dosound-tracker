# Upgrade Vitest to 5 Implementation Plan

## Summary

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Intent        | Re-evaluate and land the `vitest` 5 chain on the Vite 8 stack   |
| Key decisions | Chain upgrades together; suite cleanliness is the recorded gate |
| Open risks    | `none` - resolved during the run                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.4/upgrade-vitest-5.md`.

## Analysis

The record carried the 5.1.0 attempt's failure on rolldown-vite 7 as its
blocker. Re-evaluation found 5.1.0 still the latest release but the peer
range widened to admit Vite 8, so the suite run was the evidence gate.
The first run failed twice over, both in `test/setup-localstorage.ts`:

- The mirror assignment `globalWindow.localStorage = existing` threw
  `Cannot set property localStorage of [object Window] which has only a
getter` - newer jsdom exposes the store as a getter-only accessor.
- After routing the install through `Object.defineProperty`, three
  localStorage error-path tests failed: `vi.spyOn` on jsdom's `Storage`
  instance cannot plant method mocks - the WebIDL legacy platform object
  applies named-property semantics, so the spy is stored as data rather
  than defined as a method.

## Implementation

**Upgrade the chain**

`vitest`, `@vitest/ui`, and `@vitest/coverage-v8` move to `5.1.0`
together through `npm install -D` - they share the runner core.

**Fix the storage install unconditionally**

File to modify: `test/setup-localstorage.ts`.

```typescript
// assignLocalStorage: plain assignment with Object.defineProperty
// fallback for getter-only accessors; the plain-object mock is
// installed every run so spies always land on a normal object.
```

## Verification

- `npm test` clean - 133 files, 1198 tests under 5.1.0.
- `npm run test:coverage` - thresholds pass unchanged.
- Full loop clean: typecheck, lint, format, build, test.
