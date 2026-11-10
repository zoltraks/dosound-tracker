# Session Findings: Test Tone Race and State Restoration

## Wounds

**A test tone should validate the audio path, not race it**

The startup tone went through eight parameter iterations (frequency,
duration, volume, delay) because a race was misdiagnosed as a tuning
problem. The register reset was traced: the cursor-restore `setActiveSection`
flip fires `TrackPanel`/`HeaderPanel` `[isActive]`/`[isOctaveActive]`
effects, whose unconditional `stopPreview()` reaches
`handleHardStopLivePreview` (`useMidiActions.ts:129-133`) and writes
`0x08+ch = 0` through the live `ym2149Ref` - the ref write happens
before the `if (!ym2149)` guard, so any flip landing after the chip
exists zeroes that channel's volume. `setPosition`, `stop()`,
`resetPlaybackState`, and mute application are all playback-gated and
register-clean at init - `SoundDriver.stop()` is dead code at runtime. Re-asserting through the window worked
but was the wrong mechanism. The proper fix: the tone's job is audio-path
validation, so a dedicated `OscillatorNode` scheduled on the AudioContext
clock is the mechanism - deterministic and immune to YM register state.

Lesson: identify the mechanism before tuning parameters. A recurring
parameter-tweak loop is the symptom of an undiagnosed race.

**Logarithmic volume is not half the register**

`0x08` is not half of `0x0f`. `YM_LOG_VOLUME_TABLE[13]` = 0.5 is the true
half-amplitude level. Reading the table beats guessing the scale.

**Restore after the content exists, not the flag**

`MarkdownModal` scroll restore fired on `isOpen` while `manualContent` was
still empty - the offset clamped to zero. Restoration must wait for loaded
content, not the open flag.

**Underscore emphasis was unrecorded grammar**

`MANUAL.md` used `_italic_` and the renderer only handled `*italic*`.
Markdown consumers claim a grammar, the parser must cover it. The fix also
taught the boundary rule: `snake_case` identifiers survive the `_` regex
only with `(?<![_\w])`/`(?![_\w])` guards.

**Convention-only rules fail silently**

The markdown fix shipped without a change record until challenged - a bump
ran without a review. The rules were correct but unenforced. Mechanical
gates (`scripts/release-check.sh`) close the gap - record coverage,
assessment completeness, review presence.

**Evaluated majors keep-or-revert is the right gate**

vitest 5 (suite-wide failure on rolldown-vite 7) and js-yaml 5 (77
serialization-drift failures) were evaluated and reverted - zustand 5,
lucide-react 1.x, electron 45 kept. One package per step, per-package
gate, individual revert - never a bulk bump.

**Dropped fields in dependency majors**

electron-builder 26 removed `win.publisherName` (moved to
`signtoolOptions`) and `BuildResult.packager` (platform now read from
`platformToTargets`). Upgrade majors must audit their config schema and
hook signatures, not just install.

**Context pressure degrades the session**

Deep-thread debugging late in context produced the re-assert hack before
the proper mechanism fix. The context-management rule now recorded in
GUIDELINES (divide and spawn subagents) exists for exactly this wound.
