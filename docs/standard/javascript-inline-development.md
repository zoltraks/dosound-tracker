# JavaScript Inline Engineering Standards

<!-- Version: 0.1.4 | Date: 2026-11-08 -->

## Purpose

This document defines the engineering standard for using Node.js as an inline tool:
`node -e` one-liners, stdin-fed scripts,
and scratch `.cjs` / `.mjs` probes run from a terminal or an agent session - not for building
shippable JavaScript applications or the project's own tooling.

It covers runtime discovery, invocation forms, the module system,
crossing the boundary from another shell, encoding, errors and exit codes, credential discipline,
cross-platform differences (Windows, macOS, Linux), and scratch-probe conventions.

It is written to be executed directly by an AI coding agent and to be read without effort
by a human reviewer.

## Scope

A task is in scope when all of the following conditions hold.

- Node.js runs as a means, not the deliverable - probing a live application, measuring DOM geometry,
  reshaping a file, scanning a screenshot, driving a quick check.
- The code lives for minutes: a `-e` string, a heredoc-fed stdin script,
  or a scratch file that is deleted after use.
- The environment is a managed Windows desktop or a POSIX host - no admin rights,
  no assumption that npm can reach a registry, and a shell that may be bash, Git
  Bash, cmd, or PowerShell.

Authoring a reusable package, the project's shipped `scripts/`,
or application code is out of scope - those follow the language's product standards
(`javascript-general-development.md` and the TypeScript stack),
though every rule here still applies.

## How To Use This Standard

### Order Of Operations

- Discover the runtime before writing a command - `node --version` proves a real interpreter
  `where node` / `command -v node` shows what resolves.
- Pick the invocation form: `-e` for a single statement, stdin (`node -` or `node <<'EOF'`)
  for a short block, a `.cjs` / `.mjs` file for anything reused or longer than a screen.
- Decide the module system explicitly - `.cjs` for `require`,
  `.mjs` or `--input-type=module` for `import` and top-level `await`.
- Write probe output through an explicit encoding contract - a UTF-8 file when it is not ASCII
- Verify by exit code and evidence printed by the probe - never by absence of an error message

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Run this probe in CommonJS mode"            |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | Established scratch probe directory layout   |
| 4    | This standard                             | JavaScript inline probe rules                |
| 5    | General Node.js CLI best practice         | Anything the four sources above do not cover |

Never silently restructure existing probe scripts to match this standard.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **Multi-statement logic goes to stdin or a file.** A `-e` string that grows loops and nested
  quoting is a defect in the making - the moment the code needs a second statement,
  switch to `node -` or a script file.
- **Heredocs are single-quoted.** `node <<'EOF'` (or `cat > probe.cjs <<'EOF'`)
  prevents the host shell from expanding `$var`, `${...}`, `$(...)`,
  and backticks - JavaScript template literals use exactly those characters,
  so an unquoted heredoc silently corrupts the script.
- **Choose the module system by file extension.** `.cjs` always allows `require`,
  `.mjs` always allows `import` and top-level `await`,
  regardless of the enclosing package's `type` field - guessing `.js` makes the probe depend on
  whichever `package.json` it lands near.
- **Never interpolate JavaScript source through another shell's quoting.** Inside double quotes the
  host shell expands `$`, backticks, and `$(...)` before Node sees the string - the code that
  arrives is not the code that was written.
- **A probe prints evidence.** Observed values,
  not pass/fail - the reader verifies the claim from the printed data.
- **No secrets on stdout.** Credentials are read from the environment file into variables and used -
  their values never appear in probe output, logs, or screenshots' copied filenames.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the probe environment.

| Signal Found In The Repository         | Inferred Decision                 | Confidence |
| -------------------------------------- | --------------------------------- | ---------- |
| `package.json` with `"type": "module"` | Default to ESM probe execution    | High       |
| Scratch files with `.mjs` extension    | Explicit ESM scratch scripts      | High       |
| Scratch files with `.cjs` extension    | Explicit CommonJS scratch scripts | High       |
| Presence of a `.env` file              | Secrets must be parsed safely     | High       |
| No Node.js tooling at all              | Fresh probe environment           | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation rather than
running a questionnaire.

Example: "I see `"type": "module"` in `package.json` and `.mjs` probes under `work/<task>/`.

I will write ESM probes and keep them in that directory.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new probe workspace,
ask the following questions.

| Question                 | Options                          | Default If Declined   |
| ------------------------ | -------------------------------- | --------------------- |
| Which module system?     | ESM (`.mjs`), CommonJS (`.cjs`)  | ESM                   |
| Scratch probe directory? | `work/<task>/`, other gitignored | `work/<task>/`        |
| Secrets involved?        | `.env` parsing, environment only | Environment variables |

## Documentation

Consult these sources rather than guessing at runtime behavior.

- [Node.js command-line API](https://nodejs.org/api/cli.html) - `-e` / `--eval`, `-` (stdin),
  `-p` / `--print`, `--input-type`, `--run`, `NODE_OPTIONS`, exit-code semantics.
- [ES modules](https://nodejs.org/api/esm.html) - the `.mjs` / `.cjs` contract, `createRequire`,
  top-level `await`, `import` of JSON.
- [Modules: CommonJS](https://nodejs.org/api/modules.html) - `require` resolution,
  `require.main`, `__dirname`.
- [process](https://nodejs.org/api/process.html) - `process.argv`, `process.env`,
  `process.exitCode`, `process.platform`, signals.
- [child_process](https://nodejs.org/api/child_process.html) - when the probe itself
  must run other tools.
- [cross-platform Node.js guide](https://github.com/ehmicky/cross-platform-node-guide) - the catalog
  of Windows/POSIX differences.

## Language Version

Inline probes target Node.js 22.12.0 LTS or later.

The interpreter version is verified with `node --version` before any probe runs.

On runtime upgrade, re-validate all rules against release notes before writing code.

## Project Structure

Short-lived probe scripts live under the gitignored working directory:

```plaintext
repo-root/
  work/
    scripts/              # Short-lived scratch probe scripts (*.tmp.mjs, *.tmp.cjs)
```

A probe never lands in `src/` or a tracked directory - a stray probe file committed to the
repository is a defect.

## Naming Conventions

| Element              | Convention                              | Example                   |
| -------------------- | --------------------------------------- | ------------------------- |
| Scratch probe file   | `kebab-case` + `.tmp.mjs` or `.tmp.cjs` | `check-session.tmp.mjs`   |
| Probe function       | `camelCase` verb phrase                 | `measureLayout`           |
| Environment variable | `UPPER_SNAKE_CASE`                      | `AUTH_USER`, `AUTH_TOKEN` |
| Output artifact      | `kebab-case` in the scratch directory   | `result.json`             |

## Code Conventions

### Picking The Runtime

- `node --version` is the discovery check - it must print a version, not merely resolve a path
  `command -v node` (POSIX/Git Bash) or `where node` (cmd) only proves a file exists.
- `nodejs` is an alias on some Linux distributions and missing elsewhere - write `node`.
- Version managers (nvm, fnm, volta) install per-shell - a manager shim that resolves in an
  interactive session may be absent in a spawned process. The `--version` check is the contract.
- A probe that needs a project-local tool (`npx eslint`, `node_modules/.bin/vite`)
  runs it through `npx` or the package's npm script - `.bin` shims are `.cmd` files on Windows and
  fail under POSIX invocation, `npx` hides the difference.

### Invocation Forms

| Form                         | Use For                                               |
| ---------------------------- | ----------------------------------------------------- |
| `node -e "stmt"` / `--eval`  | A single statement or short expression                |
| `node -p "expr"` / `--print` | Evaluating one expression and printing the result     |
| `node -` or `node < script`  | A multi-line block fed by heredoc or pipe             |
| `node probe.cjs`             | Anything reused or longer than a screen - the default |
| `node --input-type=module -` | ESM or top-level `await` from stdin                   |
| `node --run <script>`        | A package.json script without `npm run`               |

- `-e` takes one string - keep it to a single statement. If the string starts with `-`,
  pass it as `--eval=<script>` so it is parsed as the flag's value.
- `node -` reads the program from stdin, and arguments after `-` land in `process.argv`
  (`node - alpha beta` -> `argv[2]` / `argv[3]`). A bare `node` with piped stdin also evaluates it,
  but the explicit `-` documents the intent.
- `--input-type=module` applies only to `--eval` and stdin - it does not change how a file on disk
  is interpreted. A file's module system comes from its extension and the nearest `package.json`.
- Top-level `await` requires module context - wrap the probe in an async IIFE or
  `--input-type=module`. A bare `await` in CJS is a syntax error reported at the
  load, not the call site.
- `node --run x` resolves only inside a package - for a scratch probe outside a package,
  `node probe.cjs` is the form.

### Called From Another Shell

When the driving shell is bash (or any POSIX shell), the quote layer is double:
the host shell parses first, Node second.

- Inside double quotes, bash expands `$var`, `${...}`, `$(...)`,
  and backticks before Node sees the code - a template literal or `process.env` reference in `-e` is
  silently rewritten. Single quotes are literal in bash:
  `node -e 'console.log(process.env.HOME)'` arrives intact.
- The single-quoted heredoc is the safe authoring form for multi-line code:
  `cat > probe.cjs <<'EOF'` writes the script verbatim,
  then `node probe.cjs` runs it - preferred over `node - <<'EOF'` when the probe may need to run
  more than once (the file survives for reruns and stack traces carry line numbers).
- Under Git Bash on Windows `nul` is a literal filename, not the null device - `2>nul`, `-o NUL`,
  and `> NUL` create a stray `nul` file or fail silently - use `2>/dev/null`, omit the output,
  or write a real file.
- A pipeline's exit code is its last command's - `probe | head` reports `head`'s status - read
  `${PIPESTATUS[0]}` for the real result.
- Windows paths: forward slashes work everywhere Node runs - pass `'C:/a/b'`,
  never an unquoted `C:\a\b` whose backslashes the shell eats as escapes. Inside the script,
  `path.join` / `path.resolve` over string surgery.
- cmd.exe does not understand single quotes - `'...'` arrives verbatim including the quotes
  PowerShell strips both quote kinds but re-parses `$` inside double quotes - a `-e` string that
  must run under either is a file, not a string.

### Module System And Project Dependencies

- `.cjs` means CommonJS and `.mjs` means ESM no matter which `package.json` the scratch directory
  sits under - pick the extension for the syntax the probe needs.
- A scratch probe may reuse the project's installed dependencies by requiring them
  through the project root:
  `require("../../<pkg>/node_modules/playwright-core")` - installed packages are already vetted.
  Do not `npm install` anything for a probe.
- Inside an `.mjs` file `require` does not exist - import CJS packages with `import pkg from "pkg"`
  or build one with `createRequire(import.meta.url)`.
- `process.cwd()` is wherever the shell ran the probe,
  not the script's directory - anchor file access to `__dirname` (CJS)
  or `new URL(".", import.meta.url)` (ESM), or pass absolute paths.

### Reading `.env` Without Printing Secrets

A probe that needs credentials reads them from the environment file into variables and
never echoes the values.

```js
const fs = require('fs');
const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
// env.AUTH_USER is used, never printed.
```

- Do not `console.log(env)` - one dump writes every secret to the transcript
  Print derived facts ("login succeeded") not values.
- `process.env` in the probe inherits the shell's environment - setting `VAR=x node probe.cjs` works
  on POSIX shells and Git Bash but not in cmd or PowerShell. The `.env` file is the portable source.
- A probe file containing a literal credential is a defect even in a scratch directory - scratch
  outlives memory of it.

### Encoding And The Console

- The Windows console defaults to an OEM/ANSI codepage - `console.log` of text outside it mangles or
  throws on some encodings - write the payload to a UTF-8 file and read the file back
  when it is not ASCII.
- `fs.writeFileSync(path, text)` writes UTF-8 without BOM - the contract other tools expect
- Redirected stdout inherits no console codepage but downstream parsers may assume UTF-8 - emit
  ASCII or write files, and never trust that a terminal showed the real bytes.
- `JSON.stringify(obj, null, 1)` is the evidence format - structured, printable, and diffable

### Errors And Exit Codes

- An uncaught exception prints a stack to stderr and exits `1` - stack text is diagnostics,
  not the contract - the exit code is.
- In Node 15+ an unhandled promise rejection also exits nonzero - an `async` probe's silent failure
  is not silent, but its exit still needs checking by the caller.
- `process.exitCode = 1` is preferred over `process.exit(1)` - it lets stdout flush
  Can truncate a just-written payload.
- A probe that must signal its own verdict exits nonzero with the reason on stderr (`console.error`)
  so stdout stays parseable as data.
- Always close what you open - a `await browser.close()` missed keeps the process alive and the
  probe hangs instead of reporting.
- `try/catch` around `require` and launch calls lets a probe degrade:
  try `msedge`, then `chrome`, then bundled - print which one ran as evidence.

### Cross-Platform Notes

- `process.platform` is `"win32"`, `"darwin"`, or `"linux"` - branch on it,
  never on `os.type()` strings parsed from uname-style output.
- Command-scoped environment variables (`VAR=x node probe`)
  are POSIX syntax - cmd needs `set VAR=x` as a separate statement and PowerShell needs
  `$env:VAR="x"`. The portable form is a `.env` file read by the probe or a shell-specific wrapper.
- `process.env.HOME` is POSIX-only - use `os.homedir()`, `os.tmpdir()` for temp files,
  and `fs.mkdtempSync` for per-run directories.
- Line endings: read with `/\r?\n/` splits,
  write `\n` unless the consumer demands CRLF - Node does not translate,
  so the file keeps what you give it.
- Executable lookup differs - POSIX runs `./tool`, Windows needs `tool.cmd` / `tool.exe` on `PATH`.
  `npx <pkg>` hides this for installed packages.
- Ctrl+C handling: `SIGINT` fires everywhere
  `SIGTERM` has no Windows equivalent - a probe that needs cleanup should finish promptly rather
  than install signal handlers.
- Reserved names on Windows (`nul`, `con`, `aux`, `prn`, `com1-9`, `lpt1-9`)
  cannot be created as files - a filename built from input can silently fail.
  Prefer names under a known scratch directory.
- Git Bash translates POSIX-style arguments (`/c/path`)
  differently than cmd does - pass Windows paths to Node quoted or with forward slashes.

### Managed-Desktop Constraints

- Reuse what is already installed - `npm install` may be offline, policy-blocked,
  or simply unnecessary because the project's `node_modules` already carries the
  package a probe needs.
- No admin rights - probes stay inside user-writable paths
- The Node version follows the project's pin when one exists - a probe that relies on newer syntax
  reports `process.version` as evidence.

### Scratch Probe Conventions

- Scratch probes live in a gitignored working directory,
  one named subdirectory per task (`work/<task>/probe.cjs`)
  - they are deleted after use and never referenced by shipped code
- A probe is disposable: optimize for fast writing and clear output,
  not structure - but keep the non-negotiable rules (they exist because probes are
  where shortcuts hurt).
- Never put credentials, tokens, or user data into a probe - scripts in a scratch directory
  outlive memory of them.
- A probe that will run more than once gets a file, not a `-e` repeat
- Before reporting done, `git status` shows no stray artifacts outside the scratch directory

### When To Reach For Node

- Node is the right probe runtime when the target is JavaScript-shaped:
  a running web application, a JSON document, a Playwright-driven browser,
  or anything already reachable through the project's `node_modules`.
- For file reshaping and structure diffing, Python's stdlib (see `python-inline-development.md`)
  and shell utilities are equally valid - pick whichever is already proven on the machine.
- A probe reaching for the same operation a third time is a utility or script request - write
  implementation code instead.

### Common Operations

Generalized recipes for the operations agent sessions script most often.

Each is a complete probe - copy it, fill the placeholders, run it through `node probe.cjs`.

**Authenticated Page Probe With playwright-core**

```js
const { chromium } = require('../../<pkg>/node_modules/playwright-core');
const fs = require('fs');
const env = Object.fromEntries(
  fs
    .readFileSync('../../<pkg>/.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
(async () => {
  let browser;
  for (const opt of [{ channel: 'msedge' }, { channel: 'chrome' }, {}]) {
    try {
      browser = await chromium.launch(opt);
      break;
    } catch {}
  }
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  if (await page.locator('input[type="password"]').count()) {
    await page
      .locator('form input[type="text"], form input:not([type])')
      .first()
      .fill(env.AUTH_USER);
    await page.locator('input[type="password"]').first().fill(env.AUTH_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
  }
  console.log(JSON.stringify({ url: page.url() }));
  await browser.close();
})();
```

The `for` loop degrades across installed browsers.

`break` on the first that launches.

`networkidle` plus an explicit `waitForTimeout` covers SPAs whose route load is a
fetch, not a navigation.

**Measure Computed Style Or Geometry In A Page**

```js
const info = await page.locator('.target').evaluate((el) => {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el, '::after');
  return { x: r.x, y: r.y, w: r.width, border: cs.border };
});
console.log(JSON.stringify(info, null, 1));
```

`getComputedStyle(el, "::after")` inspects pseudo-elements a `boundingBox` cannot reach.

Pseudo-content that is a sibling, not a descendant,
is found by DOM traversal (`parentElement.querySelector`), not by drilling into the element itself.

**Screenshot For Pixel-Level Review**

```js
const box = await page.locator('.target').boundingBox();
await page.screenshot({
  path: 'probe.png',
  clip: { x: box.x - 10, y: box.y - 10, width: box.width + 20, height: box.height + 20 },
});
```

`deviceScaleFactor` on the context controls the zoom of the captured PNG.

`clip` keeps the artifact small enough to read back.

Screenshots are artifacts - write them under the scratch directory,
and copy out only the one that must be viewed.

**Pixel-Scan A PNG**

```js
const { PNG } = require('../../<pkg>/node_modules/pngjs');
const png = PNG.sync.read(fs.readFileSync('probe.png'));
const px = (x, y) => {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
};
```

DOM geometry can lie about where a line is painted - fractional translate and sub-pixel borders
render differently from `getBoundingClientRect`.

The pixel buffer is the ground truth for antialiased edges.

**Extract Fields From JSON On Stdin**

```js
let text = '';
for await (const chunk of process.stdin) text += chunk;
const data = JSON.parse(text);
console.log(JSON.stringify(data.result.rows.length));
```

**Parse `process.argv` For Probe Parameters**

```js
const [, , target, limit = '10'] = process.argv;
console.log(JSON.stringify({ target, limit: Number(limit) }));
```

Parameters keep a probe reusable without editing the file - pass them after the filename
(`node probe.cjs <target> 20`), or after `-` for stdin-fed scripts.

**Time A Command**

```js
const { execSync } = require('child_process');
const times = [];
for (let i = 0; i < 5; i++) {
  const start = performance.now();
  execSync('node --version', { stdio: 'ignore' });
  times.push(Math.round(performance.now() - start));
}
console.log(JSON.stringify({ times, min: Math.min(...times) }));
```

`performance.now()` is monotonic - `Date.now()` jumps with the clock and corrupts deltas.

## Formatting and Linting

A scratch probe follows the project's ESLint or Biome configuration where one exists.

`node --check` is the minimum syntax gate for every probe file before it runs.

## Testing

A probe is verified by execution, not by review alone.

- Run the probe once against mock or read-only data before running it against a live target
- Assert the exit code - `0` on success, nonzero on the documented failure path
- Assert that stdout carries only the evidence payload and stderr carries only diagnostics

## Build

Inline probes have no build step - Node.js executes the source directly.

Cleanup is the post-session build obligation:

remove `work/<task>/*.tmp.mjs` and `*.tmp.cjs` files when the probe work is done.

## Dependencies

Probes prefer built-in Node.js modules and avoid external packages for quick checks.

| Category       | Module                               | Purpose                                  |
| -------------- | ------------------------------------ | ---------------------------------------- |
| File system    | `node:fs`                            | Reading `.env` and fixture files         |
| Paths          | `node:path`                          | Cross-platform path joining              |
| Processes      | `node:child_process`                 | Spawning other tools from a probe        |
| Utilities      | `node:util`                          | `promisify`, formatting helpers          |
| Browser probes | `playwright-core` (existing install) | Authenticated page and screenshot probes |

An external dependency is justified only when a built-in module cannot express the operation,
and the import resolves from an installed project package - never a fresh `npm install` for a probe.

## Verification

| Check                     | Command Or Method                                                                   | Applies To        |
| ------------------------- | ----------------------------------------------------------------------------------- | ----------------- |
| Runtime resolves          | `node --version` prints a version                                                   | Every session     |
| Probe syntax valid        | `node --check work/<task>/*.tmp.mjs`                                                | All probe scripts |
| Probe file byte-identical | Re-read the written probe file before running                                       | Every probe file  |
| Module system declared    | `.mjs`/`.cjs` extension or `--input-type` flag used                                 | Every probe file  |
| No `process.env` dump     | `grep -r -n "console\.log(process\.env)" work/<task>/` must be empty                | Security audit    |
| No leaked tokens          | `grep -r -e AUTH_SECRET -e AUTH_PASSWORD -e PRIVATE_KEY work/<task>/` must be empty | Security audit    |
| No stray probe files      | `git status --short` shows nothing outside `work/`                                  | Post-session      |
| Cleanup after session     | `rm -f work/<task>/*.tmp.mjs`                                                       | Post-session      |

## Definition of Done

### Correctness

- The runtime was verified (`node --version` ran and reported a version).
- No JavaScript source passed through another shell's double quotes or an unquoted heredoc
- The failure path exits nonzero with the reason on stderr

### Structure

- Probe files live under the gitignored scratch directory, never in tracked source
- Multi-statement logic went through stdin or a file, not a `-e` string

### Quality

- A probe prints evidence - observed values, not pass/fail
- The module system was chosen explicitly by extension or flag

### Hygiene

- No credentials appear in probe source, output, or artifacts
- Scratch files were removed when the session's probe work finished
- Non-ASCII output survived intact - file or explicit UTF-8 contract

## General Principles

**Never Print Secrets.** Credentials load into memory and are used - they never reach stdout,
stderr, logs, or screenshots.

**Single-Quote Heredocs.** `<<'EOF'` passes the script byte-identical - an unquoted heredoc lets the
shell corrupt template literals before Node sees them.

**Explicit Module Extension.** `.mjs` means ESM and `.cjs` means CommonJS everywhere,
regardless of the nearest `package.json`.

**Evidence Over Exit Silence.** A probe proves its claim by printing observed values - an absent
error proves nothing.

**One Statement For `-e`.** The moment logic needs a second statement, it moves to stdin or a file.

**Clean Up Scratch Files.** A probe is disposable - it leaves no files outside the
gitignored working directory.

**Verify The Interpreter.** `node --version` runs before the probe - a resolved path is
not a working runtime.

**Fail Loud, Exit Nonzero.** A failed probe says why on stderr and returns a nonzero code - a zero
exit is a success claim.

## Sources

The following authoritative references support the rules in this document.

- [Node.js Command-line API](https://nodejs.org/api/cli.html) - `-e`, `-`, `--input-type`, `--run`,
  `NODE_OPTIONS`, and exit semantics.
- [Node.js ES Modules](https://nodejs.org/api/esm.html) - the `.mjs` / `.cjs` extension contract
  and `createRequire`.
- [Node.js process](https://nodejs.org/api/process.html) - `argv`, `env`, `exitCode`, `platform`,
  and signal behavior.
- [cross-platform Node.js guide](https://github.com/ehmicky/cross-platform-node-guide) - environment
  variables, paths, line endings, and shell differences across Windows and POSIX.
- [PowerShell Inline Engineering Standards](powershell-inline-development.md) - the sibling document
  whose structure this standard mirrors.
- [Python Inline Engineering Standards](python-inline-development.md) - the sibling
  document for Python probes.
