# Cover the remaining modal dialogs

**Type:** Chore

**Source:** 1.4.3 window deferral from the synth and worker coverage record

## Summary

| Field         | Value                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Intent        | Extend the modal test coverage to the two dialogs the 1.4.3 record deferred                   |
| Key decisions | `MidiModal` and `MarkdownModal` need clipboard, FileReader, and layout stubs                  |
| Open risks    | jsdom cannot fully verify `scrollTop` restore - partial assertions may be the most achievable |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The 1.4.3 coverage record landed `test/modals/` suites for nine dialogs and deliberately deferred `MidiModal` and `MarkdownModal`. `MidiModal` needs `downloadFile` module mocks, a `navigator.clipboard` stub, and FileReader paths for `MAX_IMPORT_BYTES` rejection and `MidiConfigurationFormatError` handling. `MarkdownModal` renders markdown into `dangerouslySetInnerHTML` with a debounced scroll-restore that jsdom layout cannot fully exercise.

## Hints

- Follow the conventions the 1.4.3 `test/modals/` suites established.
- Accept partial verification for the scroll-restore path and record the boundary in the test.

## Out of Scope

- Changes to the modal components themselves.
