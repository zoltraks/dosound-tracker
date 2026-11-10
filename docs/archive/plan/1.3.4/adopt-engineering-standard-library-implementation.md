# Adopt the Engineering Standard Library Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.4/adopt-engineering-standard-library.md`.

## Step by Step Implementation

**Adopt the canonical set**

Copy `typescript-react-development.md`, `typescript-electron-development.md`, `typescript-general-development.md`, `css-general-development.md`, `html-vanilla-development.md`, `accessibility-general-development.md`, `performance-budgets-development.md`, and `standard-template-development.md` from the compass canonical library. Normalize to project document rules: no `---` dividers, standard ASCII.

**Reconcile the React standard**

Move `ts-react-development.md` to `typescript-react-development.md`, replace its body with the canonical document, and append a `## Project Conventions` section carrying the mined deltas: directories-only layout and the entry-file exception, no-barrel direct imports, branded types, `useLocalStorageState` shared-key caveat, Zustand transient-version detection, hook-extraction ordering and wrapped-setter rules, empty-catch `// ignore` convention, hot-path allocation avoidance, Vite `define` watch note, TrustedHtml markdown sinks, verification loop order, and test-hygiene contracts.

**Mine deltas into adopted files**

- `typescript-electron-development.md`: `.cjs` + `createRequire` test pattern, `midi` permission policy.
- `typescript-general-development.md`: strict mode, branded types at boundaries.
- `css-general-development.md`: DOS-UI theme tokens, `kebab-case`/BEM class naming.
- `accessibility-general-development.md`: ARIA attributes, keyboard navigation order.
- `performance-budgets-development.md`: real-time audio timing budgets, worker isolation.
- `html-vanilla-development.md`: adopted unmodified, low-applicability note in the index.

**Write the index**

`docs/standard/README.md` in the compass shape: Purpose blockquote, naming convention, one line per file with applicability.

**Update references**

`GUIDELINES.md` Sources of Truth, `README.md` Engineering Standards table, `WORKFLOW.md`, and `SPECIFICATION.md` references to `standard/ts-react-development.md` are updated to `typescript-react-development.md` and the adopted set.

**Format**

Run `npx prettier --write` on all touched documents and `npx prettier --check` to verify.
