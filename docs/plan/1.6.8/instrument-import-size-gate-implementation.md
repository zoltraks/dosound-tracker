# Gate the Instrument Import Size Cap Before Read and Parse Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Move the 1 MiB `MAX_IMPORT_BYTES` assertion ahead of file read and YAML parse on the instrument path, matching the order used by song, settings, and MIDI imports.                           |
| Key decisions | `FileInputs` hands the picked `File` to the loading hook instead of pre-read text; the hook gates `file.size` before `FileReader` and `assertImportSize` before the speculative `yaml.load`. |
| Open risks    | none - the change only tightens validation order                                                                                                                                             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/instrument-import-size-gate.md`.

## Best Practices

Follow TypeScript and React engineering standards from
`docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces.
- Props interface named with `Props` suffix.
- Destructure props in function signature.
- Keep components focused on single responsibility.
- No abbreviations in identifiers (use full words).

The change mirrors the existing import convention: `loadSong` in
`useDataManagement` rejects `file.size > MAX_IMPORT_BYTES` before
`FileReader.readAsText`, and `SettingsModal`/`MidiModal` do the same. The
shared text-level gate is `assertImportSize` from
`src/utils/validation/importSize.ts`, already used by every parser including
`parseInstrumentFromText`.

## Documentation Updates

- `FORMAT.md` - no update required. The instrument loader section already
  states that input larger than `MAX_IMPORT_BYTES` is rejected before
  parsing; the change makes that statement strictly true for the file path
  as well and adds the earlier file-size gate.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md` - no update required;
  validation order inside the file-loading hook is not a documented
  contract surface.

## Type and State Updates

**Type definitions**

`FileInputsProps.onLoadInstrument` widens from `(content: string) => void`
to `(file: File) => void`, matching the sibling `onLoadSong` prop which
already receives the `File`. `UseInstrumentFileLoadingResult.
handleInstrumentFileContent` widens to `(content: string | File) => void` so
the same handler serves the file picker and the repository fetch path.

File to modify: `src/components/shell/FileInputs.tsx`,
`src/hooks/instrument/useInstrumentFileLoading.ts`.

```typescript
onLoadInstrument: (file: File) => void;

handleInstrumentFileContent: (content: string | File) => void;
```

**State store modifications**

None - the hook keeps using the `setInstrumentError` callback it already
receives.

## Step by Step Implementation

**Pass the picked `File` through `FileInputs`**

The instrument file input stops reading the file itself and hands the
`File` object to `onLoadInstrument`, exactly like the song input hands its
`File` to `onLoadSong`. The size decision moves into the hook that owns
the error channel.

File to modify: `src/components/shell/FileInputs.tsx`.

```tsx
onChange={(e) => {
  const file = e.target.files?.[0];
  if (file) {
    onLoadInstrument(file);
  }
}}
```

**Gate `file.size` before `FileReader` in the hook**

`handleInstrumentFileContent` accepts `string | File`. The `File` branch
rejects `file.size > MAX_IMPORT_BYTES` with
`'Instrument file exceeds the maximum import size.'` through
`setInstrumentError` - the same message shape `loadSong` uses for songs -
then reads the file with `FileReader` and continues into the text path.

File to modify: `src/hooks/instrument/useInstrumentFileLoading.ts`.

```typescript
if (content instanceof File) {
  if (content.size > MAX_IMPORT_BYTES) {
    setInstrumentError('Instrument file exceeds the maximum import size.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const result = event.target?.result;
    handleInstrumentContent(typeof result === 'string' ? result : String(result ?? ''));
  };
  reader.readAsText(content);
  return;
}
handleInstrumentContent(content);
```

**Gate text length before the speculative `yaml.load`**

The existing content handler becomes a private `handleInstrumentContent`
callback. Its first check after the empty guard is
`assertImportSize(content, 'Instrument file')`, surfacing the thrown size
message through `setInstrumentError` so oversized text - including the
repository fetch path, which has no `File` - is rejected before the type
detection parse. The rest of the handler is unchanged.

File to modify: `src/hooks/instrument/useInstrumentFileLoading.ts`.

```typescript
try {
  assertImportSize(content, 'Instrument file');
} catch (error) {
  setInstrumentError(error instanceof Error ? error.message : 'Error loading instrument file.');
  return;
}
```

`handlePickRepositoryInstrument` keeps calling
`handleInstrumentFileContent(text)`; the string branch routes into the
same gated content handler, so repository picks gain the pre-parse check
for free.

## Implementation Order

1. Update `FileInputs.tsx` and `useInstrumentFileLoading.ts`.
2. Extend `test/hooks/instrument/useInstrumentFileLoading.test.tsx` and add
   `test/components/shell/FileInputs.test.tsx`.
3. Run targeted verification: `npx vitest run` on the touched test files,
   `npx eslint` on touched sources, `npx tsc -b`, `npx prettier --check`.
4. Record refinements in this plan.

## Testing Strategy

**Unit tests**

Extend `test/hooks/instrument/useInstrumentFileLoading.test.tsx`:

- An oversized `File` (`size > MAX_IMPORT_BYTES`) is rejected with
  `'Instrument file exceeds the maximum import size.'`, `loadInstrument` is
  never called, and `FileReader` is never constructed - proven with a stubbed
  `FileReader` class.
- An oversized string that is also invalid YAML is rejected with the size
  message rather than the parse error, proving the cap fires before
  `yaml.load`.
- A `File` under the cap flows through `FileReader` into the content
  handler and reaches `loadInstrument`.

Test file to create: `test/components/shell/FileInputs.test.tsx`.

- The instrument input hands the picked `File` object to `onLoadInstrument`
  without reading it first.

**Integration tests**

None required - the e2e smoke suite's instrument load flow
(`e2e/helpers.ts` `instrumentFileInput`) exercises the same input element
and observes the same loaded-instrument outcome for valid files.

## Verification

- Run `npx tsc -b`.
- Run `npx eslint` on the touched files.
- Run `npx prettier --check` on the touched files.
- Run `npx vitest run test/hooks/instrument/useInstrumentFileLoading.test.tsx test/components/shell/FileInputs.test.tsx`.
- Manually verify picking an instrument file under the cap still loads it,
  and confirm no regressions in the repository instrument picker.

## Refinements

Adjustments made during implementation, recorded per the workflow rule.

- `src/utils/instrument/instrumentIO.ts` was not modified. Its
  `assertImportSize` call already precedes `yaml.load`; the gap was the
  hook's speculative type-detection parse, which ran before `loadInstrument`
  ever reached the parser.
- The pick-time size check landed in the hook rather than inside
  `FileInputs`: the component has no instrument-error channel and `App.tsx`
  wiring could not change, so `onLoadInstrument` now hands the picked `File`
  to `handleInstrumentFileContent` - the same shape `onLoadSong` already
  uses - and the hook rejects `file.size > MAX_IMPORT_BYTES` before
  `FileReader.readAsText`. `FileReader` moved from the component into the
  hook with identical read semantics.
- `handleInstrumentFileContent` widened to `string | File`; `App.tsx`
  needed no change because the wider parameter stays assignable to the
  `FileInputs` prop.
- The text-path gate (repository fetch and any direct string caller)
  surfaces the specific size message through `setInstrumentError` instead
  of the generic `'Error loading instrument file.'` the sibling text paths
  produce - deliberate, so oversized repository picks report the size error
  named in the record's use cases.
- `handlePickRepositoryInstrument` still calls
  `handleInstrumentFileContent(text)`; the string branch routes into the
  gated content handler unchanged.
