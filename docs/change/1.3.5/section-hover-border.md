# Give Every Section a Distinct Hover Border

**Type:** Feature

## Summary

Hovering a track panel gains an outline border color that fades in smoothly and looks like the active-section border. The hover border should use its own red-violet color that still blends with the active-section color, and every section should gain the same mouse-over border treatment, not only the track panels.

## Description

Today only `.track-panel` shows a hover border (`var(--border-bright)`), which reads almost identical to the active-section border (`var(--active-border)`).

- Introduce a dedicated hover-border color token, red-violet in the dark theme and metal blue in the light theme, chosen to blend with each theme's `--active-border` while remaining visibly distinct.
- Every navigable section gains the mouse-over border the track panels show today: octave selection, command panel, track panels A/B/C, tone/noise and envelope panels, song information, playlist, instrument list, and piano keyboard. The Dump and EQ panels are included as visible bordered sections.
- The smooth fade in and out is preserved and extended to the sections that lack a border transition today.
- The hover color wins over the active color while the pointer is over a section; the active style returns when the pointer leaves.

## Use Cases

- When the user hovers track A, B, or C, the border fades to red-violet instead of the active blue.
- When the user hovers any other section, its border fades to the same red-violet.
- When the user hovers the currently active section, the red-violet hover border shows instead of the active border.
- In the light theme the hover border reads as a clearly metal blue tone against the light background.

## Out of Scope

- Changing the active-section border color or the active glow.
- Restyling button, link, or list-item hover effects that are not section borders.
