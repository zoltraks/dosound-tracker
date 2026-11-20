# WebKit E2E Playback Root Cause Implementation Plan

## Summary

| Field         | Value                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | Root-cause the two WebKit playback e2e failures and resolve honestly - a real fix if the app is at fault, an explicit environment-expected annotation if not |
| Key decisions | Root cause is environmental: Playwright's WebKit build on Windows ships without the Web Audio API; the two playback specs skip on `webkit` + `win32` only    |
| Open risks    | `none` - Chromium coverage is unchanged and the WebKit playback assertions still run for real on macOS and Linux                                             |

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.8/webkit-e2e-playback-root-cause.md`.

## Best Practices

This change touches only an e2e spec - no React components, hooks, or stores change. The applicable conventions are:

- Minimal, safe change - one shared reason constant and one guarded `test.skip` per playback spec.
- The skip names its platform condition and reason explicitly - no silent skip.
- Preserve existing style - the `// REASON:` comment matches the convention already used in `playwright.config.ts`.

## Audio-Critical Requirements

This change modifies no audio code. It annotates the two e2e specs that exercise playback. Audio-path verification is unchanged where the platform can support it: Chromium runs both specs on every host, and WebKit runs them on macOS and Linux where the Web Audio API exists. On Windows, Playwright's WebKit build exposes no `AudioContext` at all, so no audio behaviour is observable there to verify.

## Documentation Updates

Per project guidelines, documentation is reviewed before code changes. Update only the files affected by this change.

- `PROJECT.md` - no change: no requirement changes.
- `ARCHITECTURE.md` - no change: no structural or boundary change.
- `SPECIFICATION.md` - no change: no implementation detail changes.
- `FORMAT.md` - no change: no save or export format change.
- `TESTING.md` - intentionally not edited under this record's ownership split; the proposed coverage-gap note is recorded in Refinements for the integrator.

No source documentation file requires an update; the docs-first step is satisfied by this explicit statement plus the TESTING.md note handed to the integrator.

## Type and State Updates

**Type definitions**

No type changes. The spec gains a `browserName` fixture parameter already provided by `@playwright/test`.

File to modify: none.

**State store modifications**

No store changes. No subscribing components are affected.

File to modify: none.

## Step by Step Implementation

**Reproduce and probe the WebKit failure**

Run `npx playwright test --project=webkit e2e/smoke.spec.ts` to confirm the two playback specs fail while the rest pass. Then probe the page with a temporary diagnostic spec that wraps the `AudioContext` constructors through `page.addInitScript` and reads audio globals through `page.evaluate`.

File to modify: `e2e/diag-audio.spec.ts` (temporary - created for diagnosis, deleted in the same session; not part of the change set).

**Annotate the playback specs**

Add a shared `WEBKIT_WINDOWS_NO_WEB_AUDIO` reason constant and a `test.skip` guarded by `browserName === 'webkit' && process.platform === 'win32'` at the top of each playback spec. The condition names the platform; the reason string records why coverage is absent there.

File to modify: `e2e/smoke.spec.ts`.

```typescript
const WEBKIT_WINDOWS_NO_WEB_AUDIO =
  'Playwright WebKit on Windows has no Web Audio API - playback cannot start in this environment';

test('enters a note in track A and plays the song', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit' && process.platform === 'win32', WEBKIT_WINDOWS_NO_WEB_AUDIO);
  // ...unchanged body...
});
```

## Implementation Order

Execute the steps above in this sequence.

1. Reproduce the failure and probe the WebKit audio surface
2. Annotate the two playback specs in `e2e/smoke.spec.ts`
3. Verify the webkit and chromium projects
4. Run typecheck, lint, and formatting on the touched file

## Testing Strategy

**Unit tests**

None - no source or utility code changes.

**Integration tests**

The Playwright smoke suite is the integration surface for this change:

- `npx playwright test --project=webkit e2e/smoke.spec.ts` - the two playback specs report as skipped with the recorded reason; the other 13 pass.
- `npx playwright test --project=chromium e2e/smoke.spec.ts` - all 15 specs pass and the playback specs execute for real, proving Chromium coverage is intact.

## Verification

- `npx playwright test --project=webkit e2e/smoke.spec.ts` - 13 passed, 2 skipped.
- `npx playwright test --project=chromium e2e/smoke.spec.ts` - 15 passed.
- `npx tsc -b tsconfig.node.json` - clean; covers `e2e/` and the Playwright config.
- `npx eslint e2e/smoke.spec.ts` - clean.
- `npx prettier --write e2e/smoke.spec.ts` then `npx prettier --check` - clean.
- Full `npx tsc -b` reports errors in `test/utils/cross/zzprobe.test.tsx`, an untracked probe file owned by concurrent work outside this change set - reported separately, not touched.

## Refinements

**Root cause**

Playwright's WebKit build on Windows is compiled without Web Audio support. `window.AudioContext`, `window.webkitAudioContext`, and `window.OfflineAudioContext` are all `undefined` in the page - the API does not exist, so this is not a suspended-context resume failure and not an autoplay-policy block. Upstream confirmation: microsoft/playwright#14105 records that `ENABLE_WEB_AUDIO` is unsupported on the Windows port.

**Evidence**

- Temporary diagnostic spec (since deleted) probed the live page: `typeof AudioContext === 'undefined'`, `typeof webkitAudioContext === 'undefined'`, `typeof OfflineAudioContext === 'undefined'`; `navigator.webdriver === true`; `visibilityState === 'visible'`; `document.hasFocus() === true`; `window.ym2149` absent after load and after the PLAY SONG click; `.play-song-button` kept the class `command-button play-song-button ` with no `playing`.
- Failure chain in source: `useAudioContext` finds no `AudioContext` class and leaves `audioContext` null; `useAudioSetup` returns early so no `SoundEngine` ever lands; `usePlaybackHandlers.startWhenReady` awaits `waitForEngines()`, whose waiter never resolves, so `startSong` never runs and `sequencerState.isPlaying` stays false.
- Reproduced before the change on this host: 2 failed / 13 passed on the webkit project; after the change: 2 skipped / 13 passed. Chromium: 15 passed before and after.

**Chosen resolution**

Environment-expected annotation via `test.skip(browserName === 'webkit' && process.platform === 'win32', reason)`. `test.skip` was chosen over `test.fixme` because there is no defect to fix - the platform cannot expose the API, and `fixme` would imply an app-side bug. The guard names `webkit` and `win32` explicitly, so WebKit on macOS and Linux still executes both playback assertions for real and Chromium coverage is untouched.

**TESTING.md note for the integrator**

Proposed addition to the "Audio-path verification requires the webkit project" paragraph:

> On Windows hosts the webkit project cannot exercise audio at all - Playwright's WebKit build ships without the Web Audio API (`window.AudioContext` is undefined), so the two playback specs in `e2e/smoke.spec.ts` skip there through an explicit `webkit` + `win32` guard. Audio-path e2e verification therefore runs on chromium on every host and on webkit only on macOS and Linux; a Windows webkit run reports those specs as skipped, not failed.
