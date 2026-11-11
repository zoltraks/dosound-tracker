# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Suspended-Context Writes Pile And Desynchronise Playback

Observed symptom: pressing play in Safari started the sequencer view immediately while audio joined
hundreds of milliseconds later, mid-position, with the first notes dropped; stop was delayed the same
way.

Root cause: WebKit leaves the `AudioContext` suspended after page load and `resume()` took ~580 ms in
measurement. The old play path started the worker anyway, so ticks wrote audio parameters against a
frozen `currentTime` - the writes piled at one timestamp and applied at once on resume. The same pile
held `silenceAll`'s zero-gain on stop.

Preventing rule: see "Audio-Path State Rules" in `docs/standard/typescript-audio-development.md`.

### Cadence Start Skipped The Starting Step

Observed symptom: the first note's attack step was never processed on every play start.

Root cause: the sequencer worker waited a full tick interval, then posted state only after advancing -
the first emitted position was tick 1, never tick 0.

Preventing rule: see "Timing Model" in `docs/standard/typescript-audio-development.md`.

### Asynchronous Engine Landing Dropped Writes

Observed symptom: play during engine construction produced silence while the cursor ran; stop during
the same window left audio ringing.

Root cause: engine creation resolved through a `.then()`, leaving the engine reference null during
construction - real for Ayumi's `audioWorklet.addModule`, which takes hundreds of milliseconds under
the dev server. Writes and `silenceAll` issued in that window were silently dropped.

Preventing rule: see "Audio-Path State Rules" in `docs/standard/typescript-audio-development.md`.

### Chromium Verification Hid A WebKit-Only Failure

Observed symptom: every automated probe reported identical, correct timing while the user reproduced
the desync reliably - a six-commit bisect found no introducing commit.

Root cause: Chromium auto-resumes the `AudioContext` on first gesture, so headless chromium probes
always measured a running context. WebKit preserves the suspended startup state - the failure class
existed in every revision and only WebKit exposed it.

Preventing rule: see "Verification" in `docs/standard/typescript-audio-development.md` and
"Audio-path verification requires the webkit project" in `docs/TESTING.md`.

### Write Timestamps Proved Nothing About Audible State

Observed symptom: instrumentation measured `writeRegister` timing at ~50 ms and reported the path
healthy while the user heard a delayed, desynchronised start.

Root cause: call timestamps prove a call happened, not that audio rendered - writes against a frozen
`currentTime` still timestamp on schedule.

Preventing rule: see "Assert the audible outcome, not call timing" in `docs/TESTING.md`.

### Vestigial Setup Outlived Its Feature

Observed symptom: the EQ bars showed phantom channel activity on load with nothing playing.

Root cause: register initialisation writes (`R8-10`, `R7`) added for a chip test tone survived the
tone's removal - the setup outlived the behavior and read as live audio state.

Preventing rule: see "KISS And YAGNI" in `docs/standard/clean-code-general-development.md`.

### Hot-Module Reloads Recreated Audio State Before Testing

Observed symptom: audio timing appeared freshly broken across many successive manual tests.

Root cause: frequent HMR updates touching audio-adjacent files re-ran the audio effects, closing the
`AudioContext` and leaving a fresh suspended one moments before each test - the symptom mimicked a
regression that did not exist.

Preventing rule: see "Hot-module reloads can recreate audio state mid-session" in `docs/WORKFLOW.md`.

### Environmental Failure Survived Commit Bisection

Observed symptom: six successive historical checkouts all reproduced the same defect.

Root cause: bisection isolates code changes - the cause was browser autoplay behavior, identical in
every revision checked out.

Preventing rule: see "Rule out the environment before bisecting a regression" in `docs/WORKFLOW.md`.
