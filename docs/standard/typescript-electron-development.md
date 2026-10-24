# TypeScript, React, and Electron Desktop Engineering Standards

<!-- Version: 0.1.4 | Date: 2026-10-24 -->

## Purpose

This document defines the engineering standard for desktop applications built with TypeScript,
React 19, and Electron 35.

It covers the language version, the project layout, the Electron main and preload conventions,
the renderer conventions, the security model, the testing, and the packaging.

It builds on the TypeScript engineering standard and adds only the Electron+React-specific rules.

It is written to be executed directly by an AI coding agent and to be read without effort by a human
reviewer.

## Scope

A project is in scope when all of the following conditions hold.

- The project is a desktop application built with Electron.
- The renderer process is a React 19 application written in TypeScript.
- The main and preload scripts are CommonJS modules consumed by Electron.

A project that uses Tauri instead of Electron is out of scope,
because Tauri has a different process model and a Rust-based backend.

A project that uses Electron with a renderer that is not React, such as Vue or Svelte,
is partially in scope: the Electron-specific sections apply, but the React-specific sections do not.

A project that is a pure web application without Electron is covered by the companion
TypeScript/React standard instead.

## How To Use This Standard

This section is the entry point for an agent.

Read it before reading anything else in this document.

### Order Of Operations

Follow these steps in order at the start of every task that touches Electron, TypeScript,
or React code.

1. Read the project rules file, such as `AGENTS.md`, `README.md`, or `docs/GUIDELINES.md`,
   because a project rule overrides this standard.
2. Read the TypeScript engineering standard for shared language, tooling, and dependency rules.
3. Determine the Electron version, the React version, the TypeScript version, the build tool,
   and the packaging tool using the Agent Intake Protocol below.
4. Confirm the conclusion with the user when the repository is ambiguous or empty.
5. Apply the sections of this standard that match the confirmed project kind.
6. Run every applicable row of the Verification section.
7. Check the result against the Definition of Done before reporting the task complete.

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                           |
| ---- | ----------------------------------------- | ------------------------------------------------- |
| 1    | An explicit instruction from the user     | "Keep this project on Electron 30"                |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`                 |
| 3    | The existing convention in the repository | electron-forge already used for packaging         |
| 4    | The TypeScript engineering standard       | Strict mode, ESLint, Prettier, Zod, OpenTelemetry |
| 5    | This standard                             | Electron 35, React 19, Vite 7, electron-builder   |
| 6    | General Electron and React best practice  | Anything the five sources above do not cover      |

Never silently reformat existing code to match this standard.

A whole-repository reformat destroys review history and hides the real change inside noise.

Bring a deviation to the user as a proposal, not as an unrequested edit.

### Non-Negotiable Rules

- **Context isolation is enabled.** A `BrowserWindow` with `contextIsolation: false` is a security
  defect.
- **Node integration is disabled in the renderer.** A `BrowserWindow` with `nodeIntegration: true`
  is a security defect.
- **Sandbox is enabled.** A `BrowserWindow` with `sandbox: false` without a `// REASON:` comment is
  a security defect.
- **The preload script uses `contextBridge.exposeInMainWorld`.
  ** Direct `window` assignment in the preload is a defect.
- **No `any` type.** Use `unknown` when the type is genuinely unknown,
  because `any` disables the type system.
- **No `console.log` in production code.** Use a structured logger,
  because console output bypasses log levels.
- **No hardcoded secrets.** A secret in a committed file is a security incident.
- **`eslint .` produces no errors.** An ESLint error is a defect.
- **`tsc --noEmit` produces no errors.** A TypeScript error is a defect.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

Before asking the user anything, inspect the repository and infer the project shape.

| Signal Found In The Repository            | Inferred Decision                         | Confidence |
| ----------------------------------------- | ----------------------------------------- | ---------- |
| `package.json` with `electron`            | Electron desktop application              | High       |
| `electron/main.cjs` or `electron/main.js` | Electron main process entry point         | High       |
| `electron/preload.cjs`                    | Preload script with contextBridge pattern | High       |
| `package.json` with `electron-builder`    | electron-builder packaging                | High       |
| `package.json` with `@electron-forge/cli` | Electron Forge packaging                  | High       |
| `package.json` with `react` 19            | React 19 renderer                         | High       |
| `package.json` with `vite` 7              | Vite 7 build tool                         | High       |
| `package.json` with `typescript` 5.9      | TypeScript 5.9                            | High       |
| `package.json` with `vitest`              | Vitest test framework                     | High       |
| `package.json` with `@playwright/test`    | Playwright for E2E                        | High       |
| No Electron files at all                  | New project                               | High       |

### Existing Project

When detection is confident, state the conclusion and ask for a single confirmation rather than
running a questionnaire.

Example: "I see Electron 35, React 19, TypeScript 5.9 with strict mode,
Vite 7 for the renderer build, electron-builder for packaging, and Vitest for testing.

I will follow the existing conventions.

Is that correct?"

When detection is ambiguous, ask only the questions that resolve the ambiguity.

### New Project

When the repository is empty or the user declares a new project, ask the following questions.

| Question                | Options                          | Default If Declined |
| ----------------------- | -------------------------------- | ------------------- |
| Which Electron version? | Latest stable, specific version  | Latest stable       |
| Which React version?    | React 19, React 18               | React 19            |
| Which packaging tool?   | electron-builder, Electron Forge | electron-builder    |
| Which test framework?   | Vitest, Jest                     | Vitest              |

## Documentation

The following are the authoritative sources for Electron, TypeScript, and React development.

- [Electron Documentation](https://www.electronjs.org/docs/latest) - official Electron reference.
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security) - security best
  practices.
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) -
  context isolation model.
- [Electron Sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox) - sandboxing model.
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc) - inter-process communication.
- [electron-builder](https://www.electron.build/) - packaging and distribution.
- The general TypeScript engineering standard - base language and tooling rules.
- [React Documentation](https://react.dev/) - official React reference.
- [Vite Documentation](https://vitejs.dev/guide/) - build tool reference.
- The general accessibility engineering standard - WCAG 2.2 AA + axe-core.
- The performance budgets engineering standard - Core Web Vitals + bundle budgets.

## Language Version

The project targets TypeScript 5.9 or newer with strict mode enabled.

The project targets Node.js 22 LTS or newer for the Electron main process and tooling.

Do not use JavaScript in source files.

TypeScript is required for all source code in `src/`.

The Electron main and preload scripts are CommonJS (`.cjs`),
because the Electron main process runs in a CommonJS context.

## Project Structure

```
src/
  components/             React components
  hooks/                  Custom React hooks
  stores/                 Zustand stores
  services/               API and business logic services
  types/                  TypeScript type definitions
  utils/                  Utility functions
  constants/              Constant definitions
  modals/                 Modal dialog components
  renderer/               Canvas or WebGL rendering logic
  io/                     Import and export modules
  i18n/                   Internationalisation
electron/
  main.cjs                Electron main process
  preload.cjs             Electron preload script
test/
  [Mirrored structure]
```

Each directory has a single, clearly defined responsibility.

Barrel exports (`index.ts`) may be used in `types/` directories to aggregate domain exports.

All other directories import from specific files,
because barrel exports in component directories hide dependencies and slow down bundlers.

### Version Control Exclusions

Maintain `.gitignore` at project root to exclude `node_modules/`, `dist/`, `release/`, `.env*`,
`coverage/`, IDE files, and OS files.

## Naming Conventions

| Element               | Convention                  | Example                              |
| --------------------- | --------------------------- | ------------------------------------ |
| Components            | `PascalCase`                | `App`, `DataGrid`, `PropertiesPanel` |
| Hooks                 | `useCamelCase`              | `useCanvas`, `useSelection`          |
| Interfaces and types  | `PascalCase`, no `I` prefix | `UserProfile`, `ToolOptions`         |
| Type aliases          | `PascalCase`                | `NodeType`, `BlendMode`              |
| Functions and methods | `camelCase`                 | `drawNode`, `updateSelection`        |
| Variables             | `camelCase`                 | `currentNode`, `zoomLevel`           |
| Constants             | `UPPER_SNAKE_CASE`          | `DEFAULT_ZOOM`, `MAX_HISTORY_SIZE`   |
| Component files       | `PascalCase.tsx`            | `App.tsx`, `DataGrid.tsx`            |
| Hook files            | `useCamelCase.ts`           | `useLocalStorage.ts`                 |
| Electron main         | `main.cjs`                  | `electron/main.cjs`                  |
| Electron preload      | `preload.cjs`               | `electron/preload.cjs`               |
| Test files            | `PascalCase.test.tsx`       | `DataGrid.test.tsx`                  |

### Abbreviation Rule

Avoid abbreviations in identifiers.

Use full words, because an abbreviation saves two characters and costs a reader a lookup.

| Avoid    | Use             |
| -------- | --------------- |
| `Config` | `Configuration` |
| `Idx`    | `Index`         |
| `Num`    | `Number`        |
| `Btn`    | `Button`        |

Domain-specific abbreviations that are established terms in the project vocabulary are permitted
when explicitly documented in the project rules file.

## TypeScript Configuration

### Project References

Use TypeScript project references for better build performance and separation.

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.app.json` (Renderer Application Code)

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

### State Management

- Use Zustand for global state that crosses component boundaries.
- Use React Context for localised state within a subtree.
- Use `useState` and `useReducer` for component-local state.

### Zustand Store Pattern

Stores use the Zustand `create` API.

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

### Error Handling

- Use React Error Boundaries for component-level error isolation.
- Define domain-specific error classes for engine errors.
- Never swallow an error silently, because a swallowed error hides a failure.

```typescript
export class EngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'EngineError';
  }
}
```

### Async Programming

Use `async/await` exclusively.

Always `await` promises.

Floating promises are forbidden, because a floating promise's rejection is unhandled.

Handle errors with `try/catch`.

### Forbidden Patterns

- `any` type, because it disables the type system.
- Non-null assertion (`!`) without a `// REASON:` comment, because it suppresses a null check.
- `@ts-ignore` without a `// REASON:` comment, because it suppresses a type error.
- `console.log` in production code, because console output bypasses structured logging.
- `setState` in `useEffect` without a dependency guard, because it causes infinite loops.
- Direct DOM manipulation outside of React refs, because it bypasses React's reconciliation.

### Secure Electron Boundaries

The preload script exposes a typed bridge, never a raw `ipcRenderer`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath: string): Promise<string> => {
    // Input validation before dispatch
    if (typeof filePath !== 'string' || filePath.length === 0) {
      return Promise.reject(new Error('Invalid file path'));
    }
    return ipcRenderer.invoke('file:read', filePath);
  },
});
```

The main process creates windows with the sandbox on and external navigation denied:

```typescript
import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  return win;
}
```

Exposing raw `ipcRenderer` to `window`, setting `nodeIntegration: true`, and
loading unvalidated URLs are forbidden.

## Electron Integration

### Main Process

The Electron main process (`electron/main.cjs`) handles window creation and IPC communication.

Use CommonJS format (`.cjs`), because the Electron main process runs in a CommonJS context.

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000/');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.webContents.send('app-close-requested');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('app-close-confirmed', () => {
  isQuitting = true;
  if (mainWindow) {
    mainWindow.close();
  } else {
    app.quit();
  }
});
```

### Preload Script

The preload script (`electron/preload.cjs`)
exposes secure APIs to the renderer process using `contextBridge`.

Expose only the minimum surface area required by the renderer,
because every exposed function is an attack surface.

Validate callback types before registering IPC listeners,
because a non-function callback throws at call time instead of at registration time.

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onAppCloseRequested(callback) {
    if (typeof callback !== 'function') return;
    ipcRenderer.on('app-close-requested', callback);
  },
  removeAppCloseRequestedListener(callback) {
    if (typeof callback !== 'function') return;
    ipcRenderer.removeListener('app-close-requested', callback);
  },
  confirmAppClose() {
    ipcRenderer.send('app-close-confirmed');
  },
  cancelAppClose() {
    ipcRenderer.send('app-close-cancelled');
  },
  getRuntimeInfo() {
    const versions = process.versions || {};
    return {
      runtime: 'electron',
      electron: typeof versions.electron === 'string' ? versions.electron : undefined,
      node: typeof versions.node === 'string' ? versions.node : undefined,
      chrome: typeof versions.chrome === 'string' ? versions.chrome : undefined,
    };
  },
});
```

### Renderer Detection

The renderer detects Electron at runtime by checking for the `window.electronAPI` object exposed by
the preload script.

There is no separate type declaration file,
because the preload API is consumed directly where needed.

## Security

Electron desktop applications run with the user's full operating system permissions.

A compromised renderer can execute arbitrary native code if the security model is not enforced.

The following rules are non-negotiable.

### Context Isolation

Context isolation is enabled by default since Electron 12 and must remain enabled.

A `BrowserWindow` with `contextIsolation: false` is a security defect,
because it allows the renderer to access Electron internals and preload script globals.

### Node Integration

Node integration is disabled by default and must remain disabled in the renderer.

A `BrowserWindow` with `nodeIntegration: true` is a security defect,
because it gives the renderer direct access to the filesystem and the operating system.

### Sandbox

The sandbox is enabled by default since Electron 20 and must remain enabled.

A sandboxed renderer cannot access Node.js APIs and can only perform privileged tasks through IPC to
the main process.

Disabling the sandbox without a `// REASON:` comment is a security defect.

### Preload Script Surface

The preload script exposes only the minimum API required by the renderer.

Every exposed function is validated and scoped,
because an unvalidated function is an attack surface.

Never expose `ipcRenderer` directly, because a raw `ipcRenderer` allows the renderer to send
arbitrary IPC messages.

### Content Security Policy

Set a Content Security Policy in the renderer to restrict loaded resources,
because a missing CSP allows arbitrary script injection.

### Remote Content

Do not load remote content in a desktop application with full system access,
because remote content is untrusted.

If remote content is required, load it in a `BrowserView` or `<webview>` with reduced privileges and
a strict CSP.

## Styling

### Tailwind CSS

Use Tailwind utility classes for layout and structural styling.

```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Click me</button>
```

### Custom CSS

For component-specific styles that do not map cleanly to Tailwind utilities,
use plain CSS files alongside the component, such as `ColorPicker.css`.

Global theme variables and custom properties live in `src/index.css`.

### Theme Variables

Define colours as CSS custom properties on `:root` and any theme variants such as `.light`.

Update them dynamically via a hook that reads from the settings store.

## Testing

### Test Organisation

Mirror source structure in `test/`.

```
test/
  components/             Component tests
  hooks/                  Hook tests
  stores/                 Store tests
  integration/            Integration tests
  fixtures/               Committed test data
  setup.ts                Global test setup
```

### Test Setup

Create `test/setup.ts` for global test configuration.

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

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn((contextId: string) => {
    if (contextId === '2d') {
      return {
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        drawImage: vi.fn(),
      };
    }
    return null;
  }),
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

Maintain at least 80 percent line, function, branch, and statement coverage.

Every exported function has at least one unit test.

### Running Tests

```bash
npm test                    # Run all unit and component tests
npm run test:coverage       # Run tests with coverage
npm run test:e2e            # Run Playwright end-to-end tests
```

## Build

### Vite Configuration

Use Vite with deterministic filenames for Electron compatibility,
because Electron loads files from the local filesystem and content hashes break file references.

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
  preview: {
    port: 3000,
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
    "test:e2e": "playwright test",
    "electron:dev": "concurrently -k \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:preview": "npm run build && electron ."
  }
}
```

### electron-builder Configuration

Add to `package.json`:

```json
{
  "main": "electron/main.cjs",
  "build": {
    "appId": "com.example.myapp",
    "productName": "MyApp",
    "files": ["dist/**/*", "electron/**/*", "package.json"],
    "directories": {
      "output": "release"
    },
    "mac": {
      "category": "public.app-category.utilities",
      "icon": "public/icons/icon-512.png"
    },
    "win": {
      "target": ["nsis", "zip"],
      "icon": "public/icons/icon.ico"
    },
    "linux": {
      "target": ["AppImage", "tar.gz"],
      "category": "Utility"
    }
  }
}
```

## Dependencies

### Security and Updates

Run `npm audit` regularly to check for security vulnerabilities.

Keep dependencies updated to mitigate known security issues.

Address deprecated packages promptly, because a deprecated package often carries vulnerabilities.

Use `npm outdated` to identify packages needing updates.

Verify compatibility with peer dependencies before upgrading.

### Adding Dependencies

Add a dependency only when the need is concrete and the alternative is significantly more complex.

Evaluate the maintenance status, license, and bundle size impact before adding a new library.

Prefer libraries with active maintenance and a permissive license such as MIT, Apache 2.0, BSD,
or ISC.

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

## Formatting and Linting

### ESLint Flat Config

Use ESLint 9 flat config format with `typescript-eslint`.

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'release', 'node_modules', 'coverage']),
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

### Prettier

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

Both tools run in CI.

A pull request that fails either check is not accepted.

## Comments

Code is self-documenting through naming.

Limit comments to the following.

- A `// REASON:` comment on a non-obvious decision.
- JSDoc for public APIs and hooks.
- A file-level comment stating single responsibility.

Never use numbered comments.

Do not comment what the code does, because the code itself states that.

Do not leave commented-out code, because version control preserves history.

## Verification

| Check                          | Command Or Method                                               | Applies To           |
| ------------------------------ | --------------------------------------------------------------- | -------------------- |
| Type check passes              | `tsc --noEmit`                                                  | All TypeScript files |
| Lint passes                    | `eslint .`                                                      | All TypeScript files |
| Format check passes            | `prettier --check .`                                            | All files            |
| Tests pass                     | `npm test`                                                      | All tests            |
| Coverage meets threshold       | `npm run test:coverage`                                         | All tests            |
| Renderer build succeeds        | `npm run build`                                                 | Renderer             |
| Electron package builds        | `npm run electron:build`                                        | All platforms        |
| Context isolation enabled      | Grep for `contextIsolation: true` in `electron/`                | Main process         |
| Node integration disabled      | Grep for `nodeIntegration: false` in `electron/`                | Main process         |
| Sandbox enabled                | Grep for `sandbox: true` in `electron/`                         | Main process         |
| No `any` type                  | Grep for `: any` and `as any` in `src/`                         | All TypeScript files |
| No `console.log` in production | Grep for `console.log` in `src/`                                | All TypeScript files |
| No hardcoded secrets           | Grep for `password`, `secret`, `apiKey` in `src/`               | All TypeScript files |
| No `contextIsolation: false`   | `grep -r -n "contextIsolation:\s*false" src/main/` must be zero | Main process         |
| No `nodeIntegration: true`     | `grep -r -n "nodeIntegration:\s*true" src/main/` must be zero   | Main process         |
| Desktop E2E suite              | `npx playwright test tests/e2e/`                                | E2E test suite       |

## Definition of Done

### Correctness

- `tsc --noEmit` produces no errors.
- `eslint .` produces no errors.
- No `any` type was introduced.
- Context isolation, node integration disabled, and sandbox enabled are verified.
- Tests cover normal cases, boundary values, and error paths.

### Structure

- The project layout matches the confirmed project kind.
- No circular dependency was introduced.
- No component file exceeds approximately 300 lines without a justification.
- Every component is a function component.

### Interface

- Every public API has a typed signature.
- Every props interface is named with the `Props` suffix.
- Every hook starts with `use`.
- Every error class ends with `Error`.

### Interaction

- Every `useEffect` has a correct dependency array or a `// REASON:` comment.
- Every event listener is removed in cleanup.
- Every IPC listener in the preload validates callback types.
- Every `async` call is awaited or explicitly voided with a comment.

### Quality

- `prettier --check .` produces no output.
- No debugging output or commented-out code remains.
- Comments explain reasons, not actions.

### Hygiene

- `node_modules/`, `dist/`, `release/`, and `coverage/` are gitignored.
- No secret, token, or credential was committed.
- `.env` files are gitignored.
- Documentation was updated when the change altered the public API, the build, or a project rule.

## General Principles

**Single Responsibility.** One function does one thing, one component has one reason to change,
one module owns one domain concept.

**Security First.** Context isolation, no node integration, and sandbox are non-negotiable,
because a desktop application runs with the user's full permissions.

**Minimal Preload Surface.** Expose only what the renderer needs,
because every exposed function is an attack surface.

**Immutability.** Prefer immutable updates for state changes,
because a mutation is harder to trace than a replacement.

**Composition.** Build complex components from simple, focused parts,
because composition is more flexible than inheritance.

**Fail Fast.** Validate preconditions at the entry point of a function or service,
because a failure detected late is harder to trace.

**No Global State.** All state flows through React's data flow, explicit stores, or IPC,
because global mutable state makes tests order-dependent.

**Zero Warnings.** A TypeScript error or an ESLint error is either a defect or a rule the project
does not want, and both cases require an action.

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Testable main-process helpers.** Main-process helpers live in standalone CommonJS modules so unit
tests import them under a plain Node runner via `createRequire`, without booting the Electron
runtime. The entry file itself is never imported in tests - helper modules export pure functions and
explicit constants whose shape is asserted rather than trusted.

**Origin-gated permissions.** Device permissions are granted per origin - the packaged `file://`
bundle and the development server origin are allowlisted separately - and privileged sub-permissions
are never granted. A permission handler returns an explicit boolean for every request, never a
default grant.

## Sources

The following authoritative references support the rules in this document.

- [Electron Documentation](https://www.electronjs.org/docs/latest) - the platform reference.
- [Electron Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) - main,
  renderer, and preload process responsibilities.
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security) - the
  mandatory settings, including `contextIsolation`, sandboxing, CSP, and IPC sender validation.
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) - the
  isolated preload context and `contextBridge` exposure rules.
- [Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox) - the renderer
  sandbox and its API restrictions.
- [Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc) - `ipcMain` /
  `ipcRenderer` channels and the warning against exposing raw IPC APIs.
- [electron-builder](https://www.electron.build/) - packaging, signing, and publishing.
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html),
  [React](https://react.dev/), and [Vite](https://vitejs.dev/guide/) - the language, UI,
  and build stack rules the application code follows.

## Project Conventions

Project-specific values for the DOSOUND Tracker codebase.

- `electron/permissions.cjs` grants `midi` only for the packaged `file://` bundle and the
  dev origin `http://localhost:8008`; `midiSysex` is never granted.
