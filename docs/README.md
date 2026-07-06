# DOSOUND Tracker — Agent Entry Point

This file is the primary entry point for AI coding agents working in this repository.
Read it first, then read every file listed below before making any change.

## Read All Guidelines First

This rule is mandatory and unconditional.
Before making any change in this repository, read every file in the active documentation set.

Required files, in order:

- `GUIDELINES.md` — hard rules, naming, documentation style, change workflow, audio-critical principles
- `PROJECT.md` — requirements, use cases, quality targets
- `ARCHITECTURE.md` — system architecture, module boundaries, state domains
- `SPECIFICATION.md` — implementation details, source layout, schemas, constants
- `FORMAT.md` — song and instrument file format specification
- `COPYRIGHTS.md` — copyright and licensing rules
- `WORKFLOW.md` — day-to-day development workflow
- `REFACTORING.md` — refactoring proposal and assessment process
- `TESTING.md` — testing strategy, verification loop, CI
- `DEPLOYMENT.md` — deployment targets and hosting
- `VERSIONING.md` — version numbering, bumping rules, CHANGELOG format
- `standard/ts-react-development.md` — TypeScript and React engineering standards

Never assume a subset is sufficient.
Never make any code change before completing this read.

## New Feature Implementation Workflow

When asked to implement a new feature, follow this sequence exactly.

1. Read all guidelines files and follow rules.
2. Analyse the current implementation.
3. Make required research.
4. Create a change request in `docs/change/<version>/` using `docs/template/change-request-template.md`.
5. Create an implementation plan in `docs/plan/<version>/` using `docs/template/implementation-plan-template.md`.
6. Ask for confirmation to implement.

Do not begin implementation until the user confirms the plan.

## Key Rules

- No commits unless explicitly told to commit. The AI assistant never commits.
- No version bumps unless explicitly instructed. Use `npm run bump` to bump and build; `npm run build` builds without bumping.
- No commit message prefixes (`feat:`, `fix:`, `docs:`, etc.).
- Update documentation before writing any code.
- Run the verification loop before the first code change and after finishing implementation: `npm run typecheck && npm run lint && npm run build && npm test`.
- Windows shell is PowerShell. Do not use Unix utilities (`grep`, `awk`, `sed`, `head`).
- Audio-critical development principles in `GUIDELINES.md` override standard React best practices. Never apply linting fixes that break audio timing.

See `GUIDELINES.md` for the complete rule set.
