# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

### Format Step Sweeps Restricted Directories

Observed symptom: the pre-bump verification loop rewrote files in `docs/report/`, a restricted directory the agent had not been asked to touch.

Root cause: `npm run format` runs Prettier on the whole tree; restricted-directory rules govern reads and edits but not the formatter.

Preventing rule: see "Clean Build Definition" in `TESTING.md`.

### Vite Config Dependencies Must Be Imports

Observed symptom: after `npm run bump` rewrote `package.json`, the running dev server kept serving the old `__APP_VERSION__` and the About modal showed the previous version.

Root cause: the define value was loaded with `readFileSync`, which Vite does not register as a watched config dependency. In dev mode `define` constants are globals injected through `/@vite/env`; the served module keeps the placeholder literally, so grepping transformed output shows no replacement.

Preventing rule: see "Bundler Configuration" in `docs/standard/ts-react-development.md`.

### Killing the Launch Shell Orphans the Dev Server

Observed symptom: after terminating the launching shell, port 8008 stayed bound and a restarted server fell back to port 8009 while the stale process kept serving the old build.

Root cause: on Windows the Vite child process survives termination of the wrapper shell.

Preventing rule: see "Tooling Notes" in `WORKFLOW.md`.

### Table Formatter and Prettier Disagree

Observed symptom: after the canonical table formatter aligned the edited documents, `npx prettier --check` still flagged four files and required a `prettier --write` pass to converge.

Root cause: the table formatter and Prettier apply different table conventions; Prettier is the enforcing format check in this repository.

Preventing rule: see "Tooling Notes" in `WORKFLOW.md`.
