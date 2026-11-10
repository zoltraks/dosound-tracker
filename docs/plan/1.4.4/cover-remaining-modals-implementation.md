# Cover the Remaining Modal Dialogs Implementation Plan

## Summary

| Field         | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Intent        | Extend `test/modals/` coverage to `MidiModal` and `MarkdownModal`, deferred from the 1.4.3 record |
| Key decisions | Mirror the 1.4.3 suite conventions; stub clipboard, `URL.createObjectURL`, and `FileReader` paths |
| Open risks    | jsdom cannot fully verify `scrollTop` restore - partial assertions are the recorded boundary      |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.4/cover-remaining-modals.md`.

## Analysis

`MidiModal` needs three seams stubbed: `navigator.clipboard.writeText` for the copy-monitor path (`onCopySummary` receives the copied-events string), `URL.createObjectURL`/`URL.revokeObjectURL` (or a `fileOperations` module mock) for the export-config download, and the hidden file input driven through `fireEvent.change` for the `MAX_IMPORT_BYTES` rejection and `MidiConfigurationFormatError` branches - jsdom `File`/`FileReader` work natively.

`MarkdownModal` renders `renderMarkdown` into `dangerouslySetInnerHTML`, restores `scrollTop` from `loadUiState().markdownScroll` on open, and persists it through a 150 ms debounced save - `vi.useFakeTimers()` plus a writable `scrollTop` exercises the path partially, which the record accepts.

## Documentation Updates

None of `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` requires changes: test-only additions. `TESTING.md`'s coverage-gap list already names these two modals.

## Step by Step Implementation

**Write the MidiModal suite**

`test/modals/MidiModal.test.tsx` - mirror the 1.4.3 conventions: `afterEach(cleanup)`, `renderModal(overrides)` typed against the props, closed-state first test. Cover: renders nothing when closed, device selects render, save/cancel callbacks, clipboard copy path with stubbed `navigator.clipboard`, export path with stubbed `URL.createObjectURL`, oversized-file rejection via `MAX_IMPORT_BYTES`, and `MidiConfigurationFormatError` surfacing through `onLoadError`.

File to create: `test/modals/MidiModal.test.tsx`.

**Write the MarkdownModal suite**

`test/modals/MarkdownModal.test.tsx` - cover: renders nothing when closed, markdown renders into the body element, close callback, `scrollTop` restore from stored state on open, and the debounced scroll persist under fake timers - recording the jsdom boundary where layout cannot fully verify restore.

File to create: `test/modals/MarkdownModal.test.tsx`.

## Implementation Order

1. Update documentation (none required - recorded above)
2. MidiModal suite
3. MarkdownModal suite
4. Run verification loop

## Testing Strategy

**Unit tests**

The two new suites are the deliverable. Assertions follow `TESTING.md` hygiene: console.log only inside try-catch around assertions, `localStorage` spies target the object itself, synthetic events carry `bubbles: true` where dispatch is manual.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test -- test/modals/`
- Run `npm test`
