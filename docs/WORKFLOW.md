# Development Workflow

This document describes the day-to-day operational steps for delivering changes. It complements `GUIDELINES.md` (which defines the change process) and `TESTING.md` (which defines verification gates).

## Verification Loop

`TESTING.md` defines the canonical step order (`typecheck -> lint -> build -> test -> fix`), the zero-error/zero-warning bar, and the end-to-end test command. The verification loop has two modes documented in `TESTING.md`:

- **Targeted verification loop** — run during implementation iterations, testing only the code being modified.
- **Full verification loop** — run at milestones (before first code change, after finishing implementation, after refactoring, before version bump, and when asked for a production ready build).

**When the verification loop is required**

Run the verification loop only when source code, configuration, or test files are modified. It is required:

- Before the first code modification, to establish a known-good baseline.
- After each code change iteration.
- After finishing implementation or refactoring.
- Before version bumping.
- When explicitly asked for a production-ready build.

Do not run the verification loop for documentation-only changes (for example creating or updating change request documents, implementation plans, refactoring proposals, refactoring assessments, or guideline files). These changes do not affect source code, build artefacts, or test results.

**Pre-Change Baseline**

Run the full verification loop before the first code modification to establish a known-good baseline. Do not begin any implementation or refactoring until this baseline passes with zero errors and zero warnings.

**Fix Requirements**

When running the verification loop during the usual workflow (including refactoring process), you must not only build, test, and lint, but also fix all errors and all test failures. The loop is complete only when:

- All typecheck errors are resolved
- All lint errors are resolved
- All build errors are resolved
- All test failures are resolved

This applies to **every** test failure without exception:

- Failures caused by the current code change — fix the code or update the test.
- Failures that existed before the change — fix them immediately. Never dismiss them as "pre-existing".
- Flaky or timing-dependent failures — make them deterministic or remove them.

A test suite with any failing tests is not clean. Do not proceed until every failure is addressed.

## Standard Implementation Process

This is the default method for implementing all changes. The high-level rules live in `GUIDELINES.md` under "Applying a Change"; this section captures the operational details.

**Documentation-First Approach**

Every implementation begins with updating project documentation. Do not write any code before documentation is updated.

**Update project documentation**

Edit the relevant project documentation files to reflect the planned changes:

- `PROJECT.md` for new requirements or behavioural changes.
- `ARCHITECTURE.md` for architectural or structural changes.
- `SPECIFICATION.md` for implementation-specific details.
- `FORMAT.md` for changes to save or export file formats.

**Follow the implementation plan, if one exists**

When an implementation plan exists, follow it precisely. The implementation must be fully consistent with the plan.

**Handle problems and irregularities**

If problems or inconsistencies are detected during implementation:

- Stop and ask for clarification on the specific issue.
- Update the implementation plan to address the problem.
- Do not proceed with inconsistent implementation.

**Implement code changes**

After documentation is updated and any plan issues are resolved, implement the code changes.

**Run the verification loop**

Run the full verification cycle defined in `TESTING.md` until clean.

**Verify consistency**

After a successful build:

- If working from an implementation plan, verify the changes match the plan.
- Verify the changes match the updated project documentation.

**Iterate until consistent**

If inconsistencies are found between implementation and documentation, update either the implementation or the documentation to resolve the mismatch, then return to the verification loop. Continue iterating until full consistency is achieved.

## Adding a New Feature

**Follow the new feature implementation workflow**

When asked to implement a new feature, follow this sequence:

1. Read all guidelines files and follow rules.
2. Analyze current implementation.
3. Make required research.
4. Create change request.
5. Create implementation plan.
6. Ask for confirmation to implement.

Do not begin implementation until the user confirms the plan.

**Update project documentation**

Edit `PROJECT.md` with new requirements. Edit `ARCHITECTURE.md` with architectural changes if needed.

**Update the implementation specification**

Add the feature section to `SPECIFICATION.md`.

**Create an implementation plan**

Outline what files will change, what new files are needed, and the test approach. See `GUIDELINES.md` for plan location and required contents.

**Implement**

- Add types to `src/types/`.
- Implement audio engine changes in `src/synth/` or `src/exports/`.
- Add components to `src/components/`.
- Add hooks to `src/hooks/`.
- Add utilities to `src/utils/`.

**Add tests**

- Unit tests for utility and parser logic.
- Component tests for UI.
- End-to-end tests for user flows.

**Run the full verification loop**

Repeat the verification loop from `TESTING.md` until clean.

## Modifying an Existing Feature

Follow the same sequence as adding a new feature. Ensure backward compatibility or document the breaking change in `CHANGELOG.md`.

## Version-Based Feature Implementation Cycle

Change requests, including features, bug fixes, and enhancements, are organised by version in `docs/change/<version>/` when needed. The implementation follows a complete cycle for each version.

**Version Bump**

After finishing the current version, the version number is bumped per the rules in `VERSIONING.md`. See `VERSIONING.md` for the complete version bump procedure including CHANGELOG updates.

**Implementation Planning**

Create implementation plans in `docs/plan/<version>/` based on the change request descriptions. Each plan outlines what files will change, what new files are needed, and the test approach.

When asked to make an implementation plan for a specific change request pointing to a document source (for example `midi-support.md`), create the plan in `docs/plan/<current_version>/`, where `<current_version>` is the current program version from `package.json`. Name the plan document to match the change request file (for example `midi-support-implementation.md` for `midi-support.md`). Use the current version regardless of the version mentioned in the change request or the document location.

**Implementation**

Execute the implementation according to the plans. Follow the build-test-fix loop for each feature.

**Refactoring**

After implementation is complete, store refactoring proposals in `docs/refactoring/<version>/`. These proposals identify code improvements, optimisations, and structural adjustments.

**Assessment**

After refactoring, create an assessment document that evaluates the completed work. This document summarises what was implemented, what was refactored, and any remaining technical debt.

This completes the implementation cycle for that version.

**Directory Summary**

| Directory                     | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `docs/change/<version>/`      | Change request descriptions: features, bug fixes, enhancements |
| `docs/plan/<version>/`        | Implementation plans created from change requests              |
| `docs/refactoring/<version>/` | Refactoring proposals and assessments after implementation     |

**Historical Directories**

The following directories are preserved from the previous workflow and are not part of the active ASE workflow. They contain historical prompt logs and feature proposals.

- `docs/prompt/<version>/` — historical AI prompt logs from versions 1.0, 1.1, and 1.2
- `docs/feature/` — feature proposals such as LOGGER.md
- `docs/report/<version>/` — generated analysis reports

Do not modify these directories unless explicitly instructed.

## Working With AI Coding Agents

When delegating implementation to an AI coding agent, provide the following context:

- `PROJECT.md` for project requirements and constraints.
- `ARCHITECTURE.md` for architecture and patterns.
- `SPECIFICATION.md` for implementation details.
- `standard/ts-react-development.md` for TypeScript and React coding standards.
- `GUIDELINES.md` for audio-critical development principles.
- The specific source files being modified.

Verify agent output against the build-test-fix loop. Never accept code that breaks audio timing or violates the audio-critical principles in `GUIDELINES.md`.
