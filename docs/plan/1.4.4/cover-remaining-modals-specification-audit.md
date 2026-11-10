# Specification Audit - Cover the Remaining Modal Dialogs

## Document Information

|            |                                                            |
| ---------- | ---------------------------------------------------------- |
| Change     | `docs/change/1.4.4/cover-remaining-modals.md`              |
| Plan       | `docs/plan/1.4.4/cover-remaining-modals-implementation.md` |
| Audit Date | 2026-11-10                                                 |

## Completeness

| Change-record requirement                                                    | Covering plan step          |
| ---------------------------------------------------------------------------- | --------------------------- |
| `MidiModal` coverage: `downloadFile` mocks, clipboard stub, FileReader paths | Step 1                      |
| `MAX_IMPORT_BYTES` rejection and `MidiConfigurationFormatError` handling     | Step 1                      |
| `MarkdownModal` `dangerouslySetInnerHTML` and debounced scroll-restore       | Step 2                      |
| Accept partial verification for scroll-restore, record the boundary          | Step 2 + Open risks         |
| Follow the conventions the 1.4.3 `test/modals/` suites established           | Step 1 (conventions listed) |
| Out of Scope: changes to the modal components                                | Respected - test-only       |

No requirement lacks a covering step. No step lacks a stated requirement.

## Ambiguity

"Partial assertions" admits asserting the restore effect on `scrollTop` (the
element property, writable in jsdom) or asserting rendered position (layout,
unavailable). The writable-property reading is the achievable one and is what
the plan records.

## Implementability

| Step | Check                                                                                       | Result |
| ---- | ------------------------------------------------------------------------------------------- | ------ |
| 1    | `MidiModal` seams verified: clipboard guard, `downloadFile`, file input, `MAX_IMPORT_BYTES` | Pass   |
| 2    | `MarkdownModal` seams verified: `renderMarkdown` sink, `loadUiState` scroll, 150 ms timer   | Pass   |

Ten existing `test/modals/` suites carry the conventions; jsdom supplies
`File`/`FileReader`/`scrollTop`; `vi.stubGlobal` and fake timers are already
used in sibling suites.

## Fidelity

- Enumeration fidelity - both deferred modals are covered; the other two untested dialogs (`AboutModal`, `DownloadModal`) stay deferred as before.
- Vocabulary freeze - suite naming mirrors `test/modals/<Name>.test.tsx`.
- Cross-party parity - stubs cover every browser seam each modal touches; no component edit.
- Constants completeness - `MAX_IMPORT_BYTES` is reused, not redeclared.
- Boundary decisions - the scroll-restore boundary is recorded explicitly.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    | -       | -                |
