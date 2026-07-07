# DOSOUND Tracker Development Guidelines

## Hard Rules

**Section Header Format**

- Use "fragment", not "excerpt", for code examples.
- Section headers using bold (`**Header**`) must follow this format:
  - Header text on its own line.
  - No period at the end.
  - Followed by a blank line.
  - Content on the next line.

Example:

```
**Schema validator**

Rejects unknown fields loudly in development.
```

Not:

```
**Schema validator.**

Rejects unknown fields loudly in development.
```

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

| File                                       | Purpose                                                          |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `GUIDELINES.md`                            | Central source of truth for AI-assisted development rules (this file) |
| `PROJECT.md`                               | Project description, scope, requirements, use cases, and quality targets |
| `ARCHITECTURE.md`                          | System architecture, module boundaries, state domains, and patterns |
| `SPECIFICATION.md`                         | Project-specific implementation details, stack, schemas, and constants |
| `COPYRIGHTS.md`                            | Copyright and licensing rules                                    |
| `WORKFLOW.md`                              | Day-to-day development workflow                                  |
| `REFACTORING.md`                           | Refactoring proposal and assessment process                      |
| `TESTING.md`                               | Testing strategy, test types, fixtures, and CI                   |
| `DEPLOYMENT.md`                            | Deployment targets and hosting                                   |
| `VERSIONING.md`                            | Version numbering scheme, bumping rules, and CHANGELOG format    |
| `FORMAT.md`                                | Project file format specification for song and instrument files  |
| `MAX.md`                                   | MAX audio file format specification                              |
| `FUTURE.md`                                | Candidate future enhancements (not committed work)              |
| `standard/ts-react-development.md`         | TypeScript and React engineering standard                        |
| `template/change-request-template.md`      | Template for change request specification documents              |
| `template/implementation-plan-template.md` | Template for implementation plan documents                       |

## General Workflow

**Read all guidelines before any change**

This rule is mandatory and unconditional. Before making any change in this codebase, read every file in the active documentation set listed below. Never assume a subset is sufficient. No matter how small the change, every guideline file must be reviewed first.

- Always read all guideline files before making changes. The required files are:
  - `GUIDELINES.md`
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
  - `standard/ts-react-development.md`
- Never assume a subset of these files is sufficient.
- For any implementation task, consult the corresponding standard in `standard/` before writing code. These standards are generalized; project-specific conventions and code organization live in `SPECIFICATION.md`.
- Ask for clarification when requirements are missing or ambiguous.
- When a guideline file is added, removed, or its purpose changes, update this file accordingly.

## Implementation Planning

**New Feature Implementation Workflow**

When asked to implement a new feature, follow this sequence:

1. Read all guidelines files and follow rules.
2. Analyze current implementation.
3. Make required research.
4. Create change request.
5. Create implementation plan.
6. Ask for confirmation to implement.

Do not begin implementation until the user confirms the plan.

**Implementation Plan Creation**

When asked to make an implementation plan:

- Gather all requirements from project documentation (`PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`).
- Review `standard/ts-react-development.md` for general engineering standards and best practices.
- Review `SPECIFICATION.md` for project-specific source layout, technology stack, and coding conventions.
- Use the template at `docs/template/implementation-plan-template.md`.
- Create a comprehensive implementation plan in `docs/plan/<current_version>/`. Name the plan document to match the change request file (for example `midi-support-implementation.md` for `midi-support.md`), or according to the nature of the change if based on a description.
- Use the current version number from `package.json` for the plan directory.
- Do not include time estimates for phases; time does not matter for agentic software engineering.

**Required Plan Contents**

Every implementation plan must include:

- Best practices applicable to the specific implementation.
- Reference to engineering standards from `standard/ts-react-development.md`.
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

```
**Fix track panel instrument display**

TrackPanel shows instrument ID from local state. Use currentInstrument from props instead.

File to modify: `src/components/TrackPanel.tsx`.

```typescript
// Import currentInstrument
```
```

**Change Request and Plan Directory Access**

- Do not read any document from `docs/change/` unless the user explicitly requests implementation of a specific change request. Never automatically scan or gather change requests from this directory; the user will manually request implementation plans for individual changes.
- Do not read any document from `docs/plan/` unless specifically instructed by the user. Implementation plans are written to this directory only when the user explicitly requests them.
- Do not read any document from `docs/archive/` or `docs/refactoring/` unless specifically instructed by the user. These directories contain historical documents and refactoring proposals that are not part of the active documentation set.
- Do not read any document from `docs/report/` unless the user explicitly requests it. This directory is for custom reports generated on demand and is not part of the active documentation set.
- Do not read any document from `docs/prompt/` unless specifically instructed by the user. This directory contains historical AI prompt logs from versions 1.0, 1.1, and 1.2 and is not part of the active documentation set.
- Do not read any document from `docs/feature/` unless specifically instructed by the user. This directory contains feature proposals that are not part of the active documentation set.

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

Run the full verification loop defined in `TESTING.md` before the first code modification to establish a known-good baseline. Do not begin implementation until this baseline passes with zero errors and zero warnings.

During implementation, run the targeted verification loop (typecheck, lint, format, build, and only the tests covering the modified code) after each iteration.

After implementation is finished, run the full verification loop again. The work is finished only when both the pre-change baseline and the post-change run pass with zero errors and zero warnings, the implementation matches the documentation, and any plan in scope has been satisfied.

Do not run the verification loop for documentation-only changes. See the "Documentation-Only Changes Bypass the Verification Loop" rule above.

**Repeat until done**

- If the change spans multiple components, repeat the implement and verify steps for each one.
- Do not consider the task complete until all components pass and documentation is consistent with the final implementation.

## Memorisation Convention

When the user says "memorise" or "remember", update the most relevant guideline file with the new rule.

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

**Documentation Style**

- Write short sentences.
- Use explicit line breaks.
- One idea per paragraph. Do not group unrelated thoughts in the same paragraph.
- **Blank lines**: never put more than one blank line between sections or blocks. Avoid two or more consecutive blank lines.
- **Language**: all project documentation must be written in English. This applies to every file under `docs/`.
- **Lists**: prefer bullet points (`-`) over numbering. Avoid numbering unless the order is strictly required for technical correctness. Put exactly one blank line before and after lists of items.
- **Procedures**: do not use numbered lists for complex procedures with code blocks. Instead end the introductory sentence with a dot, use a bold heading for each step on its own line, put exactly one empty line before the step description or code, and put exactly one empty line after the step content.
- Use standard ASCII characters.
- Keep section names short. Do not put qualifiers in section names using parentheses. Put qualifiers like "mandatory" or "do not repeat" as sentences in the section body instead.
- **Heading hierarchy**: use H2 (`##`) for major sections and H3 (`###`) for subsections. For emphasis on non-heading text, use bold on its own line.
- **Flattened structure**: use H2 for all major sections under the main H1. Avoid deeply nested hierarchies beyond H3. Stick to the existing heading levels of the document being modified.
- **Horizontal dividers**: do not use `---` anywhere in documents. Separate sections using headings only.
- **Headings**: avoid using colons in headings.

**Internal Document References**

When referencing other documents within the same `docs/` directory, do not include the `docs/` prefix. Use only the filename.

Examples:

- GOOD: "See `SPECIFICATION.md` for details".
- GOOD: "Defined in `ARCHITECTURE.md`".
- BAD: "See `docs/SPECIFICATION.md` for details".
- BAD: "Defined in `docs/ARCHITECTURE.md`".

**Markdown Tables**

- Keep them readable as plain text.
- **Proactive formatting**: when editing any document in markdown format, check and fix markdown table alignment and documentation style compliance, even for tables not directly edited.
- **Cell descriptions**: use short, telegraphic noun phrases. Never start with "A", "An", or "The". Avoid full sentences in table cells.
- **Column widths**: calculate the column width as the maximum character width of all cells in that column, including the header cell. Include all Markdown formatting characters in the width measurement.
- **Cell padding**: pad every cell with trailing spaces so it matches the column width. Empty cells must also be padded. Do not pad beyond the column width. Never truncate cell contents. Content must be aligned left. Do not use `:---` or `---:`.
- **Delimiters**: use one space after the leading pipe and one space before the trailing pipe. Do not add extra spaces around the pipes beyond the single required space.
- **Separator row**: place the separator line immediately after the header row. Use `W + 2` contiguous hyphens, where `W` is the calculated column width. Do not add spaces between the pipes and the hyphens.
- **Pipes**: all vertical pipes (`|`) must be vertically aligned.
- **Visual indicators**: use `✓` for affirmative or available features and `✗` for negative or unavailable features.

**Formatting Rules**

- Put code, commands, file names, and paths in backticks.
- **Code blocks**: always use three backticks. No indentation; the block starts at the very beginning of the line. Mandatory spacing: exactly one blank line before and after the block.

**API Design Documentation**

- **Component structure**: group components by feature or domain.
- **Table format**: use tables to list props and methods.
- **Parameter tables**: use columns `Name`, `Type`, `Required`, and `Description`.
- **Error consistency**: document standard error handling patterns.

**CHANGELOG Maintenance**

For version bumping rules and CHANGELOG format, see `VERSIONING.md`.

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

See `TESTING.md` for the canonical verification loop, test types, fixtures, and CI configuration.

## Development Principles

- Preserve existing style and conventions.
- Prefer minimal, safe changes.
- Keep components decoupled. Each feature must be independently testable.

## File Maintenance

- Preserve encoding and line endings in existing files.
- Do not add generated files to the repository unless explicitly required.
- Do not change version numbers in project artefacts unless explicitly instructed.
- **Header versions**: do not bump version numbers in document headers unless explicitly instructed by the user.
- **CHANGELOG.md**: do not modify `CHANGELOG.md` outside the version bump procedure described in `VERSIONING.md`. Feature and fix entries accumulate in the codebase and are recorded only when the version is actually bumped.
- **Binary output location**: all compiled output must go to a dedicated `dist/` or `build/` directory. Never build to the repository root, source directories, or outside the project. The `dist/` directory must be gitignored.
- **Temporary files**: always use the `work` directory at the repository root for temporary files, test data, local-only configurations, and generated artifacts. Never create `work/` subdirectories inside component directories. Tests that generate files on disk must write them inside `work/` and must clean them up afterward using `try/finally` so no generated file is left behind inside or outside `work/`.

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

## General Rules

- **Strict rule adherence**: follow the rules at all times unless specifically told to do otherwise.
- **Copyright compliance**: `COPYRIGHTS.md` contains mandatory copyright and licensing rules that must be obeyed. All code must be original, AI-generated code must be verified for originality, and dependency licensing must be compatible (MIT, Apache 2.0, BSD 2-Clause, BSD 3-Clause, ISC, Boost only; GPL is not allowed).
- **No legacy checking**: unless specifically told to do so, do not implement additional support for previous behaviour or create legacy checking for deprecated configuration keys or features.
- **Debug logging cleanup**: when debug logging such as `console.log` is added to trace bugs, it must be removed after the bug is fixed.
- **AI interaction patterns**: when explaining what actions will be taken for a request type, describe the process generally without asking for task-specific details. Only ask for specifics when the user actually initiates that type of request. This applies to refactoring proposals, feature implementations, and any multi-step workflows.
- **Refactoring proposals**: when asked to create a refactoring proposal, do not ask the user what to refactor. Instead, autonomously analyse recent changes, the current implementation, existing guidelines and standards, and good practices to determine the most valuable refactoring focus. Present the proposal for review before implementing.
