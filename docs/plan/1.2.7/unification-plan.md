# DOSOUND Tracker Unification Plan

## Document Information

**Version**: 1.0

**Date**: 2026-07-06

**Author**: Devin (GLM-5.2 High)

**Scope**: Align DOSOUND Tracker documentation structure and package versions with PET LAB, following the ASE blueprint from `PREPARATION.md`.

## Version History

| Version | Date       |
| ------- | ---------- |
| 1.0     | 2026-07-06 |

## Introduction

This plan unifies the DOSOUND Tracker project with the ASE documentation structure and tooling conventions established in PET LAB.

Both projects were bootstrapped from the same `PREPARATION.md` blueprint, but DOSOUND Tracker diverged early and is missing 6 of the 11 core guidelines files, has a renamed and minimal `ARCHITECT.md` instead of a full `ARCHITECTURE.md`, and lacks the change request and implementation plan workflow.

The plan has two phases.

Phase 1 sets up the documentation and ASE workflow.

Phase 2 aligns package versions and adds missing tooling.

Phase 1 must be completed and confirmed before Phase 2 begins.

## User Decisions

The following decisions were confirmed by the user before this plan was written.

| Decision             | Choice                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| Vite direction       | Keep rolldown-vite 7 in DOSOUND (no change to Vite setup)              |
| Path aliases         | Add `@/*` path aliases to DOSOUND tsconfig and vite config             |
| Coverage thresholds  | Add 80% coverage thresholds (tests must be written first to pass)     |
| Extra tooling        | Add Prettier, Playwright E2E, coverage tools                         |
| Feature/prompt dirs  | Leave `docs/feature/` and `docs/prompt/` untouched                     |
| ARCHITECT.md         | Rename to `ARCHITECTURE.md` and rewrite as full architecture document |

## Phase 1 — Documentation and ASE Workflow

### 1.1 Create ASE Directory Structure

Create the following directories under `docs/`:

| Directory     | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `docs/change/`| Change request documents (new workflow from PET LAB)           |
| `docs/plan/`  | Implementation plan documents (new workflow from PET LAB)      |
| `docs/template/` | Document templates (change request + implementation plan)   |
| `docs/standard/` | Engineering standards (TypeScript/React)                    |
| `docs/archive/`   | Historical documents (mirrors PET LAB structure)            |

Add `.gitkeep` files to empty directories (`change/`, `plan/`, `archive/`).

The existing `docs/refactoring/`, `docs/report/`, `docs/feature/`, `docs/prompt/`, and `docs/media/` directories remain untouched.

### 1.2 Rename ARCHITECT.md to ARCHITECTURE.md

Rename `docs/ARCHITECT.md` to `docs/ARCHITECTURE.md`.

The current `ARCHITECT.md` (42 lines) is a refactoring process checklist, not an architecture document.

It will be replaced with a full `ARCHITECTURE.md` adapted from PET LAB's structure, covering:

- High-level component overview
- Module boundaries (components, hooks, stores, synth, exports, utils, workers)
- State domains (current single `uiStore`, `App.tsx` state, hook-local state)
- Data flow (song data to audio playback pipeline)
- Audio synthesis pipeline (YM2149 to Web Audio API)
- Export pipeline (song to asm/bin/vgm/wav/max)
- Architectural decisions (including the intentional audio-critical anti-patterns)

The refactoring process content from the old `ARCHITECT.md` will be moved into the new `REFACTORING.md` (section 1.7).

### 1.3 Create docs/README.md (Agent Entry Point)

Create `docs/README.md` as the AI agent entry point, adapted from PET LAB's version.

It will mandate reading all guidelines files before any change and define the new feature implementation workflow:

1. Read all guidelines files and follow rules
2. Analyze current implementation
3. Make required research
4. Create change request in `docs/change/<version>/`
5. Create implementation plan in `docs/plan/<version>/`
6. Ask for confirmation to implement

### 1.4 Rewrite docs/GUIDELINES.md

The current `GUIDELINES.md` (98 lines) contains only audio-critical development principles.

It will be rewritten as a full rules document with the following structure:

- **Hard Rules**: section header format, identifier format, commit messages, git commits
- **Sources of Truth**: table of all core documentation files
- **General Workflow**: read-all-guidelines rule, implementation planning
- **Implementation Planning**: new feature workflow, plan creation, required plan contents
- **Change Request and Plan Directory Access**: access rules for `change/`, `plan/`, `archive/`, `refactoring/`, `report/`, `prompt/`, `feature/`
- **Documentation Style**: plain-text friendly style rules (from ai-dev GUIDELINES.md)
- **Audio-Critical Development Principles**: the existing content preserved as a dedicated section, with a note that these rules override general React best practices within this project

The audio-critical section is the strongest part of the current document and will be preserved verbatim with its emoji markers and checklist format.

### 1.5 Create Missing Core Documentation Files

Create the following 6 missing core files, each adapted from PET LAB's equivalent but rewritten for DOSOUND Tracker's domain.

**docs/COPYRIGHTS.md**

Adapt from PET LAB's version. Key differences:

- DOSOUND has a `LICENSE` file (MIT) at repo root, so the project license section references it
- No embedded ROM (DOSOUND emulates the YM2149 in software, no copyrighted firmware)
- Keep the fundamental rules, dependency licensing, and asset licensing sections

**docs/SPECIFICATION.md**

New document covering DOSOUND's implementation details:

- Technology stack (React 19, TypeScript 5.9, rolldown-vite 7, Zustand, Web Audio API)
- Source directory structure (components, constants, exports, hooks, modals, stores, synth, types, utils, workers)
- Data models (Song, Instrument, Pattern, Note, Step, Playlist)
- YM2149 register mapping and frequency calculations
- Sequencer timing (50Hz VBLANK, envelope progression)
- Export format details (cross-reference to FORMAT.md for file layouts)
- Constants (note frequencies, noise periods, volume curves)
- Keyboard shortcuts and input bindings
- Known limitations

**docs/TESTING.md**

Adapt from PET LAB's version. Key differences:

- Test types: unit, component, integration, E2E (Playwright)
- Clean build definition (zero errors, zero warnings)
- Pre-change baseline and post-change workflow
- Verification loop: `npm run typecheck && npm run lint && npm run build && npm test`
- Coverage thresholds: 80% for lines, functions, branches, statements
- Test directory structure (current: components, hooks, stores, synth, utils, fixtures)
- Note the audio-critical testing constraint: audio playback tests require manual verification
- Test data locations: `work/` for scratch files, `test/fixtures/` for committed fixtures

**docs/WORKFLOW.md**

Adapt from PET LAB's version. Key differences:

- Verification loop (typecheck, lint, build, test)
- Standard implementation process (documentation-first)
- New feature implementation workflow (change request, plan, confirm)
- Version-based feature implementation cycle
- Working with AI coding agents
- Note: the `docs/prompt/` directory is preserved as historical prompt logs and is not part of the active workflow

**docs/VERSIONING.md**

Adapt from PET LAB's version. Key differences:

- DOSOUND uses semantic versioning (MAJOR.MINOR.PATCH) with the same increment rules
- The `scripts/bump-version.mjs` script exists and auto-bumps on build; document it
- The version bump procedure should note that the bump script automates the version number increment, but the CHANGELOG entry and security audit remain manual steps
- CHANGELOG conventions (same format as PET LAB)
- Note: DOSOUND currently has no `CHANGELOG.md`; creating one is part of this plan

**docs/DEPLOYMENT.md**

Adapt from PET LAB's version. Key differences:

- Build output (dist/ directory)
- Electron distribution (macOS, Windows, Linux via electron-builder)
- Static hosting options
- No PWA (DOSOUND is not a PWA; remove PWA sections)
- Download page reference (https://dosound.alyx.pl)
- Configuration (environment variables, Vite define)

**docs/REFACTORING.md**

New document combining:

- PET LAB's refactoring process structure (definition, rule of three, focus areas, proposal content)
- The refactoring process content from the old `ARCHITECT.md` (version-based proposal and assessment workflow)
- DOSOUND-specific focus areas: App.tsx decomposition, hook extraction, store boundary cleanup, business logic separation from utils, audio-critical constraints during refactoring
- The existing `docs/refactoring/` directory structure is preserved and documented

### 1.6 Create Document Templates

Copy and adapt the two templates from PET LAB.

**docs/template/change-request-template.md**

Adapt from PET LAB's template. The structure is domain-agnostic (Summary, Description, Use Cases, Hints, Out of Scope) and can be copied with minimal changes.

**docs/template/implementation-plan-template.md**

Adapt from PET LAB's template. Key changes:

- Remove PET LAB-specific references (Command pattern, `executeFrameCommand`, `executeCellCommand`, `selectionStore`)
- Replace with DOSOUND-specific references (audio-critical constraints, `synth/`, `exports/`, `hooks/`)
- Remove the "Interactive Tool Requirements" section (not applicable to a music tracker) or replace with "Audio-Critical Requirements" section
- Update best practices to reference DOSOUND's `standard/ts-react-development.md`
- Update verification commands to match DOSOUND's scripts

### 1.7 Create Engineering Standard

**docs/standard/ts-react-development.md**

Copy PET LAB's `ts-react-development.md` as a base.

Add a DOSOUND-specific section at the top:

- **Audio-Critical Override**: reference `GUIDELINES.md` for audio-critical development principles that override standard React best practices
- Note that `useCallback` wrapping, dependency array additions, and state synchronization removal are intentionally avoided in audio paths

The rest of the standard (naming conventions, file structure, project organization) is domain-agnostic and can be copied with minimal changes.

No `asm-dasm-development.md` is needed because DOSOUND generates assembly output but does not write 6502 assembly; it targets the 68000/YM2149 DOSOUND format. The assembly generation code is documented in `SPECIFICATION.md` and `FORMAT.md`.

### 1.8 Update Root README.md

Update the root `README.md` to reference the new documentation structure.

Add a "Documentation" section with:

- Core guidelines table (listing all 11+ core files)
- ASE directory structure description
- Templates table
- Engineering standards table
- Note that `docs/prompt/` and `docs/feature/` are historical directories not part of the active workflow

Remove the note that says "PROJECT.md is not used for the current development process anymore" — PROJECT.md will be updated as part of the active set.

### 1.9 Update docs/PROJECT.md

The current `PROJECT.md` is marked as bootstrap-only.

Update it to be an active requirements document with:

- Vision and purpose
- Goals and non-goals
- Target audience
- Glossary (YM2149, PSG, DOSOUND, XBIOS, VBLANK, chiptune, etc.)
- Functional requirements (MoSCoW prioritized)
- Non-functional requirements (audio performance, cross-platform, etc.)
- Use cases
- Quality targets

The existing YM2149 implementation details and UI layout specifications can be preserved as reference material within the document.

### 1.10 Create CHANGELOG.md

Create a `CHANGELOG.md` at the repository root following the format from PET LAB's `VERSIONING.md`:

```markdown
# Changes

## Version 1.2.7

Initial CHANGELOG entry documenting the unification of documentation structure and ASE workflow.
```

### 1.11 Documentation Files Summary

| File                                | Action   | Source                                      |
| ----------------------------------- | -------- | ------------------------------------------- |
| `docs/README.md`                    | Create   | Adapted from PET LAB                        |
| `docs/GUIDELINES.md`                | Rewrite  | Extend existing + PET LAB structure         |
| `docs/ARCHITECTURE.md`              | Create   | Replace old ARCHITECT.md                    |
| `docs/SPECIFICATION.md`             | Create   | New, adapted from PET LAB structure         |
| `docs/COPYRIGHTS.md`                | Create   | Adapted from PET LAB                        |
| `docs/WORKFLOW.md`                  | Create   | Adapted from PET LAB                        |
| `docs/TESTING.md`                   | Create   | Adapted from PET LAB                        |
| `docs/VERSIONING.md`                | Create   | Adapted from PET LAB                        |
| `docs/DEPLOYMENT.md`                | Create   | Adapted from PET LAB                        |
| `docs/REFACTORING.md`               | Create   | PET LAB structure + old ARCHITECT.md content|
| `docs/PROJECT.md`                   | Update   | Rewrite as active requirements document     |
| `docs/FORMAT.md`                    | Keep     | Already excellent, no changes needed        |
| `docs/FUTURE.md`                    | Keep     | Retained as planning reference              |
| `docs/MAX.md`                        | Keep     | Retained as format specification            |
| `docs/feature/LOGGER.md`            | Keep     | Retained as feature proposal                |
| `docs/template/change-request-template.md`    | Create | Adapted from PET LAB                 |
| `docs/template/implementation-plan-template.md` | Create | Adapted from PET LAB              |
| `docs/standard/ts-react-development.md`       | Create | Adapted from PET LAB                 |
| `docs/ARCHITECT.md`                 | Delete   | Replaced by ARCHITECTURE.md                 |
| `README.md`                         | Update   | Add documentation section                   |
| `CHANGELOG.md`                      | Create   | New file at repo root                       |

## Phase 2 — Package Upgrade and Tooling Alignment

### 2.1 Package Version Alignment

Align DOSOUND Tracker package versions to match PET LAB where PET LAB is newer, and keep DOSOUND's newer versions where DOSOUND is ahead.

Vite stays as rolldown-vite 7 (per user decision).

**Packages to upgrade in DOSOUND:**

| Package              | Current        | Target         | Reason                        |
| -------------------- | -------------- | -------------- | ----------------------------- |
| `vitest`             | `^3.2.0`       | `^4.1.5`       | Align to PET LAB              |
| `electron`           | `^39.2.6`      | `^42.0.0`      | Align to PET LAB              |
| `electron-builder`   | `^24.13.3`     | `^26.8.1`      | Align to PET LAB              |
| `jsdom`              | `^27.2.0`      | `^29.0.0`      | Align to PET LAB              |
| `concurrently`       | `^9.1.0`       | `^10.0.3`      | Align to PET LAB              |
| `wait-on`            | `^7.2.0`       | `^8.0.0`       | Align to PET LAB              |
| `@testing-library/react` | `^16.3.0` | `^16.3.2`      | Align to PET LAB              |

**Packages already at or above PET LAB (no change):**

| Package                       | DOSOUND        | PET LAB        |
| ----------------------------- | -------------- | -------------- |
| `react`                       | `^19.2.0`      | `^19.0.0`      |
| `react-dom`                   | `^19.2.0`      | `^19.0.0`      |
| `typescript`                  | `~5.9.3`       | `^5.3.0`       |
| `@vitejs/plugin-react`        | `^5.1.0`       | `^4.2.0`       |
| `eslint`                      | `^9.39.1`      | `^9.0.0`       |
| `typescript-eslint`           | `^8.46.3`      | `^8.0.0`       |
| `eslint-plugin-react-hooks`   | `^7.0.1`       | `^5.0.0`       |
| `globals`                     | `^16.5.0`      | `^15.0.0`      |
| `@types/node`                 | `^24.10.0`     | `^22.0.0`      |
| `@types/react`                | `^19.2.2`      | `^19.0.0`      |
| `@types/react-dom`            | `^19.2.2`      | `^19.0.0`      |
| `vite`                        | `rolldown-vite@7.2.2` | `^6.0.0` |
| `zustand`                     | `^4.5.0`       | `^4.5.0`       |
| `js-yaml`                     | `^4.1.0`       | `^4.1.0`       |
| `lucide-react`                | `^0.460.0`     | `^0.460.0`     |
| `@types/js-yaml`              | `^4.0.9`       | `^4.0.9`       |

**New packages to add to DOSOUND:**

| Package                       | Version    | Purpose                              |
| ----------------------------- | ---------- | ------------------------------------ |
| `prettier`                    | `^3.2.0`   | Code formatter (matches PET LAB)     |
| `@playwright/test`            | `^1.48.0`  | E2E testing framework                |
| `@vitest/coverage-v8`         | `^4.1.5`   | Coverage provider for Vitest         |
| `@vitest/ui`                  | `^4.1.5`   | Vitest UI mode                       |
| `@testing-library/dom`        | `^10.4.1`  | DOM testing utilities                |
| `@testing-library/jest-dom`   | `^6.9.1`   | Custom Jest matchers for DOM         |

**Packages to evaluate for removal:**

| Package                       | Reason                                              |
| ----------------------------- | --------------------------------------------------- |
| `@babel/core`                 | PET LAB does not use it; check if Vite/rolldown needs it |
| `eslint-formatter-compact`    | PET LAB does not use it; check if needed            |
| `eslint-formatter-unix`       | PET LAB does not use it; check if needed            |

### 2.2 Add Path Aliases

Add `@/*` path alias to DOSOUND's TypeScript and Vite configuration.

**tsconfig.app.json**

Add `baseUrl` and `paths` to `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}
```

Update `types` to include `"vitest/globals"` instead of `"vitest"` (matching PET LAB):

```json
"types": ["vite/client", "vitest/globals", "node"]
```

**vite.config.ts**

Add `resolve.alias` configuration:

```typescript
import { resolve } from 'node:path';

// ... inside defineConfig
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  },
},
```

**vitest.config.ts**

Add `resolve.alias` to the Vitest config as well (matching PET LAB's approach where vitest.config.ts is standalone):

```typescript
import { resolve } from 'node:path';

// ... inside defineConfig test config
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  },
},
```

**Import migration**

The actual migration of relative imports to `@/` imports is a code refactoring task that should be done incrementally. It is not part of this initial setup but should be documented as a future refactoring target in `REFACTORING.md`.

The path alias will be available immediately for new code.

### 2.3 Add Coverage Thresholds

Update `vitest.config.ts` to add coverage configuration matching PET LAB:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'test/', 'e2e/', 'src/**/*.d.ts'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
},
```

**Risk**: The 80% thresholds will immediately fail because DOSOUND's current test coverage is well below 80% (37 test files for 147 source files).

**Mitigation strategy**:

- Add the coverage config but initially set thresholds to a level that passes (for example 25% for lines, functions, branches, statements)
- Document the target of 80% in `TESTING.md`
- Create a follow-up plan to incrementally raise thresholds as tests are added
- The `test:coverage` script will be available to track progress

Alternatively, add the full 80% thresholds and accept that `npm run test:coverage` will fail until coverage is built up. The regular `npm test` (without coverage) will still pass.

### 2.4 Add Prettier

Add Prettier configuration and scripts.

**package.json scripts**

Add:
```json
"format": "prettier --write ."
```

**New file: `.prettierrc`**

Copy from PET LAB (check PET LAB's `.prettierrc` for exact settings).

**eslint.config.js update**

Add `eslint-config-prettier` if needed to avoid conflicts between ESLint and Prettier. PET LAB does not appear to use this, so it may not be necessary.

### 2.5 Add Playwright E2E

Add Playwright configuration and scripts.

**package.json scripts**

Add:
```json
"test:e2e": "playwright test"
```

**New file: `playwright.config.ts`**

Adapt from PET LAB's `playwright.config.ts`, adjusting:

- `webServer.port` to 8008 (DOSOUND's dev port)
- `testDir` to `./e2e/`
- Project configuration (chromium, firefox, webkit)

**New directory: `e2e/`**

Create with `.gitkeep`. E2E tests will be written as part of future work.

### 2.6 Update package.json Scripts

Add the following scripts to match PET LAB's script set:

| Script              | Command                          | Notes                                    |
| ------------------- | -------------------------------- | ---------------------------------------- |
| `typecheck`         | `tsc --noEmit`                   | New script for standalone type checking  |
| `format`            | `prettier --write .`             | New script for formatting                |
| `test:ui`           | `vitest --ui`                    | New script for Vitest UI mode            |
| `test:coverage`     | `vitest run --coverage`          | New script for coverage reporting        |
| `test:e2e`          | `playwright test`                | New script for E2E tests                 |
| `electron:preview`  | `npm run build:core && electron .` | New script for Electron preview        |

The existing `build` script (`node scripts/bump-version.mjs && npm run build:core`) is preserved.

The `bump-version.mjs` script is preserved as an automation tool. The `VERSIONING.md` will document both the automated bump script and the manual version bump procedure (including CHANGELOG and security audit).

### 2.7 Update vitest.config.ts

Merge the coverage and alias configuration into the existing `vitest.config.ts`.

The existing `onConsoleLog` handler for the rolldown-vite esbuild/oxc warning must be preserved.

The `setupFiles` should be updated to include both `./test/setup.ts` and `./test/setup-localstorage.ts` if both exist.

The `include` pattern should be added: `['test/**/*.{test,spec}.{ts,tsx}']`.

### 2.8 Update eslint.config.js

Align the ESLint configuration with PET LAB's approach:

- Add `globalIgnores` for `release`, `node_modules`, `work`, `coverage`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- Update `files` pattern to `['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}']`
- Add `@typescript-eslint/no-explicit-any: 'error'` rule
- Add `@typescript-eslint/no-unused-vars` rule with `argsIgnorePattern: '^_'`
- Preserve the existing audio-critical linting rules (react-hooks warnings)
- Add `parserOptions` with `project: ['./tsconfig.app.json']`

### 2.9 Verification

After all Phase 2 changes, run the full verification loop:

1. `npm run typecheck` — must pass with zero errors
2. `npm run lint` — must pass with zero errors and zero warnings
3. `npm run build` — must complete successfully
4. `npm test` — must pass all tests

If any step fails, fix the issue before proceeding.

The `npm run test:coverage` command may fail due to the 80% thresholds. This is expected and documented in `TESTING.md` as a known gap.

## Implementation Order

**Phase 1 (Documentation and ASE Workflow)**

1. Create ASE directories (`change/`, `plan/`, `template/`, `standard/`, `archive/`)
2. Rename `ARCHITECT.md` to `ARCHITECTURE.md` and rewrite
3. Create `docs/README.md` (agent entry point)
4. Rewrite `docs/GUIDELINES.md` (full rules document)
5. Create `docs/COPYRIGHTS.md`
6. Create `docs/SPECIFICATION.md`
7. Create `docs/WORKFLOW.md`
8. Create `docs/TESTING.md`
9. Create `docs/VERSIONING.md`
10. Create `docs/DEPLOYMENT.md`
11. Create `docs/REFACTORING.md`
12. Update `docs/PROJECT.md`
13. Create document templates (`change-request-template.md`, `implementation-plan-template.md`)
14. Create `docs/standard/ts-react-development.md`
15. Update root `README.md`
16. Create `CHANGELOG.md`
17. Delete old `docs/ARCHITECT.md`

**Phase 2 (Package Upgrade and Tooling)**

18. Update `package.json` with version bumps and new packages
19. Run `npm install` to update `package-lock.json`
20. Add path aliases to `tsconfig.app.json` and `vite.config.ts`
21. Update `vitest.config.ts` with coverage and alias configuration
22. Update `eslint.config.js` with aligned rules
23. Add `.prettierrc`
24. Add `playwright.config.ts`
25. Create `e2e/` directory with `.gitkeep`
26. Run verification loop (`typecheck`, `lint`, `build`, `test`)
27. Fix any issues from the verification loop

## Risks and Mitigations

| Risk                                        | Mitigation                                                        |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Vitest 4.x incompatibility with rolldown-vite 7 | Test after upgrade; if incompatible, keep vitest 3.2.0 and document |
| 80% coverage thresholds fail immediately    | Start with lower thresholds or only enforce on `test:coverage`    |
| Electron 42 may have breaking changes       | Test Electron dev and build after upgrade                         |
| Path alias migration is not done in this plan | Document as future refactoring; alias available for new code     |
| `@babel/core` removal may break builds      | Test build after removal; restore if needed                       |
| Prettier may conflict with existing formatting | Run `prettier --write .` and review diff before committing       |
| Auto-bump script conflicts with manual versioning workflow | Document both approaches in VERSIONING.md; script is optional |

## Out of Scope

The following items are explicitly out of scope for this plan:

- Migrating relative imports to `@/` imports (future refactoring)
- Writing new tests to reach 80% coverage (future work)
- Writing E2E tests (future work)
- Decomposing `App.tsx` (future refactoring, documented in REFACTORING.md)
- Adding Command pattern or undo/redo (future refactoring)
- Adding Zustand domain stores (future refactoring)
- Modifying `docs/feature/` or `docs/prompt/` directories
- Modifying `docs/refactoring/` or `docs/report/` existing content
- Upgrading PET LAB packages (this plan only touches DOSOUND Tracker)
