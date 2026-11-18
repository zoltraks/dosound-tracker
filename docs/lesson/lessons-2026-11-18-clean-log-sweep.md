# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Verification log deleted mid-run by clean.sh

Observed symptom: a background verification loop redirected its output to `work/2026-11/2026-11-18/verify-loop.log`. `scripts/clean.sh` ran first in the same chain and deleted the file, leaving the loop writing to an unlinked descriptor - the log was unrecoverable and the loop had to be restarted under a different name.

Root cause: the temp-residue sweep in `scripts/clean.sh` matches `*.log`, `*.tmp`, `*.bak`, and `.DS_Store` in every directory outside `node_modules` and `.git` - `work/` is not excluded, and every path under the gitignored `work/` passes the removable check.

Preventing rule: see "`clean.sh` sweeps `*.log` under `work/` too" in `docs/TOOLING.md` - name captured loop output `*.txt` or another unmatched extension.
