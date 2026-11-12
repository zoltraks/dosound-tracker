# Invert section state backgrounds and add a combined hover state

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Section background semantics invert: an active section is darker than the normal background and a hovered one is lighter, with a distinct background for a hovered active section                     |
| Key decisions | All three themes share the inverted semantics; the swap happens at the shared `--active-bg` and `--section-hover-bg` variables; a new `--section-active-hover-bg` variable carries the combined state |
| Open risks    | `--active-bg` also drives buttons and selected cells - the darker tone applies to every active indicator, not only section frames                                                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

In the dark theme today an active section is lighter than the normal background
(`--bg-secondary: #252537` vs `--active-bg: #252d42`) while a hovered section is
darker (`--section-hover-bg` mixes 25% black in). A hovered active section gets
only a distinct border - its background is the plain hover color, since the
eight `.x.active:hover` rules set no background of their own.

The semantic inverts so that owning the keys reads as recessed and hovering
reads as lifted:

- An active section is darker than the normal background.
- A hovered inactive section is lighter than the normal background.
- A hovered active section gets a third background that is distinct from both - the lime `--section-active-hover-border` stays as it is.
- The light and contrast themes receive the same inversion, with per-theme values that keep the same darker-active / lighter-hover reading.

## Use Cases

- The user presses TAB into a section - the frame darkens and signals that it owns the keys.
- The user hovers an inactive section - the frame lightens under the pointer.
- The user hovers the active section - a third background appears that matches neither the plain active nor the plain hover tone.

## Hints

- The variables live in the three theme blocks of `src/App.css` (`:root`, `.app.light`, `.app.contrast`); every section follows the `.x` / `.x.active` / `.x:hover` / `.x.active:hover` pattern.
- The combined background lands on the eight `.x.active:hover` rules via `background-color: var(--section-active-hover-bg)`; gradient panels such as the command and track headers get the matching gradient variant.
- `--track-hover-bg` drives per-cell row hover, not the section frame, and is unchanged.
- Visual verification runs on the dev server - `npm run dev` hot-reloads the CSS; a headless computed-style probe under `work/` can assert the three states per the WORKFLOW tooling notes.

## Out of Scope

- Border and glow colors - `--section-hover-border`, `--section-active-hover-border`, `--active-border`, and the hover glow stay as they are.
- Non-section surfaces with their own accent colors: buttons, modal dialogs, playback position rows, and the track-cell hover background.
- Changes to which section is active or how focus moves.
