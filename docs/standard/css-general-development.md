# CSS Engineering Standards

<!-- Version: 0.1.4 | Date: 2026-10-21 -->

## Purpose

This document defines the engineering standard for writing CSS and the HTML structure that CSS
styles.

It covers the architecture, the layout systems, the naming conventions, the design tokens,
the accessibility, and the build.

It is written to be executed directly by an AI coding agent and to be read without effort by a human
reviewer.

## Scope

A project is in scope when all of the following conditions hold.

- The project styles user interfaces with CSS, with or without a CSS framework.
- The project targets evergreen browsers.
- The project is either a compiled single-page application with a build step or a single HTML file
  with linked CSS.

A project that uses a CSS-in-JS runtime such as styled-components or Emotion is partially in scope:
the naming, layout, and accessibility sections apply,
but the architecture sections assume static CSS files.

A project that uses Tailwind CSS as the only styling mechanism is covered by the companion
TypeScript/React standard for the Tailwind-specific conventions.

This standard applies to the custom CSS that supplements Tailwind.

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches CSS or HTML.

1. Read the project rules file, such as `AGENTS.md`, `README.md`, or `docs/GUIDELINES.md`,
   because a project rule overrides this standard.
2. Determine the project type, the CSS framework,
   and the browser baseline using the Agent Intake Protocol below.
3. Confirm the conclusion with the user when the repository is ambiguous or empty.
4. Apply the sections of this standard that match the confirmed project kind.
5. Run every applicable row of the Verification section.
6. Check the result against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Use BEM for this project"                   |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | Cascade layers already declared              |
| 4    | This standard                             | Cascade layers and `:where()` over BEM       |
| 5    | General CSS best practice                 | Anything the four sources above do not cover |

Never silently reformat existing CSS to match this standard.

A whole-repository reformat destroys review history and hides the real change inside noise.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **No unscoped element selectors for components.** `nav a { }` without a scoping class is a defect,
  because it leaks into unrelated elements.
- **No `!important` outside utility classes.** An `!important` in a component rule is a defect,
  because it breaks the cascade.
- **No raw colour values in component CSS when a token exists.** `#3366ff` in a component rule is a
  defect when `--color-primary` is defined.
- **No `float` for layout.** `float` is for text wrapping around images, not for layout.
- **Visible focus indicators.** A missing `:focus-visible` style on an interactive element is an
  accessibility defect.
- ** `prefers-reduced-motion` is respected.** An animation that ignores reduced motion is an
  accessibility defect.
- **Stylelint passes.** A Stylelint error is a defect.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the project shape.

| Signal Found In The Repository           | Inferred Decision                  | Confidence |
| ---------------------------------------- | ---------------------------------- | ---------- |
| `vite.config.ts` or `webpack.config.js`  | Compiled SPA with a build step     | High       |
| `index.html` with `<link>` CSS tags only | Single HTML SPA with no build step | High       |
| `tailwind.config.js`                     | Tailwind CSS framework present     | High       |
| `@layer` declarations in CSS files       | Cascade layers in use              | High       |
| `container-type` or `@container` in CSS  | Container queries in use           | High       |
| `postcss.config.js`                      | PostCSS processing pipeline        | High       |
| `.stylelintrc` or `stylelint.config.js`  | Stylelint enforced                 | High       |
| BEM class names in HTML or CSS           | BEM naming convention              | High       |
| No CSS files at all                      | New project                        | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation rather than
running a questionnaire.

Example: "I see a compiled SPA with Vite, cascade layers declared, BEM naming, Stylelint enforced,
and no CSS framework.

I will follow the existing conventions.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project, ask the following questions.

| Question                 | Options                            | Default If Declined     |
| ------------------------ | ---------------------------------- | ----------------------- |
| Which project type?      | Compiled SPA, Single HTML SPA      | Compiled SPA            |
| Which naming convention? | BEM, Cascade layers, Utility-first | Cascade layers with BEM |
| Which CSS framework?     | None, Tailwind, Bootstrap          | None                    |

## Documentation

The following are the authoritative sources for CSS and HTML development.

- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS) - comprehensive property and
  selector reference.
- [MDN HTML Reference](https://developer.mozilla.org/en-US/docs/Web/HTML) - element and attribute
  reference.
- [CSS Cascade and Inheritance](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade) - cascade
  behaviour and specificity.
- [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) - `@layer`
  reference.
- [CSS Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
  - `@container` reference.
- [Can I Use](https://caniuse.com/) - browser support verification.
- [Web.dev CSS Guidance](https://web.dev/learn/css) - modern CSS guidance from Google Chrome team.

## Core Technologies

- **Native CSS**: write styles in plain CSS,
  because modern CSS has replaced most preprocessor features.
- **HTML5**: use semantic elements where appropriate,
  because semantics communicate structure to assistive technology.
- **Modern browser baseline**: target evergreen browsers, because they support cascade layers,
  container queries, and `:has()`.
- **Framework coexistence**: when the project uses a CSS framework, custom styles are isolated,
  because a custom style that overrides a framework in place is fragile.

On runtime upgrade, re-validate all rules against release notes before writing code.

## Project Structure

### Compiled SPA

A project with a build step that bundles CSS.

```plaintext
styles/
  base/
    reset.css
    variables.css
    typography.css
  layout/
    grid-system.css
    regions.css
  components/
    button.css
    card.css
    modal.css
  utilities/
    spacing.css
    visibility.css
  main.css
```

The `main.css` file imports all layers in order from the most generic to the most specific,
because loading order controls cascade priority when cascade layers are not used.

### Single HTML SPA

A project served as a single HTML file with no build step.

```plaintext
css/
  variables.css
  layout.css
  components.css
  interactive.css
index.html
```

Each `<link>` appears in a documented order, because file loading order controls cascade priority.

```html
<link rel="stylesheet" href="css/variables.css" />
<link rel="stylesheet" href="css/layout.css" />
<link rel="stylesheet" href="css/interactive.css" />
```

`variables.css` loads first so that later files can reference its custom properties.

`interactive.css` loads last so that state and interaction styles override base styles.

## Naming Conventions

| Element                | Convention               | Example                                           |
| ---------------------- | ------------------------ | ------------------------------------------------- |
| Components             | `kebab-case`             | `.btn`, `.data-grid`, `.modal-dialog`             |
| BEM elements           | double underscore        | `.card__header`, `.card__body`                    |
| BEM modifiers          | double dash              | `.btn--primary`, `.btn--small`                    |
| Global reusable states | `is-*` or `has-*`        | `.is-active`, `.has-error`                        |
| Component-local states | bare adjective           | `.dragging`, `.conflict`, `.active`               |
| Utilities              | `u-*` prefix             | `.u-hidden`, `.u-text-center`, `.u-sr-only`       |
| Theme tokens           | CSS custom properties    | `--color-primary`, `--space-2`, `--radius-md`     |
| Layout regions         | descriptive `kebab-case` | `.page-header`, `.content-main`, `.sidebar-aside` |
| CSS files              | `kebab-case.css`         | `button.css`, `grid-system.css`                   |

## Code Conventions

### Cascade and Specificity

Prefer low specificity and predictable cascade behaviour,
because high specificity is hard to override.

Keep selectors shallow.

Do not nest deeper than three levels, because a deep selector is brittle and slow to match.

```css
/* Recommended: shallow selector */
.card__title {
  font-weight: bold;
}

/* Discouraged: deep nesting */
.page .content .card .header .title {
  font-weight: bold;
}
```

### Cascade Layers

Use cascade layers (`@layer`) to define explicit priority zones,
because layers override specificity and make cascade behaviour predictable.

```css
@layer reset, base, theme, layout, components, utilities;
```

Layers combine with design tokens and native nesting:

```css
@layer reset, base, layout, components, utilities;

@layer base {
  :root {
    --color-primary: oklch(0.55 0.22 260);
    --space-sm: 0.5rem;
    --space-md: 1rem;
  }
}

@layer components {
  .card {
    padding: var(--space-md);

    & .card__title {
      font-size: 1.25rem;
    }
  }
}
```

Styles in later layers override styles in earlier layers regardless of selector specificity inside
the layer.

This is the recommended approach for large compiled SPAs and when mixing custom styles with a CSS
framework, because it eliminates specificity wars.

### Modern Selectors

Use `:where()` to remove specificity weight from a selector,
because a `:where()` selector is easily overridden.

```css
:where(.btn) {
  padding: 0.5rem 1rem;
}
```

Use `:is()` for forgiving selector grouping,
because `:is()` handles unsupported pseudo-classes gracefully.

```css
:is(:hover, :focus-visible) {
  outline: 2px solid var(--color-focus);
}
```

Use `:has()` for parent selection, because `:has()` replaces JavaScript-based parent styling.

```css
.card:has(.badge--featured) {
  border-color: var(--color-accent);
}
```

### Specificity Management Without Layers

When cascade layers are not used, manage specificity through file loading order and shallow
selectors.

Load files from the most generic to the most specific.

Use `inherit`, `initial`, `unset`, or `revert` instead of explicit values where appropriate,
because these keywords express intent and reduce duplication.

```css
/* Recommended: inherits transition from parent */
.child {
  transition: inherit;
}
```

Prefer not to use `!important`.

If it is necessary, restrict it to utility classes,
because an `!important` in a component rule breaks the cascade for every override.

## Layout Systems

Use **Flexbox** for one-dimensional layouts, because Flexbox handles alignment, distribution,
and centering cleanly.

Use **CSS Grid** for two-dimensional layouts, because Grid controls both rows and columns.

Use **Subgrid** when a nested grid must align its tracks to the parent grid,
because Subgrid is the correct tool for form labels and inputs that share a column definition.

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  & .grid-item {
    display: grid;
    grid-template-columns: subgrid;
  }
}
```

Use **Container Queries** (`@container`) for component-responsive behaviour,
because a component should respond to the space its container provides, not the viewport.

```css
.parent {
  container-type: inline-size;
}

@container (min-width: 30rem) {
  .card {
    grid-template-columns: 1fr 2fr;
  }
}
```

### Positioning

Prefer `position: relative` with offsets for small adjustments.

Use `position: absolute` for overlays, tooltips, dropdowns, and popovers.

Define an explicit positioning context on the parent when using absolute positioning,
because an absolute element without a positioned ancestor anchors to the viewport.

```css
.dropdown {
  position: relative;
}

.dropdown__menu {
  position: absolute;
  top: 100%;
  left: 0;
}
```

Use the `inset` shorthand for positioned elements,
because `inset: 0` is clearer than four separate properties.

```css
.modal-overlay {
  position: fixed;
  inset: 0;
}
```

Overlay expandable header regions below the header
instead of letting them join the header flow and shift its content.

### Logical Properties

Use logical properties for writing-mode-safe layouts,
because a logical property flips correctly in a right-to-left context.

Prefer `margin-inline-start` over `margin-left`,
`padding-block` over `padding-top` and `padding-bottom`,
and `border-inline-end` over `border-right`.

Do not use logical properties indiscriminately.

Ask whether the property should flip in a right-to-left context.

If the answer is no, use the physical property.

### Shared Chrome Metrics

Controls that share a chrome row, such as a menu bar, a tool rail, or a section header,
carry one height variant.

A `btn-sm` beside a `btn`, or a lighter header button beside heavier rail buttons,
reads as uneven chrome.

Derive a control's height the same way in every state,
because a rem-fixed height in the collapsed state beside a padding-derived height in the expanded
state silently mismatches whenever the root font-size is not 16px.

Controls adjacent to the same viewport edge share one outer gutter value,
so stacked bars and panel edges align their last element.

Compress a primary action row to one fitted row at the narrowest widths,
and wrap only when compression becomes unreadable.

## Responsive Design

Include the viewport meta tag in the HTML `<head>`.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Use media queries to adapt layout at defined breakpoints.

Consider both width and height when the application targets desktop and mobile,
because a viewport that is wide but short breaks layouts that assume height.

```css
@media (max-width: 1100px), (max-height: 700px) {
  .main-content {
    flex-direction: column;
  }
}
```

Use dynamic viewport units (`dvh`, `dvw`) instead of `vh` and `vw`,
because dynamic units account for mobile browser UI elements that appear and disappear.

### Layout Reflow Strategies

Use `display: contents` to flatten a container so its children participate in the parent's layout
flow, because this removes a wrapper from the box tree without removing it from the DOM.

Use `flex: 0 0 auto` with `overflow: visible` on mobile when content should stack and scroll
naturally instead of being confined.

Use `position: fixed` for headers, keyboards,
and control bars that must remain accessible on mobile.

Pair with a safe-area padding or height offset so content is not obscured.

## Scrollable Regions and Sticky Positioning

When a container scrolls in one or both directions,
define the scroll container with `overflow: auto` and `position: relative`.

Use `position: sticky` for elements that must remain visible during scroll.

Always pair sticky positioning with a `background` and a `z-index`,
because content shows through transparent sticky areas.

```css
.timeline-scroll-area {
  overflow-x: auto;
  overflow-y: auto;
  position: relative;
}

.timeline-labels {
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--color-bg);
}
```

When a flex child must scroll internally, set `min-height: 0` on the child,
because without it the flex child expands to fit its content instead of respecting the parent's
overflow boundary.

```css
.middle-column {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
```

Reserve the scrollbar gutter on `html` with `scrollbar-gutter: stable` for any variable-height page
with a centered column or a sticky header, not only for a locked scroll shell.

A fit-then-scroll page gets one scroll container on a definite height chain,
intrinsic-aspect media leaves the flow, and the document scroller locks,
because a second document-level scrollbar beside the intended one means the height chain is wrong.

Size grid and flex tracks by content when clipped items would let them collapse,
and let the container scroll.

## HTML Structure for Layout

Use semantic HTML5 elements for major regions when the markup is static or server-rendered,
because semantics communicate structure to assistive technology.

```html
<body>
  <header class="page-header">...</header>
  <nav class="main-nav">...</nav>
  <main class="content-main">
    <section class="dashboard">...</section>
  </main>
  <aside class="sidebar">...</aside>
  <footer class="page-footer">...</footer>
</body>
```

Include the viewport meta tag and theme color for all web applications.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#000000" />
```

For single HTML SPAs where the DOM is generated entirely by JavaScript,
a root container such as `<div id="app"></div>` is acceptable.

In this case, use descriptive class names and `role` attributes to communicate structure.

Keep nesting shallow, because a wrapper element should have a clear, single purpose.

Avoid wrapper elements that exist solely to apply a single CSS property,
and use container queries or layout parents instead.

Define layout containers with a class, not an element selector,
because a class is reusable and an element selector is not.

Keep container gutters in one shared rule,
because a component `padding` shorthand on the same element erases the gutters through source
order.

## Selectors and Scoping

Prefer class selectors for styling, because a class selector is reusable and has predictable
specificity.

Avoid unscoped element selectors such as `nav a { }` or `div { }`,
because they leak into unrelated elements.

### ID Selectors

ID selectors are acceptable for the single root application container.

```css
#app {
  height: 100vh;
  display: flex;
}
```

Avoid ID selectors for components and reusable elements,
because an ID has high specificity and is not reusable.

### Element Selectors

Element selectors are acceptable in two cases.

- Global base styles on `html` and `body` for typography and reset.
- Scoped descendants inside a component where the element is guaranteed to exist.

```css
/* Acceptable: base styles */
body {
  font-family: var(--font-family);
  color: var(--color-text);
}

/* Acceptable: scoped descendant */
.toolbar-buttons button {
  padding: 6px 14px;
}

/* Discouraged: unscoped element selector */
nav a {
  color: blue;
}
```

## State Management with CSS

Manage visual states through CSS class changes,
because this is the preferred mechanism for toggling visibility, highlighting,
and interaction feedback.

```css
.timeline-bar.dragging {
  opacity: 0.85;
  z-index: 50;
}

.timeline-bar.conflict {
  outline: 2px solid var(--color-danger);
}

.conflict-panel.hidden {
  display: none;
}
```

An author `display` value outranks the user-agent rule behind the `hidden` attribute,
so an element styled `display: flex` still renders while marked `hidden`.

Keep `hidden` authoritative with a `[hidden]{display:none}` guard,
or switch visibility through a class instead of the attribute.

A collapsed state reached two ways, through a class toggle and through a viewport breakpoint,
hides and shrinks identically.

Write the rules once on a shared selector list or mirror them exactly,
because a class state that only shrinks while its breakpoint twin also hides its labels produces
a half-collapsed rail.

### Inline Styles

Inline styles via the HTML `style` attribute are acceptable for values that are computed at runtime,
changed frequently, or cannot be expressed as discrete class-based states because the value space is
continuous.

```javascript
// Acceptable: runtime-computed position
bar.style.left = `${newStartWeek * weekWidth}px`;
```

Static styling uses classes, because a class is reusable and an inline style is not.

### Inline CSS Custom Properties

Injecting CSS custom properties through inline styles is acceptable for component-level theming,
because this passes values from JavaScript to CSS without generating new classes.

```javascript
element.style.setProperty('--track-line-color', instrumentColor);
```

```css
.track-line-colored {
  background-color: color-mix(in srgb, var(--track-bg) 80%, var(--track-line-color) 20%);
}
```

## Z-Index Management

Define z-index values as CSS custom properties,
because this creates a documented stacking order and prevents arbitrary magic numbers.

```css
:root {
  --z-sticky: 10;
  --z-drag: 50;
  --z-tooltip: 60;
  --z-panel: 100;
  --z-modal: 200;
}
```

Reference these properties instead of raw numbers, because a raw number is a magic number.

```css
.modal-overlay {
  z-index: var(--z-modal);
}
```

## Design Tokens and Theming

All visual values are tokenised as CSS custom properties,
because a token centralises a value and makes it reusable.

Define them on `:root` in a dedicated file such as `variables.css` or `base/variables.css`.

| Category   | Prefix       | Examples                                      |
| ---------- | ------------ | --------------------------------------------- |
| Color      | `--color-*`  | `--color-primary`, `--color-text-muted`       |
| Spacing    | `--space-*`  | `--space-1`, `--space-2`, `--space-4`         |
| Typography | `--font-*`   | `--font-body`, `--font-size-lg`               |
| Radius     | `--radius-*` | `--radius-sm`, `--radius-md`, `--radius-full` |
| Shadow     | `--shadow-*` | `--shadow-sm`, `--shadow-lg`                  |
| Z-Index    | `--z-*`      | `--z-dropdown`, `--z-modal`, `--z-toast`      |

Do not use raw values in component CSS when a token exists,
because a raw value drifts from the design system.

### Dynamic Custom Properties

Custom properties may be updated at runtime by JavaScript,
because this is useful for layout dimensions that depend on data.

```javascript
document.documentElement.style.setProperty('--total-weeks', String(n));
```

Document which tokens are dynamic and which are static,
because a dynamic token has different maintenance characteristics.

### Dark Mode

Support dark mode via `color-scheme` and a `prefers-color-scheme` media query,
because the operating system preference should be respected by default.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111111;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111111;
    --color-text: #eeeeee;
  }
}
```

When the application provides a manual theme toggle, use a class on the root element,
because a class override is explicit and testable.

```css
.light {
  --color-bg: #ffffff;
  --color-text: #111111;
}

.dark {
  --color-bg: #1e1e2e;
  --color-text: #f8f8f2;
}
```

Keep theme variants inside tokens,
because a theme-attribute element selector outranks single-class component rules and leaks base
colors onto component surfaces.

Define foreground and background token pairs for every interactive state in every theme variant,
because a hardcoded text color on a tokenized background is unreadable as soon as the theme remaps.

### Forced Colors Mode

Support Forced Colors Mode (`@media (forced-colors: active)`),
because users with high-contrast assistive technology need visible borders and controls.

Ensure borders, focus rings, and interactive elements remain visible.

Use `currentColor` for SVG strokes and borders when appropriate.

## Accessibility and Interaction

Provide visible and consistent focus indicators,
because a missing focus indicator is an accessibility defect.

Use `:focus-visible` instead of `:focus` for keyboard-only outlines,
because `:focus-visible` avoids showing an outline on mouse clicks.

```css
.btn:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

Ensure touch targets are at least 44 by 44 CSS pixels for interactive elements,
because smaller targets are hard to activate on touch devices.

Respect `prefers-reduced-motion`, because an animation that ignores reduced motion causes
discomfort.

Gate animations and transitions behind it.

```css
@media (prefers-reduced-motion: no-preference) {
  .modal {
    transition: opacity 0.2s ease;
  }
}
```

Use `::before` and `::after` for decorative elements only.

Never put critical content in generated pseudo-elements,
because generated content is not accessible to screen readers.

Use the `u-sr-only` utility class for visually hidden but screen-reader accessible content.

```css
.u-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Hover feedback changes surface such as background, border, or shadow,
and never displaces the element,
because a `translate` or `scale` lift on a card carrying a glyph moves the glyph with it and reads
as
jitter.

Chrome controls and decorative labels stay non-selectable with `user-select: none` plus the
`-webkit-` prefix, while copy-worthy data text such as phone numbers, addresses,
and prices opts back
into `user-select: text`.

## Property Order and Values

Group related properties together, because a logical order makes a rule easier to scan.

Order: positioning, display and box model, typography, visual, interaction, animation.

```css
.card {
  /* Positioning */
  position: relative;
  z-index: var(--z-card);

  /* Display and Box Model */
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-4);
  padding: var(--space-4);

  /* Typography */
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);

  /* Visual */
  background-color: var(--color-surface);
  border-radius: var(--radius-md);

  /* Animation */
  transition: transform 0.2s ease;
}
```

### Units

| Use Case                         | Unit         | Reason                                |
| -------------------------------- | ------------ | ------------------------------------- |
| Text-related sizing              | `rem`, `em`  | Scales with user font size preference |
| Borders and hairlines            | `px`         | Pixel-precise rendering               |
| Content-width sizing             | `ch`, `ex`   | Tied to character metrics             |
| Layout gaps and container sizing | `dvh`, `dvw` | Accounts for mobile browser UI        |

Prefer `currentColor` and `inherit` over redundant variable declarations,
because `currentColor` and `inherit` reduce duplication.

```css
.icon {
  fill: currentColor;
}

.link {
  color: inherit;
}
```

Use shorthand properties only when setting all related values,
because a shorthand that sets only some values accidentally resets the others.

Write hexadecimal colors lowercase and shorten to three digits whenever every channel doubles.

## Visual Effects

Use `::before` and `::after` for decorative effects such as shimmer sweeps.

```css
.command-btn {
  position: relative;
  overflow: hidden;
}

.command-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.command-btn:hover::before {
  left: 100%;
}
```

Use `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` for text elements
that change colour during transitions, because this prevents visible text shimmer in Safari and
Firefox.

Keep decorative layers within document bounds and move them through `background-position` or
in-bounds transforms, because an overhang that grows the scrollable area leaves phantom scroll
space.

## Formatting and Linting

Use Stylelint for formatting and rule enforcement,
because Stylelint catches errors that a human review misses.

Enforce the following.

- Property order.
- Ban unscoped ID selectors.
- Limit `!important` to utilities.
- Require consistent custom property naming.

A `.stylelintrc.json` on `stylelint-config-standard` pins the ruleset and forbids `!important` in
component styles.

Stylelint runs in CI.

A pull request that fails the lint check is not accepted.

## Testing

CSS does not have a unit test framework in the traditional sense.

Testing is performed through the following mechanisms.

- **Stylelint**: catches syntax errors, invalid property values, and convention violations.
- **Visual regression testing**: tools such as Playwright or Percy capture screenshots before and
  after a change and diff them, because a CSS change can break layout in ways that linting cannot
  detect.
- **Cross-browser testing**: verify the application in all target browsers,
  because a property that works in Chrome may not work in Safari or Firefox.
- **Responsive testing**: verify the application at all target breakpoints and container sizes,
  because a layout that works at one size may break at another.
- **Measure before changing layout math**: for viewport and overflow bugs, capture
  `innerWidth`, `document.documentElement.scrollHeight`, the element's bounding height,
  and `CSS.supports('height', '100dvh')` before editing styles,
  because a media query that does not match looks identical to a height bug.

A pull request that introduces a visual regression is not accepted.

## Build

CSS is deliverable as static files.

For compiled SPAs, `main.css` is the entry point,
and the build tool concatenates and minifies while the source architecture remains organised.

For single HTML SPAs, CSS is loaded via `<link>` tags with a documented order.

When coexisting with a CSS framework, load framework styles first and custom styles last,
or use `@layer` to isolate them, because a framework style that loads after custom styles overrides
it.

Minification and bundling run through the PostCSS pipeline or Lightning CSS:

```bash
npx lightningcss --minify src/styles/index.css -o dist/styles.css
```

## Dependencies

| Category      | Package                      | Purpose                                        |
| ------------- | ---------------------------- | ---------------------------------------------- |
| Linter        | `stylelint`                  | Modern CSS syntax and rule enforcement         |
| Configuration | `stylelint-config-standard`  | Standard recommended stylelint ruleset         |
| Minifier      | `lightningcss` or `csso-cli` | Fast CSS bundling, prefixing, and minification |

## Comments

CSS is self-documenting through naming.

Comments are appropriate in two cases.

- A `/* REASON: */` comment on a non-obvious decision,
  such as a browser quirk or a specificity workaround.
- A block comment at the top of a file stating its layer and responsibility.

Do not comment what the rule does, because the rule itself states that.

Do not leave commented-out CSS, because version control preserves history.

## Verification

| Check                             | Command Or Method                                             | Applies To       |
| --------------------------------- | ------------------------------------------------------------- | ---------------- |
| Stylelint passes                  | `stylelint "**/*.css"`                                        | All CSS files    |
| No unscoped element selectors     | Grep for `^[a-z]+ {` in component CSS                         | All CSS files    |
| No `!important` outside utilities | Grep for `!important` excluding `utilities/`                  | All CSS files    |
| No raw colours when tokens exist  | Grep for `#[0-9a-f]{3,6}` in `components/`                    | All CSS files    |
| No `float` for layout             | Grep for `float:` excluding `float: none`                     | All CSS files    |
| Focus indicators present          | Grep for `:focus-visible` in component CSS                    | All components   |
| Reduced motion respected          | Grep for `prefers-reduced-motion`                             | All CSS files    |
| Cascade layers declared           | Grep for `@layer` in entry CSS                                | Compiled SPAs    |
| Stylelint analysis                | `npx stylelint "src/**/*.css"`                                | All CSS files    |
| Build and minify CSS              | `npx lightningcss --minify src/styles/index.css -o /dev/null` | Build validation |
| Build succeeds                    | `vite build` or equivalent                                    | Compiled SPAs    |

## Definition of Done

### Correctness

- Stylelint produces no errors.
- No unscoped element selector was introduced.
- No `!important` was introduced outside a utility class.
- No raw colour value was introduced where a token exists.
- No `float` was introduced for layout.

### Structure

- The CSS file layout matches the confirmed project type.
- Cascade layers are declared when the project uses them.
- No selector nests deeper than three levels.
- Each component owns its own styles.

### Quality

- Stylelint reports zero errors and zero warnings.
- No `!important` appears in a component definition.
- Color contrast meets the documented accessibility threshold.

### Accessibility

- Every interactive element has a `:focus-visible` style.
- Every animation is gated behind `prefers-reduced-motion`.
- Touch targets are at least 44 by 44 CSS pixels.
- Forced Colors Mode is supported.

### Tokens

- Every visual value is a token or a deliberate one-off.
- Z-index values reference custom properties.
- Dark mode is supported via `prefers-color-scheme` or a class toggle.

### Hygiene

- `node_modules/`, `dist/`, and `coverage/` are gitignored.
- No commented-out CSS remains.
- Documentation was updated when the change altered the architecture or the token set.

## General Principles

**Single Responsibility.** A class does one thing, a component owns its own styles,
a utility overrides exactly one property.

**Co-location.** Styles for a component live in a file named after the component,
because co-location makes the styles easy to find.

**Self-documenting.** Class names describe what the element is, not how it looks,
because a semantic name survives a redesign.

**No Inline Styles for Static Values.** Use classes and custom properties for presentational styling
that does not change at runtime, because an inline static style is not reusable.

**Performance.** Animate only `transform` and `opacity`,
because these properties do not trigger layout or paint.

Use `contain: layout paint` for isolated component regions.

Use `content-visibility: auto` for off-screen sections.

Minimise reflow triggers.

**Zero Warnings.** A Stylelint error is either a defect or a rule the project does not want,
and both cases require an action.

**Cascade layers over specificity.** A layer order beats a specificity battle.

**Design tokens for every color.** A raw color value drifts from the design system.

**No `!important`.** A component rule never reaches for it.

## Sources

The following authoritative references support the rules in this document.

- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS) - the property, value,
  and at-rule reference.
- [Introduction to the CSS Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction)
  - origin, importance, and specificity ordering.
- [Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer) - the
  `@layer` mechanism and its precedence rules.
- [Using Container Size and Style Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries)
  - the `container-type` setup and query conditions.
- [CSS Specifications Index](https://www.w3.org/Style/CSS/specs.en.html) - the CSS Working Group's
  normative module list.
- [Can I Use](https://caniuse.com/) - per-feature browser support tables for gate decisions.
- [web.dev Learn CSS](https://web.dev/learn/css) - the maintained curriculum on modern layout,
  cascade, and selector behavior.
- [Stylelint](https://stylelint.io/) - the linter and its rule reference.

## Project Conventions

- The UI is monospaced and DOS-like: avoid complex modern styling where text rendering suffices.
- Dark (default) and light themes are token-driven; classes use `kebab-case` or BEM.
- A `border-color` rule without a visible border is dead code - the base rule must declare the border (or a transparent placeholder) before a state rule changes its color.
