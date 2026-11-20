# Refresh TESTING.md Enumerations and Close Coverage Map Gaps Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Bring `TESTING.md` enumerations back in line with the test tree, add a direct `ayumiWorklet` suite plus focused constant and script suites, and record the present-tense changelog convention in `VERSIONING.md`            |
| Key decisions | Present tense becomes the recorded changelog rule with a dated note - entries are not rewritten; thin-area tests land only where a clean seam exists (worklet harness, constants helpers, script entry points)              |
| Open risks    | `chipIndexForChannelId` and `channelIdsForChip` are currently unused exports - the constants suite pins them as vocabulary contract; `electron/preload.cjs` and `main.cjs` have no Vitest seam and stay uncovered by design |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/testing-docs-coverage-refresh.md`.

## Best Practices

Documentation and test-only change - no production code moves. New suites
follow the established harness patterns: the AudioWorklet fake-global
harness from `test/workers/sequencerWorklet.test.ts`, the `createRequire`
pattern from `test/electron/permissions.test.ts`, and the `os.tmpdir()`
fixture convention from `test/scripts/retentionSweepCoverage.test.ts`.
Every assertion that can fail carries the try/catch `console.log`
diagnostic the suite style requires, and no test uses `any`.

## Audio-Critical Requirements

None - the change touches tests and documentation only. The worklet suite
asserts audio output values but does not modify the audio path itself.

## Documentation Updates

- `docs/TESTING.md` - fix the moved `test/modals/midi/MidiModal.test.tsx`
  citation, complete the node-environment enumeration, and add the missing
  `test/guard/` and `test/scripts/` directories. The two flake notes added
  during the 1.6.7 closeout are preserved verbatim.
- `docs/VERSIONING.md` - the CHANGELOG tense rule is amended to present
  tense with a dated note recording the convention change; no changelog
  entry is rewritten.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` - no
  update required; behaviour, architecture, format, and requirements are
  unchanged.

## Type and State Updates

None.

## Step by Step Implementation

**Add the direct `ayumiWorklet` suite**

`src/workers/ayumiWorklet.ts` had no direct test - integration coverage
reached it only indirectly. The suite installs the same
`AudioWorkletProcessor`/`registerProcessor`/`sampleRate` fakes the
sequencer worklet suite uses, imports the module dynamically, and drives
the processor through `port.onmessage` dispatches and `process()` calls on
128-sample quanta. It pins the registration name, every message type
(`write`, `writes`, `clock`, `chip`, `pans`, `reset`), the register-mapping
branches (tone, noise, mixer, volume, envelope period and shape, and the
out-of-range fall-through), the folded-mono versus per-side output stage,
the soft-knee limiter bound, and the pan clamp and stereo activation rules.

File to create: `test/workers/ayumiWorklet.test.ts`.

**Add the constants chip-mapping suite**

`src/constants/song.ts` carries the only logic in `src/constants/` - three
chip helpers (`chipIndexForChannelId`, `channelIdsForChip`,
`channelCountForChipCount`) that the dual-chip feature relies on. A small
node suite pins the A-C/D-F channel vocabulary and the 3/6 channel counts.
The other constant modules are pure data with no branches, so no dedicated
suite is forced for them.

File to create: `test/constants/song.test.ts`.

**Add the script entry-point suites**

`scripts/bump-version.mjs` resolves its targets relative to its own
location, so each case copies it into an `os.tmpdir()` fixture and runs it
as a real `node` subprocess - patch increment, patch-to-minor rollover,
minor-to-major rollover, and the non-X.Y.Z fallback, asserting both
`package.json` and `package-lock.json` stay in sync.
`scripts/afterAllArtifactBuild.cjs` is a pure `module.exports` function -
the `createRequire` pattern loads it and the suite asserts the SHA256SUMS
file name, per-platform joining, hash lines, and return value against
fixture artifacts.

Files to create: `test/scripts/bumpVersion.test.ts`,
`test/scripts/afterAllArtifactBuild.test.ts`.

**Refresh the `TESTING.md` enumerations**

Three stale spots are corrected against the current `test/` tree: the
`navigator.clipboard` note cites `test/modals/midi/MidiModal.test.tsx`, the
node-environment paragraph names every node-side directory and file
(`test/constants/`, `test/electron/`, `test/exports/`, `test/scripts/`,
`test/synth/`, `test/workers/` in full, `test/guard/licenseAllowlist.test.ts`,
and the three node `test/hooks/song/` suites), and the Test Directory list
gains `test/guard/` and `test/scripts/`. The full-suite Settings starvation
note and the e2e concurrency note are preserved unchanged.

File to modify: `docs/TESTING.md`.

**Record the present-tense changelog convention**

`public/CHANGELOG.md` entries from the 1.3.x line through 1.6.8 are
consistently present-tense while `VERSIONING.md` prescribed past tense -
a drift uniform enough to read as an unrecorded convention change. The rule
is amended to present tense with a dated note; entries 1.2.9 and earlier
keep their original tense and are not rewritten.

File to modify: `docs/VERSIONING.md`.

## Implementation Order

1. Update `TESTING.md` and `VERSIONING.md` (documentation first).
2. Create `test/workers/ayumiWorklet.test.ts`.
3. Create `test/constants/song.test.ts`.
4. Create `test/scripts/bumpVersion.test.ts` and
   `test/scripts/afterAllArtifactBuild.test.ts`.
5. Run targeted verification and record refinements.

## Testing Strategy

**Unit tests**

`test/workers/ayumiWorklet.test.ts` - 17 cases covering registration,
register writes and replay, clock and chip switches, reset, malformed
messages, the output stage (mono fold, mono bus, soft-knee bound), and pan
clamping and routing.

`test/constants/song.test.ts` - chip-index mapping, channel id lists, and
channel counts.

`test/scripts/bumpVersion.test.ts` - four subprocess cases over fixture
copies.

`test/scripts/afterAllArtifactBuild.test.ts` - checksum file content and
return contract for single and multi platform builds.

Test files to create: the four listed above.

**Integration tests**

None required - the suites exercise module contracts directly; no DOM
structure, class names, or user flow changes.

## Verification

- Run `npx tsc -b` - the new test files must typecheck under the strict
  project graph.
- Run `npx eslint` on the touched files - zero errors and zero warnings.
- Run `npx vitest run` on the four new suites plus the touched
  `App.test.tsx` and `retentionSweepCoverage.test.ts` - all green.
- Run `npx vitest run --coverage` under the companion record - the new
  suites must hold or raise the branch figure.
- Audio playback verification is not applicable - no audio-path code
  changed.

## Refinements

Adjustments made during implementation, recorded per the workflow rule.

- `electron/preload.cjs` and `electron/main.cjs` have no Vitest seam - both
  `require('electron')` at load, which the suite cannot satisfy, matching
  the constraint `TESTING.md` already records for `main.cjs`. Only
  `permissions.cjs` is import-safe and it already has a dedicated suite.
- `src/constants/` files other than `song.ts` are pure data exports with
  no functions or branches - a dedicated suite would be artificial, so they
  stay covered through their importers.
- `scripts/clean.sh`, `scripts/release-check.sh`, and
  `scripts/sync-branches.sh` are shell scripts outside the Vitest harness;
  `release-check.sh` is exercised by the release gate itself. No test seam
  was forced.
- `chipIndexForChannelId` and `channelIdsForChip` have no callers in the
  current tree - the constants suite pins them anyway as the recorded
  channel vocabulary the dual-chip surface is built on; if a later change
  retires them the suite flags the removal deliberately.
- `test/electron/webPreferences.test.ts` and
  `test/workers/serviceWorker.test.ts` landed concurrently from sibling
  change records; the node-environment enumeration covers them under the
  directory-level entries.
