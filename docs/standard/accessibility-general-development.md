# Accessibility Engineering Standards

<!-- Version: 0.1.3 | Date: 2026-10-24 -->

## Purpose

This document defines the accessibility standard for all web user interfaces.

It covers WCAG 2.2 Level AA conformance, automated testing, ARIA patterns, and manual verification.

It is referenced by frontend engineering standards (CSS, HTML vanilla, TypeScript/React,
JavaScript/Express) and does not stack - it is a cross-cutting requirement.

It is written to be executed directly by an AI coding agent and to be read without effort by a human
reviewer.

## Scope

This standard applies to every project that delivers a web user interface - any HTML/CSS/JS that
runs in a browser and is operated by humans.

This standard applies to:

- React, Vue, Svelte, Solid, vanilla JS frontends
- Server-rendered HTML (PHP, Java, C#, Go, Python, Rust templates)
- Electron, Tauri, Capacitor desktop/wrapper apps
- Progressive Web Apps

This standard does not apply to:

- CLI tools, backend APIs, headless services
- Native mobile apps (iOS/Android) - platform guidelines apply instead

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches UI code.

1. Read the project rules file and the referring frontend standard.
2. Run automated accessibility audit (axe-core) on the current build.
3. Apply the relevant sections below for the component/feature being built.
4. Run manual verification checklist for new interactive components.
5. Run every applicable row of the Verification section.
6. Check the result against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                | Example                                      |
| ---- | ------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user | "This component needs AAA contrast"          |
| 2    | The project rules file                | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The referring frontend standard       | the referring React standard                 |
| 4    | This standard                         | WCAG 2.2 AA + axe-core                       |
| 5    | General accessibility best practice   | Anything the four sources above do not cover |

Never silently reformat existing code to match this standard.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **WCAG 2.2 Level AA conformance.** Every page/component meets all Level A and AA success criteria.
  A violation is a defect.
- **axe-core passes in CI.** `axe-core` automated audit reports zero violations on merge.
  A violation is a defect.
- **Keyboard operability.** Every interactive element is reachable and operable via keyboard alone.
  A keyboard trap is a defect.
- **Focus visibility.** Every interactive element has a visible `:focus-visible` style meeting 3:1
  contrast. Missing focus indicator is a defect.
- **Color contrast.** Text 4.5:1, large text 3:1, UI components 3:1 against adjacent colors.
  A contrast failure is a defect.
- **No color-only information.** Information conveyed by color is also available via text, icon,
  or pattern. A color-only signal is a defect.
- **ARIA patterns followed.** Custom widgets implement WAI-ARIA Authoring Practices Guide patterns.
  A pattern deviation is a defect.
- **Screen reader compatibility.** Semantic HTML, `alt` text, `aria-label` / `aria-labelledby`,
  live regions for dynamic content. A screen reader failure is a defect.
- **Responsive zoom.** 200% zoom without horizontal scroll, 400% with reflow.
  A reflow failure is a defect.
- **Reduced motion.** `prefers-reduced-motion` respected, no auto-playing animation > 5s.
  A violation is a defect.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the accessibility posture.

| Signal Found In The Repository       | Inferred Decision                 | Confidence |
| ------------------------------------ | --------------------------------- | ---------- |
| `axe-core` in `package.json` devDeps | Automated testing configured      | High       |
| `playwright.config.ts` with `axe`    | E2E accessibility testing         | High       |
| `vitest` with `axe` integration      | Unit accessibility testing        | High       |
| `@testing-library/jest-dom`          | Accessibility assertions in tests | High       |
| `eslint-plugin-jsx-a11y`             | Lint-time accessibility checks    | High       |
| No accessibility tooling             | New project / not configured      | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation.

Example: "I see axe-core in devDeps, Playwright with axe integration, eslint-plugin-jsx-a11y.

I will enforce WCAG 2.2 AA with automated + manual verification.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project,
accessibility tooling is mandatory. Ask the following questions.

| Question                   | Options                                  | Default If Declined       |
| -------------------------- | ---------------------------------------- | ------------------------- |
| Which conformance target?  | WCAG 2.2 AA, WCAG 2.1 AA, ADA-only       | WCAG 2.2 AA               |
| Which test stack?          | axe-core + Playwright, jest-axe + Vitest | axe-core + Playwright     |
| Which lint plugin?         | `eslint-plugin-jsx-a11y`, none           | `eslint-plugin-jsx-a11y`  |
| Manual verification level? | Screen reader + keyboard, keyboard only  | Keyboard + NVDA/VoiceOver |

## Documentation

The following are the authoritative sources for accessibility.

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) - normative success criteria
- [WAI-ARIA Authoring Practices Guide 1.2](https://www.w3.org/WAI/ARIA/apg/) - widget patterns
- [axe-core](https://github.com/dequelabs/axe-core) - automated testing engine
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - developer guide
- [web.dev Accessibility](https://web.dev/accessible/) - practical tutorials
- [Accessible Colors](https://accessible-colors.com/) - contrast calculator

## Language Version

This standard targets **WCAG 2.2** (published October 2023)
and **axe-core 4.10** (automated testing engine).

WCAG 2.2 Level AA is the minimum conformance target for all projects.

Level AAA is required for:

- Authentication flows (login, registration, password reset)
- Payment/checkout flows
- Legal/regulatory content
- Any component the project rules file explicitly designates

On WCAG/axe-core upgrade, re-validate all rules against release notes before writing code.

## Project Structure

Accessibility is integrated into the referring frontend project structure.

This standard defines the integration points:

```
src/
  components/           Components with accessibility built-in
    Button.tsx          Semantic <button>, focus styles, ARIA
    Modal.tsx           Focus trap, ARIA dialog, Escape handling
  hooks/                Accessibility utilities
    useFocusTrap.ts     Focus management hook
    useAnnouncer.ts     Live region announcer
  utils/                Accessibility helpers
    axe-test-utils.ts   axe-core test helpers
    contrast.ts         Contrast calculation
tests/
  a11y/                 Accessibility test suites
    *.a11y.test.tsx     axe-core component tests
    accessibility.spec.ts  Playwright E2E accessibility tests
.github/workflows/
  a11y.yml              Lighthouse CI + axe-core CI workflow
```

## Naming Conventions

| Element                | Convention              | Example                           |
| ---------------------- | ----------------------- | --------------------------------- |
| ARIA pattern names     | `kebab-case`            | `dialog-modal`, `menu-navigation` |
| Focus management hooks | `useCamelCase`          | `useFocusTrap`, `useAnnouncer`    |
| Live region IDs        | `kebab-case`            | `toast-announcer`, `error-live`   |
| Test files             | `*.a11y.test.ts`        | `Button.a11y.test.tsx`            |
| E2E test files         | `accessibility.spec.ts` | `accessibility.spec.ts`           |

## Code Conventions

### Automated Testing Configuration

**Playwright (E2E):**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

**Vitest (Unit/Component):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

```typescript
// tests/setup.ts
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);
```

**ESLint (Lint-time):**

```javascript
// eslint.config.js
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },
];
```

### Keyboard Operability

- **Tab order** follows visual order (DOM order) - no `tabindex > 0`.
- **Focus trap** in modals, drawers, dialogs - focus cycles within, `Escape` closes.
- **Skip links** at page top: "Skip to main content" -> `#main`.
- **Focus restoration** - when a dialog closes, focus returns to trigger element.

### Focus Visibility

Every interactive element must have a visible `:focus-visible` style with >= 3:1 contrast.

```css
:focus-visible {
  outline: 2px solid var(--color-focus, #005fcc);
  outline-offset: 2px;
}
```

### Color Contrast

| Content Type                          | Ratio | Examples                              |
| ------------------------------------- | ----- | ------------------------------------- |
| Normal text (< 24px / < 18.5px bold)  | 4.5:1 | Body copy, labels, links              |
| Large text (>= 24px / >= 18.5px bold) | 3:1   | Headlines, large buttons              |
| UI components (borders, icons, focus) | 3:1   | Input borders, button outlines, icons |

### ARIA Patterns

Custom widgets must follow WAI-ARIA APG 1.2 patterns exactly.

| Widget      | Required Roles/States                      | Keyboard                    |
| ----------- | ------------------------------------------ | --------------------------- |
| Button      | `role="button"`, `tabindex="0"`            | `Enter`/`Space`             |
| Checkbox    | `role="checkbox"`, `aria-checked`          | `Space`                     |
| Radio group | `role="radiogroup"`, `aria-checked`        | Arrow keys                  |
| Tab panel   | `role="tablist"`, `tab`, `tabpanel`        | Arrow keys                  |
| Menu        | `role="menu"`, `menuitem`                  | Arrow keys, `Escape`        |
| Dialog      | `role="dialog"`, `aria-modal="true"`       | `Escape` closes, focus trap |
| Slider      | `role="slider"`, `aria-valuemin/max/now`   | Arrow keys                  |
| Tree view   | `role="tree"`, `treeitem`, `aria-expanded` | Arrow keys                  |

### Screen Reader Compatibility

- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`, `<h1>` - `<h6>`, `<button>`,
  `<label for="id">`
- Every `<img>` has `alt` - descriptive for content, empty for decorative
- Complex images have `aria-describedby` pointing to full description
- Forms: `<label for="id">`, `aria-required`, `aria-invalid`, `aria-describedby` for errors
- Live regions: `aria-live="polite"` for updates, `assertive` for alerts

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### WCAG 2.2 Criteria

Target size (2.5.8): interactive targets are at least 24 by 24 CSS pixels,
with spacing compensating where size falls short:

```css
.icon-button {
  min-width: 24px;
  min-height: 24px;
  /* Spacing counts toward the 24px target where the control is smaller */
  margin: 4px;
}
```

The native `<dialog>` element provides focus trapping and `Esc` dismissal
without a custom implementation (1.4.13, 2.1.2):

```html
<dialog id="confirm-dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm action</h2>
  <p>This action cannot be undone.</p>
  <button type="submit">Confirm</button>
  <button formmethod="dialog">Cancel</button>
</dialog>

<script>
  const dlg = document.getElementById('confirm-dialog');
  dlg.showModal(); /* focus is trapped, Esc closes */
</script>
```

Authentication flows permit paste and password-manager autofill (3.3.8) -
`autocomplete` stays enabled and no copy gate blocks the field:

```html
<input type="text" name="username" autocomplete="username" />
<input type="password" name="password" autocomplete="current-password" />
```

Status updates announce through a polite live region (4.1.3):

```html
<div aria-live="polite" aria-atomic="true" id="status-region"></div>
```

## Formatting and Linting

### Automated Testing Tools

| Tool                      | Version | Purpose                        |
| ------------------------- | ------- | ------------------------------ |
| axe-core                  | 4.10+   | Automated accessibility engine |
| @axe-core/playwright      | 4.10+   | Playwright integration         |
| jest-axe                  | 8.0+    | Vitest/Jest integration        |
| eslint-plugin-jsx-a11y    | 6.10+   | Lint-time checks               |
| @testing-library/jest-dom | 6.0+    | Test assertions                |

### CI Requirements

- `axe-core` audit runs on every PR - zero violations to merge.
- `eslint-plugin-jsx-a11y` runs on every PR - zero errors to merge.
- Component tests include `axe` assertions - zero violations to merge.

## Testing

### Verification Methods

| Method               | Tool                     | Scope             |
| -------------------- | ------------------------ | ----------------- |
| Automated audit      | axe-core + Playwright    | All pages (E2E)   |
| Component tests      | axe-core + Vitest        | All components    |
| Lint-time            | eslint-plugin-jsx-a11y   | All JSX/TSX files |
| Manual keyboard      | Tab-through + focus trap | New components    |
| Manual screen reader | NVDA/VoiceOver           | New components    |
| Color contrast       | axe-core + spot check    | All pages         |
| Zoom 200%            | Browser zoom             | All pages         |

### Requirements

- Zero axe-core violations in CI (E2E + component).
- Zero eslint-plugin-jsx-a11y errors in CI.
- Manual keyboard operability checklist passes for new components.
- Manual screen reader smoke test passes (NVDA/VoiceOver).
- Color contrast meets WCAG 2.2 AA ratios.

## Build

### CI Integration

**Frontend (Lighthouse CI + axe-core):**

```yaml
# .github/workflows/a11y.yml
name: Accessibility
on: [pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: http://localhost:3000
      - run: npx playwright test tests/e2e/accessibility.spec.ts
```

## Dependencies

| Category          | Library                                                 | Purpose                  |
| ----------------- | ------------------------------------------------------- | ------------------------ |
| Automated testing | `axe-core`, `@axe-core/playwright`                      | Accessibility engine     |
| Unit testing      | `jest-axe`                                              | Vitest/Jest integration  |
| Linting           | `eslint-plugin-jsx-a11y`                                | Lint-time checks         |
| Test assertions   | `@testing-library/jest-dom`                             | Accessibility assertions |
| Test utils        | `@testing-library/react`, `@testing-library/user-event` | Component testing        |

## Verification

| Check                    | Command Or Method                                          | Applies To                 |
| ------------------------ | ---------------------------------------------------------- | -------------------------- |
| axe-core E2E audit       | `npx playwright test tests/e2e/accessibility.spec.ts`      | All pages                  |
| axe-core component tests | `npm test` (includes jest-axe)                             | All components             |
| ESLint a11y rules        | `eslint .` (includes jsx-a11y)                             | All JSX/TSX files          |
| Color contrast           | `axe-core` + manual spot check                             | All pages                  |
| Keyboard operability     | Manual tab-through + focus trap test                       | All interactive components |
| Screen reader            | NVDA/VoiceOver smoke test                                  | New components             |
| Zoom 200%                | Browser zoom test                                          | All pages                  |
| Reduced motion           | OS setting + page load                                     | All animations             |
| ARIA patterns            | APG checklist per widget                                   | Custom widgets             |
| axe-core CLI audit       | `npx @axe-core/cli http://localhost:3000`                  | Running instance           |
| pa11y CI audit           | `npx pa11y-ci --sitemap http://localhost:3000/sitemap.xml` | All pages                  |

## Definition of Done

### Correctness

- `axe-core` reports zero violations in CI (E2E + component).
- `eslint .` reports zero `jsx-a11y` errors.
- Manual keyboard operability checklist passes.
- Manual screen reader smoke test passes (NVDA/VoiceOver).
- Color contrast meets WCAG 2.2 AA ratios.

### Structure

- Semantic HTML used throughout - no `div`/`span` where native element exists.
- ARIA only where native semantics insufficient - no redundant ARIA.
- Focus management implemented for all overlays (modals, drawers, toasts).
- Skip link present at page top.

### Quality

- Design tokens define verified contrast ratios.
- Reduced motion implemented for all animations.
- No auto-playing media without controls.
- Error messages linked via `aria-describedby`.

### Hygiene

- Accessibility test files committed (`*.a11y.test.ts`, `accessibility.spec.ts`).
- No `role="presentation"` on focusable elements.
- Documentation updated when component API changes affect accessibility.

## General Principles

**Native First.** Use native HTML elements - they have built-in accessibility.

**Test Automated, Verify Manual.** axe-core catches ~50% of issues, manual testing catches the rest.

**Focus Is Sacred.** Never break keyboard navigation, always manage focus in overlays.

**Color Is Decoration.** Never rely on color alone to convey information.

**Motion Is Optional.** Respect `prefers-reduced-motion` - it's a user need, not a preference.

**Standards Over Custom.** Follow APG patterns exactly - custom patterns cause screen reader bugs.

**Accessibility Is Not a Feature.** It is a baseline quality attribute - every component ships
accessible.

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Recorded keyboard order.** Keyboard traversal follows a recorded, documented order through the
interface's logical regions - the order is stated in prose so agents and tests verify the same
sequence rather than inferring it.

**Active-region signalling.** The currently focused or active interface region is visually
highlighted in addition to the element-level focus ring, so navigation stays legible in dense
layouts.

## Sources

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) - normative standard
- [WAI-ARIA Authoring Practices Guide 1.2](https://www.w3.org/WAI/ARIA/apg/) - widget patterns
- [axe-core](https://github.com/dequelabs/axe-core) - automated testing
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) - lint-time checks
- [jest-axe](https://github.com/nickcolley/jest-axe) - unit test integration
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
  - E2E integration
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - developer guide

## Project Conventions

Project-specific values for the DOSOUND Tracker codebase.

- The recorded TAB order and section highlighting rules are owned by `SPECIFICATION.md` and
  `GUIDELINES.md`.
