# Consolidate the Modal Prop Surface and Characterise Fresh Extractions

## Problem

The 1.6.3 window opened with no active change records, so its refactoring phase analysed the current implementation directly. The survey covered every focus area in `REFACTORING.md`: `src/App.tsx` remains the largest file in the tree, a documented state that stays deferred to a dedicated request rather than a drive-by phase. Store splitting is architectural and out of scope. The export and synth modules already sit in domain isolation, and no `any` types, unchecked casts, or TODO markers were found. Two verified findings remain.

**Duplicated modal prop surface**

`src/components/modal/ModalManager.tsx` redeclares nearly the whole `ModalContainerProps` surface from `src/components/modal/ModalContainer.tsx`, destructures every shared member, and re-forwards each one verbatim through a long JSX block. The same prop names appear a third time in the `useAppModals` wiring call, so adding or renaming one modal prop means editing four sites across three files.

The two declarations have already drifted cosmetically: different parameter names (`error`, `open`, `checked` versus `value`), inline unions versus the container's `TransposeScope` aliases, and required versus optional `aboutRuntime` members. The duplication is a maintained copy, not an alias.

**Thin direct coverage on the fresh extractions**

The modules extracted during the 1.6.2 window carry no dedicated unit suites and rely on indirect coverage through parent-hook tests. The coverage summary shows `useMidiDeviceAttachments` near three quarters of statements with the error guards and fallback arms uncovered, `useMidiMonitors` near half of its branches, `useMidiOutput` near three quarters of its branches, `songRenumber` near seventy percent of its branches, `songOptimize` below eighty percent of its branches, and single residual guard gaps in `useEditHistory` and `midiDebugFlag`.

Files the refactoring would touch: `src/components/modal/ModalManager.tsx` for the consolidation, plus new test files under `test/hooks/midi/` and `test/hooks/song/` for the characterisation work.

**Deferred observation**

The output-close guard in `useMidiDeviceAttachments` logs `Failed to close MIDI input` while closing an output device. Rewording a log message is observable behaviour, not refactoring, so the fix defers to a change record in the next window per the Deferral rule.

## Goal

The modal prop surface is declared exactly once. `ModalManagerProps` inherits `ModalContainerProps` and adds only the members the manager itself consumes - the repository-instrument picker, the demo-song picker, the export modal, and the paste-track modal. The manager body destructures those owned members and forwards the rest by spread, so a new container prop reaches the container with no manager-side edit.

Each freshly extracted module carries a dedicated suite that pins its error guards, fallback arms, and boundary branches, keeping the coverage gate above its thresholds with direct rather than incidental coverage.

## Findings

**Duplicated modal prop surface**

**Issue**

`src/components/modal/ModalManager.tsx` holds a second copy of the container's prop declaration and a forwarding block that names every shared member twice more:

```tsx
interface ModalManagerProps {
  songError: string;
  setSongError: (error: string) => void;
  // the full shared surface redeclared
}

<ModalContainer
  songError={songError}
  setSongError={setSongError}
  // every shared member forwarded verbatim
/>;
```

**Impact**

Maintenance burden and drift risk. The forwarding block carries no logic yet must be edited for every modal addition, and the parallel interface can silently diverge in optionality or parameter typing until a compile break exposes it.

**Recommendation**

Collapse the declaration into an interface extension and forward by rest spread:

```tsx
interface ModalManagerProps extends ModalContainerProps {
  isExportModalOpen: boolean;
  // only the members the manager renders itself
}

const { isExportModalOpen, ...containerProps } = props;

<ModalContainer {...containerProps} />;
```

**Risk Level**

Major

**Breaking Change Assessment**

No Breaking Change - the accepted prop set stays identical for the sole caller (`useAppModals`), and two members relax from required to optional, which only widens the surface.

**Thin direct coverage on the fresh extractions**

**Issue**

`useMidiDeviceAttachments.ts`, `useMidiMonitors.ts`, `useMidiOutput.ts`, `songRenumber.ts`, `songOptimize.ts`, `useEditHistory.ts`, and `midiDebugFlag.ts` have no dedicated suite; their uncovered regions are mostly guard and error arms such as:

```tsx
} catch (error) {
  logger.warn('Failed to look up MIDI input', error);
}
```

**Impact**

Edge paths - lookup failures, attach failures, close failures, the `onmidimessage` fallback, no-access cleanup, and renumber guard chains - can regress silently inside a passing coverage gate.

**Recommendation**

Add dedicated suites for the weakest modules, asserting observable calls (listener attach, `close`, `sendSystemReset`, warning logs, returned song data) rather than internals.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - additive test files only.

## Plan

**Extend the container props interface**

Rewrite `ModalManagerProps` as `interface ModalManagerProps extends ModalContainerProps` holding only the picker, export, and paste members the manager renders itself, importing `ModalContainerProps` from `./ModalContainer.tsx`. The duplicated member block and the now-unneeded inline unions leave in the same step - the container's exported aliases supply the transpose types. Verify with `npm run typecheck` and `npm run lint` before the next step.

**Forward container props by rest spread**

Replace the member-by-member destructured signature with a `props` parameter, destructure the manager-owned members plus `...containerProps`, and render `<ModalContainer {...containerProps} />` followed by the four owned modals. Verify with `npm run typecheck`, `npm run lint`, and the modal component tests.

**Characterise the MIDI attach branches**

Add `test/hooks/midi/useMidiDeviceAttachments.test.tsx` covering lookup failure, attach failure, open rejection, close failure, the `onmidimessage` fallback, input replacement, and the no-access cleanup path through fake access, input, and output objects.

**Characterise the MIDI monitor and output branches**

Add suites for `useMidiMonitors` and `useMidiOutput` covering their uncovered guard arms, and close the residual `midiDebugFlag` guards in the same domain pass.

**Characterise the renumber and optimize branches**

Add `test/hooks/song/songRenumber.test.ts` and `test/hooks/song/songOptimize.test.ts` covering the guard chains and boundary arms, and close the residual `useEditHistory` guard where the song-domain suite lands adjacent.

## Step Granularity

Each step touches one file or one test domain and leaves the tree buildable and testable. The interface extension precedes the spread so a member-set mismatch fails typecheck at the earliest point. Test suites are additive and independent, so a failure inside one suite cannot masquerade as a regression elsewhere.

## Risk

The consolidation risk is a dropped or mistyped member, which fails at typecheck - the only caller is `useAppModals` and its prop set is unchanged. Rendered output is identical by construction: the same values reach the same elements. App-level integration tests and the modal component suites exercise the render path, and the Playwright smoke suite provides the recorded live slice.

The characterisation risk is false confidence from implementation-detail assertions - suites must assert observable calls and returned data. Hook suites run under `renderHook` on the jsdom environment; pure-logic modules carry the `// @vitest-environment node` pragma. Fakes are hoisted or referentially stable per `TESTING.md`, the localStorage mock reinstalls per test, and console output stays behind failure paths only.

## Acceptance Criteria

- `ModalManagerProps` declares no member already present on `ModalContainerProps`, the verbatim forwarding block is gone, and the file drops to roughly a third of its prior size.
- Rendered behaviour is identical on the smoke flows: open the settings modal and confirm or cancel, open the export modal and pick a format, open the paste-track modal, and open each file picker.
- Each named extracted module reaches at least the gate level for branches, or carries a documented unreachable residual.
- The full verification loop passes with zero errors and zero warnings: typecheck, lint, format, build, and `npm test` plus `npm run test:coverage` at or above the configured thresholds.
- Produced export output stays identical for the supplied fixtures - the emission goldens remain untouched.
- The Playwright smoke suite passes against the built bundle as the recorded live slice.
