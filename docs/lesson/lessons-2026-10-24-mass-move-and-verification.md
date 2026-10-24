# Session Findings - Mass Move and Verification Gates

Durable lessons recorded when a session ends.

### Move Rewrites Cover Both Directions

Observed symptom: a specifier rewrite for the domain-subfolder reorganization fixed only imports pointing at moved files; the moved files' own imports of unmoved modules broke with TS2307 errors.

Root cause: the rewriter keyed rewrites on the target being in the move map, ignoring that a moved importer's relative paths re-root one level deeper.

Preventing rule: see "Rewrite every specifier in a moved file, not only inbound ones" in `WORKFLOW.md`.

### The Real Type Gate Is the Build

Observed symptom: `npm run typecheck` reported clean while broken imports existed; `npx tsc -b` caught them.

Root cause: the root `tsconfig.json` is solution-style (`files: []`), so `tsc --noEmit` checks nothing - already recorded in `TESTING.md`.

Preventing rule: covered by "Type checking" in `TESTING.md` - no new rule needed.

### Scripted Edits Need Fresh Text

Observed symptom: an exact-match doc replace failed because the same file had been renamed-referenced earlier in the session.

Root cause: the script targeted text captured before another edit pass rewrote it - a variant of the recorded format-sweep lesson.

Preventing rule: covered by "Re-read files after a format sweep" in `WORKFLOW.md`, extended in spirit to any scripted sweep - re-read before exact-match edits.

### Single-File Directories Are Accepted

Observed symptom: the directories-only rule produced single-file directories (`utils/timer/`, `utils/log/`); the user later questioned a remaining single-file directory (`stores/`).

Root cause: strict domain grouping forces singletons; the tension was surfaced and resolved by recording them as allowed and dissolving `stores/` into `hooks/ui/` instead.

Preventing rule: covered by "Source Directory Structure" in `SPECIFICATION.md` - no new rule needed.
