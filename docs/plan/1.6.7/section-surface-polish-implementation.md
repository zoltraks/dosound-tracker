# Section Surface Polish Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Align the title bar, command panel, and piano with the tracker section idiom; remove the envelope Pos/Val footer; polish header controls                                                                              |
| Key decisions | Dark gradient + warm `#503c28` frame for title bar and piano; static tinted-gradient command panel on the theme border; `data-position` replaces the footer as the cursor observable; compact `.app` top padding 52px |
| Open risks    | `none` — presentation-only changes verified by live geometry, computed styles, and the standard loop                                                                                                                  |

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.7/section-surface-polish.md`.

## Best Practices

Follow the repository's TypeScript/React and CSS standards from
`docs/standard/typescript-react-development.md` and
`docs/standard/css-general-development.md`:

- Functional components only with proper TypeScript interfaces
- No abbreviations in identifiers (use full words)
- CSS custom properties for theme-aware values; hardcoded colors only where
  the surface is intentionally theme-independent (the dark section fill)
- Preserve accessibility: keyboard focus indicators stay via `:focus-visible`
- jsdom cannot observe CSS or layout; geometry claims require live
  measurement per `docs/TOOLING.md`

## Documentation Updates

Per project guidelines, update the active documentation set before any source
code modifications. Update only the files affected by this change.

- `PROJECT.md` — no change: surface styling is not a project requirement
- `ARCHITECTURE.md` — no change: no structural or boundary change
- `SPECIFICATION.md` — no change: no behavior, format, or data-model change
- `FORMAT.md` — no change: no save or export format change
- `public/MANUAL.md`, `public/MESSAGES.md` — no change: neither document
  describes the Pos/Val footer or the header surface styling (verified by
  search during implementation)

No documentation file requires an update for this change; the docs-first step
is satisfied by this explicit statement.

## Type and State Updates

**Type definitions**

No type changes. `data-position` is a plain DOM attribute, not component
state.

File to modify: none.

**State store modifications**

No store changes. `currentPosition` in `EnvelopePanel` remains local
`useState`; the attribute only reflects it.

File to modify: none.

## Step by Step Implementation

**Title bar surface**

Restyle `.header-panel` to the section idiom: replace the diagonal gradient,
2px bottom border, drop shadow, and `::after` hairline with the dark vertical
gradient, warm `#503c28` frame, inset shadow, `margin: 4px 4px 0` gutter, and
`padding: 4px 14px`. Remove the `.header-panel::after` rule. Raise the compact
`.app` `padding-top` from 36px to 52px so the taller fixed header clears
content.

File to modify: `src/App.css`.

**Command panel surface**

Restyle `.command-panel` with `padding: 7px`, the color-mixed hover-tinted
vertical gradient, theme `--border-color` frame, and inset shadow; delete the
`.command-panel.active`, `.command-panel:hover`, and
`.command-panel.active:hover` rules so the panel is fully static.

File to modify: `src/App.css`.

**Light-theme fills**

Add `.light .header-panel, .light .command-panel` overriding the background
to a `--bg-secondary`→`--bg-tertiary` vertical gradient and `box-shadow:
none` (the dark inset shadow reads as a smudge on light surfaces), and switch `.header-panel`'s frame to the theme `--border-color`. Dark and contrast themes are untouched; the piano keeps its dark fill
and `#503c28` frame in every theme.

File to modify: `src/App.css`.

**Dialog action buttons (all themes)**

Add an unscoped `.modal-actions .command-button` rule with `padding: 5px 8px
4px` — integer values replacing the base fractional `3.5px`, one extra pixel
of button height, and the label nudged lower. Every dialog's action row uses
the `.modal-actions` convention, so the override covers settings, export,
file-picker, MIDI, about, confirm, transpose, paste-track, and instrument
dialogs uniformly; command-panel buttons sit outside `.modal-actions` and
keep the base styling. Identical across dark, light, and contrast themes.

File to modify: `src/App.css`.

**Piano frame**

Change `.piano-keyboard`'s border from `var(--border-color)` to `#503c28` to
match the title bar against the shared dark fill.

File to modify: `src/App.css`.

**Title typography**

Set `.application-name` to `font-family: var(--font-heading)` and explicit
`font-weight: 400` (the `<h1>` user-agent style otherwise renders bold).

File to modify: `src/App.css`.

**Header controls**

Remove the `translateX(6px)` on `.header-right`, change the settings glyph
from `⚙` to `⚙️` (U+FE0F emoji presentation to match the theme toggle), and
add `.logo:focus:not(:focus-visible) { outline: none; }` following the
`.chip-switcher-button` convention.

Files to modify: `src/App.css`, `src/components/shell/HeaderPanel.tsx`.

**Envelope footer removal**

Delete the `.envelope-footer` JSX block from `EnvelopePanel`'s non-mode
return and the `.envelope-footer` rule from `App.css`; add
`data-position={currentPosition}` to the panel element so tests and tooling
retain a cursor observable. Update `EnvelopePanel.test.tsx`: replace the 20
`Pos:` assertions with `data-position` reads (hex display values map to
decimal indices; `1F` becomes `31`) and the 2 `Val:` assertions with the
`.envelope-value.current` cell text; rename the render test to drop "footer".

Files to modify: `src/components/envelope/EnvelopePanel.tsx`,
`src/App.css`, `test/components/envelope/EnvelopePanel.test.tsx`.

## Verification

- `npx tsc --noEmit` — clean
- `npx eslint` on touched files — clean
- `npx prettier --check` on touched files — clean
- `npx vitest run` — full suite green, including the rewritten
  `EnvelopePanel.test.tsx` (43 tests)
- `npm run build` — clean
- `npm run test:e2e` — Playwright suite green
- Live checks (Playwright against the dev server): header/piano/command
  computed styles match the section recipe; header content vertically
  centered at the reduced height; compact viewport shows no header/content
  overlap; envelope panels measure ~113px with no footer and the notes panel
  absorbing the freed height; logo click produces no focus ring while
  `:focus-visible` still applies

## Out of Scope

- Track header volume label (`docs/change/1.6.7/track-header-volume-label.md`)
- Per-channel track borders and tints (`track-frame-borders.md`,
  `dual-chip-track-tints.md`)
- Envelope editing behavior and the mode panel
- Version bump and commit creation
