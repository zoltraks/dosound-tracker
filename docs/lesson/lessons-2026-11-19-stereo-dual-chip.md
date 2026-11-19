# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Song-data ownership was modelled as an app setting

Observed symptom: `dualChip` lived in `SettingsValues` and gated the second playback engine, so a two-chip song with the setting off played a single centred engine - chip 2's content was silent and the output read as mono no matter what the stereo modes said. The user corrected the model directly: the two-chips state is song data and must be stored in the song and synchronized.

Root cause: the feature was wired before the ownership boundary was established - a per-song property (which engines a song needs, its `chipCount`) was implemented as a global preference, and playback derived from the setting instead of the song.

Preventing rule: see "F-18: Per-Channel Stereo Output" and "F-17: Settings Modal" in `docs/PROJECT.md` - per-song properties (chip count, stereo modes) are song data written through the song update path, while application preferences (mono, crosstalk, engine) stay in the settings draft; the settings UI may expose song data only as a synchronized control, never as a draft value.

### Mirrored per-chip content cannot reveal a routing failure

Observed symptom: an early stereo probe reported plausible-looking left/right levels while the actual routing was wrong - identical patterns on both chips made every configuration measure the same.

Root cause: the diagnostic seeded the same pattern content onto channels A-C and D-F, so a collapsed or swapped route produced the same measurement as a correct one; only different content per chip separates the channels in the capture.

Preventing rule: see "Stereo claims verify by correlation on distinct content" in `docs/TESTING.md` - stereo and routing claims verify by left/right correlation on a post-bus capture seeded with distinct per-chip content, after confirming the seed took.

### A leaf tap measures silence regardless of the signal

Observed symptom: a live audio probe read zeros from an `AnalyserNode` tapped off the engine while playback was clearly running.

Root cause: the Web Audio renderer pulls only nodes reachable from `AudioContext.destination`; a tap connected as a leaf branch never processes.

Preventing rule: see "Tap the destination chain, not a dead-end branch" and "Temporary graph instrumentation restores the original edge" in `docs/TESTING.md` - probes tap in series through the destination chain and restore the original edge on removal, verified by diff.

### A seed that assumes stored state silently no-ops

Observed symptom: a Playwright probe seeded a two-chip song into localStorage, then measured a single-chip result - the seed never landed because a fresh browser context carries no stored song for the mutation path to update.

Root cause: the probe mutated state through the app's own update path assuming prior stored song data existed; on a clean context the assumption fails silently and the measurement reflects defaults.

Preventing rule: see "Stereo claims verify by correlation on distinct content" in `docs/TESTING.md` and the seeding note in `docs/TOOLING.md` - confirm the seed took (resolved pan values, active flags, track counts) before trusting any measurement.

### Equal API surface is not engine parity

Observed symptom: the Ayumi worklet accepted the same `setChannelPans` values as the internal engine but rendered centred channels 6 dB quieter and folded mono at half amplitude - the same settings sounded different per engine.

Root cause: `StereoPannerNode` uses an equal-power taper while the worklet defaulted to a linear pan law, and its all-centre path folded `(left + right) * 0.5` where the internal engine kept unity gain.

Preventing rule: see "Cross-engine parity is a DSP-law claim" in `docs/TESTING.md` - parity verification checks the pan/gain law at every reachable value and the level path on both engines with the same seed; `AyumiCore.setPanBypass` plus `isEqp = true` now coincide with the node taper at 0, 0.5, and 1.

### UI-count assertions ignored the view projection

Observed symptom: a live check expected six track panels on a two-chip song and found three - the code was correct; the default `visible-tracks` setting renders a sliding three-channel window.

Root cause: panel count follows the view layer's projection, not the song's channel count; the assertion counted channels instead of projected panels.

Preventing rule: see "View-projection assertions seed the projection" in `docs/TESTING.md` - seed `dosound-tracker-visible-tracks` or assert against the projected set before counting UI elements.

### Stale project documents outlived the model they described

Observed symptom: `docs/PROJECT.md` still described the retired named-layout stereo model and claimed the interface exposes no stereo editing control; `docs/TOOLING.md` seeded a `dosound-tracker-dual-chip` key that no longer exists.

Root cause: the stereo refactor updated SPECIFICATION, FORMAT, MANUAL, and ARCHITECTURE but missed the requirements-level and tooling documents that described the same feature from a different angle.

Preventing rule: session review sweeps every document that names the changed surface, not only the ones the change record lists - this review corrected `docs/PROJECT.md` F-17/F-18 and the `docs/TOOLING.md` seeding example, and indexed the sweep here.

### Scripted edits need a verify-after-write pass

Observed symptom: several `edit` calls reported "string not found" on freshly-read content, one parameter pair arrived with duplicated fragments, and a shell heredoc once appended command text into a probe file producing a `SyntaxError`.

Root cause: exact-match edits are brittle against whitespace and concurrent file state; scripted replacements without a post-write read can land corrupted content silently.

Preventing rule: see "Tooling Notes" in `docs/TOOLING.md` - re-read the edited region after every scripted change and prefer `assert count == 1` replacements over blind writes; fall back to Python exact-match with an assertion when the edit tool rejects fresh content.

### Deferred: cross-engine loudness parity

Observed symptom: during stereo verification the Ayumi engine's rendered RMS measured roughly 2.4x the internal engine's across identical material.

Root cause: `AYUMI_OUTPUT_GAIN = 1.2` was set to the measured parity point, but a residual DAC-table scaling difference remains between the emulation core and the Web Audio node engine.

Preventing rule: recorded as a candidate in `docs/FUTURE.md` - not a defect of this session's changes; a future calibration pass owns the level match.

### Considered but not landed

- Strict-inequality assertions against saturating functions (`tanh` output can round a hair past the nominal bound) - a one-off assertion tweak, not yet a repeated wound; revisit if it recurs.
- The `edit`-tool "not found" failures themselves - agent-side tooling friction already covered by the re-read rule above; no repository rule added.
- User-authored edits to `docs/TESTING.md` (foreign in-flight failure attribution) and `docs/TOOLING.md` (`--app-zoom` sub-pixel rounding) were preserved untouched - they are the owner's rules, not this session's.

## Appendix

Rules indexed above live in the owning documents' bodies:

- `docs/PROJECT.md` - F-17 settings-modal draft/sync contract, F-18 stereo requirements including song-data ownership.
- `docs/TESTING.md` - audio-path verification cluster (destination-chain taps, edge restoration, correlation methodology, DSP-law parity) and the view-projection assertion note.
- `docs/TOOLING.md` - live-probe seeding and scripted-edit re-read rules.
- `docs/FUTURE.md` - cross-engine loudness parity candidate.
- `docs/SPECIFICATION.md`, `docs/FORMAT.md`, `docs/ARCHITECTURE.md`, `public/MANUAL.md` - the stereo/chip-count model as implemented (updated during the session, not by this review).
- `docs/change/1.6.7/` - session change records: `stereo-modes-crosstalk.md`, `stereo-live-preview-crossfade.md`, `song-driven-dual-chip-playback.md`, `song-chip-count-setting.md`, `ayumi-stereo-parity.md`.

This review landed documentation only - no source changes, no commit.
Verification: every touched file re-read end to end; the session's last full loop (typecheck, lint, format, build, 1794 tests) still stands since no code changed.
Foreign working-tree edits (`src/App.css`, retro-vice files, user doc edits) were preserved untouched.
