# Cover Remaining Test Surfaces

**Type:** Chore

## Summary

| Field         | Value                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Intent        | Close the recorded coverage gaps: `AboutModal`/`DownloadModal` tests and |
|               | thin component and hook branches                                         |
| Key decisions | Coverage work follows the recorded test conventions - jsdom vs node-env  |
|               | per file, mock rules per `TESTING.md`                                    |
| Open risks    | Thin-surface work must not erode the documented audio-critical lint      |
|               | exceptions while making code testable                                    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The recorded coverage gaps in `TESTING.md` are: `AboutModal` and
`DownloadModal` in `src/modals/` lacking dedicated tests, several
components in `src/components/` without dedicated tests, and a number of
hooks with thin branch coverage. This record continues the modal
coverage work started under `cover-remaining-modals` in the 1.4.4 group.

Each surface gets a dedicated suite following the file's conventions:
component tests register `afterEach(cleanup)`, DOM-free logic suites
carry the `// @vitest-environment node` pragma, and `localStorage` spies
target the object, never the prototype. The 80% thresholds in
`vitest.config.ts` stay enforced.

Refactoring purely for testability is allowed where it is small and
behaviour-preserving - restructuring that alters behaviour splits into
its own record.

## Use Cases

- When the suite runs, `AboutModal` and `DownloadModal` are exercised
  like every other modal.
- When a thin hook branch is covered, the test asserts the branch's
  observable effect, not just the call.

## Hints

- The component test-hygiene rules in `TESTING.md` (cleanup,
  localStorage object spies, full `fetch` Response surface, escaped
  entity assertions) apply to every new suite.
- Start from `npm run test:coverage` output - the thinnest surfaces are
  named there and the deltas prove the work.
- `AboutModal`/`DownloadModal` render document content - reuse the
  markdown-rendering assertions already proven in `MarkdownModal` tests.

## Out of Scope

- New e2e flows - those are tracked under the e2e expansion record.
- Coverage threshold changes - 80% stays the bar.
