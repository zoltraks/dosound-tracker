# Validate Storage Restores Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Close FND-SEC-002 / REC-004: bound and shape-check restored undo history, route song restores through parser-equivalent validation, and enforce the MIDI config version field                                                                                    |
| Key decisions | Restored stacks keep the newest persisted-depth entries and reset whole on any malformed snapshot; song restores rebuild fields explicitly then gate on `validateSongData`; MIDI `version` must equal `1`; per-field fallback kept for the MIDI settings restore |
| Open risks    | Stricter restore validation rejects snapshots earlier tolerated versions wrote - fallbacks already cover every path; `test/utils/cross/branchGaps.test.ts` fixtures need the now-required `version: 1`                                                           |

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/validate-storage-restores.md`, remediating audit finding
FND-SEC-002 (recommendation REC-004) in `docs/report/1.6.7/AUDIT-1.7.md`.

## Best Practices

Follow TypeScript and React engineering standards from
`docs/standard/typescript-react-development.md`:

- Functional code only with proper TypeScript interfaces
- No abbreviations in identifiers (use full words)
- No `any`; untrusted storage values stay `unknown` until narrowed
- Reuse the import parsers' normalization helpers instead of duplicating
  logic - `validateSongData`, `expandEnvelope`, `expandLoopingEnvelope`,
  `coerceYamlNumber`, `normalizeInstrumentId`, `normalizePatternId`,
  `parseBaseKey`, `formatBaseKey`, `normalizeInstrumentColor`,
  `clampMidiChannel`, `clampMidiProgram`, `clampVolumeNibble`
- Restore paths are startup-only, never audio hot paths

## Audio-Critical Requirements

This change does not affect audio playback, timing, or the sequencer. It
runs once at startup or on an explicit restore action. No `useCallback` or
`useMemo` dependencies change, no state-management pattern in audio paths
changes, and the YM2149 emulator and SoundDriver are untouched. Manual
playback verification is not required; restored songs are covered by unit
tests.

## Documentation Updates

Per project guidelines, documentation updates precede source edits. Two
documents describe contracts this change tightens; both sit outside this
task's file ownership, so the needed edits are recorded here and flagged
for the documentation owner rather than applied:

- `SPECIFICATION.md` - the Edit History section should note that restored
  stacks are re-bounded to the persisted depth and shape-checked per
  snapshot; the snapshot-mirror paragraph should note that mirrored songs
  pass the same validation gate as the localStorage restore
- `FORMAT.md` - the MIDI configuration Behaviour list should record that
  `version` values other than `1` raise `MidiConfigurationFormatError`,
  matching the settings loader rules already documented

No other documentation file requires an update: `PROJECT.md` gains no
requirement, `ARCHITECTURE.md` gains no boundary change, and the change
request itself is read-only.

## Type and State Updates

**Type definitions**

No type changes. `deserializeEditHistory` gains an optional entry-predicate
parameter; `EditSnapshot`, `EditHistory`, `Song`, `Instrument`, `Step`,
`Note`, `Pattern`, and `Line` keep their shapes. The restored objects are
constructed to satisfy the existing interfaces exactly.

File to modify: none.

**State store modifications**

No store changes. `useEditHistory` keeps holding the `EditHistory` ref;
`useDataManagement` keeps calling `normalizeRestoredSong` for the mirror
path, which now throws on invalid snapshots - the existing `.catch` already
logs and leaves the default song in place. `useMidi` keeps its
`MidiConfiguration` state; only the localStorage initializer's field
narrowing changes.

File to modify: none.

## Step by Step Implementation

**Bound and validate restored edit history**

`deserializeEditHistory` currently returns the persisted `undo`/`redo`
arrays verbatim once it confirms they are arrays. Slice each stack to the
newest `EDIT_HISTORY_PERSIST_LIMIT` entries - the persisted bound is the
tighter constraint and also satisfies the in-memory `EDIT_HISTORY_LIMIT` -
and accept an optional `isValidEntry` predicate. When the predicate is
supplied, any surviving entry that fails it returns an empty history,
extending the existing all-or-nothing corrupt-input contract rather than
introducing per-entry drop semantics.

File to modify: `src/utils/song/editHistory.ts`.

```typescript
export const deserializeEditHistory = <T>(
  raw: unknown,
  isValidEntry?: (entry: unknown) => entry is T,
): EditHistory<T> => {
  // ...existing shape guard...
  const undo = candidate.undo.slice(-EDIT_HISTORY_PERSIST_LIMIT);
  const redo = candidate.redo.slice(-EDIT_HISTORY_PERSIST_LIMIT);
  if (isValidEntry && [...undo, ...redo].some((entry) => !isValidEntry(entry))) {
    return createEditHistory();
  }
  return { undo, redo, lastKey: null, lastTime: 0 };
};
```

**Shape-check persisted snapshots**

Add a private `isValidEditSnapshot` predicate in the storage module. A
snapshot is valid when `song` passes `validateSongData` (the same contract
the import parser ends with), `instrument` is an object with string `id`
and `name`, all five envelopes are arrays of finite numbers, optional
`base`/`octave`/`sustain`/`color`/`midi` members carry their declared
types when present, and `position`, when present, is an object with finite
numeric `pattern` and `line`. Pass the predicate into
`deserializeEditHistory` from `loadPersistedEditHistory`.

Decision - reset, not drop: a single malformed snapshot discards the whole
persisted history. Rationale: the existing contract is all-or-nothing
(corrupt input already returns an empty history), undo depth is expendable
by design, and whole-reset cannot leave a partially validated stack behind.

File to modify: `src/utils/storage/editHistoryStorage.ts`.

**Rebuild restored songs explicitly and validate**

Rewrite `normalizeStoredSongToCurrentSchema` in `useSongManagement.ts` to
construct the `Song` field by field instead of spreading the raw persisted
object. Song scalars normalize exactly like `parseSongFromYaml`: trimmed
title/author with defaults, `normalizeSongSpeed`, length clamped to
`[4, MAX_PATTERN_LENGTH]` with the `patternLength` legacy fallback,
`coerceYamlNumber`-based `year`/`loop`/`chipCount`, normalized `chip`,
`frame`, `clock`, `stereo`, and the derived-or-explicit `chipCount` rule.

Patterns map to explicit `{id, name, step}` objects: id falls back through
`normalizePatternId` to a positional hex id, name falls back to
`Pattern <id>`, steps normalize `note`/`volume` (legacy `A`/`trackA`/`B`/
`trackB`/`C`/`trackC` note aliases and `lines`/`patterns`/`playlist`/
`instruments`/`noiseEnvelope`/`arpeggio`/`patternLength`/`volumeEnvelope`
migrations preserved), and each step array pads - never truncates - to the
song length. Non-object pattern, line, or instrument entries throw, the
same boundary the parser draws.

Playlist rows rebuild as `{A, B, C}` strings with `trackA`/`trackB`/
`trackC` aliases and conditional `D`/`E`/`F`, replacing the current
`String(...)` coercion that could persist `"[object Object]"`.

Instruments rebuild as explicit `Instrument` objects: `id` via
`normalizeInstrumentId` with a positional fallback, parser-default
`base`/`octave`/`sustain`, `color`/`midi` emitted only when valid, and all
five envelopes expanded through the same helpers the parser uses
(`expandEnvelope` for volume/pitch/noise/mode, `expandLoopingEnvelope` for
the `arpeggio` fallback, `expandEnvelope` for `shift` matching the
parser's hold-last semantics). Envelope arrays that are not clean finite
number arrays expand to `ENVELOPE_LENGTH` instead of passing through.

`normalizeRestoredSong` then applies the parser's presence gates - empty
`line`, `pattern`, or `instrument` collections throw - and finishes with
`validateSongData`, the same call `parseSongFromYaml` ends with. A throw
propagates to the existing fallbacks: `loadInitialSong` catches and falls
back to the bundled default YAML (then `createDefaultSong`), and the
IndexedDB mirror path's `.catch` logs and leaves the default song. No
change to `useDataManagement.ts` is needed - both restore paths share
`normalizeRestoredSong`.

Decision - reset, not drop: a song is one coherent document, so any
structural failure resets the whole snapshot to the default song rather
than dropping individual patterns, rows, or instruments, which could leave
unresolvable playlist references. Field-level values still repair to
parser defaults because that is what the import parser itself does with
missing or malformed members.

File to modify: `src/hooks/song/useSongManagement.ts`.

**Validate the MIDI configuration version**

After the existing `midi` section shape check in
`parseMidiConfigurationFromYaml`, require `midiNode.version === 1` and
throw `MidiConfigurationFormatError` otherwise, mirroring the settings
parser's `unsupported version` rejection. Missing, non-numeric, string, or
unknown versions all reject explicitly; version `1` is the only format the
writer has ever emitted, so rejection is the correct handling and no
migration is needed.

File to modify: `src/utils/midi/midiConfiguration.ts`.

**Type-check the persisted MIDI device ids**

The `useMidi` localStorage initializer is the remaining settings-style
restore that passes raw persisted values through: `parsed.inputId ?? null`
and `parsed.outputId ?? null` trust the JSON shape. Narrow both to
`typeof === 'string' ? value : null`, matching the per-field fallback
style the same initializer already uses for the boolean members. This is
the "settings equivalent" restore the change record's song-and-settings
wording covers; the app-settings paths (`loadSettings`,
`normalizeSettings`, the persisted `settingsView` draft) were audited and
already validate member-by-member, so they need no change.

File to modify: `src/hooks/midi/useMidi.ts`.

## Implementation Order

1. Write this plan (done)
2. Update `deserializeEditHistory` bounds and predicate
3. Add `isValidEditSnapshot` in `editHistoryStorage.ts`
4. Rewrite `normalizeStoredSongToCurrentSchema` and gate
   `normalizeRestoredSong`
5. Add the MIDI version check
6. Narrow the `useMidi` persisted device ids
7. Update and add tests
8. Run verification loop

## Testing Strategy

**Unit tests**

- `test/utils/song/editHistory.test.ts` - add cases: an oversized persisted
  payload restores only the newest `EDIT_HISTORY_PERSIST_LIMIT` entries per
  stack; `isValidEntry` passes all-valid entries and returns an empty
  history when any entry fails
- `test/utils/storage/editHistoryStorage.test.ts` - update fixtures to
  valid snapshots; add cases: oversized stored payload bounds to the
  persisted depth, a malformed snapshot entry (bad song shape, bad
  instrument shape, bad position) restores an empty history
- `test/hooks/song/loadInitialSong.test.ts` - add cases: stored songs with
  empty `pattern`/`line`/`instrument`, non-object entries, and non-object
  roots fall back to the bundled song; a stored song with malformed member
  values still restores with parser-default repairs
- `test/hooks/song/useDataManagement.mirror.test.tsx` - update fixtures to
  valid song snapshots; add a case where a malformed mirrored snapshot
  leaves the default song and shows no restore notice
- `test/hooks/song/useDataManagement.history.test.tsx` - update the
  persisted-history fixture to a valid snapshot shape
- `test/utils/midi/midiConfiguration.test.ts` - add cases: `version: 2`,
  missing `version`, and string `version` each raise
  `MidiConfigurationFormatError`; update existing fixtures to carry
  `version: 1`
- `test/utils/cross/branchGaps.test.ts` - update the two MIDI YAML fixtures
  to include `version: 1`
- `test/hooks/midi/useMidi.test.tsx` - add a case where non-string persisted
  `inputId`/`outputId` restore as `null`

**Integration tests**

The mirror-restore and persisted-history hook tests above cover the
end-to-end restore paths through the real hooks; no separate integration
suite is needed for this change.

## Verification

Run the task-scoped verification loop in this order:

- `npx vitest run` on each touched test file
- `npx eslint` on touched source and test files
- `npx tsc -b`
- `npx prettier --check` on touched files (`npx prettier --write` only on
  touched files where needed)

Full `npm test`, `npm run build`, and `npm run test:e2e` are out of scope
for this task per the change instructions.

## Refinements

- "Song and settings restores" was interpreted as the song snapshot restore
  plus the MIDI-configuration settings restore. The app-settings paths
  (`loadSettings` in `settingsState.ts`, `normalizeSettings`, and the
  persisted `settingsView` draft consumed through `normalizeSettings` in
  `useSettingsDialog`) were audited and already validate member-by-member,
  so the concrete gap fixed is `useMidi.ts`'s raw `inputId`/`outputId`
  pass-through - the settings persistence hook under `src/hooks/`.
- `deserializeEditHistory` caps restored stacks at
  `EDIT_HISTORY_PERSIST_LIMIT` (20), the tighter of the two bounds; this
  also satisfies the in-memory `EDIT_HISTORY_LIMIT` (100) and matches the
  documented "reload restores a shallower history" contract.
- Malformed history snapshots reset the whole persisted history rather
  than dropping individual entries, matching the existing all-or-nothing
  corrupt-input fallback; song snapshots likewise reset whole through the
  existing default-song fallbacks rather than dropping nested members.
- `normalizeStoredSongToCurrentSchema` rebuilds objects explicitly instead
  of adding a shared stored-JSON parser export; it reuses
  `validateSongData` plus the same normalization helpers the import parser
  uses, which is the parser-equivalent seam the recommendation asks for.
- Restored envelopes expand to `ENVELOPE_LENGTH` through the parser's own
  helpers, so previously tolerated short arrays (for example a stored
  `noise: [4]`) now restore at canonical length; one existing assertion in
  `loadInitialSong.test.ts` is updated to match.
- `test/utils/cross/branchGaps.test.ts` is edited even though it sits
  outside the listed test directories - its MIDI parser fixtures lack the
  now-required `version` field and would fail without the update.
- `SPECIFICATION.md` and `FORMAT.md` describe the pre-change contracts and
  need the updates listed under Documentation Updates; they are outside
  this task's file ownership and are flagged rather than edited.
- `yaml.load` syntax errors in `parseMidiConfigurationFromYaml` still
  propagate unwrapped (pre-existing behavior, different from the settings
  parser); left unchanged as outside this finding's scope.
