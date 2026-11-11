# Suppress Modal Focus Outline Implementation Plan

## Summary

| Field         | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| Intent        | Remove the default focus ring from the focused modal dialog    |
| Key decisions | One CSS rule, matching the existing `outline: none` convention |
| Open risks    | none                                                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.1/suppress-modal-focus-outline.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`. Stylesheet-only change.

## Documentation Updates

None of the tracked documents need updates - the record's behavior is a
presentation detail already covered by the F-17 restore paragraph; no
requirement, structure, or format surface moves. `SPECIFICATION.md`,
`PROJECT.md`, `ARCHITECTURE.md`, and `FORMAT.md` are unchanged.

## Implementation Steps

1. `src/App.css` - add `.modal-dialog:focus { outline: none; }` beside
   the base `.modal-dialog` rule.
2. Verify: prettier, build, and a preview probe asserting the computed
   `outline` on the focused dialog resolves to none.

## Verification Approach

Headless probe focuses the settings dialog and reads the computed outline
style.
