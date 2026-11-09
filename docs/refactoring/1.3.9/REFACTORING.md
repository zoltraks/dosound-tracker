# Refactoring Proposal - 1.3.9 Window

## Summary

| Field         | Value                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Intent        | consolidate the duplication measured after the preview-envelope consolidation             |
| Key decisions | three deduplications through existing canonical helpers, plus three small extractions     |
| Open risks    | `none` - every touched site is a pure-function substitution covered by the existing suite |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Problem

The window's `consolidate-preview-envelope-engine` work collapsed five divergent envelope engines into `src/hooks/playback/usePreviewEnvelope.ts`. A measured pass over the resulting tree found residual duplication that the consolidation surfaced but did not own:

- The MIDI note-name, octave, and monitor-label computation is written three times in `src/hooks/midi/useMidiMessageProcessing.ts`, each copy re-declaring a `noteNames` literal that duplicates the canonical `NOTES` constant.
- The preview key identity `` `${note}${octave}` `` is constructed inline at eleven sites across four files. That string is the implicit contract between `generatePianoKeys` key ids, pressed-key sets, and `usePreviewEnvelope` voice-map keys - a drift silently breaks pressed highlighting and voice matching.
- `src/components/HeaderPanel.tsx` still carries a local `parseBaseKey` that is an exact functional duplicate of the canonical `parseBaseKey` in `src/utils/song/songFormat.ts`.
- The `formatBaseKey` formatting rule is re-implemented inline at three sites that already have the canonical helper available.
- Three undocumented dead exports remain: `ARPEGGIO_MIN`, `ARPEGGIO_MAX`, and `TrackKey`.
- `src/exports/asm.ts` writes the same fourteen-line tone-comment builder twice - the `meta.note` label branch, the `periodToNoteAndPitch` fallback, and the `formatAsmLine` call around them.

Files the refactoring touches: `src/hooks/midi/useMidiMessageProcessing.ts`, `src/utils/midi/midiUtils.ts`, `src/utils/panel/pianoUtils.ts`, `src/utils/keyboard/keyboardNoteMapping.ts`, `src/components/PianoKeyboard.tsx`, `src/components/TrackPanel.tsx`, `src/components/HeaderPanel.tsx`, `src/exports/core.ts`, `src/exports/asm.ts`, `src/hooks/instrument/useInstrumentDialogs.ts`, `src/constants/music.ts`, `src/hooks/song/useSongManagement.ts`.

**Analysis method**

Dead-export census across `src/`, `test/`, `e2e/`, `electron/`, and `scripts/` (six candidates, three documented in `SPECIFICATION.md` and `LOGGER.md` and therefore deferred). Exact-duplication grep for the `` `${note}${octave}` `` and `formatBaseKey` shapes. Comment strip-list scan on all files touched this window - no strip-list comments found. Import-graph check on `previewEnvelopeTiming.ts` and `timerUtils.ts` - both retain live consumers and stay.

## Goal

One canonical implementation per concept:

- `resolveMidiNote` in `src/utils/midi/midiUtils.ts` is the single MIDI note-number to name, octave, and label computation, built on `NOTES` and `formatBaseKey`.
- `noteKeyId` in `src/utils/panel/pianoUtils.ts` is the single preview key-id constructor, consumed by every site that produces or matches a key id.
- `HeaderPanel` uses the shared `parseBaseKey`.
- Every `formatBaseKey`-equivalent expression that is safe to substitute delegates to `formatBaseKey`.
- No undocumented dead exports.

## Findings

### F1 Triplicated MIDI note-label block

**Issue**

`src/hooks/midi/useMidiMessageProcessing.ts` repeats the same six-line cluster at three sites (near lines 114-119, 156-161, and 279-285):

```ts
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiOctave = Math.floor(noteNumber / 12) - 1;
const noteName = noteNames[noteNumber % 12] || 'C';
const noteBase = noteName.length === 1 ? `${noteName}-` : noteName;
noteLabel = `${noteBase}${midiOctave}`;
```

The `noteNames` literal is a third copy of the canonical `NOTES` constant in `src/constants/music.ts`.

**Impact**

Exact duplication on a hot MIDI path. A label-format or note-table fix must be repeated three times and can silently diverge. The `noteNames` literal can drift from `NOTES`.

**Recommendation**

Add `resolveMidiNote(noteNumber)` to `src/utils/midi/midiUtils.ts` returning `{ noteName, octave, label }`, with `label` computed through `formatBaseKey`. Rewire all three sites.

**Risk Level**

Major

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: the six-line cluster above, three times. After: `const { noteName, octave: midiOctave, label: noteLabel } = resolveMidiNote(noteNumber);` once per site.

### F2 Inline preview key-id construction at eleven sites

**Issue**

The preview key identity `` `${note}${octave}` `` is built inline at `src/utils/panel/pianoUtils.ts:33,53,68`, `src/utils/keyboard/keyboardNoteMapping.ts:19`, `src/components/PianoKeyboard.tsx:99,129,186,230,267,283`, and `src/components/TrackPanel.tsx:162`.

**Impact**

The key id is the shared identity between `PianoKeyConfig.keyId`, `getKeyboardMappedNote` results, pressed-key sets, and `usePreviewEnvelope` voice-map keys. The format is load-bearing but invisible - eleven independent spellings of the same contract.

**Recommendation**

Add `noteKeyId(note, octave)` to `src/utils/panel/pianoUtils.ts` - the module that owns `PianoKeyConfig.keyId` - and rewire all eleven sites.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: `const keyId = `${note}${octave}`;`. After: `const keyId = noteKeyId(note, octave);`.

### F3 Local parseBaseKey duplicate in HeaderPanel

**Issue**

`src/components/HeaderPanel.tsx` defines a local `parseBaseKey` (near lines 94-112) whose body matches `src/utils/song/songFormat.ts`'s `parseBaseKey` exactly. The only difference is the declared parameter type (`string` versus `unknown`), and the single call site always passes a string.

**Impact**

Functional duplication. A parsing fix must be repeated in both copies.

**Recommendation**

Delete the local function and import `parseBaseKey` from `../utils/song/songFormat.ts`.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: eighteen-line local `parseBaseKey` plus `parseBaseKey(currentInstrument.base || 'C-4')`. After: shared import plus the unchanged call.

### F4 formatBaseKey rule re-implemented inline

**Issue**

Three sites re-implement the `formatBaseKey` conditional:

- `src/exports/core.ts:68` - `note.includes('#') ? `${note}${octave}`:`${note}-${octave}`` where `note` comes from `NOTES` and is always uppercase.
- `src/exports/asm.ts:301` - the same conditional over `Object.keys(NOTE_FREQUENCIES)`, always uppercase.
- `src/hooks/instrument/useInstrumentDialogs.ts:232` - the same conditional over an already-uppercased `upper`.

`src/exports/core.ts:47` has the same shape but consumes the public `baseNote` parameter, whose casing is unconstrained - substituting `formatBaseKey` there would uppercase lowercase input and is a behaviour change. That site stays.

**Impact**

Formatting-rule duplication in export code, where byte-identical output is a hard constraint.

**Recommendation**

Replace the three safe sites with `formatBaseKey(...)`. Leave `core.ts:47` unchanged and record the reason.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: `upper.endsWith('#') ? `${upper}${octave}`:`${upper}-${octave}``. After: `formatBaseKey(note, octave)`.

### F5 Duplicated tone-comment builder in asm.ts

**Issue**

`src/exports/asm.ts` repeats the same comment-building block at two sites (near lines 124-137 and 200-213): the `meta.note.includes('#')` base-label conditional, the `formatPitchDelta` call, the `T<channel>` comment shape, and the `periodToNoteAndPitch` fallback.

**Impact**

Exact duplication in export code where byte-identical output is a hard constraint. A comment-format fix must be repeated in both copies.

**Recommendation**

Extract a module-level `buildToneComment(channelLabel, meta, period, chipClock)` in `asm.ts` and call it from both sites. The extraction keeps the existing inline conditional verbatim - `meta.note` comes from parsed song data whose casing is not proven uppercase, so routing it through `formatBaseKey` would risk a byte diff and is deliberately not done.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: the fourteen-line `meta`/`periodToNoteAndPitch` block, twice. After: `comment = buildToneComment(channelLabel, meta, period, chipClock);` once per site.

### F6 Undocumented dead exports

**Issue**

The dead-export census found three exports with zero references anywhere in `src/`, `test/`, `e2e/`, `electron/`, `scripts/`, or `docs/`:

- `ARPEGGIO_MIN` and `ARPEGGIO_MAX` (`src/constants/music.ts`) - aliases of `SHIFT_MIN` and `SHIFT_MAX`.
- `TrackKey` (`src/hooks/song/useSongManagement.ts`) - local type alias.

Three further dead exports - `ExportFormat`, `asTrackId`, and `LogEntry` - are documented surface in `SPECIFICATION.md` and `LOGGER.md`. Removing them is a spec-level decision and is deferred to a 1.4.0 change record.

**Impact**

Dead surface is maintenance noise; the two arpeggio aliases imply an API that no caller uses.

**Recommendation**

Delete the three undocumented exports. Defer the documented three via `docs/change/1.4.0/`.

**Risk Level**

Suggestion

**Breaking Change Assessment**

No Breaking Change

**Example**

Before: `export const ARPEGGIO_MIN = SHIFT_MIN;`. After: line removed; `SHIFT_MIN` remains the single name.

## Plan

**Remove undocumented dead exports**

Delete `ARPEGGIO_MIN`, `ARPEGGIO_MAX`, and `TrackKey`. Tidy step - pure dead-code removal. Addresses F6.

Files: `src/constants/music.ts`, `src/hooks/song/useSongManagement.ts`.

**Replace the HeaderPanel parseBaseKey**

Delete the local function, import the shared `parseBaseKey`. Addresses F3.

Files: `src/components/HeaderPanel.tsx`.

**Delegate the three safe formatBaseKey sites**

Substitute `formatBaseKey` at `core.ts:68`, `asm.ts:301`, and `useInstrumentDialogs.ts:232`. Leave `core.ts:47` untouched. Addresses F4.

Files: `src/exports/core.ts`, `src/exports/asm.ts`, `src/hooks/instrument/useInstrumentDialogs.ts`.

**Extract noteKeyId and rewire eleven sites**

Add `noteKeyId` to `src/utils/panel/pianoUtils.ts`, then rewire `pianoUtils` internals, `keyboardNoteMapping`, `PianoKeyboard`, and `TrackPanel`. Addresses F2.

Files: `src/utils/panel/pianoUtils.ts`, `src/utils/keyboard/keyboardNoteMapping.ts`, `src/components/PianoKeyboard.tsx`, `src/components/TrackPanel.tsx`.

**Extract resolveMidiNote and rewire three sites**

Add `resolveMidiNote` to `src/utils/midi/midiUtils.ts`, then rewire the three clusters in `useMidiMessageProcessing`. Addresses F1.

Files: `src/utils/midi/midiUtils.ts`, `src/hooks/midi/useMidiMessageProcessing.ts`.

**Extract buildToneComment and rewire two sites**

Add a module-level `buildToneComment` in `asm.ts` holding the existing comment block verbatim, then call it from both emission sites. Addresses F5.

Files: `src/exports/asm.ts`.

## Step Granularity

Each step is confined to its own file set and leaves the tree buildable. The two extraction steps each touch at most four files and are purely mechanical substitutions - a regression would be obvious from that step's verification output. No step mixes a rename with a structural change; the dead-export step runs first and touches no file shared with later steps.

## Risk

All substitutions are pure-function replacements verified against identical inputs. The export-path substitutions (`core.ts`, `asm.ts`) are guarded by the export test suite's byte-identical requirement. The MIDI label substitution is guarded by `useMidiMessageProcessing.test.tsx` assertions on `'C-4'` and `'C#4'` monitor labels. The key-id substitution is guarded by piano and preview tests plus the pressed-highlight path. No audio-critical pattern (prop mirroring, sparse dependency arrays, direct `setState`, manual memoization) is touched - every change sits in pure helpers or presentational call sites.

## Acceptance Criteria

- `npm run lint` - zero errors, zero warnings.
- `npm run build` - passes.
- `npm test` - 76 files, 555 tests, all green (identical count; no test changes required).
- Export output byte-identical - the export test suite stays green.
- Each of the eleven key-id sites, three MIDI label sites, three `formatBaseKey` sites, and two asm tone-comment sites delegates to the canonical helper.
- `core.ts:47` retains its original expression, with the reason recorded in the assessment.
- Three documented dead exports remain pending, tracked by a new `docs/change/1.4.0/` record.
