# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### A superseded worklet reply clobbered the restarted playback state

Observed symptom: stopping a Shift+Enter song playback with plain Enter silenced the audio while the sequencer kept animating - the mode-switch path ran `stop()` plus a deferred `startPatternLoop`, and the worklet's `stop` reply landed on the main thread after the restart had already set `isPlaying: true`, merging `isPlaying: false` over it. The `safeIsPlaying` latch then muted every later tick while position data still updated the UI.

Root cause: the worklet answers commands asynchronously on its message port, and the main-thread handler merged every `stop` reply into `playbackStateRef` unconditionally - the reply answered a command that a newer `start` had already replaced.

Preventing rule: see "Audio-Path State Rules" in `docs/standard/typescript-audio-development.md` - a reply to a superseded asynchronous command updates resources, never state.

### Generic late-file selectors beat equal-specificity section states

Observed symptom: two frame defects in one session shared one mechanism - the global `*:focus` ring painted an extra outline on the piano (the only section that takes real DOM focus on activation), and `X:hover` repainted over `X.active`, so a hovered active section showed the same frame color as an inactive one.

Root cause: `App.css` orders generic rules late in the file, so they win every equal-specificity contest - `*:focus` beat `.piano-keyboard { outline: none }`, and each `X:hover` block beat the earlier `X.active` rule.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - a section state that must win takes a compound selector (`.active:hover`) or a dedicated override, never a reliance on source order.

### A per-render fake tore the test's worker down on every state change

Observed symptom: new `useSequencer` regression tests posted `stop` and `start` messages that never reached the handler - only the mount-time `setParams` and `start` posts arrived.

Root cause: `fakeAudioContext()` returned a new object on each render, so the node-creation effect re-ran on every state change, tearing down the fake worklet node and building a fresh one - the test's messages landed on a dead port.

Preventing rule: see "Fakes consumed through dependency arrays must be referentially stable" in `TESTING.md` - hoist the fake to module scope or a `useRef`.

### The bundled manual drifted across several behaviour changes

Observed symptom: `public/MANUAL.md` still told users that ENTER "starts playing current pattern" after the playback bindings had changed several times - the refresh needed a dedicated user request.

Root cause: the documentation-first rule names the pillar documents (`SPECIFICATION.md`, `ARCHITECTURE.md`, `PROJECT.md`, `FORMAT.md`) but not the bundled user documents in `public/`, so user-facing text had no owning step in the change flow.

Preventing rule: see "Update the project specification" in `WORKFLOW.md` - the bundled documents join the documentation-first list for user-facing behaviour.

### Stage gates ask through the host's mechanism

Already indexed in `docs/archive/lesson/2026-11/lessons-2026-11-11-window-1.5.4.md` - noted here only because the same correction recurred this session; the written rule stands.
