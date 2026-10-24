# Vanilla HTML Engineering Standards

<!-- Version: 0.1.2 | Date: 2026-10-21 -->

## Purpose

This document defines development standards for browser applications and websites built with plain
HTML, CSS, and JavaScript.

It applies to applications that run in the browser with no framework, no bundler, and no build step.

It builds on the general HTML engineering standard and adds only the rules specific to a
frameworkless application.

It is written to be executed directly by an AI coding agent such as Devin, Antigravity,
or Claude Code, and to be read without effort by a human reviewer.

## Scope

A vanilla application is a browser application that satisfies all of the following conditions.

- The browser loads hand-written HTML, CSS, and JavaScript directly.
- No framework such as React, Vue, Angular, or Svelte is used.
- No bundler, transpiler, or preprocessor sits between the source files and the browser.
- Runtime dependencies are zero, or limited to a small number of libraries loaded on demand.
- The whole application is served from a static file server or opened directly from the file system.

This standard does not apply to compiled single page applications.

For those, use a framework-specific development standard.

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches application code.

1. Read the project rules file, such as `AGENTS.md`, `README.md`, or `docs/GUIDELINES.md`,
   because a project rule overrides this standard.
2. Determine the application model and the source layout using the Agent Intake Protocol below.
3. Confirm the model with the user when the repository is ambiguous or empty.
4. Apply the sections of this standard that match the confirmed model and layout.
5. Verify the change against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                        |
| ---- | ----------------------------------------- | ---------------------------------------------- |
| 1    | An explicit instruction from the user     | "Keep everything in one file"                  |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`              |
| 3    | The existing convention in the repository | Double quotes in JavaScript across every file  |
| 4    | This standard and the general standard    | Single quotes in JavaScript                    |
| 5    | General web development best practice     | Anything not covered by the four sources above |

Never silently reformat existing code to match this standard.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

These rules hold in every model and every layout,
including the single-file layout and including a throwaway prototype.

- **No native dialogs.** `window.alert`, `window.confirm`,
  and `window.prompt` are inadmissible in application code.
- **Responsive.** The application adapts to viewport width, viewport height, and orientation,
  with no horizontal page scroll at any supported size.
- **Reactive.** The interface answers user input within the interaction budget and never blocks the
  main thread while data loads.
- **One source of truth.** State lives in JavaScript, the DOM is a projection of it.
- **Escape everything.** No value reaches `innerHTML` without passing through the escape helper.
- **Readable source.** The code is formatted, indented, and logically divided, whatever the layout.
- **Lowest workable complexity.** Choose the smallest structure that solves the problem,
  and grow only when a real boundary appears.
- **Keyboard and screen reader parity.** Every action reachable with a pointer is reachable with a
  keyboard.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

The agent must know two things before it writes a single line:
the application model and the source layout.

These two answers determine the render surface, the file structure, the loop model,
and most of the remaining rules.

There is no profile file to maintain.

The repository itself is the record of the decision,
so the agent derives the answers from the files that exist and asks only when the files cannot
answer.

### Detection First

Inspect the repository before asking anything.

Apply the detection table below and form a conclusion.

| Signal Found In The Repository                                    | Inferred Layout     | Confidence |
| ----------------------------------------------------------------- | ------------------- | ---------- |
| A single `.html` file with inline `<style>` and inline `<script>` | Single File         | High       |
| `index.html` plus one `css/` file plus one `js/` file             | Minimal             | High       |
| `index.html` plus several files under `css/` and `js/`            | Modular             | High       |
| `src/index.html` with `css/` and `js/` inside `src/`              | Modular With `src/` | High       |
| An empty repository or documentation only                         | Undetermined        | None       |

| Signal Found In The Repository                           | Inferred Model |
| -------------------------------------------------------- | -------------- |
| Forms, tables, record lists, `localStorage` persistence  | Application    |
| A `<canvas>` element and a `requestAnimationFrame` loop  | Game           |
| Generated SVG frames, a frame counter, playback controls | Presentation   |

Also detect the following secondary decisions, because each of them is a project-wide contract.

| Decision           | Detect By                                                      |
| ------------------ | -------------------------------------------------------------- |
| Module system      | `<script type="module">` versus ordered classic `<script>`     |
| Organization       | A single namespace object versus one class per file            |
| Modal mechanism    | A `<dialog>` element versus a `.modal-overlay` div             |
| Quote style        | The dominant quote character in existing JavaScript            |
| Indentation        | The dominant indent width in existing source                   |
| Locale support     | The presence of an `i18n` module or a translations directory   |
| Persistence        | The presence of a `localStorage` key constant                  |
| Development server | The presence of `server.js`, `server.mjs`, or a `start` script |

### Existing Project

When detection reaches a confident conclusion, state it and ask for a single confirmation.

Do not run the full questionnaire against a repository that already answers it.

Use one short message in the following shape.

```
Detected: Application model, Minimal layout, classic scripts, namespace object,
overlay-div modals, double quotes, two-space indent, i18n present, localStorage present.
Continuing on that basis unless you say otherwise.
```

Ask a targeted question only for a decision that detection could not resolve and that the task
actually depends on.

Never ask about a decision that has no bearing on the requested change.

### New Project

When the repository is empty, or the task is to start a new application,
ask the intake questions before writing code.

Ask them as one grouped set, not one at a time.

Ask only the questions in the first table,
and derive everything else from the answers and from the defaults in this standard.

| Question            | Options                                               | Default If Declined |
| ------------------- | ----------------------------------------------------- | ------------------- |
| Application model   | Application, Game, Presentation                       | Application         |
| Source layout       | Single File, Minimal, Modular, Modular With `src/`    | Minimal             |
| Distribution        | Static host, Opened from the file system, Both        | Static host         |
| Persistence         | None, `localStorage`, `localStorage` plus JSON export | `localStorage`      |
| Languages           | One, Several                                          | One                 |
| Offline requirement | Not required, Must work with no network               | Not required        |

The answers cascade into the secondary decisions without further questions.

| Answer                                | Consequence                                                              |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Distribution includes the file system | Classic scripts, no ES modules, no `fetch` of local data                 |
| Distribution is a static host only    | ES modules are permitted, and the project states that choice in the docs |
| Source layout is Single File          | No development server, no package manifest, no external asset            |
| Offline requirement is set            | Every third-party library is vendored, no CDN reference survives         |
| Languages is Several                  | An i18n module is created before the first user-facing string is written |
| Model is Game                         | Canvas render surface, one `requestAnimationFrame` loop, keyboard parity |
| Model is Presentation                 | SVG render surface, a frame counter, no per-frame hardcoded coordinates  |

### Asking Well

Present the questions as a compact numbered list with the default marked.

State that the user may answer with a single line,
such as `Application, Single File, static host, localStorage, one language, offline`.

Do not block on an answer that the task does not need.

Do not re-ask a question that a previous answer in the same session already resolved.

### Recording The Decision

Do not create a profile file, a decision log, or a settings file to store the answers.

Create the file structure that the answers imply, and let that structure be the record.

State the resulting structure in `README.md` so a human reader sees the same conclusion the agent
will detect later.

A future session re-derives the model from the repository using the detection table,
which is why the layouts in this standard are deliberately distinguishable from each other.

## Documentation

Consult these sources rather than guessing at browser behavior.

- [MDN HTML Reference](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [MDN JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Web Vitals](https://web.dev/articles/vitals)
- [Baseline Web Platform Status](https://webstatus.dev/)
- [Can I Use](https://caniuse.com/)

## Core Technologies

- **HTML5**: One entry document that hosts all screens.
- **Native CSS**: Custom properties on `:root`, no preprocessor.
- **ECMAScript 2020 or later**: Written directly, never transpiled.
- **Node.js 18 or later**: Runs the static development server only, never in the browser path.

## Application Models

A vanilla application falls into one of three models, and the model shapes the rest of the choices.

| Model        | Primary Content                      | Render Surface        | Typical Interaction            |
| ------------ | ------------------------------------ | --------------------- | ------------------------------ |
| Application  | Records, forms, dashboards, editors  | DOM                   | Clicks, typing, drag and drop  |
| Game         | A continuous or stepped visual scene | Canvas, sometimes DOM | Pointer, keyboard, real-time   |
| Presentation | A sequence of discrete visual frames | SVG, sometimes DOM    | Step navigation, auto-playback |

The model determines the render surface, the loop model, and the accessibility strategy.

A single application may combine surfaces, for example a canvas game with a DOM control bar.

Keep the dominant surface as the primary one and treat the other as a companion.

The model is independent of the source layout, so any model can be built in any layout.

## Project Structure

Choose one of four layouts before writing any code.

| Layout              | Use Case                                             | Structure                                        |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Single File         | One distributable file, offline tool, demo, embed    | one `.html` with inline `<style>` and `<script>` |
| Minimal             | Small application with one group of screens          | `index.html`, one stylesheet, one script         |
| Modular             | Application with several distinct subsystems         | `index.html`, split `css/`, split `js/`          |
| Modular With `src/` | Large application that separates source from tooling | `src/index.html`, `runtime/`, `docs/`            |

Pick the smallest layout that fits the application.

A small application must not be forced into the modular layout.

Splitting a two hundred line script across six files adds ceremony and removes nothing.

Grow the layout only when a real boundary appears, such as a second subsystem or a second developer.

The layout is a project-wide contract.

An agent must not migrate a project from one layout to another as a side effect of an unrelated
task.

### Single File Layout

The whole application lives in one `.html` file.

Markup, style definitions, images, and logic are all inline,
and the file has no external asset of any kind.

This layout is selectable for a new project and must be preserved during further development of a
project that already uses it.

It is not the recommended default, because a split layout gives better caching, cleaner diffs,
per-file linting, and a stricter security posture.

Select it when one of the following is true.

- The application must be distributed as one file that is mailed, embedded,
  or carried on a memory stick.
- The application must run by double-clicking the file with no server and no network.
- The application is a small tool, a demo,
  or an embed where a directory of assets is disproportionate.
- The user has asked for it.

Convenience alone is not a reason to select it,
and neither is an unwillingness to create a second file.

```plaintext
project-root/
  app-name.html           -- markup, inline <style>, inline images, inline <script>
  README.md               -- overview and purpose
  docs/
```

Every other rule in this standard applies to this layout unchanged.

The Single File Applications section describes how the file is divided, how images are embedded,
and where its limits are.

### Minimal Layout

Use this layout when the application is small enough that one script stays readable.

All styles live in one stylesheet and all logic lives in one script.

```plaintext
project-root/
  index.html              -- single entry document
  package.json            -- npm scripts and metadata
  README.md               -- overview, quick start, feature list
  server.mjs              -- static development server
  css/
    style.css             -- all styles, tokens first
  js/
    app.js                -- all application logic and state
    catalog-data.js       -- generated data, optional
  docs/
```

Name the single script `app.js` or `main.js` and keep that choice consistent across the project.

Name the single stylesheet `style.css`.

Keep the token block at the top of `style.css` and the `@media` rules at the bottom.

A generated data file stays separate even in this layout, because it is not hand-edited.

A translations directory is the one other admissible split,
because one file per locale keeps a diff reviewable.

### Modular Layout

Use this layout when the application has several distinct subsystems.

```plaintext
project-root/
  index.html              -- single entry document
  package.json            -- npm scripts and metadata
  README.md               -- overview, quick start, feature list
  server.mjs              -- static development server
  css/
    variables.css         -- design tokens on :root
    layout.css            -- structure, grid, regions
    components.css        -- reusable components
    interactive.css       -- states, drag, modal, tooltip
  js/
    model.js              -- domain types, no DOM access
    data.js               -- initial or generated data
    i18n.js               -- translation dictionary and locale
    renderer.js           -- DOM generation
    persistence.js        -- localStorage and import/export
    app.js                -- bootstrap and wiring, loaded last
  docs/
```

### Modular With `src/` Layout

Use this layout when the project has enough tooling that separating source from tooling is worth an
extra directory level.

The distinguishing feature is that the deployable artifact is exactly the `src/` directory.

```plaintext
project-root/
  package.json            -- npm scripts and metadata, no runtime dependencies
  README.md               -- overview, quick start, feature list
  .gitignore
  runtime/
    server.js             -- static development server
  src/
    index.html            -- single entry document
    css/
    js/
  docs/
    GUIDELINES.md         -- project rules
    ARCHITECTURE.md       -- module boundaries and data flow
    TESTING.md            -- manual verification checklist
```

Deployment is a copy of `src/` and nothing else.

### Scaling Between Layouts

Move to the next layout up when any of the following becomes true.

- A single script passes roughly one thousand lines.
- A single stylesheet passes roughly one thousand lines.
- A single-file document passes roughly fifteen hundred lines.
- Two subsystems start editing the same file for unrelated reasons.

Splitting later is cheap because there is no build step to reconfigure.

Never move down a layout, because collapsing files loses history and gains nothing.

Propose the move and wait for approval, because a layout change touches every path in the project.

### Shared Rules

The bootstrap script is always loaded last and is always the only entry point.

Never place application source inside `docs/`.

## Single File Applications

This section applies only to the Single File layout.

It exists because a one-file application is the layout most likely to decay into an unreadable wall
of text, and the standard refuses that outcome.

The absence of files is not an absence of structure.

### Internal Order

The file has the same logical divisions a split layout would have,
expressed as ordered regions rather than as files.

Keep the regions in this order and never interleave them.

| Order | Region        | Location           | Content                                          |
| ----- | ------------- | ------------------ | ------------------------------------------------ |
| 1.    | Document head | `<head>`           | Doctype, charset, viewport, title, meta          |
| 2.    | Style         | `<style>` in head  | Tokens, reset, layout, components, states, media |
| 3.    | Icon sprite   | Start of `<body>`  | One hidden `<svg>` holding every `<symbol>`      |
| 4.    | Shell markup  | `<body>`           | Header, main, screens, overlays                  |
| 5.    | Templates     | End of markup      | `<template>` elements for repeated structures    |
| 6.    | Data          | `<script>` in body | Constants, generated data, translation tables    |
| 7.    | Logic         | `<script>` in body | State, rendering, events, bootstrap              |

Place the style block in `<head>` so the browser paints once instead of repainting after a late
stylesheet.

Place both script blocks at the end of `<body>` so the markup parses before the logic runs.

Keep data and logic in two separate `<script>` blocks even though one would work,
because that boundary is what makes the file splittable later.

### Region Banners

Mark every region and every subsection with a banner comment,
because the file has no directory tree to navigate by.

A banner is the only navigation aid the reader has, so make it greppable and make it unique.

```html
<!-- ============================================================
     REGION 4  SHELL MARKUP
     ============================================================ -->
```

```css
/* ============================================================
   2.1  DESIGN TOKENS
   ============================================================ */
```

```javascript
/* ============================================================
   7.3  RENDERING
   ============================================================ */
```

Number the banners to match the internal order table,
so the file reads the same way in every project that uses this layout.

A reviewer can then refer to a location as "region 7.3" in a task or a comment.

### Division Inside The Blocks

Divide the style block in the same order a split stylesheet would use.

Divide the script block in the same order split scripts would use.

| Order | Style Subsection | Script Subsection |
| ----- | ---------------- | ----------------- |
| 1.    | Tokens           | Constants         |
| 2.    | Reset            | State             |
| 3.    | Layout           | Helpers           |
| 4.    | Components       | Persistence       |
| 5.    | States           | Rendering         |
| 6.    | Media queries    | Events            |
| 7.    |                  | Bootstrap         |

Declare exactly one namespace object or one bootstrap function,
and attach nothing else to the global scope.

Sharing one scope is a property of the layout, not a licence to use it.

Pass collaborators explicitly, exactly as a split layout would have to.

Do not use `<script type="module">` in this layout when the file must open over `file://`,
because module loading is blocked on that scheme.

### Inline Images

Every image is inline, and there are three admissible techniques.

| Technique             | Use For                                 | Notes                                        |
| --------------------- | --------------------------------------- | -------------------------------------------- |
| Inline SVG `<symbol>` | Icons, flags, logos, diagrams           | The default, scales cleanly, styles with CSS |
| CSS gradient or shape | Backgrounds, dividers, decorative fills | Costs no extra bytes and no decode           |
| `data:` URI           | A small raster that cannot be vector    | Last resort, base64 inflates size by a third |

Declare the icon sprite once as a hidden `<svg>` and reference each icon by fragment.

```html
<svg aria-hidden="true" focusable="false" width="0" height="0" style="position: absolute">
  <symbol id="icon-search" viewBox="0 0 24 24">
    <path d="M10 2a8 8 0 105.3 14l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0010 2z" fill="currentColor" />
  </symbol>
</svg>
```

```html
<button class="btn" aria-label="Search">
  <svg class="icon" width="20" height="20" aria-hidden="true"><use href="#icon-search" /></svg>
</button>
```

Draw icons with `fill="currentColor"` so one CSS colour rule restyles the whole set.

A sprite keeps every icon in one region instead of scattering path data through the markup.

Keep any `data:` URI under roughly five kilobytes.

A raster larger than that inflates the parse cost of the document and belongs in a split layout.

### Limits

The single-file layout has a working range, and beyond it the layout stops paying for itself.

| Limit                           | Threshold             | Action When Exceeded         |
| ------------------------------- | --------------------- | ---------------------------- |
| Total document length           | Roughly 1500 lines    | Consider the Minimal layout  |
| Total file size                 | Roughly 500 kilobytes | Move data or images out      |
| Inline raster asset             | Roughly 5 kilobytes   | Replace with SVG or move out |
| Distinct subsystems in the file | Two                   | Move to the Minimal layout   |

A generated data table is the usual reason a single file grows past its limit.

Moving only the data into one adjacent `.js` file is the smallest useful step and is preferable to a
full split.

State that deviation in `README.md`, because the layout is then Minimal with one script,
not Single File.

### Staying Upgradable

Write the single file so that splitting it later is a copy operation, not a rewrite.

- Keep each region contiguous, so a region becomes a file by cutting it whole.
- Keep the style subsections in cascade order, so they become `variables.css`, `layout.css`,
  `components.css`, and `interactive.css` in that order.
- Keep data separate from logic, so the data block becomes `data.js`.
- Reference icons by fragment, so moving the sprite to `sprite.svg` changes only the `href` prefix.
- Keep translation tables in their own subsection, so they become `i18n.js`.

### Accepted Trade-Offs

The single-file layout buys portability and pays for it in five places.

| Trade-Off                       | Consequence                                      | Mitigation                                                  |
| ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| No per-asset caching            | A one-character edit re-downloads the whole file | Acceptable for an offline or portable tool                  |
| Inline `<script>` and `<style>` | A strict Content Security Policy blocks them     | Ship source hashes, see the Content Security Policy section |
| Larger diffs                    | A style change and a logic change share one file | Region banners keep the diff locatable                      |
| No per-file linting             | A tool cannot lint one concern in isolation      | Run `node --check` on an extracted copy of the script block |
| One parse before first paint    | A large file delays the first meaningful paint   | Respect the size limits above                               |

Name the trade-off out loud in `README.md` rather than pretending it does not exist.

## Naming Conventions

Naming follows the general standard.

The deltas below are the conventions an application adds on top.

### Internationalization Keys

Use `snake_case` for all translation keys.

Prefix every key with the category it belongs to.

| Key Pattern                  | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `app_title`                  | Global application text            |
| `nav_back`, `nav_play`       | Navigation and control labels      |
| `tab_process`, `tab_effects` | Tab labels                         |
| `<id>_name`                  | Item name for a data-driven entry  |
| `<id>_description`           | Item description                   |
| `<id>_frame_<N>_title`       | Frame title for step N             |
| `<id>_frame_<N>_desc`        | Frame description for step N       |
| `<id>_effect_<N>`            | Effect list item N                 |
| `<id>_<label_key>`           | In-scene label inside an SVG frame |

The `<id>` placeholder is the unique identifier of a data entry, not a human-readable name.

This convention lets the application construct keys dynamically from data.

### Storage Keys

Use one `localStorage` key per concern, and prefer a versioned key so the schema can evolve.

| Purpose           | Key Pattern        | Example                     |
| ----------------- | ------------------ | --------------------------- |
| Application state | `<app>-state-v<n>` | `catalog-state-v1`          |
| Locale            | `<app>-locale`     | `catalog-locale`            |
| Feature flag      | `<app>-<feature>`  | `catalog-sidebar-collapsed` |

## Code Conventions

### Screens

Represent every screen as a `<section>` with the `screen` class and a stable `id` ending in
`-screen`.

```html
<main>
  <section id="home-screen" class="screen active"></section>
  <section id="test-screen" class="screen"></section>
  <section id="results-screen" class="screen"></section>
</main>
```

The stylesheet controls visibility so that JavaScript only toggles a class.

```css
.screen {
  display: none;
}
.screen.active {
  display: block;
}
.hidden {
  display: none !important;
}
```

Markup that never changes belongs in the entry document.

Markup that depends on state is generated by a render function.

Do not mix both inside the same container element.

### State Management

Keep all application state in one place.

Use `App.state` for the namespace pattern and a single model object for the class pattern.

Never store application state in DOM attributes or in class names.

The DOM is a projection of state, never the source of truth.

Mutate state through named methods, then call the render function.

There is no reactivity and no virtual DOM.

### Rendering

Two rendering techniques are allowed.

- `document.createElement` with `appendChild` for structural and interactive content.
- A template literal assigned to `innerHTML` for a self-contained block that is replaced as a whole.

Be consistent within a single render function and do not mix the two techniques inside that
function.

Clear a container with `container.innerHTML = ''` before a full re-render.

Cache a DOM query when the same element is read more than once.

A full re-render replaces the text or markup of many elements at once.

A language change is the typical trigger,
because every visible label and every generated list must update.

A full re-render can cause visible flicker when the browser paints intermediate layout states while
the re-render is still in progress.

Two techniques prevent the flicker.

Suppress CSS transitions during the re-render so elements with `transition: all` do not animate
property changes caused by the re-render.

Add a class to the `body` before the re-render and remove it in the next `requestAnimationFrame`.

```css
body.no-transition * {
  transition: none !important;
}
```

```javascript
onLocaleChange() {
  document.body.classList.add('no-transition');
  this.renderUI();
  this.renderHomeStats();
  requestAnimationFrame(() => document.body.classList.remove('no-transition'));
}
```

Defer visibility changes to the next animation frame when a re-render happens behind a modal or an
overlay.

Closing the overlay in the same synchronous block as the re-render forces the browser to paint the
new layout and hide the overlay in one frame.

Deferring the close to `requestAnimationFrame` lets the new layout settle behind the overlay before
the user sees it.

```javascript
option.onclick = () => {
  this.selectLanguage(code);
  requestAnimationFrame(() => this.closeLanguageModal());
};
```

Read geometry, canvas contexts, and element measurements only after the owning elements exist.

Guard every boot-time DOM lookup that can run before its target renders.

### Persistence

Persist state to `localStorage` whenever the user may resume later.

Write and read inside `try` and `catch` because storage can be full or blocked.

When a `version` field is stored, reject a payload whose version does not match.

Convert a `Set` or a `Map` to an array before serializing.

```javascript
const STORAGE_KEY = 'catalog-state-v1';

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        screen: App.state.screen,
        items: App.state.items,
        selection: [...App.state.selection],
        savedAt: Date.now(),
      }),
    );
  } catch (e) {
    console.warn('saveState failed', e);
  }
}
```

Restore state before the first render, not after it.

Restore also means syncing every control that mirrors persisted state during boot,
such as a theme toggle's icon, a collapsed section's chevron, or a dock control's position,
so no control contradicts the restored value.

Apply persisted visual state before first paint through a synchronous head script when the state
changes appearance, such as the theme, so a reload shows no flash of the default state.

Save on every state change and on `beforeunload`.

Offer JSON export and import when the user may want to share or back up the data.

### Data Loading

Ship static data as a JavaScript file that declares constants and loads before `app.js`.

This avoids a `fetch` round trip and keeps the application working over `file://`.

```html
<script src="js/catalog-data.js"></script>
<script src="js/app.js"></script>
```

Generate that file from a source document kept under `docs/reference/`.

Never hand-edit generated data.

Use `fetch` only for data that genuinely changes at runtime.

### Error Handling

Validate input at the boundary of every public method.

Log an unexpected state to the console and never swallow an error silently.

Wrap only the operations that can genuinely fail, such as storage access, JSON parsing,
and file reading.

Show the user a message for any failure that changes what they can do.

### User Feedback

Every message, warning, error, confirmation, and prompt is a component the application owns.

`window.alert`, `window.confirm`, and `window.prompt` are inadmissible,
with no exception for a prototype, a demo, or an internal tool.

See the Messages and Dialogs section for the required mechanism.

### Frameworkless Primitives

A shared store extends `EventTarget` so subscribers react to changes:

```javascript
export class ObservableStore extends EventTarget {
  #state;

  constructor(initialState) {
    super();
    this.#state = structuredClone(initialState);
  }

  getState() {
    return structuredClone(this.#state);
  }

  setState(updates) {
    this.#state = { ...this.#state, ...updates };
    this.dispatchEvent(new CustomEvent('change', { detail: this.getState() }));
  }
}
```

Reusable widgets are autonomous Custom Elements with a hyphenated tag:

```javascript
export class CounterElement extends HTMLElement {
  #count = 0;

  connectedCallback() {
    this.innerHTML = `<button type="button">Count: ${this.#count}</button>`;
    this.querySelector('button').addEventListener('click', () => {
      this.#count++;
      this.querySelector('button').textContent = `Count: ${this.#count}`;
    });
  }
}

customElements.define('app-counter', CounterElement);
```

Any string that enters markup passes through escaping first:

```javascript
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

Assigning unescaped input to `element.innerHTML` is forbidden.

## Formatting and Linting

Formatting follows the general standard: two-space indentation, the project's quote style,
semicolons, no `var`, and lines under roughly 120 characters.

No linter or formatter is mandated.

Verify source files with `node --check` before delivery.

## Testing

Automated tests are optional.

When they are added, extract the pure logic into a file with no DOM access and test that file with
the Node test runner.

```bash
node --test test/
```

Maintain the verification checklist as a numbered list of manual steps that exercise the main flows.

## Build

There is no build step.

Start the server with `npm start` and open the printed URL.

An IDE browser preview is a proxy to that server and stops working when the server stops.

Deployment is a copy of the source directory to any static host.

## Development Server

Every project in the modular or minimal layout ships a static server with zero npm dependencies.

The inline layout may omit the server because the file opens directly from the file system.

The server serves the source directory, maps MIME types, rejects directory traversal,
and disables caching.

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
const root = path.join(__dirname, '..', 'src');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.end(data);
  });
});

server.listen(port, () => console.log(`Server running at http://localhost:${port}/`));
```

The server may be a CommonJS file (`server.js`) or an ES module (`server.mjs`).

Live reload is optional and is implemented with `fs.watch` and a server-sent events endpoint.

The server injects the reload client into the HTML response so the source stays clean.

The port is fixed per project and overridable through the `PORT` environment variable.

Document the chosen port in `README.md`.

## Dependencies

Runtime dependencies are zero by default,
and the package manifest declares metadata and scripts only.

```json
{
  "name": "catalog",
  "version": "0.0.1",
  "description": "Single page item catalog with local persistence",
  "private": true,
  "scripts": {
    "start": "node runtime/server.js",
    "check": "node --check src/js/app.js"
  },
  "engines": {
    "node": ">=18"
  }
}
```

Set `private` to `true`.

Keep `dependencies` empty.

A `devDependencies` entry is acceptable only for a linter or a formatter.

When a library genuinely earns its place, load it on demand, pin an exact version,
and provide a fallback, per the general standard.

## Reactivity

Reactive means the interface answers the user immediately and never makes the user wait for
something the application could have hidden, deferred, or cancelled.

It does not mean a reactivity framework, and it does not mean a virtual DOM.

### Interaction Budget

Treat these numbers as the contract between the application and the user.

| Budget          | Target | Meaning                                              |
| --------------- | ------ | ---------------------------------------------------- |
| Visual feedback | 100 ms | Some visible change acknowledges the input           |
| Interaction     | 200 ms | The interaction completes and the next frame paints  |
| Task slice      | 50 ms  | No single JavaScript task runs longer than this      |
| Content ready   | 2.5 s  | The main content of the first screen is visible      |
| Layout shift    | None   | Content never moves under a pointer or a reading eye |

A handler that cannot finish inside the interaction budget must acknowledge the input first and
continue afterwards.

### Acknowledge Then Work

Split a slow action into an immediate acknowledgement and a deferred body.

The user sees the state change in the current frame, and the work happens in the next one.

```javascript
function onGenerate() {
  setBusy(true);
  requestAnimationFrame(() => {
    buildLargeReport();
    setBusy(false);
  });
}
```

Disable the control that started the work, so a second click cannot queue a second run.

Re-enable it in the same function that clears the busy state, never in a separate path.

### Breaking Long Work

A loop over a large collection is the usual cause of a frozen interface.

Yield back to the browser at least every fifty milliseconds so input events can be processed.

```javascript
async function processAll(items, handle) {
  let deadline = performance.now() + 50;
  for (const item of items) {
    handle(item);
    if (performance.now() < deadline) continue;
    await yieldToBrowser();
    deadline = performance.now() + 50;
  }
}

function yieldToBrowser() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}
```

Show progress while a chunked task runs, because a task worth chunking is a task worth reporting.

### Batching DOM Work

Read every measurement first, then write every change,
because interleaving them forces the browser to recalculate layout on each read.

```javascript
const heights = rows.map((row) => row.offsetHeight);
rows.forEach((row, i) => {
  row.style.height = `${heights[i]}px`;
});
```

Coalesce repeated updates into one animation frame rather than running them per event.

```javascript
let scheduled = false;

function scheduleRender() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    render();
  });
}
```

Build a list off-document in a `DocumentFragment` and insert it once,
rather than appending inside the loop.

Prefer a targeted update over a full re-render when only one value changed.

Setting `textContent` on one element is always cheaper than rebuilding a container.

### Rate Limiting Input

Match the technique to the event.

| Event                      | Technique | Typical Delay |
| -------------------------- | --------- | ------------- |
| Typing in a search field   | Debounce  | 250 ms        |
| Scroll or pointer movement | Throttle  | One frame     |
| Window resize              | Debounce  | 150 ms        |
| A submit button            | Neither   | Disable it    |

Debounce delays until the input stops, and throttle limits the rate while the input continues.

Using the wrong one produces either a laggy field or a flooded handler.

### Asynchronous Data

Every request that can be superseded carries an `AbortSignal`.

Abort the previous request before starting a new one,
otherwise a slow earlier response can overwrite a fast later one.

```javascript
let inFlight = null;

async function search(term) {
  inFlight?.abort();
  inFlight = new AbortController();
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
      signal: inFlight.signal,
    });
    if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
    renderResults(await response.json());
  } catch (error) {
    if (error.name === 'AbortError') return;
    Dialogs.alert('Search failed', 'The results could not be loaded. Please try again.');
  }
}
```

Never leave a rejected promise unhandled, and never report an abort as an error.

Give every request a timeout, because a request that never settles leaves the interface in a
permanent loading state.

### Loading States

An empty region is not a loading state.

| Situation                | Treatment                                               |
| ------------------------ | ------------------------------------------------------- |
| Under 200 ms expected    | Show nothing, the result arrives before a spinner would |
| A known result shape     | A skeleton matching the final layout                    |
| An unknown result shape  | A spinner with a label                                  |
| A long or countable task | A progress indicator with a count                       |
| No result                | An empty state explaining what to do next               |
| A failure                | An inline message or a modal with a retry action        |

Reserve the final dimensions of the region before the data arrives,
so the content does not shift when it does.

A skeleton whose size differs from the real content is worse than no skeleton at all.

### Optimistic Updates

Apply an update to the interface immediately when the operation is local, reversible,
and almost always succeeds.

Toggling a flag, reordering a list, and marking an item are good candidates.

Keep the previous value and restore it if the operation fails, then explain the failure.

Do not apply an optimistic update to a destructive or irreversible action.

## Application Shell

The shell is the frame that stays on screen while the content region changes.

Two shells cover almost every application of this kind.

### Centered Shell

Use a centered shell when the application is a sequence of screens with no persistent navigation.

A sticky header carries the identity and the global actions,
and a centered column carries the content.

```css
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: var(--bg-card);
  border-bottom: 1px solid var(--color-border);
}

.app-main {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
}
```

The centered column keeps line length readable on a wide monitor without a media query.

### Sidebar Shell

Use a sidebar shell when the application has persistent navigation between many views.

```css
.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  overflow-y: auto;
}

.app-body {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  min-width: 0;
  padding: var(--space-lg) var(--space-lg) 60px;
}
```

The `min-width: 0` declaration is mandatory on every flex child that holds text or a table.

A flex item defaults to `min-width: auto`,
which refuses to shrink below its content and pushes the layout wider than the viewport.

### Collapsing the Sidebar

Below the tablet breakpoint the sidebar leaves the flow and becomes an off-canvas panel.

Animate it with `transform` rather than `left`, because `transform` does not trigger layout.

```css
@media (max-width: 1024px) {
  .app {
    display: block;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: var(--z-drawer);
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .hamburger {
    display: inline-block;
  }
}
```

The toggle sets the state on both the panel and its backdrop in one function.

Close the sidebar after a navigation click when the viewport is narrow.

### Wide Content

A table does not reflow into a narrow viewport.

Wrap it in a scroll container and give the table a minimum width,
so the page never scrolls sideways as a whole.

```css
.table-wrap {
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table-wrap table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
}
```

Rebuilding a table as a card list on mobile is acceptable when the row has few columns.

Horizontal scroll inside a bounded container is the simpler default and keeps one render function.

## Overlays

An overlay is any element that floats above the content region.

| Overlay  | Purpose                                  | Dismissed By                   |
| -------- | ---------------------------------------- | ------------------------------ |
| Modal    | A decision that must block the workflow  | Action button, Escape          |
| Drawer   | Editing a record beside its list context | Close button, backdrop, Escape |
| Dropdown | A short contextual list of choices       | Outside click, Escape          |
| Toast    | A confirmation that must not block       | Timeout                        |

### Layer Order

Every overlay takes its `z-index` from a token, and the tokens form one documented scale.

The scale below is a reference, not a fixed contract.

| Layer           | Token          | Value |
| --------------- | -------------- | ----- |
| Sticky header   | `--z-header`   | `100` |
| Dropdown        | `--z-dropdown` | `200` |
| Backdrop        | `--z-backdrop` | `300` |
| Drawer, sidebar | `--z-drawer`   | `400` |
| Modal           | `--z-modal`    | `500` |
| Toast           | `--z-toast`    | `600` |

Leave gaps in the scale so a new layer can be inserted without renumbering.

Never write a literal `z-index` value in a rule.

### Reusable Modal

Declare the modal once in the entry document and reuse it for every message.

Do not create a second modal for a second message.

The Messages and Dialogs section defines the two admissible mechanisms and the behavior both must
implement.

### Drawer

A drawer edits one record while its list stays visible behind.

Build it as a head, a body, and a foot, and let only the body scroll.

The fixed head and foot keep the title and the save action visible however long the record is.

A drawer follows the same required behavior as a modal,
except that it does not have to trap focus when the list behind it stays interactive.

### Dropdown

Close a dropdown from a listener on the document and stop the propagation of clicks inside the
panel.

Register the document listener on the next tick,
otherwise the click that opened the panel closes it immediately.

## Messages and Dialogs

Every message the application shows to the user is a component the application owns and styles.

This section is a hard rule, not a recommendation.

### Native Dialogs Are Inadmissible

Never call `window.alert`, `window.confirm`, or `window.prompt` in application code.

They block the main thread, so the application stops responding while one is open.

They cannot be styled, so they break the visual identity of the application.

They cannot be translated, so a multilingual application shows a browser-language button label next
to its own text.

They are suppressed in some embedded and cross-origin contexts,
so the message silently never appears.

They cannot carry a third action, a form field with validation, or a scrolling body.

This rule has no exception for a prototype, a demo, an internal tool, or a debugging path.

Use `console.log`, `console.warn`, and `console.error` for developer diagnostics,
and a component for anything the user is meant to read.

### Message Taxonomy

Pick the component from the intent of the message, not from convenience.

| Intent                                             | Component | Blocking | Dismissed By                       |
| -------------------------------------------------- | --------- | -------- | ---------------------------------- |
| Report a completed action                          | Toast     | No       | Timeout                            |
| Report a recoverable problem                       | Inline    | No       | The user fixing the field          |
| State something the user must read                 | Modal     | Yes      | An acknowledge button, Escape      |
| Ask a yes or no question                           | Modal     | Yes      | A confirm or cancel button, Escape |
| Ask for a value                                    | Modal     | Yes      | A submit or cancel button, Escape  |
| Report a failure that changes what the user can do | Modal     | Yes      | An acknowledge button, Escape      |

A field-level validation error belongs beside the field, not in a modal.

A modal that only says "Saved" is a toast written in the wrong component.

### One Message API

Expose one small API and route every message through it.

The three functions mirror the three native calls they replace,
and each returns a promise so the calling code reads sequentially.

```javascript
const Dialogs = {
  alert(title, message) {
    /* resolves to undefined */
  },
  confirm(title, message) {
    /* resolves to true or false */
  },
  prompt(title, label, initial) {
    /* resolves to a string or null */
  },
  toast(message) {
    /* returns nothing */
  },
};
```

```javascript
async function deleteRecord(id) {
  const ok = await Dialogs.confirm('Delete record', 'This cannot be undone.');
  if (!ok) return;
  Store.remove(id);
  Dialogs.toast('Record deleted');
}
```

A single API means the mechanism can change without touching a single caller.

### Mechanism

Two mechanisms are admissible, and a project picks one and applies it to every dialog.

| Mechanism       | Element                 | Suits                                                                                           |
| --------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| Native dialog   | `<dialog>`              | A new project with no legacy dialog code                                                        |
| Overlay element | A `div` with an overlay | A project that already uses it, or one needing full control over the backdrop and the animation |

Neither mechanism is preferred by this standard.

Record the choice by using it consistently,
because a mixed codebase is the failure this rule exists to prevent.

### Native Dialog Mechanism

`<dialog>` with `showModal()` provides the top layer, the `::backdrop` pseudo-element,
the inert background, the initial focus, the focus trap, and Escape dismissal.

That removes most of the code the overlay mechanism has to write by hand.

```html
<dialog id="app-dialog" aria-labelledby="app-dialog-title">
  <h2 id="app-dialog-title"></h2>
  <div class="dialog-body"></div>
  <form method="dialog" class="dialog-actions">
    <button value="cancel" class="btn btn--secondary"></button>
    <button value="confirm" class="btn btn--primary" autofocus></button>
  </form>
</dialog>
```

```css
#app-dialog {
  max-width: min(90vw, 32rem);
  max-height: 90vh;
  padding: var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  box-shadow: var(--shadow-lg);
  overscroll-behavior: contain;
}

#app-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

#app-dialog .dialog-body {
  overflow-y: auto;
}
```

```javascript
function confirmDialog(title, message) {
  const dialog = document.getElementById('app-dialog');
  dialog.querySelector('#app-dialog-title').textContent = title;
  dialog.querySelector('.dialog-body').textContent = message;
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), {
      once: true,
    });
  });
}
```

A button inside `<form method="dialog">` closes the dialog and sets `returnValue` to its `value`,
so no click handler is needed for the actions.

Escape fires `close` with an empty `returnValue`, which the code above correctly reads as a cancel.

Two behaviors are still the application's responsibility.

- **Scroll lock**, because the page behind the dialog can still scroll.
  Set `overscroll-behavior: contain` on the dialog and add a body scroll lock class.
- **Backdrop dismissal**, because light dismiss is not universally available.
  Add a click listener that compares the event target to the dialog element itself.

Use `addEventListener` with `{ once: true }` so the listener cannot accumulate across repeated
opens.

### Overlay Element Mechanism

The overlay mechanism builds the same behavior from an ordinary element.

Center the dialog with flexbox on the overlay rather than with offsets and transforms.

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.modal {
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: min(90vw, 32rem);
  max-height: 90vh;
  padding: var(--space-lg);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.modal-body {
  overflow-y: auto;
}

body.scroll-locked {
  overflow: hidden;
}
```

Mark the overlay with `role="dialog"`, `aria-modal="true"`,
and `aria-labelledby` pointing at the title, because none of that is implied by a `div`.

One open function owns the whole lifecycle and returns the page to its previous state on close.

The function must implement every behavior the native mechanism provides for free.

- Store `document.activeElement` on open and restore focus to it on close.
- Move focus into the dialog on open, to the primary action or the first focusable element.
- Keep `Tab` and `Shift+Tab` inside the dialog while it is open.
- Close on Escape, and detach the Escape listener in `close`.
- Close on a backdrop click, comparing the event target to the overlay itself.
- Add and remove the body scroll lock class.
- Mark the content behind the overlay `inert` so a screen reader does not read it.

Detach every listener in `close`, otherwise each open call leaves another Escape handler on the
document.

An `AbortController` removes every listener in one call and makes that impossible to forget.

```javascript
const controller = new AbortController();
const { signal } = controller;
document.addEventListener('keydown', onEscape, { signal });
overlay.addEventListener('click', onBackdrop, { signal });
// close():
controller.abort();
```

### Required Behavior

Both mechanisms must satisfy every row of this table.

| Behavior         | Requirement                                                        |
| ---------------- | ------------------------------------------------------------------ |
| Accessible name  | `aria-labelledby` points at the visible title                      |
| Initial focus    | Focus moves into the dialog on open                                |
| Focus trap       | `Tab` never reaches the content behind the dialog                  |
| Focus restore    | Focus returns to the triggering control on close                   |
| Escape           | Closes the dialog and resolves as a cancel                         |
| Backdrop click   | Closes the dialog, a click inside it does not                      |
| Scroll lock      | The page behind the dialog does not scroll                         |
| Maximum height   | `max-height: 90vh` with a scrolling body                           |
| Text assignment  | The message is assigned with `textContent`, never with `innerHTML` |
| Single instance  | One declared dialog is reused, never cloned per message            |
| Listener cleanup | Every listener added on open is removed on close                   |

The maximum height and the scrolling body are mandatory.

Without them a long message grows the dialog past the viewport and the action buttons become
unreachable.

### Toast

A toast reports a completed action and never asks a question.

Clear the previous timer, otherwise a second toast is hidden early by the first timeout.

Keep `pointer-events: none` while hidden so the toast never intercepts a click.

Give the toast container `role="status"` and `aria-live="polite"` so the message is announced
without stealing focus.

Never use a toast for an error the user must act on,
because a message that disappears cannot be acted on.

### Inline Messages

An inline message sits next to the control it describes.

Reserve its height so the layout does not jump when the message appears.

Associate it with its control through `aria-describedby` and mark the control `aria-invalid="true"`.

## Forms

### Field Structure

One field is a label and its control in a column,
and fields sit in a grid that collapses to one column.

```html
<div class="field-grid">
  <div class="field">
    <label for="f-name">Name</label>
    <input id="f-name" type="text" data-key="name" />
    <span class="field-error"></span>
  </div>
  <div class="field field--full">
    <label for="f-notes">Notes</label>
    <textarea id="f-notes" rows="3" data-key="notes"></textarea>
    <span class="field-error"></span>
  </div>
</div>
```

Every label carries a `for` attribute that matches the `id` of its control.

This is what makes the label clickable and what lets a screen reader announce the field.

A grid section heading spans the full row with `grid-column: 1 / -1` and groups related fields
without nesting another container.

### Describing Fields

Describe the form as an array and render from that array when the form is non-trivial.

A descriptor keeps the markup, the validation, and the reset logic reading from one definition.

```javascript
const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'size', label: 'Size', type: 'select', options: SIZES },
  { key: 'notes', label: 'Notes', type: 'textarea', full: true },
];
```

### Binding Values

Mark every control with `data-key` and bind the whole form with one loop.

A `<select>` reports `change` and a text control reports `input`,
so the event name is derived from the element.

Normalize an empty string to `null` at the boundary,
so the rest of the application tests one absent value.

### Editing a Copy

Edit a copy of the record and commit it only when the user saves.

Binding directly to the stored record makes cancel impossible,
because every keystroke has already been applied.

### Dependent Fields

When one control determines the options of another,
clear the dependent value and re-render that part of the form.

Leaving a stale value behind is the most common defect in a form of this kind.

### Validation

Validate on save, not on every keystroke.

Report every error at once rather than stopping at the first.

```javascript
function validate(record) {
  const errors = {};
  FIELDS.filter((f) => f.required).forEach((f) => {
    if (!record[f.key]) errors[f.key] = 'This field is required.';
  });
  return errors;
}
```

Reserve the height of the error line so the layout does not jump when a message appears.

Move focus to the first invalid control, because the error may be scrolled out of view.

Never report a validation error with `window.alert`.

### Touch Targets

A control that is comfortable with a mouse is often too small for a thumb.

Raise the minimum height on a coarse pointer rather than at a width breakpoint,
because the pointer type is the real condition.

```css
@media (pointer: coarse) {
  .btn,
  .field input,
  .field select {
    min-height: 44px;
  }
}
```

The absolute floor is 24 by 24 CSS pixels for every pointer type,
as stated in the Input Modality section.

### Custom Choice Controls

A clickable `<div>` that behaves like a radio button must declare that role and accept the keyboard.

```html
<div class="options-list" role="radiogroup" aria-labelledby="question-text">
  <div class="option-item" role="radio" aria-checked="false" tabindex="0"></div>
</div>
```

Update `aria-checked` whenever the selected class changes,
because the class alone tells assistive technology nothing.

Prefer a real `<input type="radio">` with a styled `<label>` when the control does not need custom
layout.

## Internationalization

Add internationalization when the application has more than one audience language.

### Translation Module

Keep one dictionary object keyed by locale and one lookup function in a dedicated `i18n.js` file.

```javascript
'use strict';

window.I18n = {
  locale: localStorage.getItem('app-locale') || 'en',

  T: {
    en: { app_title: 'My App', nav_back: 'Back' },
    de: { app_title: 'Meine App', nav_back: 'Zur-ck' },
  },

  t(key) {
    const dict = this.T[this.locale] || this.T.en;
    return dict[key] || this.T.en[key] || key;
  },

  setLocale(locale) {
    this.locale = locale;
    try {
      localStorage.setItem('app-locale', locale);
    } catch (e) {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('localechange'));
  },
};
```

The lookup function follows a three-step fallback chain.

It tries the current locale first, then the default locale, then returns the key itself.

Returning the key instead of throwing an error lets the application render with missing translations
during development.

### Placeholders

Never concatenate translated fragments.

Use a placeholder inside the translation string instead.

A project may use positional placeholders such as `{0}` or named placeholders such as `{name}`,
and must apply one style consistently.

### Default Locale

Choose one locale as the default and place it first in the dictionary.

The default locale serves as the fallback when a key is missing from the active locale.

Every key that exists in any locale must exist in the default locale.

### Locale Persistence and Re-Rendering

Persist the active locale in `localStorage` under the `<app>-locale` key.

Read the saved locale on module initialization so the user's choice survives a page reload.

Wrap both the read and the write in a `try` / `catch` block because `localStorage` may be
unavailable in private browsing mode.

Call `setLocale()` when the user selects a language.

`setLocale()` stores the new locale and dispatches a `localechange` CustomEvent on `window`.

The application listens for this event and re-renders all visible content.

Set `document.documentElement.lang` to the current locale code on every locale change.

This keeps the page accessible to screen readers and search engines in the correct language.

### Language Bar

Render one button per locale in a navigation element.

Each button carries a `data-lang` attribute with the locale code.

Bind a single click listener on the container and read `dataset.lang` from the clicked button.

Toggle an `active` class on the buttons to indicate the current locale.

### Locale Indicators

A locale indicator shows the active language as a flag or a symbol.

Never use emoji flags such as the regional indicator sequences for GB or PL as a locale indicator.

Flag emoji depend on operating system font support and render inconsistently across browsers.

Embedded browser environments such as IDE previews lack the font fallback that draws flag emoji,
and fall back to regional indicator letters.

Use inline SVG flags instead, which render identically in every browser.

Store each flag as an SVG string constant in `i18n.js` alongside the locale entry.

```javascript
const FLAG_GB = '<svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">...</svg>';

window.LANGUAGES = {
  en: { name: 'English', flag: FLAG_GB },
};
```

Inject the SVG with `innerHTML` so the markup renders as an image, not as literal text.

### Consistent Icon Sizing

Flags and other icons have different native aspect ratios.

Displaying them with a fixed height and `width: auto` produces inconsistent widths.

Give every icon in a group the same fixed bounding box and let `preserveAspectRatio` fit each icon
inside it.

```css
.lang-option-flag svg {
  display: block;
  width: 26px;
  height: 18px;
}
```

The default `preserveAspectRatio` value (`xMidYMid meet`)
fits the entire icon inside the box and centers it.

Use `xMidYMid slice` or a CSS `background-image` with `background-size: cover` when the icon must
fill a shaped container such as a circle and crop the overflow.

### Script Load Order

Load `i18n.js` before any module that calls `I18n.t()`.

The typical order is `i18n.js` first, then `data.js`, then view or animation modules,
then `app.js` last.

## Accessibility

Accessibility is part of the definition of done, not a later pass.

- Give every icon-only control an `aria-label`.
- Mark a decorative SVG with `aria-hidden="true"`.
- Associate every dynamically created `<input>` with a `<label>` through `for` and `id`.
- Make every interactive element reachable by `Tab` and activatable by `Enter` and `Space`.
- Trap focus inside an open modal and restore focus to the trigger on close.
- Close a modal and a dropdown with `Escape`.
- Keep a visible focus outline, never set `outline: none` without a replacement.
- Announce the current screen by moving focus to its heading after a screen switch.
- Verify text contrast against the background for every token pair.
- Keep every interactive target at 24 by 24 CSS pixels or larger.
- Keep the focused control fully visible, never covered by a sticky header or a toolbar.
- Announce an asynchronous result through a live region rather than only through a visual change.
- Respect the reduced motion preference.

Build a non-native widget from the matching WAI-ARIA Authoring Practices pattern rather than from an
invented set of attributes.

Copy the roles, the states, and the keyboard interactions from the pattern in full,
because a partial implementation is often worse than a plain `<div>`.

Do not hide the system cursor unless the application is a full-screen visual experience.

## Canvas Applications

Use a canvas when the view is a continuous visual scene rather than a document.

Keep the canvas as the render surface and the DOM as the control surface.

Drive the scene with a single `requestAnimationFrame` loop and never with `setInterval`.

```javascript
function frame(ts) {
  const dt = lastTs ? Math.min(ts - lastTs, 80) : 16.7;
  lastTs = ts;
  if (!S.paused) advance(dt);
  drawBackground();
  drawScene();
  updateHud();
  requestAnimationFrame(frame);
}
```

Clamp the delta so a background tab does not produce one enormous step.

Read the device pixel ratio and resize the backing store on `resize`.

Keep pure math helpers such as `lerp`, `clamp`, and `ease` in one place.

Mirror every canvas interaction with a keyboard equivalent,
because a canvas is invisible to assistive technology.

## Interactive Presentations with SVG

An interactive presentation is a vanilla application that displays a sequence of visual frames to
explain a process, navigated by the user or played automatically.

It differs from a data-driven dashboard or a form editor because the primary content is a set of
generated images, not a list of records or a form.

### When to Use This Pattern

Apply this pattern when the application meets all of the following conditions.

- The content is a set of discrete steps that must be shown one at a time.
- Each step is a visual scene built from shapes, text,
  and indicators rather than a photograph or a static illustration.
- The user navigates between steps manually or plays them in sequence.
- The same scene must render at different viewport sizes without redrawing every pixel.

A photo gallery, a slide deck of images, and a video player are not this pattern.

### Architecture

An interactive presentation adds one module beyond the standard set: an animation renderer.

| Module          | Responsibility                                               |
| --------------- | ------------------------------------------------------------ |
| `data.js`       | Declares each animation class, its frame count, and metadata |
| `i18n.js`       | Holds frame titles, descriptions, and in-scene label keys    |
| `animations.js` | Generates an SVG string for a given class and frame number   |
| `app.js`        | Owns playback state, navigation, and the frame counter       |

The animation renderer is a pure function: it takes a frame index and returns an SVG string.

The application calls the function and injects the result into a container.

No animation markup is hardcoded in the HTML.

### SVG as the Render Surface

Use an SVG with a `viewBox` rather than a canvas when each frame is a composition of named shapes,
text labels, and indicators.

The `viewBox` lets the scene scale to any container size without recalculating coordinates.

```css
.animation-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}

.animation-stage svg {
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  height: auto;
}
```

The `min-height: 0` declaration on the flex parent is mandatory.

Without it the SVG refuses to shrink below its intrinsic size and overflows the container.

Do not set a fixed `width` or `height` on the SVG element.

The `viewBox` attribute handles scaling.

### Coordinate System

Every animation function declares its own coordinate constants at the top.

```javascript
const VW = 700,
  VH = 420;
const CX = 70,
  CY = 80,
  CW = 500,
  CH = 220;
const RY = CY + CH * 0.55;
const RX1 = CX + 45,
  RX2 = CX + CW - 45;
```

| Constant     | Meaning                                           |
| ------------ | ------------------------------------------------- |
| `VW`, `VH`   | SVG viewport width and height                     |
| `CX`, `CY`   | Top-left corner of the main content block         |
| `CW`, `CH`   | Width and height of the main content block        |
| `RY`         | Y coordinate of a reference line inside the block |
| `RX1`, `RX2` | Left and right edges of the reference line        |

All element positions are derived from these constants, never hardcoded as independent pixel values.

This lets a single constant change shift every dependent element at once.

### Frame Generation

Each frame is produced by computing a set of intermediate values and then composing the SVG from
them.

Store the per-frame progression as an array indexed by the frame number.

Derive every visual property, such as position, opacity, color, and label text,
from that single value.

Never branch on the frame number to set a pixel coordinate.

Always set `text-anchor` on SVG text, never rely on the default `start` alignment.

When a label describes a specific element, derive its position from that element's coordinates,
not from the viewport origin.

This keeps the label attached to the element if the element's position changes.

### Defs and Gradient IDs

Each animation function defines its own `<defs>` block with gradient and pattern IDs.

Prefix every ID with the animation class code to prevent collisions when the SVG is injected into
the same document.

When two SVGs with the same gradient ID exist in the document at the same time,
the second one silently references the first definition.

### Random Elements

Some frames use `Math.random()` to generate random paths, scattered positions, or particle effects.

This means the same frame may look different each time it is rendered.

This is acceptable for decorative elements but not for elements that convey information.

If a random element must be stable across re-renders, seed it with the frame number.

### Navigation and Playback

The application owns a frame counter and three navigation actions: previous, next, and reset.

Wrap the frame counter with modulo so it loops in both directions.

Automatic playback uses `setTimeout`, not `setInterval`, so the delay can vary per frame.

A longer delay after the last frame lets the viewer absorb the final state before the loop restarts.

Bind arrow keys to frame navigation and stop playback on any keypress.

Stopping playback on any keypress prevents a running timer from advancing the frame while the user
is manually navigating.

### Internationalization of In-Scene Text

Every text element inside the SVG must use a translation key, including proper names, status labels,
and measurement units.

A hardcoded string inside an animation function is invisible to the locale switch.

When the locale changes, re-render the current frame so all in-scene text updates.

Mathematical expressions and scientific formulas are language-neutral, but proper names,
status words, and unit labels are not.

### State Persistence

Persist the current class, frame, and tab so the user can resume after a reload.

Do not persist the `playing` state.

A user who reloads during auto-play expects to see the paused frame,
not a suddenly running animation.

### Tabs

A presentation often shows two views of the same content:
the animated process and a static list of effects.

Use a tab bar with two panels rather than two separate screens.

The tab state is part of the application state and is persisted.

Switching tabs does not stop playback, only navigating away from the detail screen does.

## Verification

Verify every change before considering it complete.

| Check             | Command Or Method                         | Applies To            |
| ----------------- | ----------------------------------------- | --------------------- |
| JavaScript syntax | `node --check js/app.js`                  | Every changed script  |
| Server start      | `npm start`                               | Every change          |
| Console clean     | Browser developer tools                   | Every change          |
| Manual checklist  | Project checklist                         | Every change          |
| Responsive layout | Device toolbar at each breakpoint         | Every layout change   |
| Narrow width      | The narrowest supported width             | Every layout change   |
| Landscape         | A short landscape viewport                | Every layout change   |
| Keyboard path     | `Tab`, `Enter`, `Space`, `Escape`         | Every new control     |
| Focus visibility  | Tab through the changed region            | Every new control     |
| Interaction delay | Performance panel while using the change  | Every new slow action |
| ESLint validation | `npx eslint "src/**/*.js"`                | Every changed script  |
| No raw innerHTML  | `grep -r -n "innerHTML\s*=" src/`         | Sanitization audit    |
| Element tag check | `grep -r -n "customElements.define" src/` | Hyphenated names      |
| Smoke tests       | `npx playwright test tests/smoke/`        | Browser probes        |

The single-file layout has no server and no manifest,
so verify it by opening the file directly and by copying the script block into a scratch file for
`node --check`.

## Definition of Done

A task is complete when every applicable row passes.

An agent runs this list before reporting, and states which rows were checked and which do not apply.

### Correctness

- The changed script passes a syntax check.
- The browser console is clean, with no error and no warning the change introduced.
- The main flows still work, verified against the project checklist.
- Restored state from a previous session still loads.

### Structure

- The change respects the project's source layout and did not migrate it.
- The change respects the project's module system, organization pattern, and quote style.
- No new global symbol was introduced outside the established pattern.
- No file exceeds the scaling threshold for its layout without a stated reason.

### Quality

- Comments explain reasons, not actions.
- No debugging output, commented-out code, or unused declaration remains.
- Every value reaching `innerHTML` is escaped.
- Documentation was updated when the change altered structure, load order, or a project rule.

### Interface

- The layout is correct at every project breakpoint, and at the narrowest supported width.
- The layout is correct in landscape on a short viewport.
- There is no horizontal page scroll at any tested size.
- No content shifts after the first paint.

### Interaction

- Every new message goes through the message API, and no native dialog was added.
- Every interactive element is reachable by `Tab` and activatable by `Enter` or `Space`.
- `Escape` closes every dialog and dropdown the change touched.
- Focus is visible on every control the change touched.
- Every icon-only control has an accessible name.
- Every long-running action acknowledges the input within the interaction budget.

### Hygiene

- No secret, token, or credential is committed.
- The modal or overlay the change touched still traps focus, restores it, and closes on Escape.

## Comparison With Market Practice

This section records why the rules above are what they are.

It compares the standard against the authoritative specifications,
against widely cited reference projects,
and against the way applications of this kind are actually built.

An agent can follow the standard without reading this section.

A reviewer who wants to challenge the standard should start here.

### Where This Standard Agrees With The Field

The following positions are settled, and this standard adopts them without qualification.

| Position                                                 | Basis                                                 |
| -------------------------------------------------------- | ----------------------------------------------------- |
| A modal must trap focus, restore it, and close on Escape | The WAI-ARIA Authoring Practices modal dialog pattern |
| An interactive target is at least 24 by 24 pixels        | WCAG 2.2 success criterion 2.5.8                      |
| Focus must remain visible and unobscured                 | WCAG 2.2 success criteria 2.4.11 and 2.4.13           |
| An interaction should complete within 200 ms             | The Core Web Vitals interaction threshold             |
| A JavaScript task longer than 50 ms is a long task       | The Chrome long task definition                       |
| Content must not shift after paint                       | The Core Web Vitals layout shift threshold            |
| A custom radio group needs roles and arrow keys          | The WAI-ARIA Authoring Practices radio group pattern  |
| Design tokens belong in custom properties                | Uniform practice across every current design system   |
| Inline scripts require hashes under a strict policy      | The Content Security Policy specification             |

### Where This Standard Is Stricter

Three rules in this document are deliberately harder than common practice.

**No native dialogs, with no exception.** Most style guides discourage `alert` and `confirm` and
then permit them in a prototype. That exception is the reason they survive into production,
because a prototype is where most production code comes from. This standard removes the exception.

**Escape everything, including trusted data.** A common position is that generated or internal data
does not need escaping. The problem is that trust is a property of the moment,
and a data file that is generated today is hand-edited or imported tomorrow.
A single unconditional rule is cheaper to enforce and cheaper to verify than a case-by-case
judgement.

**No layout migration as a side effect.** Tooling and agents both tend to "improve" structure while
doing something else. This standard treats the source layout as a contract,
because an unrequested reorganisation destroys review history and costs more than it saves.

### Where This Standard Is Deliberately Looser

**No mandated linter or formatter.** The field is split between StandardJS, an ESLint configuration,
and Prettier, and the Google JavaScript style guide is no longer maintained.
A no-build project should not acquire a toolchain to satisfy a preference,
so this standard specifies the formatting outcome and leaves the tool to the project.

**No mandated modal mechanism.** The native `<dialog>` element provides the top layer,
the inert background, the focus trap, and Escape dismissal,
which makes it the better starting point for new code. It is not made mandatory here,
because a working overlay implementation that satisfies the required behavior table has no defect to
fix, and rewriting it would be change for its own sake.
What is mandatory is that a project uses one mechanism and not both.

**No mandated state pattern.** A proxy-based store, a namespace object,
and a set of collaborating classes are all defensible at this scale.
The rule that matters is that state has one home and the DOM is a projection of it,
and that rule is enforced regardless of pattern.

### What The Reference Projects Show

The reference implementations of this kind of application converge on a small number of habits.

| Reference Kind                              | What It Demonstrates                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| The canonical vanilla to-do implementations | A complete application in a few hundred lines with no build step and no library |
| Attribute-driven interactivity libraries    | That most dynamic behavior is markup-level, not application-level               |
| Minimal drop-in reactivity libraries        | That a single script tag is an acceptable dependency boundary                   |
| Long-lived single-file wiki applications    | That a one-file application can be maintained for many years at real scale      |
| Single-file developer tools                 | That a directory of assets is disproportionate for a small focused utility      |
| Single-file bundler output                  | That the format has mechanical limits, mostly around asset size and caching     |

The most useful lesson from the single-file projects is that they succeed on discipline,
not on size.

They keep strict region ordering, heavy banner commenting, and one clear entry point,
which is exactly what the Single File Applications section requires.

### What Changed In The Platform

The argument for a framework was once that the platform could not do the job.

Most of the specific gaps that argument rested on have closed.

| Former Gap                     | Closed By                                  |
| ------------------------------ | ------------------------------------------ |
| Component encapsulation        | Custom elements and shadow DOM             |
| Scoped and themed styling      | Custom properties, cascade layers, nesting |
| Component-level responsiveness | Container queries                          |
| Parent and sibling selection   | `:has()`                                   |
| Accessible modal behavior      | `<dialog>` and `showModal()`               |
| Dependency resolution          | ES modules and import maps                 |
| Code splitting                 | Dynamic `import()`                         |
| Animated view changes          | The View Transitions API                   |
| Routing                        | The History API and the Navigation API     |

What the platform still does not provide is a declarative binding between state and markup.

That single remaining gap is why this standard specifies rendering, escaping,
and full re-render behavior in as much detail as it does.

### Observations From Applications Of This Kind

Reviewing working applications built to this pattern, the same defects recur,
and the sections of this standard exist to prevent them.

| Recurring Defect                                           | Section That Prevents It |
| ---------------------------------------------------------- | ------------------------ |
| A modal with no Escape key, scroll lock, or focus trap     | Messages and Dialogs     |
| A modal with no maximum height, so its buttons scroll away | Messages and Dialogs     |
| A `z-index` literal that starts an escalation war          | Layer Order              |
| `transition: all`, which animates unrelated changes        | Motion                   |
| A missing reduced-motion block                             | Motion                   |
| A reset that omits `font: inherit` on form controls        | Reset                    |
| Trusted data interpolated without escaping                 | Escaping                 |
| An unversioned storage key that cannot evolve              | Persistence              |
| A clickable `div` with no role and no keyboard path        | Custom Choice Controls   |
| Flicker during a full re-render on a locale change         | Full Re-renders          |
| Emoji used as icons, rendering differently per system      | Locale Indicators        |
| Comments that restate the code                             | Comments                 |

None of these are exotic.

They are the predictable cost of building without a framework,
which is the cost this standard is written to pay down once rather than repeatedly.

## General Principles

**One Source of Truth.** State lives in JavaScript objects, the DOM only displays it.

**No Native Dialogs.** Every message is a component the project owns and styles.

**Progressive Enhancement.** The application degrades to a usable state when a lazy library or a
storage API is unavailable.

**Design With Intent.** Commit to one aesthetic direction and express it through tokens, typography,
and motion rather than through scattered one-off values.

**Render Consistently.** Prefer vector graphics over emoji for icons that must look the same in
every browser, and suppress transitions during a full re-render so the user never sees an
intermediate layout state.

**Answer Immediately.** Acknowledge input in the current frame,
and do the slow part in the next one.

**Fit Every Screen.** Width, height, orientation, and pointer type are all part of the requirement.

## Sources

The following authoritative references support the rules in this document.

- [WHATWG HTML Standard](https://html.spec.whatwg.org/) - the living standard for document
  structure, elements, and script behavior.
- [WHATWG DOM Standard](https://dom.spec.whatwg.org/) - the document object model and event model.
- [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/) - the `fetch` contract.
- [ECMA-262 ECMAScript Language Specification](https://tc39.es/ecma262/) - the JavaScript language
  specification.
- [MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML),
  [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS),
  [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), and
  [MDN Web API](https://developer.mozilla.org/en-US/docs/Web/API) - the practical references for
  elements, properties, syntax, and platform APIs.
- [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - accessible names, roles,
  states, and keyboard interaction patterns.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) - the conformance criteria for accessibility
  requirements.
- [web.dev Web Vitals](https://web.dev/articles/vitals) - the performance metrics and their
  thresholds.
- [webstatus.dev](https://webstatus.dev/) and [Can I Use](https://caniuse.com/)
  - feature-support lookups for the baseline gate.
