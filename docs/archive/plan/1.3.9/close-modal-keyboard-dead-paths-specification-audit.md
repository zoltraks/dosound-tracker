# Specification Audit - Close Modal Keyboard Dead-Paths

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| Change     | `docs/change/1.3.9/close-modal-keyboard-dead-paths.md`              |
| Plan       | `docs/plan/1.3.9/close-modal-keyboard-dead-paths-implementation.md` |
| Audit Date | 2026-11-09                                                          |

## Verdict

The plan is ready for implementation. Both defects were verified against `src/hooks/modal/useModalManager.ts` before planning: `isQuitConfirmOpen` is absent from `hasConfirmModal` (lines 157-166) while present in both key branches (lines 284, 382), and `instrumentOperationSummary` is present in the Escape chain (line 256) but absent from the Enter chain.

## Completeness

| Requirement                                        | Plan step                                           |
| -------------------------------------------------- | --------------------------------------------------- |
| `isQuitConfirmOpen` joins the modal guards         | Add `isQuitConfirmOpen` to the confirm-modal guard  |
| `instrumentOperationSummary` joins the Enter chain | Add `instrumentOperationSummary` to the Enter chain |
| Escape and Enter pass on both modals               | Modal keyboard contract tests                       |

No requirement lacks a covering step. The spec-update step serves the documentation-first rule, not a change-record requirement.

## Ambiguity

The record's phrase "the same action as its confirmation path" for `instrumentOperationSummary` resolves to `handleCloseInstrumentOperationSummary`: the dialog is an info modal built by `buildInfoModals` in `src/utils/panel/modalRendering.ts`, whose only action is `onClose` (line 106). Enter therefore closes the dialog, matching the other info modals.

## Implementability

Every referenced identifier exists in `src/hooks/modal/useModalManager.ts`: `isQuitConfirmOpen`, `handleCancelQuit`, and `handleConfirmQuit` are declared (lines 53-55), destructured (lines 120-122), and already listed in the effect dependency array (lines 443-445). `instrumentOperationSummary` and `handleCloseInstrumentOperationSummary` are declared (lines 20-21) and destructured (lines 87-88). No new imports or props are needed.

The test file location `test/hooks/modal/` exists and mirrors `src/hooks/modal/` per `TESTING.md`. No existing test covers `useModalManager`, so no test is broken by the change.

## Fidelity

- Enumeration fidelity: both modals named by the record are covered - `isInstrumentDeleteOpen` intentionally stays out of the Enter chain (its dialog offers two confirm actions, so Enter has no unique confirmation path) and remains out of scope per the record.
- Constants completeness: no constants, bounds, or defaults are introduced.
- Boundary decisions: Enter on `instrumentOperationSummary` maps to its single close action - decided, not implied.

## Findings Returned to Planning

`none`
