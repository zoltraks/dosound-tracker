# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### electron-builder's default deb dependencies miss the t64 rename

Observed symptom: the stock `deb` dependency list names `libgtk-3-0` and `libatspi2.0-0`, packages that no longer exist on Ubuntu 24.04 and Linux Mint 22.x - `apt-cache policy` shows no candidate for either name, so a default-built `.deb` would fail dependency resolution on the current release family.

Root cause: electron-builder ships a static `deb` depends list that predates the 64-bit-time_t package rename; the repositories now carry `libgtk-3-0t64` and `libatspi2.0-0t64` instead. The same list also omits `libasound2`, which the Electron binary links at runtime, and `libc6`, which lintian requires declared.

Preventing rule: see the Debian Package section in `docs/DEPLOYMENT.md` - `build.deb.depends` declares the full list with `t64 | legacy` alternation so one package resolves on both naming schemes, and `lintian` plus `apt-get install --simulate` verify the result on the target host.
