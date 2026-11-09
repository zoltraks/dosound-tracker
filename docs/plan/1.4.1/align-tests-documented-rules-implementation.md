# Align Tests With Documented Rules Implementation Plan

## Summary

| Field         | Value                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Remove the violations of the suite's own testing rules and centralize the MIDI storage key                                            |
| Key decisions | spies and stubs target the `localStorage` object; the bundled-song fixture is copied inside `test/`; the MIDI key joins `StorageKeys` |
| Open risks    | `none`                                                                                                                                |

## Change Request Reference

`change/1.4.1/align-tests-documented-rules.md`

## Best Practices

- `TESTING.md` owns the violated rules: spies and stubs for `localStorage` target the `localStorage` object itself, and unit tests stay self-contained inside `test/`.
- Test edits follow `standard/typescript-general-development.md` and `standard/typescript-react-development.md`; assertions must prove the code path ran, not only the absence of a throw.
- The key move makes the code match `SPECIFICATION.md`, which already records that local storage keys are centralised in `src/utils/storage/storageKeys.ts`.

## Documentation Updates

No documentation update is required. `TESTING.md` rule text already states both rules correctly, and the key move brings the code into conformance with `SPECIFICATION.md` rather than changing what it records.

## Type and State Updates

**Type definitions**

None.

**State store modifications**

None. `StorageKeys` gains one static member; it is a constants class, not a store.

## Step by Step Implementation

**Repoint the localStorage spy at the object**

`test/hooks/storage/useLocalStorageState.test.tsx` spies `Storage.prototype.getItem`, which never intercepts the plain-object mock installed by `test/setup-localstorage.ts`. Repoint the spy at the object so the error path actually executes.

File to modify: `test/hooks/storage/useLocalStorageState.test.tsx`.

```typescript
const spy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
  throw new Error('access denied');
});
```

**Repair the same violation in branchGaps.test.ts**

`test/utils/branchGaps.test.ts` monkey-patches `Storage.prototype.setItem` in `warns but survives when localStorage throws` - the same silent-never-intercepts violation, found during implementation analysis. Stub the object itself and assert the warn path ran so the test stops passing vacuously.

File to modify: `test/utils/branchGaps.test.ts`.

```typescript
vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
  throw new Error('quota');
});
const warnSpy = vi.spyOn(logger, 'warn');
// ...schedule and advance timers...
expect(warnSpy).toHaveBeenCalled();
```

File to read: `src/utils/log/logger.ts` for the `logger` import.

**Copy the bundled-song fixture inside test/**

`test/utils/song/useDataManagement.test.ts` reads `src/assets/song.yaml`, violating the `test/` confinement rule. Copy the file to `test/fixtures/bundled-song.yaml` - the committed snapshot proves the bundled singular-key document parses; the fixture landed after `remove-dead-dependency-fixtures` so it survives the pruning.

File to add: `test/fixtures/bundled-song.yaml` (verbatim copy of `src/assets/song.yaml`).

File to modify: `test/utils/song/useDataManagement.test.ts` - repoint `readFixture('src/assets/song.yaml')` to `readFixture('test/fixtures/bundled-song.yaml')`.

**Join the MIDI storage key to StorageKeys**

`src/utils/midi/midiUtils.ts` exports `STORAGE_KEY = 'dosound-tracker-midi-configuration'`, the only storage key outside the central module. Add the member under a MIDI comment group, repoint the single consumer, and drop the dead export.

File to modify: `src/utils/storage/storageKeys.ts`.

```typescript
  // MIDI
  static readonly MIDI_CONFIGURATION = 'dosound-tracker-midi-configuration' as const;
```

File to modify: `src/hooks/midi/useMidi.ts` - replace the `STORAGE_KEY` import with `StorageKeys` and use `StorageKeys.MIDI_CONFIGURATION` at the three sites. `OLD_STORAGE_KEY` stays local: the migration pair was deliberately kept local in `refactoring/1.3.2/REFACTORING.md`, and the record moves only the live key.

File to modify: `src/utils/midi/midiUtils.ts` - remove the `export const STORAGE_KEY` line; no other importer exists.

File to modify: `test/hooks/midi/useMidi.test.tsx` - replace the local `'dosound-tracker-midi-configuration'` literal with `StorageKeys.MIDI_CONFIGURATION`.

## Implementation Order

1. Documentation updates - none required.
2. `StorageKeys` constant.
3. `useMidi.ts` and `midiUtils.ts` repoint and export removal.
4. Fixture copy and `useDataManagement.test.ts` repoint.
5. Spy repairs in `useLocalStorageState.test.tsx` and `branchGaps.test.ts`.
6. `useMidi.test.tsx` constant alignment.
7. Verification loop.

## Testing Strategy

**Unit tests**

Targeted runs while implementing.

```bash
npm test -- test/hooks/storage/useLocalStorageState.test.tsx test/utils/branchGaps.test.ts test/utils/song/useDataManagement.test.ts test/hooks/midi/useMidi.test.tsx
```

**Integration tests**

`useMidi.test.tsx` covers the hook's load/migrate/persist flow against the centralized key value - unchanged behaviour is the acceptance signal, not new coverage.

## Verification

- `npm run typecheck` - `tsc -b` across the project graph.
- `npm run lint` - zero errors, zero warnings.
- `npm run format` - applied to the tree.
- `npm run build` - `tsc -b && vite build` clean.
- `npm test` - the full suite green; the two repaired tests now exercise real error paths.
