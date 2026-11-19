# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Heading weight removal does not unbold a heading element

Observed symptom: "DOSOUND Tracker" still rendered bold after `font-weight: bold` was deleted from `.application-name`.

Root cause: the `<h1>` element picks up `font-weight: bold` from the user-agent stylesheet; deleting the author's declaration changes nothing because the UA layer still applies. Matching a normal-weight reference requires an explicit `font-weight: 400`, confirmed by computed style.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - heading elements carry UA bold; set the weight explicitly and verify the computed style.

### Mouse clicks draw the global focus ring

Observed symptom: clicking the logo drew the global focus ring even though the click was not keyboard navigation.

Root cause: the global `*:focus` outline fires on any focus including mouse clicks; suppressing `:focus` unconditionally would also strip keyboard focus feedback. The repo already had the convention on `.chip-switcher-button`.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - `:focus:not(:focus-visible) { outline: none }` removes the mouse-click ring while keeping the keyboard indicator; apply it per component.

### Text-presentation glyphs look different from emoji neighbors

Observed symptom: the settings gear `⚙` rendered as a thin monochrome text symbol beside the color-emoji theme toggle `☀️`/`🌑`.

Root cause: U+2699 defaults to text presentation; the emoji neighbors carry emoji presentation. Appending U+FE0F forces emoji presentation - match the glyph's presentation, not just the character.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - a glyph that must render in emoji presentation carries U+FE0F.

### A fixed header's height is a layout contract

Observed symptom: growing `.header-panel` during the section restyle silently overlapped compact-layout content until `.app`'s `padding-top` was raised to match.

Root cause: the fixed bar's height and the content offset below it are coupled; the offset was sized for the old height and never updated. Any fixed-chrome height change must verify the first content element's offset at a compact viewport, not only desktop.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - a fixed-position bar's height is a layout contract with the content offset below it.

### Deleting a visual readout orphans its tests

Observed symptom: removing the envelope `Pos:`/`Val:` footer broke 22 test assertions that probed cursor state through the footer text.

Root cause: the footer was the only DOM observable of cursor position; deleting it removed the tests' queryable state. Exposing the same state as `data-position` on the panel kept every assertion meaningful.

Preventing rule: see "Project Conventions" in `docs/standard/typescript-react-development.md` - removing the only DOM observable of state orphans its tests; expose the same state as a `data-*` attribute.

### Tinted gradients compose better than new tokens

Observed symptom: the command panel needed "the title's dark colors plus the hover tone" as a permanent background - a one-off tint that did not fit the existing token set.

Root cause: expressing the tint as per-theme variable triples would add tokens that need dark/light/contrast values for a single use. `color-mix()` derives the gradient stops from existing tokens and surface colors per theme without new variables.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - theme-tinted gradients derive stops with `color-mix()` over theme tokens and surface colors instead of adding per-theme variable triples.

### Ad-hoc UI iteration supersedes its own docs

Observed symptom: the title-bar change record described an intermediate flat-surface design that later requests in the same batch replaced; the uncommitted record would have shipped a lie about the final state.

Root cause: the record was authored mid-iteration before the design settled. Records written during ad-hoc iteration must describe the final landed state - superseded intermediate docs are consolidated into the batch record or removed before close.

Preventing rule: see "Version-Based Feature Implementation Cycle" in `docs/WORKFLOW.md` - ad-hoc records describe the final landed state; superseded intermediate designs are consolidated or removed before the batch closes.

### Foreign in-flight work failed the suite and was attributed by diff

Observed symptom: the batch-close verification reported 5 vitest failures and ~20 typecheck errors in settings/dual-chip files the UI batch never touched.

Root cause: the shared working tree carried the user's uncommitted dual-chip refactor; failures outside the change set belong to that in-flight work. Attributing by diff and reporting separately keeps the report honest without claiming green or silently fixing foreign work.

Preventing rule: see "Attributing failures to in-flight work" in `docs/TESTING.md` - failures in untouched files are confirmed by diff, reported separately with evidence, and escalated to their owner.
