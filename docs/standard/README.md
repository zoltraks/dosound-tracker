# Engineering-Standard Library

## Purpose

> **Scope:** Index of the engineering-standard documents, one per technology stack
> or application kind, plus the standard-authoring template
> **Key items:** naming convention, the full file list, selection entry point

Files are named `<language-or-domain>-<category>-development.md` and are discovered
by that convention. Each adopted document carries a `Project Conventions` section
where project-specific deltas are recorded; canonical content is kept unmodified
so future syncs stay diffable. The repository-wide format sweep restyles vendored
files (spaced table separators, code reflows), so a byte-level diff against the
canonical library is always noisy - sync checks compare content with `diff -w -B`
or by section, never raw bytes.

- **`accessibility-general-development.md`** - Accessibility, general. Adopted, project deltas.
- **`typescript-audio-development.md`** - TypeScript, real-time audio. Adopted, project deltas.
- **`css-general-development.md`** - CSS, general. Adopted, project deltas.
- **`html-vanilla-development.md`** - HTML, vanilla. Adopted unmodified; low applicability to this React project.
- **`performance-budgets-development.md`** - Performance budgets, cross-stack. Adopted, project deltas.
- **`standard-template-development.md`** - The standard-authoring template.
- **`typescript-electron-development.md`** - TypeScript, Electron. Adopted, project deltas.
- **`typescript-general-development.md`** - TypeScript, general. Adopted, project deltas.
- **`typescript-react-development.md`** - TypeScript, React. Canonical plus project conventions.
