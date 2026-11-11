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

| File               | Purpose                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GUIDELINES.md`    | Central source of truth for AI-assisted development rules (this file)                                                                        |
| `STYLE.md`         | Central source of truth for documentation style rules                                                                                        |
| `PROJECT.md`       | Project description, scope, requirements, use cases, and quality targets                                                                     |
| `ARCHITECTURE.md`  | System architecture, module boundaries, state domains, and patterns                                                                          |
| `SPECIFICATION.md` | Project-specific implementation details and conventions - owns the audio-critical development principles                                     |
| `COPYRIGHTS.md`    | Copyright and licensing rules                                                                                                                |
| `WORKFLOW.md`      | Day-to-day development workflow - owns repository layout, session review, memorisation, distillation, directory access, and agent operations |
| `REFACTORING.md`   | Refactoring proposal and assessment process                                                                                                  |
| `TESTING.md`       | Testing strategy, test types, fixtures, and verification                                                                                     |
| `DEPLOYMENT.md`    | Deployment targets and hosting                                                                                                               |
| `VERSIONING.md`    | Version numbering scheme, bumping rules, and CHANGELOG format                                                                                |
| `FORMAT.md`        | Project file format specification for song and instrument files                                                                              |
| `MAX.md`           | MAX audio file format specification                                                                                                          |
| `FUTURE.md`        | Candidate future enhancements (not committed work)                                                                                           |
| `standard/`        | Engineering-standard library - index `standard/README.md`                                                                                    |
| `template/`        | Document templates                                                                                                                           |

### Three Pillars of Technical Documentation

Three documents form the pillars of the technical documentation. They separate concerns by role and must not duplicate each other. During implementation, update the pillar that owns the change first, before touching code.

**PROJECT.md**

What the system must do - vision, goals and non-goals, target audience, glossary, functional and non-functional requirements, use cases, and quality targets.

**ARCHITECTURE.md**

How the system is organised - system overview, module boundaries, state domains, data flow, and the architectural decision log.

**SPECIFICATION.md**

How the system works internally - data models, algorithms, file formats, constants, input bindings, and known implementation limitations.

## Repository Layout

See `WORKFLOW.md` for the resolved role-to-path map of the documentation set and its workflow directories.

**Recorded conventions**

- Document style owner: `STYLE.md`.
- Testing and verification owner: `TESTING.md`.
- Workflow owner: `WORKFLOW.md`.
- Execution policy: Human in the Loop - the user approves plans, commits changes manually, and holds reserved decisions (commit authorship, version bump, release baseline). Inside a version-window request the default gate mode is `human-in-the-loop` with `autonomous` selectable per request - the named window request is the explicit instruction that authorizes the closing version bump, and the cycle never commits under any mode.
- Adopted extensions: `version-window`, `run-resume`, `standards-synchronization`, `stage-gates`, `specification-audit`, `verification-options`, `preserve-before-reorganize`, `artifact-summary`, `work-modes`, `improvement-step`, `session-reporting`, `runnable-artifact`, `independent-verification`, `lessons-loop`, `clean`, `purge`, `version-family-retention`.
- Adopted conventions: `audit-driven-development`, `session-review`, `version-review`.
- Trigger phrases: `run the SDLC for <version>` or `process the <version> window` executes the Version Window SDLC recorded in `WORKFLOW.md` - `improve dosound-tracker` runs the Session Review recorded in `WORKFLOW.md` - `archive old documents`, `archive documents`, or `run retention` runs the Document Retention sweep recorded in `WORKFLOW.md`. Trigger phrases are recorded, never implied.
- Run-state record: `docs/plan/<version>/window-run.md` tracks completed window stages so an interrupted window run resumes at the first incomplete stage.
- A window review or audit report that was never produced for a released version is abandoned, not repaired - change records that propose retroactively writing past-version reports are discarded.
- Community files (`CONTRIBUTING.md`, `SECURITY.md`) were evaluated and declined - none are planned.
- A CI pipeline (`.github/workflows/`) was evaluated and declined - the verification loop is enforced locally and no CI configuration is planned.
- Repository profile: `Software`. Topology: `single-project`. Guidelines topology: `Distributed` - `GUIDELINES.md` plus topic owners.
- Environment-readiness owner: `README.md` for the development environment, `DEPLOYMENT.md` for build and deployment prerequisites.
- An explicit user instruction may produce an implementation plan without a change record - the plan states the instruction as its reference (for example `docs/archive/plan/1.3.1/remove-ci-workflow.md`).
- `COMPARISATION` filenames and `docs/archive/report/1.2.4-configuration/` are accepted historical naming variance inside restricted directories and are not normalized.
- ASE reference: adjustments to this document set consult the `compass-skill` canonical corpus - `references/PREPARATION.md` and the `conventions/` registry - for expected structure and semantics before editing.

## General Workflow

**Read all guidelines before any change**

This rule is mandatory and unconditional. Before making any change in this codebase, read every file in the active documentation set. Never assume a subset is sufficient. No matter how small the change, every guideline file must be reviewed first.

- Always read all guideline files before making changes. The required files are the per-document rows of the Sources of Truth table - `MAX.md`, `FUTURE.md`, `standard/`, and `template/` excluded - plus `standard/README.md` as the index for the matching standard file.
- Never assume a subset of these files is sufficient.
- For any implementation task, consult the corresponding standard in `standard/` before writing code - the index is `standard/README.md`. These standards are generalized - project-specific conventions and code organization live in `SPECIFICATION.md` and in each standard's `Project Conventions` section.
- Ask for clarification when requirements are missing or ambiguous.
- When a guideline file is added, removed, or its purpose changes, update this file accordingly.

**Work Intake Table**

When starting work on a request, include a table reporting the guidelines files and directories inspected before acting.

- One row per guidelines file read or re-read for the current request.
- One row per directory scanned for the current request.
- List only items actually inspected - a file carried over from earlier in the session is marked `carried over`, not counted as read.
- A guideline file surveyed through a delegated scout digest is marked `scout digest`, not `read` - the orchestrator reads the file itself whenever the digest covered it incompletely.
- Restricted directories kept closed by the Document Directory Access rules in `WORKFLOW.md` are not listed.

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
- Plan location, naming, and version-directory rules are owned by `WORKFLOW.md` under Implementation Planning.
- Do not include time estimates for phases - time does not matter for agentic software engineering.

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

Implementation plans follow `STYLE.md` like every other document. Plan-specific deltas:

- Use procedure format for implementation steps (bold headings, descriptions, code blocks), not numbered lists.
- Bold step headers carry no "Step X" prefixes.

**Change Request and Plan Directory Access**

See `WORKFLOW.md` under Document Directory Access for the restricted-directory read gates.

**Change Request Document Creation**

When asked to describe a change (feature, fix, refactor, chore):

- Read current project documentation to understand the context
- Analyze current implementation to understand the existing code
- Use the template at `docs/template/change-request-template.md`
- Create the document in `docs/change/<version>/` where `<version>` is the current version from `package.json`
- When the request binds the change to a record in a different version group - a declared dependency or integration target - the record joins the dependency's group instead of the `package.json` version
- Name the document using kebab-case to briefly describe the change (for example `midi-support.md`, `export-dump-fix.md`)
- The user may want to relocate the file after creation
- Change records are reviewed by experienced designers - keep each record precise, verified against the current tree, and free of drafting artifacts
- Verify every fact a record asserts against the current tree before authoring - a stale claim in the documentation set is fixed in its owning document first, never copied into a record
- Named external references - hardware boards, machine models, format specifications - are verified against their source material before a record cites them; a recalled example is a claim, not a fact

## Applying a Change

These rules apply to every change made in this project. Follow them in order - do not skip steps.

**Understand the change**

- Read the request carefully.
- Identify all components, modules, and documentation files affected.

**Create or confirm the plan**

- When asked to perform a change, first create an implementation plan - location, naming, and version-directory rules are owned by `WORKFLOW.md` under Implementation Planning.
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

The work is finished only when the loop passes clean, the implementation matches the documentation, and any plan in scope has been satisfied. Documentation-only changes bypass the loop per `TESTING.md`.

**Repeat until done**

- If the change spans multiple components, repeat the implement and verify steps for each one.
- Do not consider the task complete until all components pass and documentation is consistent with the final implementation.

**Propose a commit message**

After the change is complete and the verification loop passes, propose a commit message for review, following the Commit Messages rules above. Do not commit - the user commits manually.

## Session Review

See `WORKFLOW.md` for the session-review convention - trigger, procedure, and lesson routing.

## Memorisation Convention

See `WORKFLOW.md` for the memorisation convention and its rule-routing table.

## Documentation Guidelines

The documentation style rules live in `STYLE.md`, the central source of truth for documentation style.

## Documentation Distillation

See `WORKFLOW.md` for the documentation-distillation convention.

## Date and Time Format

See `SPECIFICATION.md` for the timestamp format rules.

## Naming Conventions

See `SPECIFICATION.md` for the project naming conventions.

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

See `SPECIFICATION.md` for the audio-critical development principles, which override the general standards on audio-critical code paths.

## Agent Operations

See `WORKFLOW.md` for session reporting, context management, and the clean and purge operations.

## General Rules

- **Strict rule adherence**: follow the rules at all times unless specifically told to do otherwise.
- **Default workflow**: every change follows the standard workflow (change request, deep analysis, implementation plan, documentation-first updates, verification loop) unless the request explicitly names an ad-hoc, immediate, or quick path.
- **Structural proposals carry trees**: every answer or document that proposes a structural change (directory locations, file moves) includes the proposed directory tree as one fenced annotated block.
- **Copyright compliance**: `COPYRIGHTS.md` contains mandatory copyright and licensing rules that must be obeyed. All code must be original, AI-generated code must be verified for originality, and dependency licensing must be compatible (MIT, Apache 2.0, BSD 2-Clause, BSD 3-Clause, ISC, Boost only - GPL is not allowed).
- **No legacy checking**: unless specifically told to do so, do not implement additional support for previous behaviour or create legacy checking for deprecated configuration keys or features.
- **Debug logging cleanup**: when debug logging such as `console.log` is added to trace bugs, it must be removed after the bug is fixed.
- **AI interaction patterns**: when explaining what actions will be taken for a request type, describe the process generally without asking for task-specific details. Only ask for specifics when the user actually initiates that type of request. This applies to refactoring proposals, feature implementations, and any multi-step workflows.
- **Refactoring proposals**: when asked to create a refactoring proposal, do not ask the user what to refactor. Instead, autonomously analyse recent changes, the current implementation, existing guidelines and standards, and good practices to determine the most valuable refactoring focus. Present the proposal for review before implementing.
