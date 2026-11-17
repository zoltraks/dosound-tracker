# Characterise the Residual Thin Coverage in Dialog, Song, and Utility Modules

## Problem

The second 1.6.3 window cycle opened with four landed change records and no
new code work, so its refactoring phase analysed the current implementation
directly. A fresh `npm run test:coverage` pass puts branch coverage at 80.88
percent against the 80 percent gate - a margin thin enough that ordinary
feature work can tip the suite under threshold. The survey covered every
focus area in `REFACTORING.md`: `src/App.tsx` remains the largest file and
stays deferred to a dedicated request, store splitting stays architectural,
no `any` types, unchecked casts, or TODO markers exist in `src/`, and the
export, synth, and domain directory structure is already clean. The residual
value is concentrated in test coverage.

**Modal dialog hooks without dedicated suites**

Three hooks under `src/hooks/modal/` carry no test file and show wide
uncovered regions in the coverage report: `useExportModal.ts` (139 lines,
roughly half of statements, near-zero branches and functions),
`usePasteTrackOptions.ts` (106 lines, just over half of branches), and
`useSettingsSession.ts` (133 lines, roughly forty percent of statements and
branches). These hooks own modal open/close state, export dispatch wiring,
paste-mode persistence through `localStorage`, and the settings session
snapshot - exactly the guard and fallback arms that regress silently.

**Song, instrument, and file operation hooks with absent or thin coverage**

Four hooks have no dedicated suite: `useTrackPattern.ts` (98 lines, just
over half of branches), `useSongToolDialogs.ts` (120 lines, near-zero
branches), `useSongImportWarning.ts` (58 lines, six percent of branches), and
`useInstrumentOctaves.ts` (64 lines, under a third of branches). Three more
carry suites that leave wide branch gaps: `useTrackOperations.ts` (486
lines, about two fifths of branches uncovered), `useExportOperations.ts`
(467 lines, about two fifths of branches uncovered), and
`useSongLifecycleDialogs.ts` (near-zero branch coverage despite a suite).

**Pure-logic residuals in utilities, UI hooks, and audio edges**

`src/utils/panel/barRendering.ts` is barely over a third covered despite an
existing suite - most of the file sits in uncovered lines. `useScrollSync.ts`
and `useResponsivePanels.ts` under `src/hooks/ui/` have no dedicated suites
and sit near sixty to seventy percent. The audio edge files
`src/hooks/audio/useAudioContext.ts` (zero percent), `useAudioContextResume.ts`
(a third covered), and the `soundEngine.ts` factory path are essentially
unexercised - small files whose guard arms decide whether playback starts at
all.

Files the refactoring would touch: new and extended test files under
`test/hooks/modal/`, `test/hooks/song/`, `test/hooks/instrument/`,
`test/hooks/file/`, `test/hooks/ui/`, `test/hooks/audio/`, and
`test/utils/panel/` only - no `src/` changes.

**Deferred observations**

`App.tsx` decomposition stays deferred to a dedicated request as in the
previous cycle. Splitting `uiStore` stays architectural. The presentational
component clusters - `PianoKeyboard.tsx` (under forty percent), the playlist
header and panel, `ActionPanel.tsx`, `InstrumentSection.tsx`,
`InstrumentTypeSection.tsx`, and the shell components - stay indirect and
defer to a later cycle: their uncovered regions are pointer and layout
interaction paths that need heavier component harnesses than this phase
budgets.

## Goal

Every named module carries a dedicated suite that pins its observable
behaviour - returned values, dispatched calls, persisted `localStorage`
writes, and warning paths - so the uncovered regions shrink to documented
unreachable or environment-bound residuals. Branch coverage rises above its
current 80.88 percent with headroom, and the suite keeps passing the
configured thresholds.

## Findings

**Modal dialog hooks without dedicated suites**

**Issue**

`useExportModal`, `usePasteTrackOptions`, and `useSettingsSession` have no
files under `test/hooks/modal/`:

```ts
const { isExportModalOpen, exportType, handleExport } = useExportModal(params);
```

**Impact**

Export dispatch selection, paste-mode confirmation flows, and settings
session apply/discard paths can regress inside a passing gate. These hooks
feed every modal the smoke suite opens.

**Recommendation**

Add one suite per hook under `test/hooks/modal/` using `renderHook` on the
jsdom environment, asserting returned state transitions, the exact
`export*WithContext` dispatch selected per export type, the
`localStorage`-backed mode persistence, and the confirm/cancel dialog
callbacks.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - additive test files only.

**Song, instrument, and file operation hooks with absent or thin coverage**

**Issue**

`useTrackPattern`, `useSongToolDialogs`, `useSongImportWarning`, and
`useInstrumentOctaves` lack dedicated suites, and `useTrackOperations`,
`useExportOperations`, and `useSongLifecycleDialogs` carry suites that leave
most branch permutations unexercised:

```ts
const warnings = useSongImportWarning({
  pendingSongImport,
  confirmPendingSongImport,
  cancelPendingSongImport,
});
```

**Impact**

Pattern lookup guards, tool-dialog confirm chains, import-warning message
construction, octave persistence, and track/file operation fallback arms
regress silently. `useSongImportWarning` builds user-facing warning text -
its six percent branch coverage means most message variants are unverified.

**Recommendation**

Add dedicated suites for the four unsuited hooks and extend the three
existing suites with the missing branch permutations, asserting returned
messages, `updateSong`/`updateInstrument` payloads, storage writes, and
dialog state transitions rather than internals.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - additive and extended test files only.

**Pure-logic residuals in utilities, UI hooks, and audio edges**

**Issue**

`barRendering.ts` sits mostly uncovered despite `barRendering.test.ts`;
`useScrollSync.ts` and `useResponsivePanels.ts` have no suites;
`useAudioContext.ts`, `useAudioContextResume.ts`, and the `soundEngine.ts`
factory edge are at or near zero:

```ts
const bars = computeBarSegments(values, ...);
```

**Impact**

Bar geometry math, scroll-sync thresholds, responsive panel breakpoints, and
the audio-context creation/resume guards decide visible playback behaviour -
their uncovered arms are exactly the failure paths users hit on odd devices
or window sizes.

**Recommendation**

Extend `barRendering.test.ts` across the uncovered segments, add
`useScrollSync` and `useResponsivePanels` suites, and add audio-edge suites
that drive `useAudioContext`, `useAudioContextResume`, and the
`soundEngine` factory through the existing `test/synth/audioContextStub.ts`
fakes. Pure-logic files carry the `// @vitest-environment node` pragma per
`TESTING.md`.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - additive and extended test files only.

## Plan

**Characterise the modal dialog hooks**

Add `test/hooks/modal/useExportModal.test.tsx`,
`test/hooks/modal/usePasteTrackOptions.test.tsx`, and
`test/hooks/modal/useSettingsSession.test.tsx` covering state transitions,
per-type export dispatch, mode persistence, and dialog callbacks. Verify
with `npm test test/hooks/modal/` and `npm run typecheck` before the next
step.

**Characterise the song dialog and lookup hooks**

Add `test/hooks/song/useTrackPattern.test.tsx`,
`test/hooks/song/useSongToolDialogs.test.tsx`, and
`test/hooks/song/useSongImportWarning.test.tsx` covering pattern guards,
confirm chains, and warning-message variants. Verify with
`npm test test/hooks/song/` before the next step.

**Characterise the instrument octave hook and deepen operation suites**

Add `test/hooks/instrument/useInstrumentOctaves.test.tsx`, then extend
`useTrackOperations`, `useExportOperations`, and `useSongLifecycleDialogs`
suites with their missing branch permutations. Verify with
`npm test test/hooks/instrument/ test/hooks/file/ test/hooks/song/` before
the next step.

**Characterise the utility and UI-hook residuals**

Extend `test/utils/panel/barRendering.test.ts` across the uncovered
segments and add `test/hooks/ui/useScrollSync.test.tsx` and
`test/hooks/ui/useResponsivePanels.test.tsx`. Verify with
`npm test test/utils/panel/ test/hooks/ui/` before the next step.

**Characterise the audio edge hooks**

Add suites for `useAudioContext`, `useAudioContextResume`, and the
`soundEngine` factory path under `test/hooks/audio/` and
`test/synth/`, driving creation, resume, and failure arms through the
existing audio stubs. Verify with `npm test test/hooks/audio/
test/synth/` before the assessment.

## Step Granularity

Each step adds or extends test files inside one domain directory and leaves
the tree buildable and testable. Suites are additive and independent, so a
failure inside one cannot masquerade as a regression elsewhere. No step
touches `src/` - the refactoring is characterisation only.

## Risk

The risk is false confidence from implementation-detail assertions - suites
must assert observable returns, dispatched calls, storage writes, and
warning text, never hook internals. Hook suites run under `renderHook` on
the jsdom environment except pure-logic files, which carry the
`// @vitest-environment node` pragma. Several target hooks carry
`eslint-disable react-hooks/exhaustive-deps` headers recorded as
audio-critical exceptions in `SPECIFICATION.md` - the suites exercise them
without modifying the sources, so the timing constraints are untouched.
Fakes are hoisted or referentially stable per `TESTING.md`, the localStorage
mock reinstalls per test, and console output stays behind failure paths.

## Acceptance Criteria

- Every module named in the findings carries a dedicated suite, and each
  suite's uncovered regions shrink to documented unreachable or
  environment-bound residuals.
- Branch coverage rises above the current 80.88 percent and stays at or
  above the configured thresholds in `vitest.config.ts`.
- Rendered behaviour is identical on the smoke flows by construction - no
  `src/` file changes, so the modal, playback, and export paths are
  untouched.
- Produced export output stays identical for the supplied fixtures - the
  emission goldens remain untouched.
- The full verification loop passes with zero errors and zero warnings:
  typecheck, lint, format, build, and `npm test`.
- The Playwright smoke suite passes against the built bundle as the
  recorded live slice.
