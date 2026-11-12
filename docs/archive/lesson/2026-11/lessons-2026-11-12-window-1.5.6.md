# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Event Object Silently Bound as a Handler Argument

Observed symptom: PASTE TRACK pasted at row 0 regardless of the cursor - `onClick={handlePasteTrack}` delivered the click `MouseEvent` into the handler's optional `anchorRow` parameter, so the anchor fell back to zero.

Root cause: a DOM event prop was wired directly to a handler whose signature is not the event - an optional numeric parameter silently received the event object, and TypeScript never complained because the call site is untyped at the JSX boundary.

Preventing rule: see "Forbidden Patterns" in `docs/standard/typescript-react-development.md` - wire `onClick={() => handler()}` when the handler's parameters are not the event.

### Commit Event Bubbled Into a Stale Parent Closure

Observed symptom: a playlist pattern-id edit recorded two `onPlaylistChange` calls per Enter press - the input committed, the event bubbled to the panel, and the panel's `onKeyDown` committed again through a stale `editingPattern` closure.

Root cause: the parent key handler and the input share the editing state but capture different renders of it - without `stopPropagation` the same gesture runs the commit path twice.

Preventing rule: see "Forbidden Patterns" in `docs/standard/typescript-react-development.md` - a committing control stops propagation so a parent closing over the same state cannot re-fire the commit.

### History Snapshot Captured the Stale Position Source

Observed symptom: undo after a note edit removed the edit but left the cursor where the edit step advanced it - the recorded position came from `sequencerState.currentLine`, which track navigation never updates.

Root cause: the editor keeps two position channels - the playlist line and playhead row in `sequencerState`, the visible track row in `sharedCurrentLine` - and the history bridge mirrored the wrong one for a stopped editor.

Preventing rule: see "Recording boundary" under Edit History in `docs/SPECIFICATION.md` - the snapshot records the playlist line from the sequencer index and the track row from the shared cursor.

### Guard Checked the Focused Channel Instead of the Operation Subject

Observed symptom: Enter and Ctrl+Enter did nothing on a disabled track - the line-start functions rejected the playback because the focused channel's slot on the playlist line was `--`, even when other channels held patterns.

Root cause: the guard evaluated incidental UI state (which channel is focused) rather than the operation's real precondition (whether the playlist line holds any pattern to loop).

Preventing rule: see the Enter-bindings bullet under Playback shortcuts in `docs/SPECIFICATION.md` - the bindings fire from a disabled track and only a completely empty playlist line is a no-op.

### Panel Actions Stole Section and Focus on Click

Observed symptom: two surfaces in one window had the same wound - playlist line command buttons activated `commands` and took DOM focus on press, and clicking an instrument row activated `instrumentList` and pulled focus from the active track.

Root cause: panel clicks bubble to the container's section activation and native mousedown moves DOM focus - action semantics and navigation semantics shared one click path with no separation.

Preventing rule: see the navigation-order paragraphs in `docs/SPECIFICATION.md` - command buttons and instrument rows swallow the click and prevent focus theft so actions preserve the caller's active section.
