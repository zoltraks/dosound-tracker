---
agent: devin-local
session: pool-pyramid
created: 2026-11-03T19:20:37Z
---

# Version 1.3.7 Window Close-Out — Autonomous SDLC Megaplan

Audit and close all 1.3.7 change records, implement the deferred stopPreview guard, run a refactoring cycle (SoundDriver dead code plus an autonomous pick), produce a full window review, bump to 1.3.8, and record the close-out procedure in the ASE documents.

## Summary

Close the 1.3.7 version window autonomously: every change record is verified or finished, the two FUTURE.md items are pulled in (stopPreview guard as a change, SoundDriver dead code as refactoring), a full window review is produced, the version bumps to 1.3.8, and `WORKFLOW.md` records this close-out cycle as the standard procedure.

## Decisions Taken

- Both FUTURE.md items enter the window: stopPreview guard via change record - SoundDriver removal inside the refactoring cycle.
- Refactoring = SoundDriver dead code + one autonomous pick chosen by analysis at implementation time.
- Review = full window review assessing every change record against its outcome and verification evidence.

## Wave 0 — Baseline and Record Audit

1. Run the full loop (typecheck → lint → format → build → test) to establish a clean baseline.
2. Audit each record in `docs/change/1.3.7/` (7 records): confirm the described outcome matches the tree — markdown-underscore-emphasis, ui-state-restoration, test-tone-parameters, release-gate, self-improvement-routines, standard-library-consolidation, context-management-rule. Any gap → finish the record's work or discard it explicitly.
3. Create `docs/plan/1.3.7/window-closeout-megaplan.md` (this megaplan persisted) and the wave's change records before each implementation step (documentation-first).

## Wave 1 — stopPreview Guard (change)

Files: `src/components/panels/TrackPanel.tsx` (~lines 303-311 `[isActive]` effect + stopPreview 131-166), `src/components/panels/HeaderPanel.tsx` (~lines 214-221 `[isOctaveActive]` effect + stopPreview 70-81), `src/hooks/midi/useMidiActions.ts` (handleHardStopLivePreview 105-136).

- Record: `docs/change/1.3.7/stop-preview-guard.md`.
- Implement: track a "was previewing" flag (ref or existing preview state) in both panels - call `stopPreview()` only when a preview was actually active, not unconditionally on mount/activation change. The unguarded ref write at `useMidiActions.ts:129-133` (fires before the `if (!ym2149)` prop guard) becomes unreachable from init paths.
- Tests: extend existing panel/UITest tests if coverage exists for these effects - otherwise verify by loop + manual reasoning documented in the record.
- Gate: full loop clean, zero warnings.

## Wave 2 — Refactoring Cycle

- Proposal: `docs/refactoring/1.3.7/REFACTORING.md` (Problem/Goal/Plan/Risk/Acceptance, steps small and buildable).
- Focus 1 — SoundDriver dead code: verify no `new SoundDriver(`, no `playEvents`/`exportToAssembly` callers remain - remove the module or consolidate surviving pieces (clampVolume, types) into their live consumers. Remove corresponding test files or keep only those covering live code paths.
- Focus 2 — autonomous pick from the recorded candidate list (e.g., hook extraction, DRY consolidation) chosen at implementation time by analysis.
- Byte-identical export fixtures where relevant - no behavior change - audio-critical patterns untouched.
- Assessment: `docs/refactoring/1.3.7/ASSESSMENT.md` — proposed vs achieved, deviations, verification counts.
- Gate: full loop clean.

## Wave 3 — Window Review + Bump

- `docs/review/1.3.7/review-1.3.7.md` — full review: every change record assessed against its stated outcome with verification evidence (test counts, gate results), the refactoring assessed, open follow-ups listed.
- `npm audit` → record result in the review.
- `scripts/release-check.sh` → must pass (records coverage + assessment + review presence).
- `npm run bump` → 1.3.8 - prepend the CHANGELOG entry (`## Version 1.3.8`, summary sentence + `**Subject**:` bullets + security item).
- Propose the commit message — never commit.

## Wave 4 — ASE Adjustment

- `docs/WORKFLOW.md` — record the autonomous window close-out cycle: read all change records for the version → implement outstanding or discard → if none open, run a refactoring cycle → full window review → release gate → bump. Names the trigger and the sequencing rules.
- `docs/VERSIONING.md` — pointer: the review must exist before bump (already gated by release-check - record the close-out ordering).
- Change record `docs/change/1.3.7/window-closeout-procedure.md` if the doc edit lands pre-bump, else file under 1.3.8.

## Files to Modify

- `src/components/panels/TrackPanel.tsx`, `src/components/panels/HeaderPanel.tsx` — preview guards
- `src/synth/SoundDriver.ts` + consumers/tests — removal/consolidation
- `docs/review/1.3.7/review-1.3.7.md`, `docs/refactoring/1.3.7/*`, `docs/change/1.3.7/*`, `docs/plan/1.3.7/*`, `public/CHANGELOG.md`, `docs/WORKFLOW.md`, `docs/VERSIONING.md`, `package.json` (via bump)

## Verification

- [ ] Full loop after every wave: `npm run typecheck`, `lint`, `format`, `build`, `test`
- [ ] `npm run test:e2e` + production preview smoke before the bump
- [ ] `npm audit` + `scripts/release-check.sh` green before `npm run bump`
- [ ] Release gate exits 0 with review present

## Risks

- SoundDriver removal may reveal live callers the scout's grep missed — gate: typecheck + tests must stay green at each removal step - revert per-step if callers surface.
- stopPreview guard could suppress a legitimate stop if preview-active tracking misses a path — mitigation: trace every `startPreview`/`isPreviewing` site before writing the guard.
