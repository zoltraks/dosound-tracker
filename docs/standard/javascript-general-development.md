# JavaScript Engineering Standards

<!-- Version: 0.1.6 | Date: 2026-11-18 -->

## Purpose

This document defines the general engineering standard for JavaScript projects,
independent of runtime.

It covers coding conventions, module use, error handling, async patterns, tooling, testing,
and verification that apply in every JavaScript codebase - browser, server, or embedded.

It is written to be executed directly by an AI coding agent and to be read without effort
by a human reviewer.

Runtime-specific rules live in the category standards - the Node.js standard covers npm projects,
and the inline standard covers `node -e` probes and scratch scripts.

## Scope

A project is in scope when its source code is written in JavaScript, regardless of runtime,
packaging, or delivery target.

A project that uses TypeScript is out of scope - use the TypeScript engineering standard instead,
which builds on this one.

Runtime category standards build on this document and add only the rules specific to their runtime -
apply the matching category standard alongside this one when one exists.

## Contents

| Section                  | Line | Read when                                                 |
| ------------------------ | ---- | --------------------------------------------------------- |
| Purpose                  | 5    | Always - what the document covers                         |
| Scope                    | 19   | Always - whether the project is in scope                  |
| How To Use This Standard | 50   | Always - agent entry, precedence, and non-negotiables     |
| Agent Intake Protocol    | 100  | Always - detect the project shape before asking           |
| Documentation            | 141  | Reference - authoritative external sources                |
| Language Version         | 151  | When confirming the language or runtime floor             |
| Project Structure        | 169  | When creating or relocating project files                 |
| Naming Conventions       | 182  | When naming files, symbols, or identifiers                |
| Code Conventions         | 196  | When writing or changing code                             |
| Formatting and Linting   | 255  | When configuring or running lint and format checks        |
| Testing                  | 310  | When writing or running tests                             |
| Verification             | 323  | Always - run every applicable check before reporting done |
| Definition of Done       | 337  | Always - check before reporting the task complete         |

Read only the sections whose `Read when` entry matches the task.

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading any rule section in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches JavaScript code.

1. Read the project rules file, such as `AGENTS.md`, `README.md`, or `docs/GUIDELINES.md`,
   because a project rule overrides this standard.
2. Determine the runtime, module system, and test framework using the Agent Intake Protocol below.
3. Confirm the conclusion with the user when the repository is ambiguous or empty
4. Apply only the sections whose `Read when` entry matches the task,
   plus the matching runtime category standard when one exists
5. Run every applicable row of the Verification section
6. Check the result against the Definition of Done before reporting the task complete

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Keep this file on classic scripts"          |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | Single quotes already used everywhere        |
| 4    | This standard                             | `const` default, ESM-first module guidance   |
| 5    | General JavaScript best practice          | Anything the four sources above do not cover |

Never silently reformat existing code to match this standard.

A whole-repository reformat destroys review history and hides the real change inside noise.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **No `var`.** It has function scope and hoisting behavior that causes bugs.
- **No floating promises.** Every promise is awaited, returned, or explicitly marked `void`.
- **No `eval` or `Function` constructor.** Both are a code-injection risk.
- **No hardcoded secrets.** A secret in a committed file is a security incident.
- **Configured checks pass.** Lint, format,
  and test checks configured in the project produce no errors.
  A project with no configured checks is a gap to record, not a pass.
- **Tests pass where a suite exists.** A failing test is a defect.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the project shape.

| Signal Found In The Repository            | Inferred Decision                          | Confidence |
| ----------------------------------------- | ------------------------------------------ | ---------- |
| `package.json` with `"type": "module"`    | ESM module system                          | High       |
| `package.json` without `"type"`           | CommonJS module system                     | High       |
| `.nvmrc` or `engines.node`                | Node.js runtime (use the node standard)    | High       |
| `index.html` with `<script>` and no build | Browser vanilla (use the vanilla standard) | High       |
| `eslint.config.js` or `.eslintrc`         | ESLint configured                          | High       |
| `.prettierrc` or `prettier.config.js`     | Prettier configured                        | High       |
| `vitest.config.*` or `jest.config.*`      | Vitest or Jest test framework              | High       |
| `tsconfig.json` present                   | TypeScript project (use TS standard)       | High       |
| No manifest or entry document             | New project                                | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation rather than
running a questionnaire.

Example: "I see classic scripts loaded in order from `index.html` with no build step and
`node --check` for verification - I will follow the existing conventions.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project, ask the following questions.

| Question              | Options                            | Default If Declined  |
| --------------------- | ---------------------------------- | -------------------- |
| Which runtime?        | Browser, Node.js, both             | Node.js              |
| Which module system?  | ESM, CommonJS, classic scripts     | ESM                  |
| Which test framework? | Vitest, Node `--test`, Jest, none  | Vitest               |
| Which linter?         | ESLint 9 flat config, legacy, none | ESLint 9 flat config |

## Documentation

The following are the authoritative sources for JavaScript development.

- [ECMAScript 2024 Specification](https://tc39.es/ecma262/) - language standard
- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - language
  and API reference
- [ESLint Documentation](https://eslint.org/docs/latest/) - linter reference
- [Prettier Documentation](https://prettier.io/docs/) - formatter reference

## Language Version

Target ECMAScript 2022 or later where the confirmed runtime supports it.

Use stable features where they improve readability:

- `import`/`export` (ESM)
- Top-level `await`
- `Object.groupBy`, `Map.groupBy`
- `Promise.withResolvers`
- `ArrayBuffer.prototype.transfer`
- `RegExp` `/v` flag (set notation)

Do not use staging proposals or features behind flags in production code.

Check feature support against the actual runtime - browser globals, Node builtins,
and host APIs differ and are owned by the category standards.

## Project Structure

One `.js` file per logical unit.

Split a file when it exceeds approximately 300 lines.

Name files and directories in `kebab-case`.

No circular dependencies between modules.

Application layouts - `src/`, `test/`, manifests,
entry points - are owned by the runtime category standards.

## Naming Conventions

| Element               | Convention        | Example                         |
| --------------------- | ----------------- | ------------------------------- |
| Variables, functions  | `camelCase`       | `fetchUser`, `maxRetries`       |
| Classes               | `PascalCase`      | `UserService`, `CacheManager`   |
| Constants             | `SCREAMING_SNAKE` | `DEFAULT_TIMEOUT`, `MAX_BATCH`  |
| Private properties    | `_camelCase`      | `_cache`, `_config`             |
| Environment variables | `SCREAMING_SNAKE` | `DATABASE_URL`, `LOG_LEVEL`     |
| Files, directories    | `kebab-case`      | `user-service.js`, `api-routes` |
| Test files            | `*.test.js`       | `user-service.test.js`          |

Avoid abbreviations - `configuration` not `config`, `message` not `msg`.

## Code Conventions

### Module System

Prefer `import`/`export` (ESM) where the module system supports it.

Use explicit file extensions in relative imports: `import { foo } from './bar.js'`.

Classic scripts are valid for browser projects that ship without a build step - keep their load
order explicit and attach one symbol per file to the shared scope.

The package-level mechanics - `"type"` declarations, `require`,
`exports` maps - belong to the Node.js standard.

### Variables and Scoping

- `const` by default, `let` only when reassignment is required
- No `var` - it has function scope and hoisting behavior that causes bugs
- Block scope is the default - prefer narrow scopes

### Error Handling

- Never throw strings or primitives - always throw `Error` subclasses
- Define domain-specific error classes extending `Error` with a `code` property for
  machine-readable handling.
- Use `Result` pattern (discriminated union) for recoverable errors at module boundaries:

```javascript
// Success case
{ ok: true, value: user }
// Error case
{ ok: false, error: new NotFoundError('user', id) }
```

- Never swallow errors - either handle, propagate, or log with context

### Async Patterns

- `async`/`await` for all asynchronous code
- No floating promises - every `await` or explicit `void` with comment
- `Promise.all` for parallel independent work,
  `Promise.allSettled` when partial failure is acceptable.
- `AbortController` for cancellation - pass `signal` through all async boundaries

### Security

- No hardcoded secrets in source - use environment variables or a secret manager
- Validate input at every trust boundary
- Escape every value before it reaches `innerHTML` or a shell command

### Forbidden Patterns

| Pattern                         | Rule                 | Reason                        |
| ------------------------------- | -------------------- | ----------------------------- |
| `var`                           | Disallowed           | Function scope, hoisting bugs |
| Floating promises               | Disallowed           | Unhandled rejections          |
| `any` equivalent (no types)     | Use JSDoc `@typedef` | Type safety via documentation |
| `eval` / `Function` constructor | Disallowed           | Code injection risk           |

## Formatting and Linting

ESLint and Prettier are the default tooling where the project configures linting.

### ESLint 9 Flat Config

Place `eslint.config.js` at repository root:

```javascript
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['node_modules/', 'dist/', 'coverage/'] },
  js.configs.recommended,
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-floating-promises': 'error',
      'require-await': 'error',
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
  },
]);
```

Run `eslint .` in CI - must produce no errors.

### Prettier 3

Place `.prettierrc` at repository root:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

Run `prettier --check .` in CI - must produce no output.

Prettier is the single source of truth for formatting - no hand-formatting decisions.

Where no toolchain exists, `node --check <file>` is the minimum syntax verification for
a JavaScript change.

## Testing

### Requirements

- A configured test runner runs the suite - do not mix frameworks within one project.
- Unit test coverage >= 80% (lines, functions, branches, statements) where a suite exists.
- Every exported function has at least one test covering normal case, boundary
  values, and error paths.
- Test files named `*.test.js`, mirroring the source structure.
- Pure functions tested in isolation.

Framework selection and runner commands are owned by the runtime category standards.

## Verification

| Check                | Command Or Method                                 | Applies To       |
| -------------------- | ------------------------------------------------- | ---------------- |
| ESLint passes        | `eslint .`                                        | All JS files     |
| Prettier passes      | `prettier --check .`                              | All files        |
| Syntax check         | `node --check <file>`                             | Changed JS files |
| Tests pass           | The configured runner                             | All tests        |
| No hardcoded secrets | `grep -r -e 'password' -e 'secret' -e 'apikey' .` | All source files |
| No `var`             | `eslint . --rule 'no-var: error'`                 | All JS files     |
| No floating promises | `eslint . --rule 'no-floating-promises'`          | All JS files     |

A check whose tooling is not configured is recorded as Unavailable, never treated as a pass.

## Definition of Done

### Correctness

- Configured lint and format checks produce no errors
- The configured test suite passes
- No `var`, no floating promises, no `eval`, no hardcoded secrets

### Structure

- Files match the confirmed layout and naming conventions
- No circular dependencies
- No file exceeds ~300 lines without justification

### Quality

- JSDoc `@typedef` and `@param` on exported functions
- Comments explain reasons, not actions
- No debugging output or commented-out code remains

## Project Conventions

No project-specific conventions are recorded for this standard.
