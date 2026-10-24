# Fix Changelog Modal Heading Clipping

**Type:** Fix

## Summary

The CHANGES view opened from the About modal clips the top of the "Changes" heading. The rendered H1 glyphs overflow their line box and are cut off by the scrollable body edge.

## Description

Opening About and clicking CHANGES renders `public/CHANGELOG.md` inside `MarkdownModal` with the modal title hidden. The first rendered element is the `# Changes` H1. The scrollable body `.modal-body.text-display-body` inherits `line-height: 0.8rem` from `.modal-body` while the H1 keeps the browser default `2em` font size. The 20px glyphs sit in a ~12.8px line box, extend above it, and are clipped by the container's `overflow-y: auto` edge.

The heading text must render fully at the top of the scrollable body.

- The compact `0.8rem` line spacing of the body text is preserved elsewhere.
- The fix covers every rendered markdown heading (`h1`, `h2`, `h3`), so any heading keeps full glyph coverage at any scroll position.
- The same body style serves the MANUAL view, which gets the same correction.

## Use Cases

- When the user opens About and clicks CHANGES, the "Changes" heading renders fully at the top.
- When the user opens About and clicks MANUAL, the "Manual" heading renders fully.
- When the user scrolls to an `h2` version heading inside CHANGES, the heading renders without clipped glyphs.

## Out of Scope

- Restyling the modal chrome, the download link, or the actions row.
- Changing the `0.8rem` line spacing of ordinary body text.
