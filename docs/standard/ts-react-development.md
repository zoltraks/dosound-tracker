# TypeScript/React Engineering Standards

## Scope

This document defines general TypeScript and React engineering standards.
It covers language conventions, component patterns, state management guidance, testing, and tooling.

Apply these standards unless a project-specific document overrides them.

## Audio-Critical Override

This project is a real-time audio application where timing is critical.
The `GUIDELINES.md` document defines audio-critical development principles that override standard React best practices.

The following patterns are intentional and must not be "fixed" in audio-critical code paths:

- **Prop mirroring**: local state synced with props for stable timing.
- **Sparse dependency arrays**: minimal dependencies to prevent unnecessary re-renders.
- **Direct setState calls**: synchronous state updates for predictable timing.
- **Manual memoization**: carefully controlled memoization vs React's automatic optimizations.

Consult `GUIDELINES.md` before applying any linting fixes or React optimisations to audio-related code.

## Documentation

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — official reference
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig) — compiler options

### React

- [React Documentation](https://react.dev/) — official reference
- [React Hooks API](https://react.dev/reference/react) — hooks reference

## Core Technologies

Projects using this standard adopt:

- **React**: functional components only. Class components are not used.
- **TypeScript**: strict mode enabled. No JavaScript in source directories.
- **Build tool**: a modern bundler with fast HMR and optimized production builds.
- **Styling**: a utility-first or component-based CSS approach with a single source of truth for design tokens.
- **State management**: choose the smallest appropriate scope for state.
- **Testing**: a modern test runner with component and unit testing utilities.
- **Linting**: ESLint with TypeScript support, enforced in CI.
- **Formatting**: a single formatter configuration shared by the whole team.

Dependencies are added only when the need is concrete and the alternative is significantly more complex.

## Project Structure

Organize source code by responsibility. Typical directories include:

- `components/` — React components
- `hooks/` — custom React hooks
- `utils/` — pure utility functions
- `types/` — TypeScript type definitions
- `stores/` — global state modules
- `exports/` — export format logic
- `synth/` — audio synthesis and hardware emulation
- `workers/` — Web Worker modules
- `constants/` — constant definitions

Group related files together. Use barrel exports only when they meaningfully aggregate a domain and do not create tight coupling.

### File Naming Conventions

- React components: `PascalCase.tsx`
- Custom hooks: `useCamelCase.ts`
- Utilities, stores, and non-component modules: `camelCase.ts`
- Test files: `PascalCase.test.ts` or `PascalCase.test.tsx`

### Version Control Exclusions

Maintain a root `.gitignore` to exclude dependencies, build output, environment files, coverage, IDE files, and OS files.

## Naming Conventions

### Code Conventions

- Components: `PascalCase` — `Button`, `Panel`.
- Hooks: `useCamelCase` — `useForm`, `useSelection`.
- Interfaces/Types: `PascalCase`, no `I` prefix — `SceneNode`, `ToolOptions`.
- Type aliases: `PascalCase` — `NodeType`, `BlendMode`.
- Functions and methods: `camelCase` — `drawNode()`, `updateSelection()`.
- Variables: `camelCase` — `currentNode`, `zoomLevel`.
- Constants: `UPPER_SNAKE_CASE` — `DEFAULT_ZOOM`, `MAX_HISTORY_SIZE`.

### Abbreviation Rule

Avoid abbreviations in identifiers. Use full words:

- `Config` → `Configuration`
- `Idx` → `Index`
- `Num` → `Number`
- `Btn` → `Button`

Domain-specific abbreviations are acceptable only when they are established terms in the project domain and are consistently applied.

### CSS

- Use utility classes or component-scoped styles as the primary styling method.
- Custom CSS class names use `camelCase` or `kebab-case`.

## TypeScript Configuration

Use TypeScript project references for better build performance and separation when the project grows beyond a single package.

### Import Paths

Prefer absolute imports with path aliases for cross-module imports. Avoid deep relative imports when a path alias is available.

```typescript
// Correct
import { Button } from '@/components/Button';
import { useForm } from '@/hooks/useForm';

// Avoid
import { Button } from '../../components/Button';
```

## Code Conventions

### React Components

- Functional components only. No class components.
- Props interface named with `Props` suffix: `ButtonProps`.
- Destructure props in the function signature.
- Prefer `export function` over `React.FC`.
- Return types are optional unless they aid clarity.

### Hooks

- Custom hooks start with `use`.
- Keep hooks focused on a single responsibility.
- Document hook parameters and return values with JSDoc when they are public.

### State Management

- Use global state only when state crosses component boundaries.
- Use context or stores for shared state, and `useState`/`useReducer` for component-local state.
- Prefer colocating state with the components that consume it.

#### Detecting Repeated Actions in Zustand

Zustand selectors only trigger re-renders when the selected value changes. If a user action must be detected by a component even when the value is unchanged, the store must also expose a transient version or counter that increments on every action.

- Keep the version field transient: add it to the store state, but exclude it from the `persist` `partialize` function so it is not saved to `localStorage`.
- Increment the version inside the action that sets the primary value.
- Components that react to the action include the version in their effect dependency arrays, while components that only need the value continue to select only the value.
- Never use a timestamp or version alone as the value; the primary value remains the canonical source of truth.

### Error Handling

- Use error boundaries for component-level error isolation.
- Define domain-specific error classes for domain errors.
- Never swallow errors silently.

### Async/Await

- Use `async/await` exclusively.
- Always `await` promises. Floating promises are forbidden.
- Handle errors with try/catch.

### Forbidden Patterns

- `any` type — disallowed. Use `unknown` when the type is genuinely unknown.
- Non-null assertion (`!`) without a `// REASON:` comment.
- `@ts-ignore` without a `// REASON:` comment.
- `console.log` in production code — use proper logging or remove.
- `setState` in `useEffect` without a dependency check — causes infinite loops.
- Direct DOM manipulation outside of React refs.

**Audio-Critical Exception**

The `setState` in `useEffect` prohibition does not apply to audio-critical code paths documented in `GUIDELINES.md`. In audio paths, synchronous state updates are intentional for predictable timing.

## Component Organization

### Single Responsibility

Each component does one thing:

- Container components manage state and pass data to children.
- Presentational components receive props and render UI.
- Hooks encapsulate reusable logic.

### Props Drilling Avoidance

Do not pass props through many layers. Use context or stores instead.

### Shared UI Components

Shared UI primitives such as modals, dialogs, and panels must be presentational. They receive display data and callbacks via props or their own store state. Business logic belongs at the call site or in dedicated hooks.

### Modal Components

- No action-specific branching inside modal components. The caller provides the title, message, and callback.
- Use composition and props for extension, not internal switch statements.
- Prop interfaces should be minimal. Prefer a simple interface over a discriminated union that forces every caller to understand every variant.
- Presentational components depend on abstractions (callbacks, props) rather than concrete stores or command factories beyond their own domain.
- When a callback is captured as a closure at the time a modal opens, resolve current state inside the closure using the store's `getState()` method rather than capturing the full state snapshot.

## Testing

### Test Organization

Keep tests close to the code they exercise. Co-locate unit tests with source files or place them in a dedicated `test/` directory with a mirrored structure.

### Unit Tests

- One test file per module.
- Cover happy paths, edge cases, and error conditions.
- Mock external dependencies and browser APIs.

### Component Tests

- Test behavior, not implementation.
- Prefer queries that reflect user intent (`getByRole`, `getByLabelText`).
- Avoid testing internal state or implementation details.

## Build

### Bundler Configuration

Configure the build tool for deterministic output and, when applicable, desktop application compatibility.

### Build Scripts

Define build, test, and lint scripts in the project manifest. Every project must be buildable with a single command.

## Formatting and Linting

- Use a flat ESLint config with TypeScript support.
- Use a single Prettier configuration for the whole project.
- Both tools must run in CI. A pull request that fails either check is not accepted.

## Comments

Code is self-documenting through naming. Limit comments to:

- A `// REASON:` comment on a non-obvious decision.
- JSDoc for public APIs and hooks.
- A file-level comment stating single responsibility.

Never use numbered comments. Do not comment what the code does. Do not leave commented-out code.

## Dependency Management

### Security and Updates

- Run the package manager's security audit regularly.
- Keep dependencies updated to mitigate known security issues.
- Address deprecated packages promptly.
- Check compatibility with peer dependencies when updating.
- Ensure related tooling versions match (for example coverage provider and test runner major versions).

### Update Process

1. Update the project manifest with the latest compatible versions.
2. For transitive dependencies that cannot be updated directly, use package manager overrides.
3. Reinstall dependencies.
4. Run the security audit to verify fixes.
5. Run the test suite to ensure compatibility.
6. Commit changes with a clear message about the updates.

## Refactoring Proposals

When asked to create a refactoring proposal without specific focus areas, analyze the codebase focusing on:

- Best-practices compliance.
- Code cleanliness and readability.
- Type safety — eliminate `any`, use `unknown` when genuinely unknown.
- Naming conventions — avoid abbreviations.
- Performance — unnecessary re-renders, bundle size, inefficient algorithms.
- Code duplication — extract shared utilities, apply DRY.
- Separation of concerns — single responsibility per component and function.
- Error handling and error boundaries.
- Testing coverage.

The analysis must be autonomous. Examine recent changes, the current codebase, existing guidelines, and good practices to determine the most valuable refactoring focus.

## General Principles

### Clean Code

Write readable, self-documenting code.

### Single Responsibility

Each function does one thing. Each component has one reason to change.

### Immutability

Prefer immutable updates for state changes.

### Composition

Build complex components from simple ones.

### Performance

Optimize intentionally. Profile before optimizing. Use memoization where it provides measurable benefit.

### No Global State

All state flows through React's data flow or explicit stores.
