# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Preview Server Hides Source Changes

Observed symptom: visual changes did not appear on `http://127.0.0.1:8008/` until a manual rebuild and page reload, confusing styling verification.

Root cause: `vite preview` serves the built `dist/` bundle, not the working tree - only `npm run dev` hot-reloads edits.

Preventing rule: see "Verify visual changes on the dev server" in `WORKFLOW.md`.

### Style Changes Verified Only by Eye

Observed symptom: hover colors, shadows, and background blends were confirmed only by asking the user to look at the running app.

Root cause: no recorded way to assert rendered styles - a throwaway Playwright script against the dev server reads `getComputedStyle` after hover and gives an objective check.

Preventing rule: see "Check rendered styles headlessly" in `WORKFLOW.md`.

### Port-Kill Instructions Were Windows-Only

Observed symptom: the recorded dev-server kill recipe named `netstat` and `taskkill`, which do not exist on macOS.

Root cause: the tooling note was written for one platform; `lsof -ti :8008 | xargs kill` is the POSIX equivalent.

Preventing rule: see "Stopping the development server" in `WORKFLOW.md`.

### Border-Color Rule Without a Border

Observed symptom: `.octave-selection.active` set `border-bottom-color` yet no border appeared - the base rule declared no border-bottom at all.

Root cause: a color-only declaration against a nonexistent border is dead code; a transparent placeholder border in the base rule made both the active and the new hover color render.

Preventing rule: see "Project Conventions" in `standard/css-general-development.md`.

### Table Separator Wording Mismatched the Files

Observed symptom: the "`W + 2` contiguous hyphens" wording read as ambiguous against the repository's actual separator rows.

Root cause: the rule counted the padded inner width rather than the hyphen run; the files use `W` hyphens between the standard one-space delimiters.

Preventing rule: see "Markdown Tables" in `GUIDELINES.md`.
