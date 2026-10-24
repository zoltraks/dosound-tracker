# TypeScript Engineering Standards

<!-- Version: 0.1.4 | Date: 2026-10-17 -->

## Purpose

This document defines the engineering standard for TypeScript projects running on Node.js or in the
browser.

It covers the language version, compiler configuration, project layout, coding conventions, tooling,
testing, and build.

It builds on the JavaScript engineering standard and adds only the TypeScript-specific rules.

It is written to be executed directly by an AI coding agent and to be read without effort by a human
reviewer.

## Scope

A project is in scope when all of the following conditions hold.

- The project is written in TypeScript with strict mode enabled.
- The project targets Node.js 22 LTS for tooling and backend, or modern browsers for frontend.
- The build entry point is `tsc` (backend) or Vite/esbuild (frontend).

A project that uses JavaScript instead of TypeScript is out of scope - use the JavaScript
engineering standard.

A project that uses a different compile-to-JS language (e.g., CoffeeScript, PureScript)
is out of scope.

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches TypeScript code.

1. Read the project rules file, such as `AGENTS.md`, `README.md`, or `docs/GUIDELINES.md`,
   because a project rule overrides this standard.
2. Read the JavaScript engineering standard for shared runtime, tooling, and dependency rules.
3. Determine the TypeScript version, build tool,
   and project kind using the Agent Intake Protocol below.
4. Confirm the conclusion with the user when the repository is ambiguous or empty.
5. Apply the sections of this standard that match the confirmed project kind.
6. Run every applicable row of the Verification section.
7. Check the result against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Keep this project on TypeScript 5.8"        |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | `export function` already used everywhere    |
| 4    | This standard                             | `export function` over `React.FC`            |
| 5    | General TypeScript best practice          | Anything the four sources above do not cover |

Never silently reformat existing code to match this standard.

A whole-repository reformat destroys review history and hides the real change inside noise.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **Strict mode is enabled.** `tsconfig.json` has `"strict": true`.
  A project with `strict: false` is a defect.
- **No `any` type.** Use `unknown` when the type is genuinely unknown. An `any` type is a defect.
- **No non-null assertions without reason.** `!` requires a `// REASON:` comment.
  A non-null assertion without reason is a defect.
- **No `@ts-ignore` without reason.** `@ts-ignore` requires a `// REASON:` comment.
  A suppression without reason is a defect.
- **No `as` type assertions on external data.** External data is untyped at runtime - use a type
  guard or runtime validator (Zod). An unchecked `as` on external data is a defect.
- **`tsc --noEmit` produces no errors.** A TypeScript error is a defect.
- **`eslint .` produces no errors.** An ESLint error is a defect.
- **`prettier --check .` produces no output.** A formatting deviation is a defect.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the project shape.

| Signal Found In The Repository            | Inferred Decision             | Confidence |
| ----------------------------------------- | ----------------------------- | ---------- |
| `tsconfig.json` with `"strict": true`     | Strict mode enabled           | High       |
| `tsconfig.json` with `references`         | Project references in use     | High       |
| `vite.config.ts` present                  | Vite build tool (frontend)    | High       |
| `esbuild` in `package.json`               | esbuild (backend or frontend) | High       |
| `vitest.config.ts` present                | Vitest test framework         | High       |
| `playwright.config.ts` present            | Playwright E2E testing        | High       |
| `tailwindcss` in `package.json`           | Tailwind CSS                  | High       |
| `zustand` in `package.json`               | Zustand state management      | High       |
| `@tanstack/react-query` in `package.json` | TanStack Query server state   | High       |
| `react` in `package.json`                 | React frontend                | High       |
| No `package.json`                         | New project                   | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation rather than
running a questionnaire.

Example: "I see TypeScript 5.9.2, strict mode, Vite for frontend build, Vitest for testing,
React 19, Tailwind CSS 4, Zustand, TanStack Query.

I will follow the existing conventions.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project, ask the following questions.

| Question                  | Options                            | Default If Declined |
| ------------------------- | ---------------------------------- | ------------------- |
| Which TypeScript version? | 5.9, 5.8                           | 5.9                 |
| Which build tool?         | Vite (frontend), esbuild (backend) | Vite                |
| Which test framework?     | Vitest, Jest                       | Vitest              |
| Frontend framework?       | React, none (backend only)         | React               |

## Documentation

The following are the authoritative sources for TypeScript development.

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - official
  reference
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig) - compiler options
- [TypeScript 5.9 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)
  - version changes
- [typescript-eslint](https://typescript-eslint.io/) - linting rules
- The general JavaScript engineering standard - base runtime and tooling rules

## Language Version

The project targets **TypeScript 5.9.2** with **Node.js 22.12.0 LTS** for tooling.

TypeScript 5.9 was released June 2025.

TypeScript 5.8 is the previous minor version.

Pin the exact version in `package.json` devDependencies: `"typescript": "5.9.2"`.

On TypeScript upgrade, re-validate all rules against release notes before writing code.

### Strict Mode Configuration

Every `tsconfig.json` must enable:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

These options are non-negotiable - they catch real bugs at compile time.

### Core Technologies

- **TypeScript 5.9.2**: Language and compiler
- **Node.js 22.12.0 LTS**: Tooling runtime (per JavaScript standard)
- **Vite 7** or **esbuild**: Build tool (Vite for frontend, esbuild for backend)
- **Vitest**: Test runner
- **ESLint 9** with `typescript-eslint`: Linting
- **Prettier 3**: Formatting (single source of truth)
- **Zod**: Runtime validation at trust boundaries
- **OpenTelemetry JS SDK**: Observability

Dependencies are added only when the need is concrete and the standard library is significantly more
complex.

## Project Structure

### Project References (Required)

Use TypeScript project references for build performance and separation.

```
tsconfig.json                    # Root config with references
tsconfig.app.json                # Application code (frontend or backend)
tsconfig.node.json               # Build scripts, config files
tsconfig.test.json               # Test configuration (optional)
```

Root `tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

### Application Config (`tsconfig.app.json`)

Frontend (Vite + React):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client", "vitest/globals", "node"]
  },
  "include": ["src", "test"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Backend (Node.js + esbuild):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["node"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Build Scripts Config (`tsconfig.node.json`)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": false,
    "types": ["node"]
  },
  "include": [
    "vite.config.ts",
    "vitest.config.ts",
    "esbuild.config.ts",
    "eslint.config.js",
    "scripts/**/*"
  ]
}
```

### Source Layout

```
src/
  index.ts              Entry point
  lib/                  Library code
  routes/               HTTP routes (backend)
  commands/             CLI commands (CLI)
  services/             Business logic
  repositories/         Data access
  config/               Configuration
  utils/                Pure utilities
  types/                Shared type definitions
test/                   Test files (mirrors src/)
```

One `.ts` file per logical unit.

Aim below ~500 lines per file and split a file when it approaches ~1000 lines.

## Naming Conventions

| Element               | Convention                              | Example                             |
| --------------------- | --------------------------------------- | ----------------------------------- |
| Types, interfaces     | `PascalCase`                            | `UserProfile`, `ApiResponse`        |
| Type aliases          | `PascalCase`                            | `Result`, `AsyncResult`             |
| Classes               | `PascalCase`                            | `UserService`, `CacheManager`       |
| Enums                 | `PascalCase` name, `PascalCase` members | `Status.Active`                     |
| Functions, methods    | `camelCase`                             | `fetchUser`, `handleRequest`        |
| Variables, parameters | `camelCase`                             | `userId`, `maxRetries`              |
| Constants             | `SCREAMING_SNAKE`                       | `DEFAULT_TIMEOUT`, `MAX_BATCH_SIZE` |
| Private properties    | `_camelCase`                            | `_cache`, `_config`                 |
| Files                 | `kebab-case.ts`                         | `user-service.ts`, `api-routes.ts`  |
| Test files            | `*.test.ts`                             | `user-service.test.ts`              |
| Hooks (React)         | `useCamelCase`                          | `useUser`, `useAuth`                |

Avoid abbreviations - `configuration` not `config`, `response` not `res`.

When expanding a clipped lambda parameter such as `f` to a domain word such as `field`,
check the enclosing scope first: a parameter that shadows an outer binding silently flips
semantics, and `items.map((field) => field === field)` compares an element to itself when
`field` is already bound above.

Use `existing` or `entry` for collection elements when the natural name is already bound
in the enclosing scope.

Comments, docblocks, and identifiers are written in English,
per the project source-language rule in `docs/STYLE.md`.

### Type-Specific Conventions

- **Discriminated unions** for state machines and operation results:

  ```typescript
  type Result<T, E extends Error = Error> =
    { success: true; value: T } | { success: false; error: E };
  ```

- **Readonly** for immutable data:

  ```typescript
  interface Config {
    readonly host: string;
    readonly port: number;
  }
  ```

- **Branded types** for domain primitives:

  ```typescript
  type UserId = string & { readonly __brand: unique symbol };
  ```

## Code Conventions

### Banned Constructs

| Construct                  | Alternative                   | Reason                 |
| -------------------------- | ----------------------------- | ---------------------- |
| `any`                      | `unknown` + type guard        | Disables type system   |
| `!` (non-null assertion)   | Type guard or `// REASON:`    | Suppresses null check  |
| `@ts-ignore`               | Fix the error or `// REASON:` | Hides real issues      |
| `as Type` on external data | Zod schema + type guard       | Unchecked at runtime   |
| `as unknown as T`          | Type guard or fix the type    | Hides real mismatch    |
| `enum` (numeric)           | `const` object or string enum | Runtime surprises      |
| `namespace`                | ES modules                    | Obsolete module system |

### Type Guards

Use type guards to narrow types at runtime boundaries:

```typescript
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### Generics

- Prefer explicit generic parameters over inference when the type is part of the API contract.
- Use `const` type parameters for literal inference: `function foo<T extends string>(x: T)`.

### Module System

- **ESM only** for application code (`"type": "module"`, `module: "NodeNext"` or `"bundler"`).
- `.js` extensions required in relative imports: `import { foo } from './bar.js'`.
- CommonJS only for Node.js config files that require it (e.g., Electron main process).
- No `require` in TypeScript source files.

### Path Aliases

Configure `@/*` -> `src/*` in `tsconfig.json` and build tool:

```typescript
// vite.config.ts
resolve: { alias: { '@': path.resolve(__dirname, './src') } }
```

Use absolute imports: `import { UserService } from '@/services/user-service.js'`.

### Error Handling

- Domain-specific `Error` subclasses with `code` property:

```typescript
class NotFoundError extends Error {
  constructor(
    readonly resource: string,
    readonly id: string,
  ) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
  readonly code = 'NOT_FOUND';
}
```

- `Result<T, E>` discriminated unions for recoverable errors.
- Never swallow errors - handle, propagate, or log with context.

### Configuration

- Zod schema validation at startup - fail fast.
- Environment variables documented in `README.md`, templated in `.env.example`.
- Pass config as parameter, never read `process.env` deep in modules.

### Logging

- Pino structured JSON logging (per JavaScript standard).
- Correlation IDs on request-scoped logs.
- No `console.log` in production code.

### Observability

- OpenTelemetry JS SDK for traces, metrics, logs.
- `/health/live`, `/health/ready`, `/metrics` endpoints.
- Structured logging with correlation IDs.

### Forbidden Patterns

| Pattern                           | Rule                           | Reason                      |
| --------------------------------- | ------------------------------ | --------------------------- |
| `any`                             | Disallowed                     | Disables type system        |
| `!` without `// REASON:`          | Disallowed                     | Unchecked null assertion    |
| `@ts-ignore` without `// REASON:` | Disallowed                     | Hides type errors           |
| `as` on external data             | Use Zod + type guard           | Runtime unchecked           |
| `console.log` in production       | Use Pino                       | Bypasses structured logging |
| Floating promises                 | `await` or `void` with comment | Unhandled rejections        |
| `require` in ESM                  | Use `import`                   | Module system mismatch      |

### TypeScript 5.9 Idioms

`satisfies` keeps literal inference while still checking the shape:

```typescript
type RouteConfig = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
};

const routes = {
  getUser: { path: '/users/:id', method: 'GET' },
  createUser: { path: '/users', method: 'POST' },
} satisfies Record<string, RouteConfig>;

// routes.getUser.method is inferred as 'GET', not widened to 'GET' | 'POST' | ...
```

Async state is a discriminated union, so consumers must narrow before reading data:

```typescript
export type AsyncResult<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

`any` is forbidden. Untrusted input is `unknown` narrowed by a type guard:

```typescript
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

## Formatting and Linting

### ESLint 9 Flat Config with typescript-eslint

`eslint.config.js`:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['node_modules/', 'dist/', 'coverage/', '**/*.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
    },
  },
]);
```

### Prettier 3

`.prettierrc` (same as JavaScript standard):

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

Run in CI: `eslint .` and `prettier --check .` - both must pass.

## Testing

### Framework

- **Vitest** (preferred): `vitest run`, `vitest run --coverage`
- **Node.js `--test`**: For backend-only projects without Vitest

Do not mix test frameworks.

### Requirements

- Unit test coverage >= 80% (lines, functions, branches, statements).
- Every exported function has tests for normal case, boundary values, error paths.
- Test files: `*.test.ts` in `test/` mirroring `src/`.
- Pure functions tested in isolation, integration tests use testcontainers.

### Running Tests

```bash
npm test                    # vitest run
npm run test:coverage       # vitest run --coverage
npm run test:ui             # vitest --ui
```

## Build

### Development

```bash
npm run dev                 # Vite dev server (frontend) or tsx watch (backend)
```

### Production

Frontend (Vite):

```bash
npm run build               # tsc --noEmit && vite build
```

Backend (esbuild):

```bash
npm run build               # tsc --noEmit && esbuild
```

Type check (`tsc --noEmit`) is a separate step from bundling.

### Docker

Multi-stage build with non-root user and distroless base (per JavaScript standard).

## Dependencies

| Category           | Library                            | Purpose                |
| ------------------ | ---------------------------------- | ---------------------- |
| Runtime validation | `zod`                              | Schema validation      |
| Logging            | `pino`                             | Structured logging     |
| Observability      | `@opentelemetry/sdk-node`          | Traces, metrics, logs  |
| HTTP (backend)     | `fastify`                          | HTTP framework         |
| Frontend (React)   | `react`, `react-dom`               | UI framework           |
| State (React)      | `zustand`, `@tanstack/react-query` | Client + server state  |
| Styling (React)    | `tailwindcss`                      | Utility-first CSS      |
| Testing            | `vitest`, `@vitest/coverage-v8`    | Test runner + coverage |
| Linting            | `eslint`, `typescript-eslint`      | Linter                 |
| Formatting         | `prettier`                         | Formatter              |

Prefer versions published >= 7 days ago.

## Verification

| Check                          | Command Or Method                                                            | Applies To           |
| ------------------------------ | ---------------------------------------------------------------------------- | -------------------- |
| TypeScript version pinned      | `grep '"typescript"' package.json`                                           | Project root         |
| Strict mode enabled            | `grep '"strict": true' tsconfig*.json`                                       | All tsconfigs        |
| No `any` type                  | `grep -r ': any' src/ --include="*.ts"`                                      | All source files     |
| No `!` without reason          | `grep -r '! // REASON:' src/`                                                | All source files     |
| No `@ts-ignore` without reason | `grep -r '@ts-ignore' src/`                                                  | All source files     |
| Type check passes              | `tsc --noEmit`                                                               | All TypeScript files |
| ESLint passes                  | `eslint .`                                                                   | All TypeScript files |
| Prettier passes                | `prettier --check .`                                                         | All files            |
| Tests pass                     | `npm test`                                                                   | All tests            |
| Coverage >= 80%                | `npm run test:coverage`                                                      | All tests            |
| npm audit clean                | `npm audit --omit=dev`                                                       | Production deps      |
| No hardcoded secrets           | `grep -r -e 'password' -e 'secret' -e 'apikey' src/`                         | All source files     |
| OpenTelemetry configured       | `grep -r '@opentelemetry' src/`                                              | Source files         |
| Project references valid       | `tsc --build --dry`                                                          | All projects         |
| Biome check                    | `npx @biomejs/biome check src/`                                              | All TS files         |
| Type-only imports              | `npx eslint --rule '@typescript-eslint/consistent-type-imports: error'` src/ | Import audit         |

## Definition of Done

### Correctness

- `tsc --noEmit` produces no errors.
- `eslint .` produces no errors.
- `prettier --check .` produces no output.
- `npm test` passes with >= 80% coverage.
- `npm audit --omit=dev` reports no vulnerabilities.
- No `any`, no `!` without reason, no `@ts-ignore` without reason.

### Structure

- Project layout matches confirmed structure.
- Project references configured and valid (`tsc --build --dry`).
- `package.json` has exact TypeScript version.
- No circular dependencies.
- Aim below ~500 lines per file, and no file exceeds ~1000 lines without a recorded justification.

### Quality

- JSDoc on all exported APIs: `@param`, `@returns`, `@throws`.
- Comments explain reasons, not actions.
- No debugging output or commented-out code remains.
- Error classes have `code` property for machine handling.

### Hygiene

- `node_modules/`, `dist/`, `coverage/` are gitignored.
- `.env` files are gitignored, `.env.example` committed.
- No secret, token, or credential committed.
- Documentation updated when change alters public API, build, or project rule.

## General Principles

**Single Responsibility.** One function does one thing, one module owns one domain concept.

**Fail Fast.** Validate at the boundary - a failure detected late is harder to trace.

**No Ambient State.** Request-scoped state travels on context, module state encapsulated.

**Explicit Error Handling.** Every error has a `code`, never swallowed.

**Observability by Default.** Logs, metrics, traces are the interface.

**Type Safety Is Not Optional.** `strict` mode + runtime validation at boundaries.

**Standard Library First.** Add a dependency only when genuinely insufficient.

**Zero Warnings.** A TypeScript/ESLint/Prettier deviation requires action.

**Reproducible Builds.** Exact versions, committed lockfile, pinned runtime.

## Sources

- [TypeScript 5.9 Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig)
- [typescript-eslint Rules](https://typescript-eslint.io/rules/)
- [Vitest Guide](https://vitest.dev/guide/)
- The general JavaScript engineering standard
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [Zod Documentation](https://zod.dev/)

## Project Conventions

- Strict mode with no `any`; use `unknown` for genuinely unknown values.
- Identifier types are branded in `src/types/branded.ts`; factories accept `number | BrandedType` and convert at boundaries.
