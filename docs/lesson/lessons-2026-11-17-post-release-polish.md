# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Effect-derived view state painted one stale frame

Observed symptom: the playlist header flickered on every channel hop that crossed the sliding window's edge - the old A,B,C header painted once before the window shifted.

Root cause: the window start was resolved in a `useEffect`, which runs after paint; the focus commit rendered the stale window, then the effect committed the shift a frame later.

Preventing rule: see "Project Conventions" in `docs/standard/typescript-react-development.md` - derived state is computed during render; the effect only persists the anchor.

### Empty-string sentinel could not express an open empty edit

Observed symptom: pressing Enter on a `--` playlist cell appeared dead - no editor mounted.

Root cause: `editingPattern` used `''` for both "no edit open" and "editing an empty cell", so the edit looked identical to idle and `isEditing` stayed false.

Preventing rule: see "Project Conventions" in `docs/standard/typescript-react-development.md` - `null` marks absence, `''` marks present-but-empty.

### Swapping a flex child element kind shifted the whole row

Observed symptom: entering playlist edit mode widened the field and pushed sibling columns horizontally.

Root cause: the `<input>` replacing the `<span>` carried the default `size` attribute, and flex items default to `min-width: auto` - the input's intrinsic min-content raised the flex floor.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - `min-width: 0` on the swapped control.

### Form control and undefined custom properties silently dropped styling

Observed symptom: the playlist editor rendered in the browser-default font and size, then showed two focus frames.

Root cause: `.pattern-input` referenced `--input-bg`/`--input-text`/`--input-border`, which no theme defines - invalid declarations dropped silently; inputs do not inherit font; and the global `*:focus` outline sits later in `App.css` at equal specificity, winning over the component's `outline: none` while a custom `:focus` box-shadow drew a second ring.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - `font: inherit`, verified `var(--*)` references, and `:focus:not(:focus-visible)` for per-component click-ring suppression; the equal-specificity source-order rule was already recorded there.

### EQ meters followed engine presence instead of the enabled channel count

Observed symptom: with Two chips enabled but single-chip song content, the EQ panel rendered three bars instead of six.

Root cause: the bar count derived from `ym2149b` existing, which requires the song to resolve two chips - but the setting alone enables the six-channel model for authoring and monitoring.

Preventing rule: see `docs/SPECIFICATION.md` track-UI paragraph - panel channel counts follow the enabled channel count; a missing engine contributes zeroed meters.

### Editable model and playback engines are separate chip gates

Observed symptom: none observed live, but the 1.6.6 review found the two concepts conflated in planning - gating the visible tracks on `songChipCount` made second-chip channels unreachable for authoring.

Root cause: `songChipCount` selects playback engines from song content; the `dualChip` setting selects the editable channel model. Content cannot reference D/E/F while the tracks that would hold those references are hidden.

Preventing rule: see `docs/SPECIFICATION.md` track-UI paragraph - the setting alone exposes all six channels; `songChipCount` alone selects engine count.

### Channel switches regressed to A-C-only assumptions

Observed symptom: D/E/F playlist cells could not be edited - 'N' created the pattern but never assigned it, and seven paths dropped or misrouted second-chip channels.

Root cause: `usePlaylistOperations`, `useTrackOperations`, `songRenumber`, `addPlaylistEntryToSong`, and `InstrumentSection` each carried literal A-C switches or ternaries that predated the six-channel model.

Preventing rule: see `docs/SPECIFICATION.md` track-UI paragraph - index `PlaylistEntry` by channel letter generically and resolve focus through `isTrackNavigationSection` (`trackA`-`trackF`); the same audit pattern as the stored-song migration lesson in `lessons-2026-11-17-window-1.6.4.md`.

### Ad-hoc session fixes accumulated without change records

Observed symptom: roughly ten user-requested fixes and polish items landed across two commits with no `docs/change/` records; the user had to ask for them.

Root cause: small direct fixes bypassed the record step during a long interactive polish session; nothing prompted filing before session end.

Preventing rule: see "Implementation Planning" in `docs/WORKFLOW.md` - retroactive fixes group into as few records as change boundaries allow, with short applied-marker plans.

### Improvement mode had no post-task harvest step

Observed symptom: the user asked for session learnings to be gathered and routed on the fly when a task completes under improvement mode.

Root cause: the `improvement` working mode applied corrections during work but its text closed the door on any session review, leaving learnings unharvested.

Preventing rule: see "Improvement" in `docs/WORKFLOW.md` - on task completion the agent harvests the current session's learnings and routes them per the Session Review table.

### Reports appended repository-state questions

Observed symptom: the user objected to sign-offs like "the tree still holds all prior uncommitted work - say the word if you want everything committed together or split".

Root cause: completion reports drifted into version-control commentary the user does not want; committing is their manual step.

Preventing rule: see "General Rules" in `docs/GUIDELINES.md` - status reports state what changed and what was verified, nothing about commit state.

### Scripted edits landed stray text silently

Observed symptom: quoted fragments appeared inside `App.css` and `EQPanel.test.tsx` after scripted replacements; one scripted CSS replacement failed an assertion on stale expected text.

Root cause: bulk edit paths (python heredocs, scripted replacements) do not surface partial-match or payload-mangling failures the way the dedicated edit tool does.

Preventing rule: see "Tooling Notes" in `docs/TOOLING.md` - re-read the touched region after a scripted edit and before reporting.

### CHANGELOG discipline already covered

Observed symptom: the user restated that `public/CHANGELOG.md` updates only at version bump or on explicit request.

Root cause: none - the existing "File Maintenance" rule in `docs/GUIDELINES.md` already records exactly this; the reminder is indexed here so future sessions know the rule was verified, not missing.

Preventing rule: see "File Maintenance" in `docs/GUIDELINES.md` (existing rule, unchanged).
