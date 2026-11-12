# Version 1.5.8 Review

## Document Information

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| Version     | 1.5.8                                                                         |
| Review Date | 2026-11-12                                                                    |
| Commands    | `git log --oneline`, `git status --short`, `git diff`, verification loop runs |

## Scope

This review covers the three change records under `docs/change/1.5.8/`, the
`upgrade-typescript-7` record discarded into `docs/discard/1.5.8/`, and the
ad-hoc change set delivered during the session. The window ran in Immediate
mode: every record was proposed, accepted, and implemented in-session, and the
whole body sits uncommitted in the working tree awaiting the owner's close
commit. `docs/change/1.5.9/consolidate-asm-export-strategies.md` seeds the
next window and is out of scope.

## Recorded Work

| Document                                           | Kind   | Status    | Result                                                                                    |
| -------------------------------------------------- | ------ | --------- | ----------------------------------------------------------------------------------------- |
| docs/change/1.5.8/instrument-empty-slot-navigation | Change | Done      | Every stored slot renders and stays navigable; selection resyncs by identity then id      |
| docs/change/1.5.8/ui-style-polish                  | Change | Done      | Font and gap scales in `:root`, themed colors, `1.2rem` modal default, focus-visible pass |
| docs/change/1.5.8/instrument-page-navigation       | Change | Done      | ALT+PAGEUP/PAGEDOWN steps instruments globally with wrap; dead CTRL+-/CTRL+Plus revived   |
| docs/discard/1.5.8/upgrade-typescript-7            | Change | Discarded | Moved to discard with the abandonment reason recorded                                     |

## Repository Analysis

Read the version-control log for the version period and reconcile it against
the recorded work above. The window's delivery is uncommitted, so the
reconciliation runs against `git status` and `git diff` rather than new log
entries since `26e7d3a`.

- **Confirmed** - `useDataManagement.ts` prefers object identity over id
  normalization in the instrument-sync effect, and
  `computeVisibleSlotCount` counts through `instruments.length` with the
  dead `isInstrumentEmpty` parameter removed - the empty-slot record.
  `App.css` carries the five consolidation items and the interactive
  instrument-list pass; `modalRendering.ts` dropped the
  `export-summary-modal` plumbing - the polish record. `navigation.ts`,
  `keyboardShortcutUtils.ts`, `useKeyboardShortcuts.ts`, `App.tsx`, and
  `TrackPanel.tsx` deliver the global page-chord instrument stepping - the
  navigation record.
- **Unconfirmed** - none; every recorded change is present in the tree.
- **Undocumented** - the bundled Ubuntu font set under `public/font/` with
  its `@font-face` declarations and the instrument-list scroll behavior
  (scroll-into-view on add, last-row max scroll, `ResizeObserver` integer
  height) landed ad-hoc alongside the records; the polish record's added
  paragraph and the plan's Refinements reconcile them.
- **Deviations** - `instrument-page-navigation` iterated once after
  landing: ALT+PAGEDOWN inside a focused track also paged the cursor 16
  rows because `TrackPanel` guarded Ctrl/Meta/Shift but not Alt - fixed
  and recorded in the plan's Refinements. The polish record grew a second
  paragraph for the interactive pass (zebra striping, uniform controls,
  message-panel font, chevron sizing, command-panel hover frame).

## Findings

| Severity | Finding                                                               | Evidence                            | Action                                              |
| -------- | --------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------- |
| Minor    | Font bundling and scroll behavior carry no dedicated change records   | `public/font/`, `InstrumentSection` | None - ad-hoc mode, reconciled in the records above |
| Info     | Dead `h-3 w-3` utility classes left lucide chevrons at 24px           | Scroll-overflow diagnostics         | Fixed in place; utility class remains unused        |
| Info     | CTRL+-/CTRL+Plus instrument bindings were declared but never consumed | `KEYBOARD_SHORTCUTS`, review trace  | Revived through the same action names               |

Severity classes follow the repository's refactoring rules document where
one exists.

## Verification Evidence

- Post-implementation loops after each change: typecheck, lint, format,
  build, test all clean; final suite 1333 tests across 142 files.
- `npm run build` completes; the pre-existing 600 kB chunk-size advisory
  is unchanged and not introduced by this window.
- New regression coverage this window: `InstrumentSection` slot
  navigation and selection resync tests (45 added lines) and
  `instrumentPanelUtils` signature updates (18 changed lines).
- Specification and bundled manual updated for the new chords in the same
  change set.

## Bump Decision

The window review feeds the version bump per `VERSIONING.md`: every 1.5.8
record is landed or discarded, the tree is verified clean, and the window
is ready for the owner's close commit and the 1.5.9 bump.
