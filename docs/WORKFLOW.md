# Development Workflow

This document describes the day-to-day operational steps for delivering changes. It complements `GUIDELINES.md` (which defines the change process) and `TESTING.md` (which defines verification gates).

## Verification Loop

`TESTING.md` defines the canonical step order (`typecheck -> lint -> format -> build -> test -> fix`), the zero-error/zero-warning bar, and the end-to-end test command. The verification loop has two modes documented in `TESTING.md`:

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
- All formatting is applied
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

**Propose a commit message**

Once the implementation is complete and consistent, propose a commit message for the change. Check `git status` to describe accurately what is being committed, and follow the Commit Messages rules in `GUIDELINES.md`. The assistant proposes only; the user commits manually.

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
| `docs/review/<version>/`      | Version-window reviews feeding the version bump decision       |
| `docs/discard/<version>/`     | Abandoned change records and optional plans                    |

**Abandoned Change Records**

A change record that is abandoned moves to `docs/discard/<version>/`, with an explicit abandonment reason recorded in the record. The directory holds non-active history only.

**Historical Directories**

The following directories are preserved from the previous workflow and are not part of the active ASE workflow. They contain historical prompt logs and feature proposals.

- `docs/prompt/<version>/` — historical AI prompt logs from versions 1.0, 1.1, and 1.2
- `docs/feature/` — feature proposals such as LOGGER.md
- `docs/report/<version>/` — generated analysis reports

Do not modify these directories unless explicitly instructed.

## Version Window SDLC

The repository adopts the `version-window` extension and the `audit-driven-development` convention. A named window request - "run the SDLC for `<version>`" or "process the `<version>` window" - executes the whole window as one operation instead of one change request at a time.

The request may select a gate mode: `autonomous` runs every stage without pausing, choosing the recommended option at each decision point and reporting each decision inline; `human-in-the-loop` stops for confirmation after each change-request iteration's plan, implementation, and verification result. An unspecified mode follows the recorded default: `human-in-the-loop`.

**Intake**

- Catalogue every active change record in `docs/change/<version>/`. All of them are in scope and none may be skipped.
- Order the requests from their recorded dependencies.
- The named window request is the explicit authorization to read that window's `docs/change/` and `docs/plan/` groups.
- An empty window reports zero active records; the refactoring phase may still run on the current state and no bump is forced.

**Request Iteration**

For each change record in the window:

- Analyze the current implementation and the project documentation deeply.
- Write the implementation plan into `docs/plan/<version>/` before touching code.
- Follow the Documentation-First Approach: update the named specification sections before implementing.
- Work in verifiable increments and run the verification loop until typecheck, lint, format, build, and test all pass. A failure returns to fix and re-verify until clean.
- A request is fulfilled only when its acceptance criteria hold and verification is clean.
- The plan names unit tests for utility-level functions and considers adding or adjusting existing tests.

**Refactoring Phase**

- After every request in the window is fulfilled, analyze the project and write a refactoring proposal into `docs/refactoring/<version>/`.
- The proposal may include distillation: removing documentation that merely restates the implementation, retiring legacy or unused tests, and stripping useless comments, alongside ordinary restructuring concerns such as DRY and SOLID.
- Refactoring executes in autonomous mode under either gate mode - recommended options, no questions - while the verification loop still applies in full.
- Close the phase with an assessment document per `REFACTORING.md`.

**Deferral**

- A need discovered in any phase, including refactoring, becomes a change record under a later window's group. Discovered work is never silently implemented inside the current window.

**Window Review**

- With the tree clean and production-ready after refactoring, review the window's delivered work against its change records and plans.
- Record the review in `docs/review/<version>/review-<version>.md` using `docs/template/change-review-template.md`. The review reconciles recorded work against the version-control log and reports confirmed, unconfirmed, undocumented, and deviated work with a readiness verdict.
- The bump decision recorded in the review is the project owner's - never the agent's.

**Window Close**

- Close the window with the version bump per `VERSIONING.md` (the verification loop, `npm audit`, `npm run bump`, and the `public/CHANGELOG.md` entry). The named window request is the explicit instruction that authorizes this bump.
- The cycle never commits on its own - commits stay manual under every mode.

**Run State**

- Under the `run-resume` extension, a window run records each completed stage in `docs/plan/<version>/window-run.md` as it proceeds. This file is a run-state record, not an implementation plan. Do not create `window-run.md` for ordinary window runs - it exists only for the run-resume extension when resuming is explicitly needed.
- A restarted window re-reads the record, verifies that artifacts claimed by completed stages actually exist - demoting any stage whose artifacts are missing - and continues from the first incomplete stage.

**Audit-Driven Ring**

- An external audit produces prioritized findings and recommendations in `docs/report/<version>/`.
- Adopted recommendations are triaged into change records under one or more version windows; each audit-derived record carries its source finding or recommendation identifier in the record's `Source` field.
- Every recommendation resolves before its window completes: it becomes a change record, or it is declined with the reason recorded.
- A recommendation never bypasses the change-record gate - audit output is never implemented directly.
- The next audit re-verifies the register and seeds the following window; the window's review is the evidence of what the window delivered.

## Tooling Notes

**Install the toolchain before the baseline loop**

`node_modules` can drift from the lockfile (for example a partial install), and the verification loop then fails with errors like `prettier: command not found`. Before running the baseline loop, confirm the declared tools exist in `node_modules/.bin/` and run `npm install` when any are missing.

**npm audit fix can no-op on peer-pinned chains**

`npm audit fix` may report a fix as available yet leave the advisory in place when the vulnerable package is pinned by exact-version sibling packages (for example `@vitest/mocker` held by `vitest`, `@vitest/coverage-v8`, and `@vitest/ui`). When the declared range already admits the fixed version, upgrade every member of the chain explicitly with `npm install -D <pkg>@^<fixed-version>` and re-run `npm audit`.

**Re-read files after a format sweep**

`npm run format` rewrites the whole tree, including documents a session may still be editing; an edit staged against the pre-format content fails its exact-match check. Re-read any file before editing it after a format run.

**Stopping the development server**

Terminating the shell that launched `npm run dev` can leave the Vite process alive and holding port 8008 - a restarted server then falls back to another port while the stale process keeps serving the old build. To stop the server reliably, kill the process holding the port: `netstat -ano | findstr :8008` to find the PID, then `taskkill /PID <pid> /F`. Verify the port is free before restarting.

**Table formatting and Prettier**

When the canonical table formatter has aligned a document's tables, run Prettier on the edited files afterwards - Prettier is the enforcing format check in this repository and may re-align tables to its own convention. `npx prettier --check` on the touched files is the gate; `npm run format` achieves the same but sweeps the whole tree (see the formatting note in `TESTING.md`).

## Working With AI Coding Agents

When delegating implementation to an AI coding agent, provide the following context:

- `PROJECT.md` for project requirements and constraints.
- `ARCHITECTURE.md` for architecture and patterns.
- `SPECIFICATION.md` for implementation details.
- `standard/ts-react-development.md` for TypeScript and React coding standards.
- `GUIDELINES.md` for audio-critical development principles.
- The specific source files being modified.

Verify agent output against the build-test-fix loop. Never accept code that breaks audio timing or violates the audio-critical principles in `GUIDELINES.md`.

Mark AI-assisted authorship per change: the commit description or the change-request document records the tool used, for example `AI-assisted: <tool>`.

## Continuity

The project is a single-author project by design; no second maintainer exists and the contributor-concentration risk is accepted by the project owner.
