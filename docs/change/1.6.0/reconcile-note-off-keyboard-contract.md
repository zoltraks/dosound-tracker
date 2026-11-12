# Reconcile the note-off keyboard contract

**Type:** Fix

**Source:** Audit 2026-11-12 REC-06 (FND-06)

## Summary

| Field         | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Intent        | Make one canonical note-off binding across code and documents |
| Key decisions | Shift+Space is canonical - `F-10` corrects to match           |
| Open risks    | none - the piano-focus binding is untouched                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Requirement `F-10` names Ctrl+Space as the note-off binding. The
implementation maps Ctrl+Space to piano focus and Shift+Space to
note-off, and a passing test asserts the focus behavior.
`SPECIFICATION.md` and `public/MANUAL.md` already describe the
implemented binding, so the requirement row is the outlier - but which
side yields is a product decision, not an audit finding.

Two reconciliations are possible: keep the tested Shift+Space note-off
and correct `F-10`, or deliberately implement Ctrl+Space note-off and
redesign the focus shortcut it displaces. Once the user picks, the
requirement, specification, manual, navigation map, and keyboard tests
all move together - a contract fixed on only one side recreates the
same conflict.

## Use Cases

- When the user selects the canonical binding, code and every document
  that names note-off describe the same shortcut.
- When the binding is exercised on a real track with modifier
  precedence, the documented behavior is what happens.

## Hints

- Correcting `F-10` is the smaller reconciliation: implementation,
  tests, specification, and manual already agree on Shift+Space.
- Sites: `docs/PROJECT.md` (`F-10`), `src/constants/navigation.ts`,
  `src/components/tracker/TrackPanel.tsx`,
  `test/hooks/keyboard/useKeyboardNavigation.test.tsx`,
  `docs/SPECIFICATION.md`, `public/MANUAL.md`.

## Out of Scope

- Any shortcut reshuffle beyond note-off and the displaced focus
  binding.
