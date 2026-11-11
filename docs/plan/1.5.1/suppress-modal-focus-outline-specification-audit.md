# Specification Audit - Suppress Modal Focus Outline

## Document Information

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Change     | docs/change/1.5.1/suppress-modal-focus-outline.md              |
| Plan       | docs/plan/1.5.1/suppress-modal-focus-outline-implementation.md |
| Audit Date | 2026-11-10                                                     |

## Completeness

| Record requirement                   | Covering plan step                         |
| ------------------------------------ | ------------------------------------------ |
| No focus frame around the dialog     | Step 1                                     |
| Inner controls keep their indicators | Step 1 (rule targets `.modal-dialog` only) |
| Verification of the rendered result  | Step 2                                     |

## Ambiguity

"Frame" is the browser default focus outline on the `tabIndex={-1}`
dialog element - one interpretation, one CSS property.

## Implementability

`.modal-dialog` exists in `src/App.css`; the `outline: none` convention
is used by sibling rules throughout the file. Preconditions hold.

## Fidelity

- Enumeration fidelity - one rule, one element class, matching the
  record's scope exactly.
- Vocabulary freeze - `.modal-dialog`, `:focus`, `outline: none` are the
  established codebase forms.

## Conclusion

Approved for implementation.
