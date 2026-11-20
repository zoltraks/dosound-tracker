# App.tsx Residual Orchestration Refactoring Assessment

## Proposal Summary

Retire the five derived logic clusters still living between the hook
instantiations in `src/App.tsx`: the sliding three-track window projection,
the edit-history position bridge, the sound-preference state, the clipboard
dispatch, and the navigation/engine adapter shims. Add
`navigableTrackSections` to the keyboard utils, `engineInstanceForChannel`
to `useAudioSetup`, and four hooks - `useSoundPreferences`,
`useEditPositionBridge`, `useTrackWindow`, `useClipboardDispatch` - each
with a dedicated suite, so the orchestrator keeps only hook instantiation
and the JSX prop map.

## Implementation Summary

All five plan steps landed. `App.tsx` dropped from 1247 to 1178 lines and
now contains no `useEffect`, no `useState`, and no derived `useCallback`;
the only React primitives left are the two edit-position refs the plan
keeps, one `useMemo` prop derivation, and the `useRef` import pair. The
file-level `exhaustive-deps` disable was removed once nothing needed it.

- `navigableTrackSections(twoChip)` lives in
  `keyboardNavigationUtils.ts`, returns `TrackNavigationSection[]`, and
  removed the inline `as import(...)` cast.
- `useSoundPreferences` owns engine id, mono, crosstalk, the preview draft,
  and the effective pair, fed by one `loadSettings()` parse.
- `useEditPositionBridge` owns the mirror and apply-binding effects; the
  refs and the `useDataManagement` bridge lambdas stay in `App.tsx`, so the
  two-phase lifecycle is unchanged.
- `useTrackWindow` owns `visibleTracks`, `trackWindowStart`, the
  render-time projection, both fallbacks, and the hysteresis effect,
  verbatim including the `set-state-in-effect` disable. It is called where
  the derivation sat, after `useTrackFocus`.
- `engineInstanceForChannel` joined `useAudioSetup`'s return; the three
  `ym2149ForChannel` prop sites pass it through unchanged.
- `useClipboardDispatch` owns the envelope-versus-track routing pair.
- `handleNavigateInstrument` moved into `useInstrumentActions`, whose
  parameter list already carried every dependency.
- `handleLineChange` was deleted; `TrackerSection`'s `onLineChange`
  receives `setSharedCurrentLine` directly.
- `SettingsSoundPreview` moved to `src/types/settings.ts`.

Four new suites landed: `useSoundPreferences` (4 tests),
`useEditPositionBridge` (2), `useTrackWindow` (6), `useClipboardDispatch`
(3) - 15 tests total.

## Gap Analysis

The deviations are recorded in the proposal's `Refinements` section. The
material ones: `handleNavigateInstrument` and `handleLineChange` were
extra clusters the Goal's "no derived `useCallback`" criterion forced out
of `App.tsx`; `envelopeMessages` `useMemo` was retained as a trivial
prop derivation whose relocation would churn `useMessageSystem` for no
gain; and `soundEngineId` shares the single `loadSettings()` parse, which
is value-identical because `loadSettings().sound.engine` resolves through
`loadSoundEngineId()` internally.

## Verification Results

- `npm run typecheck` - pass, zero errors.
- `npm run lint` - pass, zero warnings.
- `npm run format` - pass, no rewrites outside the change set.
- `npm run build` - pass.
- `npm test` - pass, 197 files and 1809 tests, including the whole-shell
  `App.test.tsx` integration specs and the unchanged export byte-equivalence
  suites.
- `npm run test:e2e` - 28 of 30 Playwright specs pass on chromium and
  webkit. The two webkit playback specs fail identically on a clean HEAD
  worktree, proving a pre-existing environmental limitation (Windows
  WebKit headless audio resume), not a regression. See Remaining Gaps.

## Baseline Repairs

Two pre-existing failures were fixed before source work per `TESTING.md`:

- `node_modules` was stale - js-yaml 4.3.2 against the required `^5.5.0`
  broke `quoteStyle: 'double'` emission and failed six `yamlEmission`
  tests. Repaired with `npm install --engine-strict=false`; the host runs
  Node 22 against the declared `>=26.13.0` engine. Environment-only.
- `scripts/retention-sweep.mjs` keyed `activeDocs` with
  `path.relative(...)`, emitting `docs\GUIDELINES.md` on Windows while the
  suite expects POSIX separators. Keys are normalized with
  `split(sep).join('/')`; the two `retentionSweepCoverage` tests failed
  before and pass after.
- Playwright browser binaries were also stale; `npx playwright install`
  restored chromium, webkit, and firefox for the current version.

## Metrics Comparison

| File                         | Before | After           |
| ---------------------------- | ------ | --------------- |
| `src/App.tsx`                | 1247   | 1178 lines      |
| Four new hooks               | -      | 228 lines total |
| Four new test suites         | -      | 248 lines total |
| `keyboardNavigationUtils.ts` | 43     | 53 lines        |
| `useAudioSetup.ts`           | -      | +7 lines        |
| `useInstrumentActions.ts`    | -      | +13 lines       |
| `types/settings.ts`          | 65     | 73 lines        |

`App.tsx` shed roughly seventy net lines; the clusters now live beside
their domain siblings where each is independently testable.

## Output Fidelity

No export, audio algorithm, or file-output code was touched. The
`yamlEmission` byte-equivalence suite passes unchanged, the e2e export
specs pass on chromium, and `dist/` emits the same chunk set.

## Behaviour Smoke Check

The moved code is verbatim: same state initializers (now two
`loadSettings()` parses instead of four), same effect positions, same
dependency arrays plus stable ref/setter entries, same render-time window
derivation, and the same callback identities through `useCallback`.
Verified flows: the `App.test.tsx` shell suite, track navigation, the
sliding window at both edges and its first-commit framing, undo/redo
position restore through the bridge, settings sound preview and
close-restore, clipboard routing in both sections, and instrument
navigation. Playback-start e2e passes on chromium; webkit playback is
unverifiable on this host before and after the change alike.

## Remaining Gaps

- WebKit audio playback cannot be exercised on this Windows host; the two
  affected specs fail on clean HEAD identically. The suspended-context
  gate `TESTING.md` requires for audio-path changes is therefore only
  partially satisfied here - chromium coverage plus the unchanged audio
  call graph carry the evidence, and a macOS/Linux run would close the
  gap.
- Manual playback listening was not performed; no synthesis, sequencer,
  or engine-selection semantics changed, so the risk is confined to
  wiring, which the suites cover.

## Lessons Learned

- A stale `node_modules` can counterfeit a broken baseline: js-yaml 4.x
  silently ignored the js-yaml 5 `quoteStyle` option and produced six
  emission failures that looked like code drift. `npm ls` against
  `package.json` ranges is the cheap first check when golden-file tests
  fail for quoting-style reasons.
- `git status` and `git diff` disagree under `core.autocrlf=true` after
  `prettier --write .`: roughly 1250 files show modified while
  `git diff --name-only` reports one. The phantom entries are LF/CRLF
  noise that the clean filter erases on commit.
- A `git worktree` at HEAD plus `npm install` is a fast, safe way to
  A/B an e2e failure against the pre-change tree without touching the
  working copy.

## Conclusion

Pass with one environmental caveat. Every planned extraction landed,
`App.tsx` is wiring and prop map only, all unit and integration suites
are green, and the two webkit e2e failures are proven pre-existing on
this host. The change set is ready for manual review and commit.
