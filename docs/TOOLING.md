# Tooling Notes

This document owns the tooling and environment notes extracted from `WORKFLOW.md`. It loads when the task touches the tool, path, or environment a note covers - shell work, the development server, builds, dependency audits, code extractions, find-and-replace sweeps, and document validation.

**Install the toolchain before the baseline loop**

`node_modules` can drift from the lockfile (for example a partial install), and the verification loop then fails with errors like `prettier: command not found`. Before running the baseline loop, confirm the declared tools exist in `node_modules/.bin/` and run `npm install` when any are missing.

**npm audit fix can no-op on peer-pinned chains**

`npm audit fix` may report a fix as available yet leave the advisory in place when the vulnerable package is pinned by exact-version sibling packages (for example `@vitest/mocker` held by `vitest`, `@vitest/coverage-v8`, and `@vitest/ui`). When the declared range already admits the fixed version, upgrade every member of the chain explicitly with `npm install -D <pkg>@^<fixed-version>` and re-run `npm audit`.

**Scoped overrides pin the fix when parents cap the range**

When `npm audit` offers only a `--force` downgrade (a breaking change, for example eslint 10 to 9) and the vulnerable package's fix ships above the parents' declared ranges (`^10.x` caps while the fix is `11.0.1+`), direct upgrades cannot reach it. Add per-parent `overrides` entries in `package.json` (for example `"eslint": { "minimatch": "^11.0.5" }`), one entry per flagged chain from `npm ls <pkg>`, then `npm install` and re-audit. Dev-tooling majors are usually safe to pin this way; lint and the test suite are the regression net.

**Rewrite every specifier in a moved file, not only inbound ones**

A mass-move specifier rewrite must cover both directions: specifiers that point at moved files and the moved files' own outbound imports to unmoved targets - the latter silently break one directory level deeper. Resolve each specifier against the importer's post-move location, falling back to its pre-move location, and cover `import()`, re-exports, `vi.mock`, query-suffixed specifiers, and `new URL(..., import.meta.url)` alongside `from` clauses. `npm run typecheck` runs `tsc -b` and is the gate that catches leftovers.

**Re-validate after structural document repairs**

A transposed or stray fence can swallow the rest of a document, hiding its prose from `validate-document.py` and the format pass - the 1.4.2 GUIDELINES fence defect masked six findings behind a bogus code block. After any structural fence fix in a document, re-run the validation battery on the whole file because newly exposed lines were never checked. The `validate-document.py` and `format-table.py` scripts are borrowed from the panther-skill checkout in astra-skills - they are not repository scripts.

**Re-read files after a format sweep**

`npm run format` rewrites the whole tree, including documents a session may still be editing - an edit staged against the pre-format content fails its exact-match check. Re-read any file before editing it after a format run.

**Stopping the development server**

Terminating the shell that launched `npm run dev` can leave the Vite process alive and holding port 8008 - a restarted server then falls back to another port while the stale process keeps serving the old build. To stop the server reliably, kill the process holding the port: `netstat -ano | findstr :8008` to find the PID, then `taskkill /PID <pid> /F` - on macOS and Linux use `lsof -ti :8008 | xargs kill`. Verify the port is free before restarting.

**Verify visual changes on the dev server**

`vite preview` serves the built `dist/` bundle - source changes appear only after `npm run build` and a page reload. For visual verification of styling work (hover states, colors, layout) run `npm run dev` instead: the dev server hot-reloads CSS and component edits into the open page with no rebuild or reload.

**Check rendered styles headlessly**

A throwaway `@playwright/test` script under `work/` can drive the dev server and assert computed styles - hover an element, wait out the transition, then read `getComputedStyle`. This verifies visual CSS behavior such as border colors, shadows, and background blends without manual screenshots.

**Place an extracted hook before its earliest consumer**

When a block of `App.tsx` moves into a hook, the hook call must precede the earliest consumer of any returned value - aggregate flags such as `isNavigationSuspended` consume modal-open state far earlier than the moved handler block. Scan consumers before choosing the call position - a `TS2448 used before its declaration` error is the symptom of a hook placed too late.

**Verify packaging metadata through an unpacked build**

`npx electron-builder --dir` packages the app without producing installers, so a `build.copyright`-style manifest change can be proven end-to-end in minutes: the unpacked `release/mac-arm64/<App>.app/Contents/Info.plist` then carries `NSHumanReadableCopyright` read via `/usr/libexec/PlistBuddy`. Skipped code signing is expected - binaries ship unsigned per `DEPLOYMENT.md`. Electron-builder output accumulates in `release/` - verification bundles and stale installers alike - and `scripts/clean.sh` does not sweep it - prune `release/` by hand when a fresh packaging check matters.

**The git index can move under the session**

Nothing in the repository stages files - no hooks, no `git add` in scripts, no lint-staged config - so staged entries that appear mid-session come from the host environment. Read `git status` fresh when reporting boundary state rather than assuming the index matches the last command run.

**Check the origin file's imports after each extraction**

Every moved fragment orphans its imports in the origin file (`yaml`, `js-yaml`, utility helpers, type-only imports). Run `npm run lint` after each slice and delete the orphaned imports it reports - each one costs a build cycle if left for `tsc -b` to find.

**Rule out the environment before bisecting a regression**

A defect that reproduces identically on old and new revisions is not a code regression - bisection can only find a code change, so check the axis that differs between the reporter's environment and the verifier's first: browser, OS, output device, autoplay and permissions policy, dev server versus built bundle. The audio-playback desync of 2026-11-10 survived six commits of bisect because the cause was WebKit's suspended-context behavior, present in every revision.

**Hot-module reloads can recreate audio state mid-session**

HMR updates that touch audio-path code re-run the audio effects, which closes the `AudioContext` and constructs a fresh suspended one seconds before a manual test - the symptom (late start, dropped first notes) then mimics a regression that does not exist. After HMR churn on audio-path files, reload the page or restart the dev server before judging timing behavior.

**Untracked files survive `git stash`**

`git stash` leaves untracked files in place, so a stash-based "clean tree" lint or build check still sees newly created files. Use `git stash -u` when the check must exclude uncommitted new files, or move them aside explicitly.

**A shared working tree shares check results**

`npx prettier --check` and `npm run format` sweep the whole tree, so on a tree shared with another session they flag - or rewrite - files the other session has mid-flight. Scope the check to the change set's own paths when the tree is shared, and treat a whole-tree failure in a file the session never touched as a foreign write, not a regression in the current change set.

**Enumerate moved files explicitly, not by depth**

A specifier rewrite driven by `find <dir> -mindepth 2` silently skips files directly under a start directory, because the depth is counted relative to each start path. After a tree move that places files at different depths, enumerate the moved paths from the move list itself (or glob each destination directory) and rewrite every one - a depth-filtered enumeration can look complete while missing a whole destination folder.

**Lint the destination file right after an extraction**

Verbatim code that was clean in its origin file can warn in its new home: file-level `eslint-disable` headers do not travel with moved code, and React compiler rules judge a custom-hook file differently from the component the code came from (`set-state-in-effect`, `preserve-manual-memoization`, `exhaustive-deps`). Run `npm run lint` immediately after each extraction step and apply the documented suppression (`/* eslint-disable react-hooks/exhaustive-deps */` file header, scoped `set-state-in-effect` block) rather than discovering all warnings in the final loop.

**Pass a getter when a ref value feeds a long-lived callback**

`react-hooks/refs` errors on reading `ref.current` during render, so a hook or engine that holds audio-path state cannot accept `ym2149Ref.current` as an option. Pass a getter (`() => ref.current`) or mirror options into an internal options ref inside a `useEffect` - the value resolves at call time, which is also fresher than a render-time snapshot. The shared preview engine's `ym2149` option accepts `YM2149 | null | (() => YM2149 | null)` for this reason.

**Choose the winner deliberately when a `Map` replaces a `find`**

A plain `map.set` loop resolves duplicate keys last-wins by accident while `Array.find` resolves first-wins - two maps over the same list then diverge silently (the 1.4.4 `instrumentsById`/`instrumentLookup` split). State the intended winner and encode first-wins with `if (!map.has(key))` whenever parity with `find` is required.

**Cut extractions on the column-0 terminator, not the first `};`**

A scripted extraction that locates a function's end with `index('};')` stops at the first nested object literal's close - an indented `  };` inside the body - leaving a truncated helper and a dangling tail in the origin file. Find the closing `};` at column 0 (`\n};\n`) of the target declaration, then re-run lint plus tests on both files.

**Check for a canonical implementation before moving a helper**

A module-level helper slated for a move into `src/utils/` may already exist there under a different name - `App.tsx` carried `formatNoteKey` and `parseBaseKeyString`, exact duplicates of `formatBaseKey` and `parseBaseKey` in `src/utils/song/songFormat.ts`. Compare candidate helpers against the target module's exports first - injecting the canonical function avoids writing a duplicate.

**Proof generated records before delivery**

A generated record written in one pass can carry drafting artifacts - half-edited sentences, self-correction notes, or stray fragments left inside prose. Re-read the emitted file end to end after writing it, before presenting it as done - the specification audit for the ayumi engine shipped a self-correction note mid-paragraph that a proof pass caught.

**Scripted sweeps must cover inline literals too**

A find-and-replace driven on line-end patterns misses single-line call sites - a `windowScroll: 0,$` pass fixed every block-style `saveUiState` literal but skipped two inline calls until a grep for the unchanged pattern caught them. Enumerate both the block and inline shapes of the target, or verify leftovers after the sweep.

**Rename sweeps must exclude homonyms in other domains**

A global `compact` to `tight` sweep correctly renamed the export strategy but also rewrote the piano keyboard's compact-layout flag, a color-picker comment, and two historical changelog sentences. Enumerate the occurrences by meaning first, exclude same-spelling words in unrelated domains, and re-check historical or generated prose (changelog entries, archived records) after the sweep.

**Optional UI surface lands behind owner confirmation**

Visible controls added beyond a record's minimum scope risk being walked back - the EQ pan buttons, Song-panel chip/stereo toggles, and the OPTIMIZED strategy level all shipped in one window and were removed or consolidated on user feedback in the next. When a record's file-format or engine support is the requirement and its visible control is optional, flag the control for owner confirmation rather than shipping it on assumption.

**Renaming a persisted enum value requires reader migration**

A value stored under a `StorageKeys` key outlives the release that renames it - a user who saved `compact` still holds that string after the strategy becomes `tight`. Extend the storage `read` function to resolve each retired value to its successor, or saved preferences silently fall back to the default.

**Visual regressions can ride inside formatting commits**

A report of cramped modal radios traced to a `line-height` change bundled inside a repository-wide Prettier commit - the formatting pass carried a real behaviour change. When chasing a visual regression, bisect the CSS rule's history before reworking markup, and treat bulk-format commits as suspects rather than neutral.

**A restore request names a version's mechanism, not its look**

A request to restore the export modal's earlier spacing was first "fixed" by reverting the format grid to its previous column count - but the 1.2.8 appearance actually came from `.modal-body`'s `line-height`, and the grid revert had to be undone and the real rule restored. When the user references a previous version's appearance, diff that version's actual rules against the current ones and restore the mechanism; approximating the symptom from the visible difference lands the wrong patch.

**Static `?worker&url` imports emit the bundle, dynamic ones do not**

Under the rolldown build, `await import('module.ts?worker&url')` compiles to a plain dynamic chunk import and leaves a dangling `./name.js` reference with no emitted file - a runtime 404 that typecheck, lint, and build all miss. The static `import url from 'module.ts?worker&url'` emits the self-contained worker bundle correctly. Verify the emitted file exists in `dist/js/` whenever a worklet route is added or moved.

**A dev server shadowing the preview port fools e2e and probes**

`playwright.config.ts` sets `reuseExistingServer`, so `npm run test:e2e` and ad-hoc probes run against whatever holds port 8008 - a stale `npm run dev` serves `src/` while `vite preview` would serve `dist/`. Dev-mode resource names like `?worker&url` wrappers differ from emitted `js/` files, so path-sensitive assertions must tolerate both or the port must be freed first (see the stopping note).

**Deleting a sole comment inside an empty body leaves a no-op**

A comment sweep that removes the only content of `.then(() => { /* c */ })` or `else if (...) { /* c */ }` leaves a `.then(() => {})` dead link or trips `no-empty`. The sweep restores an accurate deliberately-empty marker or collapses the construct - a comment-only pass can still produce a code artifact that needs its own tidy.

**`erasableSyntaxOnly` rejects TypeScript parameter properties**

`tsconfig.app.json` enables `erasableSyntaxOnly`, so constructor parameter
properties (`constructor(private readonly x: T)`) fail typecheck even though
older code reads as if they were allowed. Declare the field explicitly and
assign it in the constructor body.

**BSD sed has no GNU offset ranges**

`sed -n 'FIRST,+Np'` is GNU-only syntax - the BSD sed on macOS rejects it with `invalid command code`. Compute the end line (`sed -n 'FIRST,LASTp'`) or use `awk 'NR>=F && NR<=L'` for range reads that must run on both.

**Table formatting and Prettier**

When the canonical table formatter has aligned a document's tables, run Prettier on the edited files afterwards - Prettier is the enforcing format check in this repository and may re-align tables to its own convention. `npx prettier --check` on the touched files is the gate - `npm run format` achieves the same but sweeps the whole tree (see the formatting note in `TESTING.md`). Generated documents are checked before presentation - a newly authored record, plan, or report that fails `npx prettier --check` costs a rewrite cycle, so the check runs before the file is presented as a stage product, not only on swept files.

**BSD grep has no Perl-regex flag**

`grep -P` is GNU-only - the BSD grep on macOS fails with `invalid option -- P`, and `rg` is not installed on this machine. Non-ASCII scans and pattern checks run through `node -e`, `npx prettier --check`, or the file-search tools instead of reaching for GNU-only flags.

**Offline service-worker verification serves the bundle under a nested base**

A small static file server can mount `dist/` under a path prefix, and Playwright's `context.setOffline(true)` then drives the worker's cache path - a `work/` probe verifies nested-path deployments without touching the production host. Inside the worker, `self.registration.scope` is the ground truth the precache list and the navigation fallback key on; the 2026-11-13 probe lives at `work/2026-11/2026-11-13/sw-base-probe.mjs`.

**`npm run retention` sweeps completed families deterministically**

`scripts/retention-sweep.mjs` encodes the Document Retention sweep from `WORKFLOW.md` - dry-run prints the boundary reasoning, classified candidates, link-check hits, and `.gitkeep` actions without moving anything, `--apply` executes the `git mv` moves and reconciliation, `--repoint` rewrites staying-file references to moved paths, and `--json` emits the plan as machine-readable output. Boundary-day flat files and narrative references are reported for agent judgment, never auto-decided - run the dry-run first and read its report before passing `--apply`.
