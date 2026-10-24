# TypeScript and React Engineering Standards

<!-- Version: 0.1.3 | Date: 2026-10-24 -->

## Purpose

This document defines the engineering standard for TypeScript projects that build React 19
applications.

It covers the language version, the project layout, the coding conventions, the state management,
the testing, and the build.

It builds on the TypeScript engineering standard and adds only the React-specific rules.

It is written to be executed directly by an AI coding agent and to be read without effort by a human
reviewer.

## Scope

A project is in scope when all of the following conditions hold.

- The project is written in TypeScript with strict mode enabled.
- The project builds a React 19 web application.
- The build entry point is Vite or an equivalent static bundler.

A project that uses Angular, Vue, Svelte, or Solid instead of React is out of scope,
because those frameworks have different conventions and ecosystems.

A project that uses Next.js, Remix, or another server-rendered framework is out of scope,
because those frameworks have different conventions and a server-side runtime.

A project that uses JavaScript instead of TypeScript is out of scope,
because this standard depends on TypeScript's type system for its rules.

A project that uses Electron is in scope for the renderer-process portions,
but the Electron-specific main and preload conventions are covered by the companion Electron desktop
standard.

Optional-stack libraries - TanStack Query, Zustand, Tailwind CSS, routing libraries - are covered
as conditional rules that apply when the project adopts them.

A project that combines a React frontend with a Node.js service applies this standard to the
frontend and applies the TypeScript engineering standard and the matching backend standard to the
service.

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches TypeScript or React code.

1. Read the project rules file, such as `AGENTS.md`, `README.md`, or `docs/GUIDELINES.md`,
   because a project rule overrides this standard.
2. Read the TypeScript engineering standard for shared language, tooling, and dependency rules.
3. Determine the TypeScript version, the React version, the build tool, the state management,
   and the test framework using the Agent Intake Protocol below.
4. Confirm the conclusion with the user when the repository is ambiguous or empty.
5. Apply the sections of this standard that match the confirmed project kind.
6. Run every applicable row of the Verification section.
7. Check the result against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                     | Example                                           |
| ---- | ------------------------------------------ | ------------------------------------------------- |
| 1    | An explicit instruction from the user      | "Keep this project on React 18"                   |
| 2    | The project rules file                     | `AGENTS.md`, `docs/GUIDELINES.md`                 |
| 3    | The existing convention in the repository  | Redux already used for all state                  |
| 4    | The TypeScript engineering standard        | Strict mode, ESLint, Prettier, Zod, OpenTelemetry |
| 5    | This standard                              | React 19, Vite 7, Vitest, function components     |
| 6    | General TypeScript and React best practice | Anything the five sources above do not cover      |

Never silently reformat existing code to match this standard.

A whole-repository reformat destroys review history and hides the real change inside noise.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **TypeScript strict mode is enabled.** A project with `strict: false` is a defect.
- **No `any` type.** Use `unknown` when the type is genuinely unknown,
  because `any` disables the type system.
- **No `console.log` in production code.** Use a structured logger,
  because console output bypasses log levels and structured fields.
- **No hardcoded secrets.** A secret in a committed file is a security incident.
- **No floating promises.** Every `async` call is awaited or explicitly voided with a comment,
  because a floating promise's rejection is unhandled.
- **No class components.** React function components only, because class components are legacy.
- **No direct DOM manipulation outside React refs.** `document.querySelector` in a React component
  is a defect, because it bypasses React's reconciliation.
- **`eslint .` produces no errors.** An ESLint error is a defect.
- **`tsc --noEmit` produces no errors.** A TypeScript error is a defect.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the project shape.

| Signal Found In The Repository              | Inferred Decision               | Confidence |
| ------------------------------------------- | ------------------------------- | ---------- |
| `package.json` with `react` 19              | React 19                        | High       |
| `package.json` with `react` 18              | React 18                        | High       |
| `package.json` with `vite` 7                | Vite 7 build tool               | High       |
| `package.json` with `typescript` 5.9        | TypeScript 5.9                  | High       |
| `package.json` with `tailwindcss` 4         | Tailwind CSS 4                  | High       |
| `package.json` with `zustand`               | Zustand for client state        | High       |
| `package.json` with `@tanstack/react-query` | TanStack Query for server state | High       |
| `package.json` with `@mui/material`         | MUI component library           | High       |
| `package.json` with `vitest`                | Vitest test framework           | High       |
| `package.json` with `@playwright/test`      | Playwright for E2E              | High       |
| `tsconfig.json` with `strict: true`         | Strict mode enabled             | High       |
| No TypeScript files at all                  | New project                     | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation rather than
running a questionnaire.

Example: "I see React 19, Vite 7, TypeScript 5.9 with strict mode, Tailwind CSS 4,
Zustand for client state, TanStack Query for server state, and Vitest for testing.

I will follow the existing conventions.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project, ask the following questions.

| Question                | Options                       | Default If Declined |
| ----------------------- | ----------------------------- | ------------------- |
| Which React version?    | React 19, React 18            | React 19            |
| Which build tool?       | Vite, Next.js                 | Vite                |
| Which state management? | Zustand, Redux Toolkit, Jotai | Zustand             |
| Which styling?          | Tailwind CSS 4, CSS Modules   | Tailwind CSS 4      |
| Which test framework?   | Vitest, Jest                  | Vitest              |

## Documentation

The following are the authoritative sources for TypeScript and React development.

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - official
  TypeScript reference.
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig) - compiler options.
- The general TypeScript engineering standard - base language and tooling rules.
- [React Documentation](https://react.dev/) - official React reference.
- [React Hooks API](https://react.dev/reference/react) - hooks reference.
- [Vite Documentation](https://vitejs.dev/guide/) - build tool reference.
- [Vitest](https://vitest.dev/) - testing framework.
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - component
  testing.
- [Zod](https://zod.dev/) - runtime schema validation.
- [TanStack Query](https://tanstack.com/query/latest) - server state management, when adopted.
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) - client state management,
  when adopted.
- [Tailwind CSS](https://tailwindcss.com/docs) - styling framework, when adopted.
- The general accessibility engineering standard - WCAG 2.2 AA + axe-core.
- The performance budgets engineering standard - Core Web Vitals + bundle budgets.

## Language Version

The project targets TypeScript 5.9 or newer with strict mode enabled.

The project targets Node.js 22 LTS or newer for tooling and for any companion service.

On runtime upgrade, re-validate all rules against release notes before writing code.

Do not use JavaScript in source files.

TypeScript is required for all source code in `src/`.

## Project Structure

### Frontend Structure

```
src/
  components/             React components (flat or feature-based directory)
  hooks/                  Custom React hooks
  logic/                  Pure logic modules (no React dependency)
  utils/                  Utility functions (no React dependency)
  types/                  TypeScript type definitions
  constants/              Constant definitions
  services/               API and business logic services
  stores/                 Zustand stores (flat directory, plural), when adopted
  i18n/                   Internationalisation
  assets/                 Static assets (fonts, images, global CSS)
  modals/                 Modal dialog components
  renderer/               Canvas or WebGL rendering logic
  io/                     Import and export modules
  workers/                Web Worker modules
```

Each directory has a single, clearly defined responsibility.

Group source files by purpose: UI components, UI logic in hooks, pure logic in `logic/` or `utils/`,
and type definitions belong in separate locations rather than mixed in one directory or file.

Pure logic modules with no React dependency are placed in `src/logic/` or `src/utils/`,
because this separation ensures they are independently testable without a DOM environment.

Barrel exports (`index.ts`) may be used in `types/` directories to aggregate domain exports.

All other directories import from specific files,
because barrel exports in component directories hide dependencies and slow down bundlers.

A project that combines a React frontend with a Node.js service keeps the service layout defined by
the TypeScript engineering standard and the matching backend standard.

### Version Control Exclusions

Maintain `.gitignore` at project root to exclude `node_modules/`, `dist/`, `.env*`, `coverage/`,
IDE files, and OS files.

A mature example of this partition: a React + TypeScript desktop application that holds
twelve domain subdirectories inside `hooks/` and twenty-one inside `utils/` - the kind
folders (`components/`, `types/`, `constants/`, `workers/`) stay at the root, every grouped
directory is domain-only with zero flat files, and the entry files sit at the root as the
recorded exception. The shape reads at a glance and a file move is only a specifier edit.

## Naming Conventions

| Element               | Convention                              | Example                              |
| --------------------- | --------------------------------------- | ------------------------------------ |
| Components            | `PascalCase`                            | `App`, `DataGrid`, `PropertiesPanel` |
| Interfaces and types  | `PascalCase`, no `I` prefix             | `UserProfile`, `ToolOptions`         |
| Type aliases          | `PascalCase`                            | `NodeType`, `BlendMode`              |
| Enums                 | `PascalCase` name, `PascalCase` members | `Direction.Left`                     |
| Error classes         | `PascalCase` with `Error` suffix        | `ValidationError`, `NetworkError`    |
| Hooks                 | `useCamelCase`                          | `useCanvas`, `useSelection`          |
| Functions and methods | `camelCase`                             | `drawNode`, `updateSelection`        |
| Variables             | `camelCase`                             | `currentNode`, `zoomLevel`           |
| Constants             | `UPPER_SNAKE_CASE`                      | `DEFAULT_ZOOM`, `MAX_HISTORY_SIZE`   |
| Component files       | `PascalCase.tsx`                        | `App.tsx`, `DataGrid.tsx`            |
| Hook files            | `useCamelCase.ts`                       | `useLocalStorage.ts`                 |
| Utility files         | `camelCase.ts`                          | `apiClient.ts`, `validators.ts`      |
| CSS files             | `PascalCase.css`                        | `App.css`, `ModalDialog.css`         |
| Constants files       | `UPPER_SNAKE_CASE.ts`                   | `APP_CONSTANTS.ts`                   |
| Test files            | `PascalCase.test.tsx`                   | `DataGrid.test.tsx`                  |

### Abbreviation Rule

Avoid abbreviations in identifiers.

Use full words, because an abbreviation saves two characters and costs a reader a lookup.

| Avoid    | Use             |
| -------- | --------------- |
| `Config` | `Configuration` |
| `Idx`    | `Index`         |
| `Num`    | `Number`        |
| `Btn`    | `Button`        |
| `Req`    | `Request`       |
| `Res`    | `Response`      |
| `Err`    | `Error`         |
| `Msg`    | `Message`       |

Domain-specific abbreviations that are established terms in the project vocabulary are permitted
when explicitly documented in the project rules file.

## Type Safety

Enable all strict-mode options plus `noUnusedLocals`, `noUnusedParameters`,
and `noFallthroughCasesInSwitch`.

### Banned Constructs

- `any`, because it disables the type system. Use `unknown` when the type is genuinely unknown.
- Non-null assertion (`!`) without a `// REASON:` comment,
  because it suppresses a null check without proving the value is non-null.
- `@ts-ignore` without a `// REASON:` comment, because it suppresses a type error without fixing it.
- `as` type assertions on external data, because external data is untyped at runtime.
  Use a type guard or runtime schema validator instead.

### Type Guards

Use type guards to narrow types at runtime boundaries,
because a type guard proves the type at runtime.

```typescript
function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
```

### Discriminated Unions

Use discriminated unions for state machines, operation outcomes, and variants,
because a discriminated union makes the set of states explicit and enables exhaustive checking.

```typescript
type Result<T, E extends Error = Error> =
  { success: true; value: T } | { success: false; error: E };

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

### Readonly

Mark data structures that must not be mutated as `readonly` or `Readonly<T>`,
because a readonly property cannot be accidentally mutated.

```typescript
interface Configuration {
  readonly host: string;
  readonly port: number;
}
```

## TypeScript Configuration

### Project References

Use TypeScript project references for better build performance and separation.

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.app.json` (Application Code)

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
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vite/client", "vitest/globals", "node"]
  },
  "include": ["src", "test"]
}
```

### `tsconfig.node.json` (Build Scripts and Config Files)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts", "eslint.config.js"]
}
```

### Import Paths

Use absolute imports with path aliases, because relative imports across module boundaries are
fragile and hard to refactor.

```typescript
// Correct
import { Canvas } from '@/components/Canvas';
import { useCurrentFrame } from '@/hooks/useCurrentFrame';

// Incorrect: relative imports across module boundaries
import { Canvas } from '../../components/Canvas';
```

Configure in `vite.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

## Module System

Use ES modules (`"type": "module"` in `package.json`) for all new projects.

Use `import` and `export` syntax exclusively.

Do not use `require()` in TypeScript source files.

CommonJS is only permitted in files that must be CommonJS by their runtime context,
such as Electron main process scripts.

Name CommonJS-only files with `.cjs` extension to make the module system explicit.

### Module Boundaries

Each module exports only what callers need.

Internal helpers not meant for external use are not exported.

Circular imports are forbidden, because a circular import creates undefined behaviour at
initialisation time.

Use dependency inversion or shared types to break cycles.

A module that imports from more than ten other modules is likely doing too much and should be split
by responsibility.

## Code Conventions

### React Components

- Functional components only. No class components.
- Props interface named with `Props` suffix: `ButtonProps`.
- Destructure props in the function signature.
- Prefer `export function` over `React.FC`,
  because `React.FC` adds no value and complicates generics.

```typescript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Hooks

- Custom hooks start with `use`.
- Keep hooks focused on a single responsibility.
- Document hook parameters and return value with JSDoc.
- Follow the rules of hooks strictly.
- Encapsulate complex side effects in dedicated custom hooks.
- Use `useCallback` and `useMemo` when passing functions or derived values into `useEffect`
  dependency arrays, because an unstable reference causes the effect to re-run on every render.
- Avoid deep or unstable dependency arrays,
  and extract a custom hook when an effect is hard to express cleanly.
- When extracting effects into a custom hook, a ref shared with code that stays above the hook
  call site is declared in the component and passed in as a parameter - moving it into the hook
  creates a use-before-declaration dependency.
- A hook or pure helper defined inside a component file belongs in the hooks or logic directory as
  soon as it is shared, long enough to obscure the component, or independently testable - do not
  leave private extractions buried in page files.
- Early-return gates that interleave with conditional returns are plain functions returning
  `ReactNode | null` called during render - never hooks, because a hook call placed after a
  conditional return violates the rules of hooks.
- A component file that also exports contexts, providers, or pure formatters should be split so each
  unit lives under the directory matching its nature, because mixed modules hide the shared pieces
  from importers and break fast-refresh assumptions.

```typescript
/**
 * Manages canvas rendering lifecycle.
 * @param canvasRef - Reference to canvas element
 * @returns Render context and control functions
 */
export function useCanvas(canvasRef: RefObject<HTMLCanvasElement>) {
  // implementation
}
```

### State Management

Start with React built-in state.

- `useState` and `useReducer` for component-local state, form inputs, and overlays.
- `useRef` for DOM element references and instances that must not trigger re-renders on change.
- React Context for localised state within a subtree.
- Custom hooks for reusable stateful logic.

When shared state across independent components becomes a real requirement, evaluate a client store
such as Zustand.

Use TanStack Query for server state and data fetching when the project adopts it.

Do not duplicate server state in a client store,
because duplicated state drifts from the server and causes consistency bugs.

### Zustand Store Pattern

When Zustand is the chosen store, stores use the Zustand `create` API.

Stores that need persistence use the `persist` middleware.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'dark' | 'light';
  sidebarVisible: boolean;
}

interface UIStore extends UIState {
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarVisible: true,

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
    }),
    {
      name: 'app-ui-state',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
```

### Component Organisation

Each component does one thing.

- Container components manage state and pass data to children.
- Presentational components receive props and render UI.
- Hooks encapsulate reusable logic.

Do not pass props through more than two component layers,
because props drilling makes the component tree rigid and hard to refactor.

Use context or stores instead.

Use early returns for guard clauses, because an early return is clearer than nested conditionals.

```typescript
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;

return <DataView data={data} />;
```

Reusable UI primitives are placed in `src/components/` or a dedicated `src/components/ui/`
subdirectory.

Each primitive is a presentational component with no business logic,
because a primitive with business logic is no longer reusable.

Business logic belongs at the call site or in dedicated hooks.

When code repeats with different parameters, extract a parameterized utility function rather than
copying the block - deduplicate before or alongside structural extraction, not as a later cleanup.

### Error Handling in React

- Wrap the application root in an `ErrorBoundary` to catch unhandled render errors,
  because an unhandled error in a component unmounts the entire tree.
- Network errors and disconnections are handled as connection state transitions, not exceptions,
  because a disconnection is a normal application state, not a programmer error.
- Display connection state visibly in the UI at all times,
  because a hidden disconnection is a confusing silence.

### Async Programming

Use `async/await` exclusively.

Always `await` promises.

Floating promises, which are unawaited calls to `async` functions, are forbidden,
because a floating promise's rejection is unhandled.

Handle errors with `try/catch` around `await` expressions.

### Promise Combinators

Use `Promise.all` for parallel independent operations.

```typescript
const [users, products] = await Promise.all([fetchUsers(), fetchProducts()]);
```

Use `Promise.allSettled` when partial failures are acceptable and each result must be inspected.

Use `Promise.race` with a timeout sentinel for operations that must complete within a deadline.

### Cancellation

Use `AbortController` and `AbortSignal` for cancellable operations.

Pass `signal` through the call chain from the outermost caller to the innermost I/O operation,
because a signal that is not propagated cannot cancel the inner work.

```typescript
async function fetchData(signal: AbortSignal): Promise<Data> {
  const response = await fetch(url, { signal });
  return response.json() as Promise<Data>;
}
```

### Forbidden Patterns

- `any` type, because it disables the type system.
- Non-null assertion (`!`) without a `// REASON:` comment, because it suppresses a null check.
- `@ts-ignore` without a `// REASON:` comment, because it suppresses a type error.
- `console.log` in production code, because console output bypasses structured logging.
- `setState` in `useEffect` without a dependency guard, because it causes infinite loops.
- Direct DOM manipulation outside of React refs, because it bypasses React's reconciliation.
- Synchronous file I/O (`readFileSync`, `writeFileSync`) on the hot path,
  because it blocks the event loop.
- Mutable shared state across module boundaries, because it creates hidden coupling.

### React 19 Patterns

Form submissions use `useActionState` so pending and error state come from the action:

```tsx
import { useActionState } from 'react';

interface FormState {
  error: string | null;
  success: boolean;
}

async function updateProfile(previousState: FormState, formData: FormData): Promise<FormState> {
  const name = formData.get('name') as string;
  try {
    await api.saveName(name);
    return { error: null, success: true };
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }
}

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateProfile, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction}>
      <input name="name" required disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Profile'}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

Refs are ordinary props in React 19 - `forwardRef` is deprecated:

```tsx
interface TextInputProps {
  label: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function TextInput({ label, ref, ...rest }: TextInputProps) {
  return (
    <label>
      {label}
      <input ref={ref} {...rest} />
    </label>
  );
}
```

`React.FC` wrapper types, deprecated `forwardRef`, and side effects outside
`useEffect` are forbidden.

## Specialized Patterns

The rules in this section apply only when the application actually contains the named pattern.

### Canvas Rendering

When rendering to a `<canvas>` element, React's reconciler is not involved in frame-by-frame
rendering.

The rendering loop accesses the canvas directly via `useRef` and `requestAnimationFrame`,
because React's reconciliation is too slow for per-frame updates.

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  let frameId: number;
  const render = () => {
    renderer.drawFrame(canvas, buffer.getSnapshot());
    frameId = requestAnimationFrame(render);
  };
  frameId = requestAnimationFrame(render);
  return () => cancelAnimationFrame(frameId);
}, [renderer, buffer]);
```

Renderer logic lives outside the component.

The component owns the canvas element and the renderer owns the drawing logic,
because separating the two makes the renderer independently testable.

Any `<canvas>` whose contents must preserve pixel aspect ratio and that lives inside a flex
container must declare both an explicit CSS `width` and `height` matching its intrinsic pixel size,
and set `flex-shrink: 0`.

The `width` and `height` HTML attributes alone do not prevent flex layouts from stretching or
squeezing the element.

### Persistent Connections

When the application holds a persistent connection such as a WebSocket, network connection logic is
isolated in a dedicated module.

A custom hook consumes this module and exposes connection state and send and receive functions,
because isolating the connection logic makes it independently testable.

```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ConnectionHandle {
  state: ConnectionState;
  send: (data: Uint8Array) => void;
}
```

The connection module owns the following responsibilities.

- Establishing the connection with a configurable endpoint.
- Automatic reconnection with backoff on unexpected disconnection.
- Buffering outgoing data when the connection is temporarily unavailable.
- Delivering incoming data to a registered callback.

### Real-Time and Timing-Critical Code

In real-time systems where timing is critical, such as audio, video, or simulation,
standard React patterns may be deliberately violated for stability.

- Dependency arrays in `useCallback` and `useMemo` may be deliberately sparse to prevent render
  interruptions.
- Local state may mirror props for stable timing isolation from prop-driven updates.
- Synchronous state updates may be preferred over deferred patterns.

Document these deviations with a `// REASON:` comment at the call site,
because a reviewer who cannot see the reason will "fix" the deviation and introduce glitches.

Never apply automated linting fixes to real-time hooks without first confirming that timing
behaviour is unaffected.

### Node.js Companion Services

When the repository also contains a Node.js service, the following runtime rules apply to that
service code in addition to the TypeScript engineering standard.

Use the `pipeline` API for composing streams,
because `pipeline` propagates errors and cleans up on failure.

```typescript
import { pipeline } from 'node:stream/promises';

await pipeline(readStream, transformStream, writeStream);
```

Always destroy streams on error to release file descriptors.

Prefer `fs/promises` over callback-based APIs.

Use `try/finally` to ensure handles are released,
because a handle that is not closed leaks a file descriptor.

```typescript
const handle = await fs.open(path, 'r');
try {
  const content = await handle.readFile({ encoding: 'utf-8' });
  return content;
} finally {
  await handle.close();
}
```

Register a global handler for unhandled Promise rejections,
because an unhandled rejection crashes the process in newer Node.js versions.

```typescript
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});
```

Do not block the Node.js event loop with synchronous I/O or CPU-intensive loops,
because a blocked event loop stalls all requests.

Offload CPU-bound work to Worker Threads.

### Internationalisation

The rules in this section apply when the project uses `react-i18next` or an equivalent
translation runtime.

Evaluate `t()` lookups at render or registration time, never at module scope,
because a module-level `t()` runs before the i18next initialisation gate and freezes the
fallback language.

```tsx
// Defect: freezes the fallback language at import time
const TITLE = t('settings.title');

// Recommended: resolves per render in the active language
const title = t('settings.title');
```

Use i18next plural families (`key_one`, `key_few`, `key_many`, `key_other`) for
count-bearing labels, never hand-rolled plural logic in JSX,
because the required suffix set differs per locale and CLDR plural rules own the
selection for each shipped language.

## Styling

Use the styling system the project already adopts - Tailwind utility classes, plain CSS files,
CSS Modules, or a component-library style API such as MUI `sx`.

Tailwind CSS 4 is the default for new projects when no styling decision exists.

### Custom CSS

For component-specific styles that do not map cleanly to the styling system,
use plain CSS files alongside the component, such as `ColorPicker.css`.

Global theme variables and custom properties live in `src/index.css`.

### Theme Variables

Define colours as CSS custom properties on `:root` and any theme variants such as `.light`.

### Viewport Shells

When an application shell must fill the viewport, lock it with `100dvh` inside a dedicated media
query chosen for the scroll boundary, not a breakpoint owned by another feature such as navigation
width.

Below the lock threshold the document flows naturally so narrow screens keep a native scrollbar.

Use `dvh` units rather than `vh` for locked shells,
because `100vh` exceeds the visible viewport on browsers with dynamic toolbars and forces the shell
taller than the screen.

When diagnosing an unexpected scrollbar or overflow, measure `innerWidth`,
`document.documentElement.scrollHeight`, the shell element's bounding height, and
`CSS.supports('height', '100dvh')` before changing layout math,
because a media query that does not match and an unsupported unit both produce a page scrollbar.

## Resource Management

### Browser Resources

Clear timers and intervals when a component unmounts,
because a timer that is not cleared fires after the component is gone.

Remove event listeners added to the window or document inside `useEffect` cleanup functions,
because a listener that is not removed leaks memory.

Cancel `requestAnimationFrame` loops in cleanup.

### Node.js Resources

Stream, file-handle, and event-loop rules for companion services live in the
[Node.js Companion Services](#nodejs-companion-services) section.

## Configuration

Never hard-code environment-specific values in source files.

Read configuration from environment variables or configuration files.

Validate all configuration at startup using a schema validator,
because invalid configuration causes failures at runtime instead of at startup.

```typescript
import { z } from 'zod';

const ConfigurationSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535),
  databaseUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export function loadConfiguration(): Configuration {
  return ConfigurationSchema.parse({
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL,
  });
}
```

### Secrets

Do not log secret values.

Do not include secrets in error messages.

Do not commit secrets to version control.

Use `.env` files (listed in `.gitignore`) for local development.

Use a secrets manager for production environments.

## Logging

Use a centralised `logger` utility in `src/utils/logger.ts` or a structured logger such as `pino`,
because a centralised logger enforces log levels and allows production filtering.

Log messages as objects with a message field and contextual properties,
because structured fields allow log aggregation and querying without regex parsing.

```typescript
// Correct
logger.info('Request processed', { userId, duration: elapsed, status: 200 });

// Incorrect
logger.info(`Request processed for user ${userId} in ${elapsed}ms`);
```

### Log Levels

| Level   | When to Use                                                             |
| ------- | ----------------------------------------------------------------------- |
| `debug` | Internal state useful for diagnosing problems during development        |
| `info`  | Normal operation milestones: startup, shutdown, significant transitions |
| `warn`  | Recoverable situations that may indicate a problem                      |
| `error` | Failures that require attention                                         |

In production builds (`import.meta.env.PROD`), only `warn` and `error` are emitted,
because `debug` and `info` flood production logs.

Do not use `console.log` in production code.

### Context Propagation

Include a request or correlation identifier in every log entry within a request lifecycle,
because a correlation identifier allows tracing a request across services.

## Security

Validate all external input at system boundaries.

Never trust user-supplied data, because user-supplied data is the primary attack vector.

### Input Validation

Use a schema validator such as Zod to validate request payloads, query parameters, and file inputs,
because a schema validator checks types and constraints at runtime.

```typescript
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});
```

### Path Traversal

When server-side code resolves user-supplied file paths,
resolve the path to an absolute path and verify the result is within the allowed
root before accessing the file system, because a path traversal attack reads files outside the
intended directory.

```typescript
import * as path from 'node:path';

const allowedRoot = path.resolve('/data/uploads');
const resolved = path.resolve(allowedRoot, userInput);
if (!resolved.startsWith(allowedRoot + path.sep)) {
  throw new ValidationError('Path traversal detected', 'filename');
}
```

### Injection

Do not build SQL, shell commands, or HTML strings by string concatenation with user input,
because concatenation enables injection attacks.

Use parameterised queries for SQL.

Use an HTML template engine with automatic escaping for HTML output.

### Dependency Security

Run `npm audit` regularly and address known vulnerabilities.

Do not use packages with no active maintenance,
because an unmaintained package accumulates vulnerabilities.

Review transitive dependencies before adding a new library,
because a transitive dependency is a hidden attack surface.

## Performance

Profile before optimising, because speculative optimisation adds complexity without measurable
benefit.

Use `React.memo`, `useMemo`, and `useCallback` where measurable re-render cost exists.

Do not add memoisation speculatively, because memoisation has a cost and is not always a benefit.

### Render Performance

Avoid creating large objects or arrays as inline JSX props,
because a new reference on every render causes unnecessary re-renders.

Move object literals that do not depend on render-time values outside the component,
or stabilise them with `useMemo`.

Real-time timing deviations live in the
[Real-Time and Timing-Critical Code](#real-time-and-timing-critical-code) section.

## Formatting and Linting

### Prettier

Prettier is the single source of truth for formatting.

No manual style decisions, because a formatter that is overridden by hand produces inconsistent
style.

Configure in `.prettierrc`.

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### ESLint

Use ESLint 9 flat config format with `typescript-eslint`.

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
```

ESLint with `eslint-plugin-react-hooks` and `@typescript-eslint` enforces the following.

- Disallow unused variables.
- Enforce strict TypeScript types on all exports.
- Enforce hook dependency arrays, and require a `// REASON:` comment for exceptions.
- Disallow `any`.

Both tools are enforced in CI.

A pull request that fails either check is not accepted.

## Testing

### Framework

- Vitest for unit testing of pure modules and domain logic.
- React Testing Library for component tests.

### Test Organisation

Place test files beside the source as `*.test.ts` or `*.test.tsx`,
or mirror the source structure in `test/`, per the project convention.

```
test/
  components/             Component tests
  hooks/                  Hook tests
  stores/                 Store tests
  services/               Service tests
  integration/            Integration tests
  fixtures/               Committed test data
  setup.ts                Global test setup
```

### Test Setup

Create `test/setup.ts` for global test configuration when the project uses a `test/` tree.

```typescript
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { clamp } from '@/utils/math';

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from '@/components/Counter';

describe('Counter', () => {
  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<Counter value={5} onChange={handleChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '10' } });
    expect(handleChange).toHaveBeenCalled();
  });
});
```

### Coverage Requirements

Every public function in pure logic modules has full unit test coverage: normal cases,
boundary values, and error paths.

Maintain at least 80 percent line, function, branch, and statement coverage where a coverage gate
exists.

A pull request that reduces test coverage of pure logic modules is not accepted.

### Service Layer Testing

For companion services, test the service layer in isolation from the database and network using
test doubles such as stubs, spies, and fakes.

Do not mock the database for integration tests,
and use a real test database or an in-memory equivalent instead,
because a mocked database does not test SQL correctness.

Test HTTP handlers by mounting the application and making real HTTP calls within the test process.

### Running Tests

```bash
npm test                    # Run all unit and component tests
npm run test:coverage       # Run tests with coverage
npm run test:e2e            # Run Playwright end-to-end tests
```

## Build

The application builds to a static bundle with no runtime dependencies on a server.

### Vite Configuration

Use Vite with deterministic filenames for cache-friendly deploys and Electron compatibility.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

Output is written to `dist/`.

The bundle contains only HTML, CSS, and JavaScript.

### Build Scripts

```json
{
  "scripts": {
    "dev": "vite --port 3000",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 3000",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

## Dependencies

npm is the package manager - add with `npm add <pkg>` or `npm add -D <pkg>` for development
dependencies, remove with `npm remove <pkg>`.

Common dependencies:

| Package                                                    | Purpose                |
| ---------------------------------------------------------- | ---------------------- |
| `react`, `react-dom`                                       | UI framework           |
| `typescript`                                               | TypeScript compiler    |
| `vite`                                                     | Build tool             |
| `vitest`, `@vitest/coverage-v8`                            | Test runner + coverage |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` | Linter                 |
| `prettier`                                                 | Formatter              |
| `@testing-library/react`, `@testing-library/jest-dom`      | Component testing      |
| `zustand`                                                  | Client state, optional |
| `@tanstack/react-query`                                    | Server state, optional |
| `tailwindcss`                                              | Styling, optional      |
| `zod`                                                      | Validation             |

Prefer versions published at least 7 days ago - avoid floating ranges that auto-resolve to
brand-new releases.

Add a dependency only when the need is concrete and the alternative is significantly more complex.

Evaluate the maintenance status, license, and bundle size impact before adding a new library.

Prefer libraries with active maintenance and a permissive license such as MIT, Apache 2.0, BSD,
or ISC.

### Security and Updates

Run `npm audit` regularly to check for security vulnerabilities.

Keep dependencies updated to mitigate known security issues.

Address deprecated packages promptly, because a deprecated package often carries vulnerabilities.

Use `npm outdated` to identify packages needing updates.

Verify compatibility with peer dependencies before upgrading.

### npm Overrides

When transitive dependencies have vulnerabilities that cannot be resolved by updating direct
dependencies, force a version with npm overrides.

```json
{
  "overrides": {
    "glob": "^11.0.0",
    "rimraf": "^6.0.0"
  }
}
```

## Comments

Code is self-documenting through naming.

Comments, docblocks, and identifiers are written in English,
per the source-language rule in the project style guide.

Comments are appropriate in the following cases.

- A `// REASON:` comment on a non-obvious decision,
  such as a browser quirk or a deviation from the obvious approach.
- A reference to an external specification when behaviour is derived from it.
- JSDoc for public APIs and hooks.
- A block comment at the top of each pure logic module stating its single responsibility.

Never use numbered comments.

Do not comment what the code does, because the code itself states that.

Do not leave commented-out code, because version control preserves history.

## Verification

| Check                          | Command Or Method                                      | Applies To           |
| ------------------------------ | ------------------------------------------------------ | -------------------- |
| Type check passes              | `tsc --noEmit`                                         | All TypeScript files |
| Lint passes                    | `eslint .`                                             | All TypeScript files |
| Format check passes            | `prettier --check .`                                   | All files            |
| Tests pass                     | `npm test`                                             | All tests            |
| Coverage meets threshold       | `npm run test:coverage`                                | All tests            |
| Build succeeds                 | `npm run build`                                        | All projects         |
| No `any` type                  | Grep for `: any` and `as any` in `src/`                | All TypeScript files |
| No `console.log` in production | Grep for `console.log` in `src/`                       | All TypeScript files |
| No `document.querySelector`    | Grep for `document.querySelector` in `src/components/` | All components       |
| No hardcoded secrets           | Grep for `password`, `secret`, `apiKey` in `src/`      | All TypeScript files |
| No floating promises           | ESLint `no-floating-promises` rule                     | All TypeScript files |
| Component tests pass           | `npx vitest run tests/`                                | All unit tests       |
| No deprecated `forwardRef`     | `grep -r -n "forwardRef(" src/` must be zero           | Deprecated pattern   |

## Definition of Done

### Correctness

- `tsc --noEmit` produces no errors.
- `eslint .` produces no errors.
- No `any` type was introduced.
- No `console.log` was introduced in production code.
- No floating promise was introduced.
- Tests cover normal cases, boundary values, and error paths.

### Structure

- The project layout matches the confirmed project kind.
- No circular dependency was introduced.
- Pure logic modules have no React dependency.
- Aim below approximately 500 lines per source file.
- No file exceeds approximately 1000 lines without a recorded justification.
- Every component is a function component.

### Interface

- Every public API has a typed signature.
- Every props interface is named with the `Props` suffix.
- Every hook starts with `use`.
- Every error class ends with `Error`.

### Quality

- `prettier --check .` produces no output.
- No debugging output or commented-out code remains.
- Comments explain reasons, not actions.

### Interaction

- Every `useEffect` has a correct dependency array or a `// REASON:` comment.
- Every event listener is removed in cleanup.
- Every timer is cleared in cleanup.
- Every `requestAnimationFrame` loop is cancelled in cleanup.
- Every `async` call is awaited or explicitly voided with a comment.

### Hygiene

- `node_modules/`, `dist/`, and `coverage/` are gitignored.
- No secret, token, or credential was committed.
- `.env` files are gitignored.
- Documentation was updated when the change altered the public API, the build, or a project rule.

## General Principles

**Single Responsibility.** One function does one thing, one component has one reason to change,
one module owns one domain concept.

**Immutability.** Prefer immutable updates for state changes,
because a mutation is harder to trace than a replacement.

**Composition.** Build complex components and services from simple, focused parts,
because composition is more flexible than inheritance.

**Fail Fast.** Validate preconditions at the entry point of a function or service,
because a failure detected late is harder to trace.

**No Global State.** All state flows through React's data flow, explicit stores,
or dependency injection, because global mutable state makes tests order-dependent.

**Open/Closed.** Extend modules via composition and configuration, not by modifying existing code,
because modification breaks callers.

**Dependency Inversion.** Core business logic does not depend on UI frameworks, database drivers,
or network clients, because a dependency on a concrete implementation is a coupling that resists
change.

**Zero Warnings.** A TypeScript error or an ESLint error is either a defect or a rule the project
does not want, and both cases require an action.

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Directories-only grouping.** When a source directory holds domain subdirectories, it holds no
files directly - every file lives in a named domain subdirectory, and single-file directories are
acceptable when a domain has one member. The `src/` root may keep its entry files (application
entrypoint, root component, entry stylesheets) as the recorded exception.

**Branded domain identifiers.** Domain identifier types (entity ids that are all `number` or
`string` underneath) are branded so a song id can never bind to an instrument id. Factories accept
the raw type or the brand and convert at boundaries - parsing, storage, IPC - so the interior stays
strongly typed.

**Repeated-action detection.** A store action that must notify subscribers even when the payload is
unchanged (a dialog re-request, a repeated selection) carries a transient monotonic counter or
version field excluded from the persisted slice, so subscribers detect the repeat without relying on
reference equality.

**Hook extraction ordering.** A hook extracted out of an orchestrating component is called before
the earliest consumer of its returned values - a `TS2448` block-scoped error is the symptom of a
too-late call. Extraction parameters are typed to the source's real signatures, never a guessed
shape - a wrapped setter may be `(value) => void`, not `Dispatch<SetStateAction>`.

**Empty catch convention.** A deliberately empty catch is written `{ // ignore }`, stays rare, and
marks an intentional discard rather than forgotten error handling.

**Trusted markup boundary.** Content rendered through `dangerouslySetInnerHTML` is typed as a
trusted brand produced only by the escaping renderer, and fetch sinks for bundled documents run
behind an allowlist that rejects unexpected names and non-markup bodies.

## Sources

The following authoritative references support the rules in this document.

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) and
  [TSConfig Reference](https://www.typescriptlang.org/tsconfig) - the language rules and the strict
  compiler settings.
- [React Documentation](https://react.dev/) and
  [React API Reference](https://react.dev/reference/react) - components, hooks, and rendering.
- [Vite Guide](https://vitejs.dev/guide/) - the dev server, build,
  and environment-variable handling.
- [Zod](https://zod.dev/) - schema-based runtime validation at trust boundaries.
- [Vitest](https://vitest.dev/) and
  [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - the test
  runner and DOM testing approach.
- [TanStack Query](https://tanstack.com/query/latest) - the server-state library conventions, when
  adopted.
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) - the client-state store
  conventions, when adopted.
- [Tailwind CSS](https://tailwindcss.com/docs) - the utility-first styling rules, when adopted.
- [typescript-eslint](https://typescript-eslint.io/) - the lint rules behind the zero-warnings gate.

## Project Conventions

Project-specific conventions extend the standard above for the DOSOUND Tracker codebase.

- `useLocalStorageState` in `src/hooks/storage/` is the shared hook for localStorage-backed
  state; states sharing one JSON key are not split without a schema change.
- `useUiStore` in `src/hooks/ui/` is the single Zustand store for cross-component UI state.
- `@testing-library/react` does not auto-cleanup: every component test registers
  `afterEach(() => cleanup())`. Spy on `localStorage` itself, never `Storage.prototype`.
  `fetch` stubs return the full Response surface the code reads.
- `src/assets/song.yaml` is imported with a `?raw` query suffix - query-suffixed specifiers
  are treated as import specifiers in every move refactoring.
