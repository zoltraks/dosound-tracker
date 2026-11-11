# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Confirmed Plans Land Before Code

Observed symptom: the track-fragment-selection implementation was fully implemented and verified before its implementation plan was written to `docs/plan/1.5.6/` - the user corrected the ordering.

Root cause: the `docs/plan/` access gate conditioned writes on an explicit request and the confirmed plan was held session-level, so no artifact existed until after the code landed.

Preventing rule: see "Create an implementation plan" and the `docs/plan/` gate in `docs/WORKFLOW.md`; the durable decision is `docs/decision/2026-11-11-plan-before-implementation.md`.

### Plan Refinements Are Recorded, Not Folded In

Observed symptom: decisions taken while implementing - the selection's own track owning copy and cut, the paste-confirmation gate covering PASTE TRACK too, cursor wrap at the pattern end - had no recorded home until the user asked for them.

Root cause: implementation-time deviations were silently folded into the landed state because no convention named where they belonged.

Preventing rule: see "Record refinements in the plan" in `docs/WORKFLOW.md` and the Refinements section of `docs/plan/1.5.6/track-fragment-selection-implementation.md`; indexed under the same decision record.

### Option-Digit Chords Emit Symbols, Not Digits

Observed symptom: Option+1..3/5/6/8 on macOS did not focus tracks or run playback chords while Alt+digit worked on Windows.

Root cause: a character-producing modifier changes `event.key` - Option+digit emits `¡`, `£`, `ﬁ`, `ﬂ`, `•` - so digit chords matched on `key` never fired; the first `event.code` fix also missed because `code` values are camelCase (`Digit1`) and the prefix check was uppercase.

Preventing rule: see "Modifier-chord keys match on `event.code`" under Fed Patterns in `docs/standard/typescript-react-development.md`.

### Centered Glyphs Compensate Half A Pixel Per Side

Observed symptom: the focused volume value in a track row rendered ~1px right of the unfocused position while the note text beside it stayed put.

Root cause: the active current row drops `margin-left: -1px` while keeping its border, shifting content +1px; left-aligned note text recovered the full pixel from `padding-left`, but the volume glyph is centered in a fixed-width cell where removing near-side padding recovers only 0.5px.

Preventing rule: see the centered-cell compensation bullet under Project Conventions in `docs/standard/css-general-development.md`.

### Synthetic Keyboard Events Need `code` For Physical-Key Chords

Observed symptom: simulating Option+digit in tests required extending the press helper - a `KeyboardEvent` carrying only the symbol `key` never reached the code path.

Root cause: the test helper set `key` and modifiers but not `code`, so events that resolve the physical key could not be expressed.

Preventing rule: see the keyboard bullet under Component test hygiene in `docs/TESTING.md`.

### New Test Blocks Must See The Helper Scope

Observed symptom: a `describe` block appended at the end of `test/components/TrackPanel.test.tsx` failed typecheck with `Cannot find name 'createPanelProps'`.

Root cause: the props factory is declared inside a sibling `describe` - file-end blocks sit outside its scope.

Preventing rule: see "Suite helpers live inside their describe scope" in `docs/TESTING.md`.

### jsdom Lacks navigator.clipboard

Observed symptom: tests mounting code paths that call `navigator.clipboard` need the surface installed first.

Root cause: jsdom ships no `navigator.clipboard`; the tree's convention installs it via `Object.defineProperty` with a `writeText` mock (`test/modals/MidiModal.test.tsx`).

Preventing rule: see "jsdom lacks navigator.clipboard" in `docs/TESTING.md`.

### A Shared Working Tree Shares Check Results

Observed symptom: `npx prettier --check` flagged `docs/change/1.5.6/documentation-intake-tiers.md`, a file a parallel session had mid-flight, during this session's verification.

Root cause: whole-tree sweeps judge every file, so another session's in-progress write surfaces inside this session's gate.

Preventing rule: see "A shared working tree shares check results" in `docs/TOOLING.md`.

### BSD sed Rejects GNU Offset Ranges

Observed symptom: `sed -n 'FIRST,+Np'` failed with `invalid command code` while reading a file section.

Root cause: the `,+N` offset range is GNU-only; the BSD sed on macOS does not implement it.

Preventing rule: see "BSD sed has no GNU offset ranges" in `docs/TOOLING.md`.
