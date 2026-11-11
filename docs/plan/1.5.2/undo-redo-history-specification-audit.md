# Specification Audit - Add Undo and Redo History

## Document Information

|            |                                                       |
| ---------- | ----------------------------------------------------- |
| Change     | `docs/change/1.5.2/undo-redo-history.md`              |
| Plan       | `docs/plan/1.5.2/undo-redo-history-implementation.md` |
| Audit Date | 2026-11-14                                            |

## Completeness

- Undo reverses edits and redo re-applies reverted steps - covered by the
  history-stack step and the `undo`/`redo` wiring.
- Scope covers pattern steps, instrument parameters, playlist lines, and
  song information fields - covered by recording at the
  `useDataManagement` boundary, through which all of those mutations flow.
- Paste, transpose, renumber, and optimize record as single entries -
  verified each already applies through one mutation call; the playlist
  create-pattern-at and new-track handlers merge into one `updateSong`.
- A new edit after undo discards the redo branch - covered by `recordEdit`
  clearing `redo` on every push, including a coalesced burst's first
  keystroke.
- The history is session state and starts empty on reload - covered by
  the ref-held stacks with no persistence write.
- CTRL+Z undo and CTRL+SHIFT+Z or CTRL+Y redo - covered by the shortcut
  and matcher steps; all three bindings are documented in the plan and
  the SPECIFICATION.md update.
- Bounded depth - covered by `EDIT_HISTORY_LIMIT` eviction in
  `recordEdit`.
- Undo must not disturb audio timing - covered by restoring through the
  ordinary song setters only, with the stacks held in a ref.

## Ambiguity

- "An encapsulated command layer, or state snapshots" - resolved as state
  snapshots of the `{song, instrument}` pair taken inside
  `useDataManagement`; every mutation helper is already immutable, so
  references are safe, while a command layer would rewrite every mutation
  site.
- "The history boundary is where those setters run" - resolved as the
  recorded mutators of `useDataManagement`; `setCurrentInstrument` alone,
  the mirror restore, the instrument-sync effect, and the lazy pattern
  materialization are excluded as non-edits.
- "Song information fields" coalesce or not - resolved per-field through
  the `coalesceKey` option, so a typing burst merges while every other
  edit stays one entry per gesture.
- Song load and new song - resolved as recorded mutations: both replace
  composition data destructively, so undo is the cheapest recovery, and
  the record only fixes that the history starts empty on application
  reload.

## Implementability

- `useDataManagement` owns `currentSong`, `currentInstrument`, and every
  mutator at `src/hooks/song/useDataManagement.ts` - verified; the
  recording boundary exists.
- `usePlaylistOperations` calls `createNewPattern` then `updateSong` in
  `handleCreatePatternAt` and `handleCreateNewTrack` at
  `src/hooks/song/usePlaylistOperations.ts` - verified;
  `createPatternForSong` is exported from `usePatternManagement.ts` for
  the single-call merge.
- `getCurrentPatternForTrack` calls `updateSong` in its lazy branch at
  `src/hooks/song/useTrackPattern.ts` - verified; widening its parameter
  type accepts `UpdateSongOptions` without breaking the other consumer.
- `matchKeyboardShortcut` returns null for CTRL+SHIFT and has no `Z`/`Y`
  cases at `src/utils/keyboard/keyboardShortcutUtils.ts` - verified; the
  matcher and `KEYBOARD_SHORTCUTS` extend without collision.
- `useKeyboardShortcuts` registers named global actions at
  `src/hooks/keyboard/useKeyboardShortcuts.ts` - verified; `undo` and
  `redo` join `GlobalShortcutName`.
- `TrackPanel.handleKeyDown` reaches `getKeyboardMappedNote` regardless
  of `ctrlKey` at `src/components/TrackPanel.tsx` - verified; the guard
  sits in the final `else` branch.
- `InformationPanel` routes all fields through `handleFieldChange` at
  `src/components/InformationPanel.tsx` - verified; one widened prop
  covers every field.

## Fidelity

- Binding vocabulary stated once: `undo` and `redo` actions in
  `KEYBOARD_SHORTCUTS` map CTRL+Z, CTRL+Y, and CTRL+SHIFT+Z; no other
  binding claims those keys, and editable text inputs keep native undo
  because the window handler already skips them.
- Constants enumerated: `EDIT_HISTORY_LIMIT` 100 entries,
  `EDIT_COALESCE_MS` 1000 ms, coalescing key form `song-info:<field>`.
- Snapshot shape stated once: `{song, instrument}` - the pair every
  restore writes back through `setCurrentSong` and
  `setCurrentInstrument`, with the song marked dirty.
- Boundary decisions recorded: history never persists (no storage key,
  no file-format change), instrument selection is not an edit, the lazy
  pattern materialization and the startup mirror restore are silent, and
  undo is not gated by modal state - consistent with the other global
  shortcuts.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
