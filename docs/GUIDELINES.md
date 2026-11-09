# DOSOUND Tracker Development Guidelines

## Hard Rules

**Section Header Format**

Owned by `STYLE.md` - the bold section-header format and "fragment" terminology rules live there.

**Identifier Format**

Requirements, use cases, architectural decisions, and other numbered identifiers must follow this format:

- Letter code: `F` (functional), `N` (non-functional), `A` (architectural), `C` (use case).
- Two-digit number after a hyphen: `01`, `02`, `03`, and so on.
- No letter suffixes such as `F-04a` or `C-04b`.

Examples:

- GOOD: `F-04`, `C-12`, `N-03`, `A-15`.
- BAD: `F-04a`, `C-12b`, `N-03x`.

If items are added between existing ones, renumber sequentially.

**Commit Messages**

- No prefix. Never `docs:`, `feat:`, `fix:`, `chore:`, `refactor:`, or anything similar. This rule applies globally to the entire repository.
- Always check `git status` to accurately describe what is being committed.
- Short and natural. Maximum three sentences.
- Single line. No word wrap. No line breaks.
- If using a single sentence, do not end with a trailing dot.
- If using multiple sentences, ensure each sentence ends with a dot.
- Do not cut off messages in the middle of a sentence. Shorten the sentence or finish it completely. Never truncate the message.

Examples:

- BAD: `docs: update architecture section`.
- GOOD: `Add MIDI device selection with velocity support`.
- A version-window close commit uses the format `Version X.Y.Z <sentence ending with a dot>` - no dot after the version number.

**Git Commits**

- Do not commit unless specifically told to make commits automatically.
- The AI assistant must never commit changes. The user commits manually when ready.

**Version Bumps**

- Do not bump the version unless explicitly instructed.
- Version bumps are performed only via `npm run bump`, which runs the automated bump script and then builds.
- `npm run build` builds the application without bumping the version. Never use it to bump versions.
- See `VERSIONING.md` for the complete version bump procedure.

## Sources of Truth

The active documentation set is composed of the following files. Each file is the authoritative source for the topic listed.

| File                                             | Purpose                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `GUIDELINES.md`                                  | Central source of truth for AI-assisted development rules (this file)    |
| `STYLE.md`                                       | Central source of truth for documentation style rules                    |
| `PROJECT.md`                                     | Project description, scope, requirements, use cases, and quality targets |
| `ARCHITECTURE.md`                                | System architecture, module boundaries, state domains, and patterns      |
| `SPECIFICATION.md`                               | Project-specific implementation details, stack, schemas, and constants   |
| `COPYRIGHTS.md`                                  | Copyright and licensing rules                                            |
| `WORKFLOW.md`                                    | Day-to-day development workflow                                          |
| `REFACTORING.md`                                 | Refactoring proposal and assessment process                              |
| `TESTING.md`                                     | Testing strategy, test types, fixtures, and verification                 |
| `DEPLOYMENT.md`                                  | Deployment targets and hosting                                           |
| `VERSIONING.md`                                  | Version numbering scheme, bumping rules, and CHANGELOG format            |
| `FORMAT.md`                                      | Project file format specification for song and instrument files          |
| `MAX.md`                                         | MAX audio file format specification                                      |
| `FUTURE.md`                                      | Candidate future enhancements (not committed work)                       |
| `standard/README.md`                             | Engineering-standard library index                                       |
| `standard/typescript-react-development.md`       | TypeScript and React engineering standard                                |
| `standard/typescript-refactoring-development.md` | TypeScript refactoring engineering standard                              |
| `standard/typescript-electron-development.md`    | TypeScript and Electron engineering standard                             |
| `standard/typescript-audio-development.md`       | TypeScript and real-time audio engineering standard                      |
| `standard/typescript-general-development.md`     | TypeScript engineering standard                                          |
| `standard/css-general-development.md`            | CSS engineering standard                                                 |
| `standard/html-vanilla-development.md`           | Vanilla HTML engineering standard (reference)                            |
| `standard/accessibility-general-development.md`  | Accessibility engineering standard                                       |
| `standard/performance-budgets-development.md`    | Performance-budget engineering standard                                  |
| `standard/standard-template-development.md`      | Standard-authoring template                                              |
| `standard/bash-inline-development.md`            | Bash and inline shell engineering standard                               |
| `template/change-request-template.md`            | Template for change request specification documents                      |
| `template/implementation-plan-template.md`       | Template for implementation plan documents                               |
| `template/refactoring-proposal-template.md`      | Template for refactoring proposal documents                              |
| `template/refactoring-assessment-template.md`    | Template for refactoring assessment documents                            |
| `template/preparation-findings.md`               | Template for documentation-set findings reports                          |
| `template/change-review-template.md`             | Template for version-window review documents                             |
| `template/session-findings.md`                   | Template for session-review lesson entries                               |
| `template/decision-record.md`                    | Template for durable dated decision records                              |
| `template/specification-audit-template.md`       | Template for pre-implementation plan audits                              |
| `template/verification-report-template.md`       | Template for per-option verification reports                             |

### Three Pillars of Technical Documentation

Three documents form the pillars of the technical documentation. They separate concerns by role and must not duplicate each other. During implementation, update the pillar that owns the change first, before touching code.

**PROJECT.md**

General project overview with functional and non-functional requirements. It answers what the system must do. It holds the vision, goals and non-goals, target audience, glossary, requirements, use cases, and quality targets.

**ARCHITECTURE.md**

Architectural decisions and top-level assumptions. It answers how the system is organised. It holds the system overview, module boundaries, state domains, data flow, and the architectural decision log.

**SPECIFICATION.md**

Implementation technical decisions. It answers how the system works internally. It holds data models, algorithms, file formats, constants, input bindings, and known implementation limitations.

## Repository Layout

The resolved role-to-path map for the documentation set and its workflow directories.

| Role                   | Path                                | Notes                                            |
| ---------------------- | ----------------------------------- | ------------------------------------------------ |
| Documentation root     | `docs/`                             | All active documents                             |
| Change requests        | `docs/change/<version>/`            | Versioned per release                            |
| Implementation plans   | `docs/plan/<version>/`              | Versioned per release                            |
| Refactoring documents  | `docs/refactoring/<version>/`       | Versioned per release                            |
| Abandoned records      | `docs/discard/<version>/`           | Abandoned change records and optional plans      |
| Window reviews         | `docs/review/<version>/`            | Version-window reviews, feeds the bump decision  |
| Lessons                | `docs/lesson/`                      | Per-session findings files, restricted           |
| Decision records       | `docs/decision/`                    | Durable dated decisions, restricted              |
| Window run state       | `docs/plan/<version>/window-run.md` | Run-resume stage record, not a plan              |
| Reports                | `docs/report/`                      | On-demand generated reports, restricted          |
| Archive                | `docs/archive/`                     | Retired documents, non-active history            |
| Historical directories | `docs/feature/`, `docs/prompt/`     | Restricted, not part of the active set           |
| Templates              | `docs/template/`                    | Document templates                               |
| Standards              | `docs/standard/`                    | Engineering standards, one per technology stack  |
| Media                  | `docs/media/`                       | Documentation images                             |
| Changelog              | `public/CHANGELOG.md`               | Written only at version bump                     |
| Bundled documents      | `public/`                           | MANUAL.md, MESSAGES.md rendered in-app           |
| Local workspace        | `work/`                             | Gitignored scratch, shell-access only            |
| Agent entry            | `README.md`                         | Routes agents to `GUIDELINES.md`; no `AGENTS.md` |

**Recorded conventions**

- Document style owner: `STYLE.md`.
- Testing and verification owner: `TESTING.md`.
- Workflow owner: `WORKFLOW.md`.
- Execution policy: Human in the Loop - the user approves plans, commits changes manually, and holds reserved decisions (commit authorship, version bump, release baseline). Inside a version-window request the default gate mode is `human-in-the-loop` with `autonomous` selectable per request; the named window request is the explicit instruction that authorizes the closing version bump, and the cycle never commits under any mode.
- Adopted extensions: `version-window`, `run-resume`, `standards-synchronization`, `stage-gates`, `specification-audit`, `verification-options`, `preserve-before-reorganize`, `artifact-summary`, `work-modes`, `improvement-step`, `session-reporting`, `runnable-artifact`, `independent-verification`, `lessons-loop`, `clean`, `purge`.
- Adopted conventions: `audit-driven-development`, `session-review`, `version-review`.
- Trigger phrases: `run the SDLC for <version>` or `process the <version> window` executes the Version Window SDLC recorded in `WORKFLOW.md`; `improve dosound-tracker` runs the Session Review recorded below. Trigger phrases are recorded, never implied.
- Run-state record: `docs/plan/<version>/window-run.md` tracks completed window stages so an interrupted window run resumes at the first incomplete stage.
- Abandoned change records move to `docs/discard/<version>/` with an explicit abandonment reason recorded in the record.
- Community files (`CONTRIBUTING.md`, `SECURITY.md`) were evaluated and declined; none are planned.
- A CI pipeline (`.github/workflows/`) was evaluated and declined; the verification loop is enforced locally and no CI configuration is planned.
- No dedicated agent entry file: `README.md` is the documented agent route per the File Maintenance rule.
- Repository profile: `Software`. Topology: `single-project`. Guidelines topology: `Distributed` - `GUIDELINES.md` plus topic owners.
- Environment-readiness owner: `README.md` for the development environment, `DEPLOYMENT.md` for build and deployment prerequisites.
- An explicit user instruction may produce an implementation plan without a change record; the plan states the instruction as its reference (for example `docs/plan/1.3.1/remove-ci-workflow.md`).
- `COMPARISATION` filenames and `docs/report/1.2.4-configuration/` are accepted historical naming variance inside restricted directories and are not normalized.

## General Workflow

**Read all guidelines before any change**

This rule is mandatory and unconditional. Before making any change in this codebase, read every file in the active documentation set listed below. Never assume a subset is sufficient. No matter how small the change, every guideline file must be reviewed first.

- Always read all guideline files before making changes. The required files are:
  - `GUIDELINES.md`
  - `STYLE.md`
  - `PROJECT.md`
  - `ARCHITECTURE.md`
  - `SPECIFICATION.md`
  - `FORMAT.md`
  - `COPYRIGHTS.md`
  - `WORKFLOW.md`
  - `REFACTORING.md`
  - `TESTING.md`
  - `DEPLOYMENT.md`
  - `VERSIONING.md`
  - `standard/README.md` (index; consult the matching standard file for the task)
- Never assume a subset of these files is sufficient.
- For any implementation task, consult the corresponding standard in `standard/` before writing code - the index is `standard/README.md`. These standards are generalized; project-specific conventions and code organization live in `SPECIFICATION.md` and in each standard's `Project Conventions` section.
- Ask for clarification when requirements are missing or ambiguous.
- When a guideline file is added, removed, or its purpose changes, update this file accordingly.

**Work Intake Table**

When starting work on a request, include a table reporting the guidelines files and directories inspected before acting.

- One row per guidelines file read or re-read for the current request.
- One row per directory scanned for the current request.
- List only items actually inspected - a file carried over from earlier in the session is marked `carried over`, not counted as read.
- Restricted directories kept closed by the Change Request and Plan Directory Access rule are not listed.

Example:

| Item                 | Inspected    |
| -------------------- | ------------ |
| `docs/GUIDELINES.md` | read         |
| `docs/PROJECT.md`    | re-read      |
| `src/components/`    | scanned      |
| `docs/WORKFLOW.md`   | carried over |

## Implementation Planning

**New Feature Implementation Workflow**

The six-step feature sequence - read guidelines, analyze, research, change request, implementation plan, confirmation - is owned by `WORKFLOW.md` "Adding a New Feature". Do not begin implementation until the user confirms the plan.

**Implementation Plan Creation**

When asked to make an implementation plan:

- Gather all requirements from project documentation (`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`).
- Review `standard/typescript-react-development.md` for general engineering standards and best practices.
- Review `SPECIFICATION.md` for project-specific source layout, technology stack, and coding conventions.
- Use the template at `docs/template/implementation-plan-template.md`.
- Create a comprehensive implementation plan in `docs/plan/<current_version>/`. Name the plan document to match the change request file (for example `midi-support-implementation.md` for `midi-support.md`), or according to the nature of the change if based on a description.
- Use the current version number from `package.json` for the plan directory.
- Do not include time estimates for phases; time does not matter for agentic software engineering.

**Required Plan Contents**

Every implementation plan must include:

- Best practices applicable to the specific implementation.
- Reference to engineering standards from `standard/typescript-react-development.md`.
- Unit tests for all new utility functions.
- Integration tests for component interactions and user flows.
- Documentation updates required before code changes (per "Applying a Change" section).
- Audio-critical requirements assessment for changes affecting audio playback or timing.

**Audio-Critical Requirements**

For changes that affect audio playback, timing, the sequencer, or the YM2149 emulator, the implementation plan must include:

- **Audio impact assessment**: Describe whether the change affects React render timing, `useCallback` or `useMemo` dependencies, or state management patterns in audio paths.
- **Timing stability verification**: Describe how audio timing stability will be verified after the change (manual playback testing, comparison with reference output).
- **Linting exception documentation**: If the change introduces or preserves linting warnings that are intentional for audio stability, document which warnings are accepted and why.
- **Playback simulation**: If the change affects the sequencer or SoundDriver, describe how playback simulation will be tested.

**Implementation Plan Documentation Style**

Implementation plans must strictly follow the Documentation Style section of this file. Key requirements:

- Use bold section headers on their own line. No colons, no periods, no "Step X" prefixes.
- Use procedure format for implementation steps (bold headings, descriptions, code blocks), not numbered lists.
- One blank line between sections and before lists.
- Prefer bullet points (`-`) over numbering unless order is strictly required.

Example of correct step formatting:

````
**Fix track panel instrument display**

TrackPanel shows instrument ID from local state. Use currentInstrument from props instead.

File to modify: `src/components/TrackPanel.tsx`.

```typescript
// Import currentInstrument
````

```

**Change Request and Plan Directory Access**

- Do not read any document from `docs/change/` unless the user explicitly requests implementation of a specific change request or names a version window to run. A named window request (for example "run the SDLC for 1.3.0") is the explicit authorization to read that window's change group. Otherwise never automatically scan or gather change requests from this directory; the user will manually request implementation plans for individual changes.
- Do not read any document from `docs/plan/` unless specifically instructed by the user or a named window request authorizes the window's plan group. Implementation plans are written to this directory only when the user explicitly requests them or a window run requires them.
- Do not read any document from `docs/archive/` or `docs/refactoring/` unless specifically instructed by the user. These directories contain historical documents and refactoring proposals that are not part of the active documentation set.
- Do not read any document from `docs/report/` unless the user explicitly requests it. This directory is for custom reports generated on demand and is not part of the active documentation set.
- Do not read any document from `docs/prompt/` unless specifically instructed by the user. This directory contains historical AI prompt logs from versions 1.0, 1.1, and 1.2 and is not part of the active documentation set.
- Do not read any document from `docs/feature/` unless specifically instructed by the user. This directory contains feature proposals that are not part of the active documentation set.
- Do not read any document from `docs/discard/` unless specifically instructed by the user. This directory holds abandoned change records and is not part of the active documentation set.
- Do not read any document from `docs/review/` or `docs/lesson/` unless specifically instructed by the user. These directories hold generated reviews and recorded lessons; they are outputs and records, not active rules.
- Do not read any document from `docs/decision/` unless specifically instructed by the user or a session review routes a decision there.

**Change Request Document Creation**

When asked to describe a change (feature, fix, refactor, chore):

- Read current project documentation to understand the context
- Analyze current implementation to understand the existing code
- Use the template at `docs/template/change-request-template.md`
- Create the document in `docs/change/<version>/` where `<version>` is the current version from `package.json`
- Name the document using kebab-case to briefly describe the change (for example `midi-support.md`, `export-dump-fix.md`)
- The user may want to relocate the file after creation

**Documentation-Only Changes Bypass the Verification Loop**

Creating or updating change request documents, implementation plans, refactoring proposals, refactoring assessments, or guideline files does not require the verification loop. These activities produce only documentation files and do not modify source code, configuration, build artefacts, or test files.

Run the verification loop only when source code, configuration, or test files are modified. It is required:

- Before the first code modification, to establish a known-good baseline.
- After each code change iteration.
- After finishing implementation or refactoring.
- Before version bumping.
- When explicitly asked for a production-ready build.

## Applying a Change

These rules apply to every change made in this project. Follow them in order; do not skip steps.

**Understand the change**

- Read the request carefully.
- Identify all components, modules, and documentation files affected.

**Create or confirm the plan**

- When asked to perform a change, first create an implementation plan and write it under `docs/plan/[current_version]/`.
- Name the plan document to match the change request or according to the nature of the change.
- Use the current version number from `package.json` for the directory name.
- If a plan already exists, ensure it is consistent with the current request.
- Present the plan and ask for review before proceeding when one does not already exist.
- Do not start any implementation work until the plan is approved.

**Update documentation first**

- The first step during implementation is to apply changes in the project documentation before going to the code changes phase.
- Before writing any code, update the relevant project documentation files (`PROJECT.md`, `ARCHITECTURE.md`, or `SPECIFICATION.md`).
- If the change introduces new concepts, components, or behaviours, document them before implementing.
- Update the plan document if the documentation changes reveal gaps in the original plan.

**Update format specification before changing save file format**

- Any change that modifies the song or instrument save file format must update `FORMAT.md` before the code is changed.
- This includes adding, renaming, or removing keys, changing value types, or altering the file structure.
- The format document must reflect the new state the code will produce after the change is implemented.

**Implement**

- Follow the approved plan component by component.
- For all new functions, create unit tests.
- For all changed functions, update existing tests to match.

**Verify**

`TESTING.md` owns the verification loop - its step order, modes, milestones, and the zero-error/zero-warning bar apply unchanged here.

The work is finished only when the loop passes clean, the implementation matches the documentation, and any plan in scope has been satisfied.

Do not run the verification loop for documentation-only changes. See the "Documentation-Only Changes Bypass the Verification Loop" rule above.

**Repeat until done**

- If the change spans multiple components, repeat the implement and verify steps for each one.
- Do not consider the task complete until all components pass and documentation is consistent with the final implementation.

**Propose a commit message**

After the change is complete and the verification loop passes, propose a commit message for review. Check `git status` to describe accurately what is being committed, and follow the Commit Messages rules above. Do not commit; the user commits manually.

## Session Review

The project records a session-review convention. When the user says "improve dosound-tracker", run the session review: collect the wounds the session produced and land each one as a durable rule or record before reporting the review done.

**Trigger**

- `improve dosound-tracker` runs the session review. The trigger phrase is recorded, never implied - ordinary task requests do not invoke it.

**Procedure**

- Review the conversation history of the current session and gather its wounds: failures, surprises, workarounds, and repeated corrections.
- Verify the real state before recording a lesson - a guessed finding poisons the index.
- For each wound, check whether an existing rule already covers it. If no rule covers the lesson, add the rule to the owning document's body first, then index it in the lesson file.
- Owning documents are the project guidelines, workflow and process documents, and the engineering standards under `docs/standard/` - the review updates documentation, not source code.
- Record the session's findings in `docs/lesson/lessons-<date>-<theme>.md` using `docs/template/session-findings.md`. Entries use titles, never ordinal numbers.

**Routing**

| Lesson kind              | Owning destination                                                        |
| ------------------------ | ------------------------------------------------------------------------- |
| Engineering wound        | The relevant standard's findings, for example `standard/typescript-react-development.md` |
| Testing or tooling wound | The owning section of `TESTING.md`                                        |
| Versioning wound         | The owning section of `VERSIONING.md`                                     |
| Workflow wound           | A rule in this file plus a dated record in `docs/decision/` when the decision is durable |
| Machine or tooling quirk | Environment notes in `DEPLOYMENT.md` or `WORKFLOW.md`                     |

The lesson file indexes rules that live in the owning documents - it does not hold the rules themselves.

## Memorisation Convention

When the user says "memorise" or "remember", adjust the relevant guideline file or files in the project with the new rule - memorisation means updating project guidelines. A memorisation request that also names a correction applies the correction in the same task.

| Rule About                          | Goes To            |
| ----------------------------------- | ------------------ |
| Documentation structure or language | `GUIDELINES.md`    |
| Project scope or requirements       | `PROJECT.md`       |
| Architecture or patterns            | `ARCHITECTURE.md`  |
| Implementation details              | `SPECIFICATION.md` |
| Workflows                           | `WORKFLOW.md`      |
| Testing                             | `TESTING.md`       |
| Refactoring                         | `REFACTORING.md`   |

If no specialised file is appropriate, update this file. Always confirm the rule has been added to the correct file.

## Documentation Guidelines

The documentation style rules live in `STYLE.md`, which is the central source of truth for documentation style. The subsections that used to live here - Documentation Style, Internal Document References, Markdown Tables, Formatting Rules, and API Design Documentation - moved there unchanged.

## Documentation Distillation

Distillation keeps the documentation lean by removing content that is obvious from the source code and replacing it with cross-references. It is triggered on request, when the user says "distil" or "distill" in relation to documentation.

Distillation is a documentation-only change and bypasses the verification loop.

**Scope**

Distil `SPECIFICATION.md` and `GUIDELINES.md`. Do not remove sections from `PROJECT.md`, `ARCHITECTURE.md`, or `WORKFLOW.md` unless they also contain raw code duplication.

**What to remove**

- Technology stack tables that duplicate `package.json`.
- Directory trees that mirror the filesystem.
- Store-to-file mapping tables obvious from the store directory.
- Raw type interface blocks that duplicate `src/types/` or other source files.
- Build configuration that duplicates config files.
- Development script listings that duplicate `package.json` scripts.
- Constants tables that duplicate `src/constants/`.

**What to keep**

- Behavioural rules and semantics not obvious from interfaces alone.
- Extensibility contracts and design rationales.
- Algorithm descriptions and interaction rules.
- Error handling policies and severity behaviour.
- Lifecycle and startup explanations.
- Cross-references to the source files where definitions live.

**Process**

Replace each removed code block with a short reference such as `See src/synth/SoundDriver.ts for the Song, Pattern, and Instrument types`. Preserve all prose that explains why a type exists or how it behaves. Verify each cross-reference points to a file that exists before removing the duplicated content.

## Date and Time Format

All timestamps in project metadata, logs, and data files use a modified ISO 8601 format in local time.

**Format: `YYYY-MM-DD hh:mm:ss`**

Examples:

- `2024-01-15 10:30:00`
- `2026-04-27 14:22:15`

**Rules**

- Use 24-hour time, from `00:00:00` to `23:59:59`.
- No `T` separator between date and time.
- No timezone indicator; local time only.
- Month and day are zero-padded, `01` to `12` and `01` to `31`.
- Hours, minutes, and seconds are zero-padded, `00` to `59`.

## Naming Conventions

- **Types and classes**: `PascalCase`.
- **Variables and functions**: `camelCase`.
- **Components**: `PascalCase` for React component files (`.tsx` only).
- **Hooks**: `useCamelCase`, must start with `use`.
- **CSS classes**: `kebab-case` or BEM notation.
- **Config and data files**: `snake_case`.
- **Version numbers**: use just the number (for example `1.2.7`). Do not prefix with `v`.

**File naming rules**

- React component files must use `PascalCase` (for example `TrackPanel.tsx`, `CommandPanel.tsx`).
- All other TypeScript files must use `camelCase` (for example `songParser.ts`, `envelopeUtils.ts`).
- This distinction aligns with Vite, create-react-app, and modern React ecosystem standards.

## Testing

See `TESTING.md` for the canonical verification loop, test types, fixtures, and test layout.

## Development Principles

- Preserve existing style and conventions.
- Prefer minimal, safe changes.
- Keep components decoupled. Each feature must be independently testable.

## File Maintenance

- Preserve encoding and line endings in existing files.
- Do not add generated files to the repository unless explicitly required.
- Do not change version numbers in project artefacts unless explicitly instructed.
- **Header versions**: do not bump version numbers in document headers unless explicitly instructed by the user.
- **CHANGELOG.md**: do not modify `public/CHANGELOG.md` outside the version bump procedure described in `VERSIONING.md`. Feature and fix entries accumulate in the codebase and are recorded only when the version is actually bumped. Never delete or truncate older version entries when adding new versions - the complete historical record must be preserved.
- **Binary output location**: all compiled output must go to a dedicated `dist/` or `build/` directory. Never build to the repository root, source directories, or outside the project. The `dist/` directory must be gitignored.
- **Temporary files**: always use the `work` directory at the repository root for temporary files, test data, local-only configurations, and generated artifacts. Never create `work/` subdirectories inside component directories. Tests that generate files on disk must write them inside `work/` and must clean them up afterward using `try/finally` so no generated file is left behind inside or outside `work/`.
- **Agent entry files**: do not create `AGENTS.md` or equivalent agent entry files. `README.md` routes agents to `GUIDELINES.md` as the documented entry point. Do not propose adding such files during documentation evaluations, supplements, or reorganizations.
- **MAX.md**: externally managed document - never edit it. Format-spec changes arrive with the upstream specification.

## Audio-Critical Development Principles

This section defines the audio-critical development principles for this real-time audio application. These principles override standard React best practices within this project.

**Critical: Audio Performance Trade-offs**

This is a real-time audio application where timing is critical. Some React "anti-patterns" are intentionally maintained for audio stability.

**Do Not Apply These Linting Fixes**

1. **Dependency Array Additions** — Adding missing dependencies to `useCallback` or `useMemo` can cause re-renders during audio processing.
   - Example: `currentInstrumentData?.id`, `onHardStopLivePreview` in dependency arrays.
   - Reason: Re-renders interrupt audio timing and cause glitches.

2. **useCallback Wrapping** — Wrapping functions in `useCallback` for dependency arrays can affect render timing.
   - Example: Wrapping `stopPreview` in `useCallback`.
   - Reason: Memoization changes render cycle timing.

3. **State Synchronization Removal** — Removing prop mirroring (local state syncing with props) can break audio timing.
   - Example: `EnvelopePanel` local `envelopeData` state, `TrackPanel` local `currentInstrument` state.
   - Reason: Local state provides stable timing vs prop-driven updates.

4. **setState-in-effect "Fixes"** — Using `setTimeout` to defer setState in effects causes race conditions.
   - Example: `setTimeout(() => setState(value), 0)`.
   - Reason: Async state updates cause stale data during audio rendering.

**Safe to Apply**

1. **Type Safety Fixes**
   - Replacing `any` types with proper TypeScript types.
   - Adding explicit type annotations.
   - Example: `Record<string, unknown>` instead of `any`.

2. **Unused Code Removal**
   - Removing unused imports.
   - Removing unused variables.
   - Removing dead code.

3. **Non-Functional Improvements**
   - Code formatting.
   - Comment improvements.
   - Test setup fixes.

**Development Workflow**

1. **Always Test Audio After Changes**
   - Any change to React hooks, state management, or component lifecycle must be audio-tested.
   - Use git stash to isolate changes and test incrementally.

2. **Prefer Manual Reverts Over Automated Fixes**
   - If audio glitches occur, revert changes manually rather than applying more "fixes".
   - The original codebase was carefully tuned for audio performance.

3. **Accept Linting Warnings**
   - React hooks dependency warnings are acceptable in audio-critical paths.
   - setState-in-effect warnings are acceptable in audio-critical paths.
   - These warnings indicate intentional performance optimizations.

4. **Focus on Audio-First Development**
   - Audio stability is the highest priority.
   - React best practices are secondary to performance.
   - Test with real audio playback, not just visual rendering.

**Red Flags for Audio Issues**

If these occur after applying linting fixes:

- Audio glitches, pops, or timing issues.
- Stuttering or delayed audio response.
- Inconsistent envelope or instrument behavior.

Immediate action: revert the changes using git stash or git checkout.

**Code Review Checklist**

When reviewing changes, ask:

- Does this affect React render timing?
- Does this change `useCallback` or `useMemo` dependencies?
- Does this modify state management patterns?
- Does this remove local state (prop mirroring)?
- Has this been audio-tested?

**Architecture Notes**

The codebase uses several patterns that may appear "wrong" from a React perspective but are essential for audio:

- **Prop mirroring**: local state synced with props for stable timing.
- **Sparse dependency arrays**: minimal dependencies to prevent unnecessary re-renders.
- **Direct setState calls**: synchronous state updates for predictable timing.
- **Manual memoization**: carefully controlled memoization vs React's automatic optimizations.

These patterns ensure that audio processing occurs at consistent intervals without interruption from React's render cycle.

In real-time audio applications, performance trumps purity. The "wrong" way that works is better than the "right" way that glitches.

## Agent Operations

**Session Reporting**

Under the `session-reporting` extension:

- A request to "print usage" writes the session usage report as markdown tables: agent identity (software name, version, and the language model when known), conversation summary (prompt requests, reply blocks, sentence and token counts, marking estimated values), context-window usage and remaining headroom, fulfillment of each requested item against its delivered result, and the boundary state (uncommitted files, branch position, reserved decisions). Counters the host does not expose are reported unknown.
- Operation timing is armed by default. The agent captures the clock before starting an operation's work and ends the response with `<subject> took <m:ss>`. Naming `no timing` or `without timing` opts out for that request only. An operation longer than three minutes closes with a stage-breakdown table before the timing sentence. A backgrounded command running past about a minute reports a progress heartbeat roughly every 60 seconds - one short line with the current stage, items done of the total, and warnings seen.
- In verbose mode the final response additionally writes the usage report as markdown tables - the same content a `print usage` request produces, with unavailable counters marked unknown - plus a short description of the change, immediately before the timing line.

**Context Management**

When the context window approaches its limit, the agent divides the remaining work into discrete tasks and delegates them to spawned subagents rather than continuing degraded. Each delegated task carries its own context, file scope, and verification expectations. The agent keeps orchestration - the division, the merge, and the final verification - local.

**Clean and Purge**

Under the `clean` and `purge` extensions:

- A request to "clean project" or "clean the project" runs `scripts/clean.sh`, which removes only build artifacts and temporary files that are not under version control - `dist/`, `coverage/`, `playwright-report/`, `test-results/`, and temp residue such as `*.log`, `*.tmp`, `*.bak`, and `.DS_Store` files. Each target is verified ignored and untracked before deletion, a locked file is reported and skipped rather than failing the run, and `--dry-run` lists targets without deleting.
- A request to "purge project" or "purge the project" removes everything `clean` removes plus `node_modules/` and `work/` - all restorable through `npm install` and session recreation. The script names the restore procedure when it finishes.

## General Rules

- **Strict rule adherence**: follow the rules at all times unless specifically told to do otherwise.
- **Default workflow**: every change follows the standard workflow (change request, deep analysis, implementation plan, documentation-first updates, verification loop) unless the request explicitly names an ad-hoc, immediate, or quick path.
- **Structural proposals carry trees**: every answer or document that proposes a structural change (directory locations, file moves) includes the proposed directory tree as one fenced annotated block.
- **Copyright compliance**: `COPYRIGHTS.md` contains mandatory copyright and licensing rules that must be obeyed. All code must be original, AI-generated code must be verified for originality, and dependency licensing must be compatible (MIT, Apache 2.0, BSD 2-Clause, BSD 3-Clause, ISC, Boost only; GPL is not allowed).
- **No legacy checking**: unless specifically told to do so, do not implement additional support for previous behaviour or create legacy checking for deprecated configuration keys or features.
- **Debug logging cleanup**: when debug logging such as `console.log` is added to trace bugs, it must be removed after the bug is fixed.
- **AI interaction patterns**: when explaining what actions will be taken for a request type, describe the process generally without asking for task-specific details. Only ask for specifics when the user actually initiates that type of request. This applies to refactoring proposals, feature implementations, and any multi-step workflows.
- **Refactoring proposals**: when asked to create a refactoring proposal, do not ask the user what to refactor. Instead, autonomously analyse recent changes, the current implementation, existing guidelines and standards, and good practices to determine the most valuable refactoring focus. Present the proposal for review before implementing.
```
