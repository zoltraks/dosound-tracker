# Retire the residual App.tsx orchestration clusters

## Problem

`src/App.tsx` remains the largest file in the tree at roughly twelve hundred
lines. Staged decomposition moved the dialog, persistence, playback, and modal
concerns into bounded hooks, and `ARCHITECTURE.md` records the orchestrator's
intended shape: dependency wiring at the composition root, behaviour in domain
hooks.

Five derived logic clusters still live inline between the hook instantiations.
Each belongs to a named domain, each is split or interleaved with unrelated
wiring, and none is reachable for a unit test without mounting the whole
application:

- The sliding three-track window projection - window state, render-time
  derivation, focus fallback, preview clamp, and the hysteresis effect.
- The edit-history position bridge - two refs and two effects split across
  three places in the file.
- The sound-preference state - engine id, mono, crosstalk, the settings-draft
  preview resolution, and three separate `loadSettings()` mount calls.
- The clipboard dispatch - two callbacks branching between the track and
  envelope clipboards by active section.
- Two adapter shims - the `navigableTrackSections` map with an inline
  `as import(...)` cast, and `ym2149ForChannel` unwrapping `engineForChannel`.

Files the refactoring touches: `src/App.tsx`,
`src/utils/keyboard/keyboardNavigationUtils.ts`,
`src/hooks/audio/useAudioSetup.ts`, new
`src/hooks/ui/useTrackWindow.ts`, new
`src/hooks/song/useEditPositionBridge.ts`, new
`src/hooks/audio/useSoundPreferences.ts`, new
`src/hooks/ui/useClipboardDispatch.ts`, and three new hook test files.
`useDataManagement`, `useTrackFocus`, `useKeyboardNavigation`, and every
component prop contract stay unchanged.

## Goal

`App.tsx` holds only hook instantiation and the JSX prop map - no `useEffect`,
no derived `useCallback`, no `useState` outside `useAppState`. Every residual
cluster lives in a named hook or utility beside its domain siblings, preserving
declaration order so effect timing is unchanged.

Proposed tree:

```text
src/
  App.tsx                            composition root - wiring and JSX only
  hooks/ui/
    useTrackWindow.ts                new - sliding window, focus fallback,
                                     visibleTracks state
    useClipboardDispatch.ts          new - track vs envelope clipboard routing
    useTrackFocus.ts                 unchanged
  hooks/song/
    useEditPositionBridge.ts         new - edit-history position mirror and apply
    useEditHistory.ts                unchanged
    useDataManagement.ts             unchanged - receives the same bridge shape
  hooks/audio/
    useSoundPreferences.ts           new - engine id, mono, crosstalk, preview
    useAudioSetup.ts                 adds engineInstanceForChannel accessor
  utils/keyboard/
    keyboardNavigationUtils.ts       adds navigableTrackSections helper
  utils/song/
    visibleTracks.ts                 unchanged - window math stays a pure util
test/hooks/ui/
  useTrackWindow.test.tsx            new - slide, hysteresis, fallback, clamp
  useClipboardDispatch.test.tsx      new - section-routed copy and paste
test/hooks/song/
  useEditPositionBridge.test.tsx     new - mirror and apply behaviour
test/hooks/audio/
  useSoundPreferences.test.tsx       new - defaults and preview resolution
```

## Findings

**Sliding-window projection computed in the composition root**

`App.tsx` carries the whole channel-model derivation: the `visibleTracks` and
`trackWindowStart` state, `targetChannelIndex`, `effectiveWindowStart`,
`songTracks`, `effectiveTargetTrackId`, `previewChannelTrack`,
`effectivePreviewChannel`, the render-derive-then-persist hysteresis effect
with its `react-hooks/set-state-in-effect` disable, `trackChannelCount`, and
`navigableTrackSections` - about sixty lines.

**Impact**: the densest remaining logic block sits between unrelated hook
calls, and the recorded subtlety - deriving in render so the first commit
already frames the focused channel, then persisting the window as the
hysteresis anchor - is only exercisable through the whole-App mount.

**Recommendation**: `useTrackWindow` under `src/hooks/ui/` next to
`useTrackFocus`, its input owner. It receives `chipCount`, `targetTrackId`,
and `previewChannel`, and returns `visibleTracks`, `setVisibleTracks`,
`songTracks`, `effectiveTargetTrackId`, `effectivePreviewChannel`, and
`trackChannelCount`. The derivation and the persist effect move verbatim,
lint disable included, and the hook call takes the derivation's position so
effect ordering is preserved.

**Risk Level**: Major

**Breaking Change Assessment**: Internal Breaking Change - no public API,
stored data, or observable behaviour changes.

**Example**

Before: the projection derives inline and the fallback clamps by hand.

After:

```text
const {
  visibleTracks, setVisibleTracks, songTracks,
  effectiveTargetTrackId, effectivePreviewChannel, trackChannelCount,
} = useTrackWindow({ chipCount: songChipTotal, targetTrackId, previewChannel });
```

**Edit-history position bridge assembled from refs inline**

`editPositionRef` and `applyEditPositionRef` are created before
`useDataManagement` because the bridge consumer is instantiated before the
sequencer that the bridge applies into. Two later effects mirror
`sequencerState.currentPattern` and `sharedCurrentLine` into the position ref
and bind the apply callback to `setPosition` and `setSharedCurrentLine`.

**Impact**: the bridge's two-phase lifecycle is the reason the code exists,
yet it is spread across the file - the explaining comment, the refs, the two
effects, and the consuming lambdas are four separate places a reader must
join.

**Recommendation**: `useEditPositionBridge` under `src/hooks/song/` beside
`useEditHistory` takes the two refs plus `sequencerPatternIndex`,
`sharedCurrentLine`, `setPosition`, and `setSharedCurrentLine`, and owns both
effects verbatim. Refs passed as hook arguments follow the recorded
`midiHelpersRef` precedent. `App.tsx` keeps the ref creation and the
`getPosition`/`applyPosition` lambdas that `useDataManagement` already
consumes - the subtle ordering logic moves to a named, testable home.

**Risk Level**: Minor

**Breaking Change Assessment**: Internal Breaking Change

**Sound preferences as scattered raw state**

`monoEnabled`, `crosstalk`, `visibleTracks`, `settingsSoundPreview`, and
`soundEngineId` are five separate `useState` calls, `loadSettings()` runs in
three lazy initializers on mount, and the settings-draft preview gate -
`modalState.isSettingsOpen ? settingsSoundPreview : null` resolving into
`effectiveMono` and `effectiveCrosstalk` - is domain logic in the orchestrator.

**Impact**: three storage parses at mount where one suffices, and the
preview-resolution rule lives apart from the settings session that owns the
draft it previews.

**Recommendation**: `useSoundPreferences` under `src/hooks/audio/` owns the
engine id, mono, crosstalk, and the preview draft, resolving the effective
values from an `isSettingsOpen` argument. One `loadSettings()` call feeds both
sound initializers. `visibleTracks` and `setVisibleTracks` move into
`useTrackWindow`, whose projection is their only consumer - the settings
session receives the setter from the hook that owns the state.

**Risk Level**: Minor

**Breaking Change Assessment**: Internal Breaking Change

**Clipboard dispatch stranded between domain hooks**

`handleCopyClipboard` and `handlePasteClipboard` branch on
`isEnvelopeSectionActive` to route CTRL+C/CTRL+V between the envelope and
track clipboards.

**Impact**: small, but it is derived behaviour in the orchestrator and the
only place the two clipboard domains meet.

**Recommendation**: `useClipboardDispatch` under `src/hooks/ui/` takes the
envelope-active flag and the four domain handlers and returns the routed
pair. The dispatch rule gains a direct test surface.

**Risk Level**: Suggestion

**Breaking Change Assessment**: Internal Breaking Change

**Adapter shims on the navigation and engine surfaces**

`navigableTrackSections` maps channel ids to `track<Id>` strings and needs an
inline `as import('./constants/navigation.ts').NavigationSection` cast to
typecheck. `ym2149ForChannel` is a three-line `useCallback` that only unwraps
`engineForChannel(channel).engine`.

**Impact**: both shims exist because a pure helper and an accessor are missing
one level down. The cast hides the `TrackNavigationSection` type the keyboard
utils already export.

**Recommendation**: add `navigableTrackSections(twoChip)` to
`keyboardNavigationUtils.ts` returning `TrackNavigationSection[]`, and add
`engineInstanceForChannel` to `useAudioSetup`'s return so App passes the
accessor through unchanged and drops its `useCallback`.

**Risk Level**: Minor

**Breaking Change Assessment**: Internal Breaking Change

**Injected pure-utility params evaluated and kept**

`useTrackOperations`, `useInstrumentActions`, and `useMidiActions` receive
`formatNoteKey`, `parseBaseKeyString`, and `normalizeInstrumentId` as
parameters while sibling hooks import the same utilities directly. The
injection is a deliberate test seam - the suites stub `parseBaseKeyString`
with `vi.fn()` and `() => null` to exercise parse-failure paths.

**Impact**: the param surface is wider than necessary, but removing the seam
costs the stub and changes three hook contracts and their suites for no
runtime gain.

**Recommendation**: keep the injection as the recorded convention for these
hooks. No change.

**Risk Level**: Suggestion

**Breaking Change Assessment**: No Breaking Change

**Prop-map extraction evaluated and declined**

The remaining JSX is a per-slot prop map. Assembling each slot's props in a
separate object or builder moves the same flat surface into a second file -
relocation, not decomposition. The modal layer already slices its surface
through the domain groups; the panel slots keep flat prop lists because each
legitimately spans several domains.

**Recommendation**: no change to the JSX shape.

**Risk Level**: Suggestion

**Breaking Change Assessment**: No Breaking Change

## Plan

**Add the navigable-sections helper**

Add `navigableTrackSections(twoChip: boolean): TrackNavigationSection[]` to
`src/utils/keyboard/keyboardNavigationUtils.ts`, mapping `CHIP1_TRACK_IDS` or
`SONG_CHANNEL_IDS` to `track<Id>` section names. `App.tsx` replaces the inline
map, drops the `as import(...)` cast, and passes the helper result to
`useKeyboardNavigation`. Tidy only - no behaviour moves.

Files to modify: `src/utils/keyboard/keyboardNavigationUtils.ts`,
`src/App.tsx`.

**Extract useSoundPreferences**

Create `src/hooks/audio/useSoundPreferences.ts` holding `soundEngineId` via
`loadSoundEngineId`, `monoEnabled` and `crosstalk` fed by a single
`loadSettings()` call, the `settingsSoundPreview` draft state, and the
`effectiveMono`/`effectiveCrosstalk` resolution from an `isSettingsOpen`
argument. The `settings` modal slice and `useAudioSetup` receive the same
values through the same names. Add `test/hooks/audio/useSoundPreferences.test.tsx`
covering stored defaults, the draft preview, and the close-restore path.

Files to create: `src/hooks/audio/useSoundPreferences.ts`,
`test/hooks/audio/useSoundPreferences.test.tsx`. File to modify: `src/App.tsx`.

**Extract useEditPositionBridge**

Create `src/hooks/song/useEditPositionBridge.ts` taking `editPositionRef`,
`applyEditPositionRef`, `sequencerPatternIndex`, `sharedCurrentLine`,
`setPosition`, and `setSharedCurrentLine`, and moving the mirror effect and
the apply-binding effect verbatim. `App.tsx` keeps the two `useRef` lines and
the `getPosition`/`applyPosition` lambdas in the `useDataManagement` call;
everything between them moves. Add
`test/hooks/song/useEditPositionBridge.test.tsx` covering the mirror and the
apply path through a bound setter.

Files to create: `src/hooks/song/useEditPositionBridge.ts`,
`test/hooks/song/useEditPositionBridge.test.tsx`. File to modify: `src/App.tsx`.

**Extract useTrackWindow**

Create `src/hooks/ui/useTrackWindow.ts` moving the `visibleTracks` and
`trackWindowStart` state, the render-time projection, the
`effectiveTargetTrackId` and `effectivePreviewChannel` fallbacks, and the
hysteresis effect verbatim - including the `set-state-in-effect` disable and
the render-derive comment, which is why the order matters. The hook is called
where the derivation sits today, after `useTrackFocus` and before
`useAudioContextResume`, so effect order and the first-commit framing hold.
`setVisibleTracks` flows to `useSettingsSession` from the hook's return. Add
`test/hooks/ui/useTrackWindow.test.tsx` covering window sliding at both edges,
the focus fallback onto a hidden channel, and the preview clamp.

Files to create: `src/hooks/ui/useTrackWindow.ts`,
`test/hooks/ui/useTrackWindow.test.tsx`. File to modify: `src/App.tsx`.

**Retire the engine adapter and add the clipboard dispatch**

Add `engineInstanceForChannel` to `useAudioSetup`'s return, implemented as the
existing `engineForChannel` unwrap, and delete the `ym2149ForChannel`
`useCallback` in `App.tsx` - the three consumers keep their prop names.
Create `src/hooks/ui/useClipboardDispatch.ts` moving the two section-routed
clipboard callbacks, and add `test/hooks/ui/useClipboardDispatch.test.tsx`
covering envelope-active and track-active routing.

Files to create: `src/hooks/ui/useClipboardDispatch.ts`,
`test/hooks/ui/useClipboardDispatch.test.tsx`. Files to modify:
`src/hooks/audio/useAudioSetup.ts`, `src/App.tsx`.

**Verify and assess**

Run the full verification loop, then the Playwright smoke suite as the
runnable-artifact slice, then write `ASSESSMENT.md` beside this proposal.

## Step Granularity

The helper step is tidy-only and touches two files. Each extraction step moves
one cluster with its verbatim effects into a new hook and edits `App.tsx` plus
at most one source file - no step mixes a rename with an extraction, and no
step exceeds half a dozen files. The bridge and window steps land in the file
order their effects already occupy, so a regression localizes to one step's
diff and one hook's suite.

## Risk

The likeliest regression is effect-order drift - hooks run their effects at
their call position, so each new hook takes the position of the cluster it
replaces. The window projection's render-derive must stay in-render: resolving
it inside an effect would paint one stale frame per channel hop, which the
moved comment records and the new test's first-render assertion pins.

`useDataManagement` is instantiated before `usePlaybackControls`, which is why
the bridge binds through refs; the extraction keeps the refs in `App.tsx` and
moves only the effects, so the two-phase lifecycle is preserved exactly.
Local-storage initializers stay lazy. No moved state writes on the audio path
at frame rate - `effectiveMono` and `effectiveCrosstalk` feed `useAudioSetup`
with the same values.

Coverage comes from the three new hook suites, the whole-shell
`test/components/shell/App.test.tsx` integration specs, and the Playwright
smoke flows that exercise track navigation, settings persistence, and
clipboard copy/paste.

## Acceptance Criteria

- `App.tsx` contains no `useEffect`, no `useState`, and no derived
  `useCallback` - hook instantiation and the JSX prop map only.
- `useTrackWindow`, `useEditPositionBridge`, `useSoundPreferences`, and
  `useClipboardDispatch` exist under their domain directories with unit
  suites; `navigableTrackSections` is exported from
  `keyboardNavigationUtils.ts` and `engineInstanceForChannel` from
  `useAudioSetup`.
- Track navigation, the sliding three-track window, undo/redo position
  restore, settings sound preview, and clipboard copy/paste behave exactly as
  before.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, and
  `npm test` pass with zero errors and zero warnings.
- `npm run test:e2e` passes, covering the flows above.
- Coverage thresholds in `vitest.config.ts` hold - the new hooks are covered
  by their dedicated suites.
- Export output stays byte-identical - the export path is untouched, and the
  suite pins it.

## Refinements

Implementation landed with five deviations from the plan above, all recorded
here per the workflow.

**`handleNavigateInstrument` moved into `useInstrumentActions`**

The Goal bans derived `useCallback` in `App.tsx`. The callback's three
dependencies - `currentSong.instrument`, `currentInstrument`, and
`setCurrentInstrument` - were already parameters of `useInstrumentActions`,
so the move added no new hook surface and the keyboard-shortcuts wiring is
unchanged. `src/hooks/instrument/useInstrumentActions.ts` joins the touched
file list.

**`handleLineChange` deleted**

It was an identity wrapper over `setSharedCurrentLine`. `TrackerSection`'s
`onLineChange` now receives the store setter directly; the prop signature
`(line: number) => void` is identical.

**`envelopeMessages` `useMemo` retained**

It is a three-line memoized prop derivation joining `mirrorRestoreNotice`
with the `useMessageSystem` output. Relocating it would churn
`useMessageSystem`'s contract for no behavioural gain. The acceptance
criteria ban `useEffect`, `useState`, and `useCallback`, all of which are
gone from `App.tsx`; the memo is the only residual React primitive besides
the two bridge refs the plan keeps.

**`SettingsSoundPreview` moved to `src/types/settings.ts`**

The type left `useSettingsSession.ts` for the settings types module so
`useSoundPreferences` consumes it without a modal-to-audio import.
`useSettingsSession` imports it from there; no other consumer existed.

**`soundEngineId` shares the single `loadSettings()` parse**

The plan text said "via `loadSoundEngineId`". `loadSettings().sound.engine`
resolves through `loadSoundEngineId()` internally, so sourcing the
initializer from the same parse is value-identical and drops mount-time
storage reads from four to two (`useSoundPreferences` plus the
`useTrackWindow` `visibleTracks` initializer).

**File-level lint disable removed**

`App.tsx` opened with `/* eslint-disable react-hooks/exhaustive-deps */`.
With every effect and sparse-dependency callback moved into hooks the
directive reported as unused, so it was deleted.

**Baseline repairs precedented the refactor**

Two pre-existing failures were fixed before source work per `TESTING.md`:

- `node_modules` was stale - js-yaml 4.3.2 against the required `^5.5.0`,
  which broke `quoteStyle: 'double'` emission and failed six
  `yamlEmission` tests. Repaired with `npm install
--engine-strict=false`; the host runs Node 22 against the declared
  `>=26.13.0` engine. Environment-only, no file changes.
- `scripts/retention-sweep.mjs` keyed `activeDocs` by
  `path.relative(...)`, which emits `docs\GUIDELINES.md` on Windows while
  the suite expects POSIX separators. Keys are now normalized with
  `split(sep).join('/')`, which also makes `applyPlan`'s `join(ROOT, doc)`
  correct on every platform. Two `retentionSweepCoverage` tests failed
  before the change and pass after.
