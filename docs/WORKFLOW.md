# Development Workflow

This document describes the day-to-day operational steps for delivering changes. It complements `GUIDELINES.md` (which defines the change process) and `TESTING.md` (which defines verification gates).

## Verification Loop

`TESTING.md` is the single owner of the verification loop: the canonical step order (`typecheck -> lint -> format -> build -> test -> fix`), the zero-error/zero-warning bar, the targeted and full modes, the milestone list, and the fix requirements. This section adds no rules of its own - follow `TESTING.md` whenever the workflow reaches a verification point.

## Standard Implementation Process

This is the default method for implementing all changes. The high-level rules live in `GUIDELINES.md` under "Applying a Change" - this section captures the operational details.

**Analyze the current implementation**

Every change request begins with a new implementation analysis of the current codebase. The analysis is never carried over from earlier work or assumed from the request alone - it grounds the implementation plan written for the request.

**Documentation-First Approach**

Every implementation begins with updating project documentation. Do not write any code before documentation is updated.

**Update the project specification**

The project specification update is the first step of implementation, taken when work on the plan begins. When several implementation plans exist, each specification update runs only at the start of its own implementation - never ahead of it, so the specification never describes behaviour that is not yet implemented. Edit the relevant project documentation files to reflect the planned changes:

- `PROJECT.md` for new requirements or behavioural changes.
- `ARCHITECTURE.md` for architectural or structural changes.
- `SPECIFICATION.md` for implementation-specific details.
- `FORMAT.md` for changes to save or export file formats.
- `public/MANUAL.md` and `public/MESSAGES.md` for user-facing behaviour the bundled documents describe - a changed shortcut, playback semantic, or visible feature updates the bundled text in the same change set.

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

**Record refinements in the plan**

Decisions and adjustments made while implementing that refine the approved plan - a changed call site, a narrowed boundary, a deliberately skipped test layer - are recorded in the plan document under a Refinements section when the implementation lands, so future reviews see what diverged from the approved plan and why. A refinement is noted, never silently folded in.

**Iterate until consistent**

If inconsistencies are found between implementation and documentation, update either the implementation or the documentation to resolve the mismatch, then return to the verification loop. Continue iterating until full consistency is achieved.

**Propose a commit message**

Once the implementation is complete and consistent, propose a commit message for the change. Check `git status` to describe accurately what is being committed, and follow the Commit Messages rules in `GUIDELINES.md`. The assistant proposes only - the user commits manually.

## Adding a New Feature

**Follow the new feature implementation workflow**

When asked to implement a new feature, follow this sequence:

1. Read the guidelines files the tiered mandate in `GUIDELINES.md` names for the task's domains and follow rules.
2. Analyze current implementation.
3. Make required research.
4. Create change request.
5. Create implementation plan.
6. Ask for confirmation to implement.

Do not begin implementation until the user confirms the plan. This sequence is owned here - `GUIDELINES.md` references it rather than restating it. The confirmation is asked through the host's interactive question mechanics, the same way the mode-selection question is asked: `Implement` approves the plan as written, `Adjust` returns the plan for changes, and `Discard` drops the request - a free-text reply resolves the same way.

**Update project documentation**

Edit `PROJECT.md` with new requirements. Edit `ARCHITECTURE.md` with architectural changes if needed.

**Update the implementation specification**

Add the feature section to `SPECIFICATION.md`.

**Create an implementation plan**

Outline what files will change, what new files are needed, and the test approach. See `GUIDELINES.md` for plan location and required contents.

A plan the user confirms for implementation counts as an explicit request for the plan document: write it to `docs/plan/<version>/` before the first code edit, never after the implementation lands. The approved document is what the consistency verification pass later checks the implementation against.

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

**Record distribution**

A batch of candidates promoted to change records in one request distributes across windows by readiness: unblocked records join the current version group, and records with a recorded blocker land in later windows ordered by how early each blocker can resolve.

**Version Bump**

After finishing the current version, the version number is bumped per the rules in `VERSIONING.md`. See `VERSIONING.md` for the complete version bump procedure including CHANGELOG updates.

**Implementation Planning**

Create implementation plans in `docs/plan/<version>/` based on the change request descriptions. Each plan outlines what files will change, what new files are needed, and the test approach.

When asked to make an implementation plan for a specific change request pointing to a document source (for example `midi-support.md`), create the plan in `docs/plan/<current_version>/`, where `<current_version>` is the current program version from `package.json`. Name the plan document to match the change request file (for example `midi-support-implementation.md` for `midi-support.md`). Use the current version regardless of the version mentioned in the change request or the document location. When the change record itself sits in a different group through a declared dependency, the plan joins that same group.

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

Do not modify these directories unless explicitly instructed.

Existing `docs/report/<version>/` contents are historical, but the directory itself remains the live report role - new audits and generated reports land there per the Audit-Driven Ring and the repository layout map.

## Repository Layout

The resolved role-to-path map for the documentation set and its workflow directories.

| Role                   | Path                                | Notes                                                            |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| Documentation root     | `docs/`                             | All active documents                                             |
| Change requests        | `docs/change/<version>/`            | Versioned per release                                            |
| Implementation plans   | `docs/plan/<version>/`              | Versioned per release                                            |
| Refactoring documents  | `docs/refactoring/<version>/`       | Versioned per release                                            |
| Abandoned records      | `docs/discard/<version>/`           | Abandoned change records and optional plans                      |
| Window reviews         | `docs/review/<version>/`            | Version-window reviews, feeds the bump decision                  |
| Lessons                | `docs/lesson/`                      | Per-session findings files, restricted                           |
| Decision records       | `docs/decision/`                    | Durable dated decisions, restricted                              |
| Window run state       | `docs/plan/<version>/window-run.md` | Run-resume stage record, not a plan                              |
| Reports                | `docs/report/`                      | On-demand generated reports, restricted                          |
| Archive                | `docs/archive/`                     | Retired documents, mirrored role grouping                        |
| Historical directories | `docs/feature/`, `docs/prompt/`     | Restricted, not part of the active set                           |
| Templates              | `docs/template/`                    | Document templates                                               |
| Standards              | `docs/standard/`                    | Engineering standards, one per technology stack                  |
| Tooling notes          | `docs/TOOLING.md`                   | Conditional reads - shell, build, audit, sweep, validation notes |
| Media                  | `docs/media/`                       | Documentation images                                             |
| Changelog              | `public/CHANGELOG.md`               | Written only at version bump or on request                       |
| Bundled documents      | `public/`                           | MANUAL.md, MESSAGES.md rendered in-app                           |
| Local workspace        | `work/`                             | Gitignored scratch, shell-access only                            |
| Agent entry            | `README.md`                         | Routes agents to `GUIDELINES.md`; no `AGENTS.md`                 |

## Document Directory Access

- The documents sitting directly in `docs/` are the default read surface - read them as the task requires. The directories under it are restricted: read them only as the bullets below authorize, and never scan them for unrelated history.
- An operation stage that names window artifacts reads only the directories that stage requires - a window review analyzing the window reads its change requests and plans, and a named SDLC window run authorizes that window's groups as the bullets below record.
- Do not read any document from `docs/change/` unless the user explicitly requests implementation of a specific change request or names a version window to run. A named window request (for example "run the SDLC for 1.3.0") is the explicit authorization to read that window's change group. A request that names a specific record as a dependency or integration target authorizes reading that record - never the whole group. Otherwise never automatically scan or gather change requests from this directory - the user will manually request implementation plans for individual changes.
- Do not read any document from `docs/plan/` unless specifically instructed by the user or a named window request authorizes the window's plan group. Implementation plans are written to this directory only when the user explicitly requests them or a window run requires them - a plan the user confirms for implementation counts as an explicit request and is written before the first code edit.
- Do not read any document from `docs/archive/` or `docs/refactoring/` unless specifically instructed by the user. These directories contain historical documents and refactoring proposals that are not part of the active documentation set.
- Do not read any document from `docs/report/` unless the user explicitly requests it. This directory is for custom reports generated on demand and is not part of the active documentation set.
- Do not read any document from `docs/prompt/` unless specifically instructed by the user. This directory contains historical AI prompt logs from versions 1.0, 1.1, and 1.2 and is not part of the active documentation set.
- Do not read any document from `docs/feature/` unless specifically instructed by the user. This directory contains feature proposals that are not part of the active documentation set.
- Do not read any document from `docs/discard/` unless specifically instructed by the user. This directory holds abandoned change records and is not part of the active documentation set.
- Do not read any document from `docs/review/` or `docs/lesson/` unless specifically instructed by the user. These directories hold generated reviews and recorded lessons - they are outputs and records, not active rules.
- Do not read any document from `docs/decision/` unless specifically instructed by the user or a session review routes a decision there.
- The changelog analysis at version bump may read the closed window's `docs/change/`, `docs/plan/`, and `docs/review/` groups - `VERSIONING.md` grounds each entry in those records.

## Document Retention

Retention sweeps retired document families out of the active directories into `docs/archive/`, preserving each role's grouping. A request to "archive old documents", "archive documents", or "run retention" runs the sweep. The sweep moves files only - nothing is deleted - and the result lands as working-tree changes until a commit is requested.

**Covered roles**

| Role                  | Live directory      | Archive grouping                      |
| --------------------- | ------------------- | ------------------------------------- |
| Change requests       | `docs/change/`      | `docs/archive/change/<version>/`      |
| Implementation plans  | `docs/plan/`        | `docs/archive/plan/<version>/`        |
| Refactoring documents | `docs/refactoring/` | `docs/archive/refactoring/<version>/` |
| Abandoned records     | `docs/discard/`     | `docs/archive/discard/<version>/`     |
| Reports               | `docs/report/`      | `docs/archive/report/<version>/`      |
| Window reviews        | `docs/review/`      | `docs/archive/review/<version>/`      |
| Decision records      | `docs/decision/`    | `docs/archive/decision/<YYYY-MM>/`    |
| Lessons               | `docs/lesson/`      | `docs/archive/lesson/<YYYY-MM>/`      |

**Move boundary**

The boundary is the current minor version family. With `X.Y.Z` read from `package.json`, the current family is `X.Y.*` and every version below `X.Y.0` is a candidate - every completed minor family. At `1.4.5`, all `1.3.x` and earlier material retires while `1.4.0` and later stays. The current family and the in-flight window always stay.

**Versioned roles**

A versioned directory moves whole with all contents - `docs/change/1.2.8/` moves to `docs/archive/change/1.2.8/`. A directory name that carries a version token plus a suffix, such as `1.2.4-configuration` under `docs/report/`, moves unchanged and resolves its family from the leading token. A stray document sitting directly inside a versioned role follows the flat-file rule - a `.gitkeep` marker is not a document and is reconciled per the sweep procedure.

**Flat roles**

`docs/decision/` and `docs/lesson/` hold date-named files. A flat file retires when it belongs to a completed family: an embedded version token such as `window-1.3.9` attributes the file to that family, and a file without a token retires when its date falls before the current family's start - the day family `X.Y` began, read from the `X.Y.0` bump and the earliest dated current-family artifact in version-control history. Retired files move to `docs/archive/<role>/<YYYY-MM>/`, grouped by the file's own month.

**Sweep procedure**

- Compute the boundary from `package.json` and resolve the current family's start date.
- Enumerate the candidates per role and run a link check - scan the active document set for references to candidate paths, and repoint or report each one before moving.
- Move every candidate to its archived location, preserving names and contents.
- Reconcile `.gitkeep` markers - remove every marker from a directory that holds other content, and place one in a swept role directory the moves leave empty.
- Report what moved and what stayed per role, leaving the result uncommitted for review.

**Access**

Archived documents are historical, not active rules - the Document Directory Access gate on `docs/archive/` applies unchanged.

## Version Window SDLC

The repository adopts the `version-window` extension and the `audit-driven-development` convention. A named window request - "run the SDLC for `<version>`" or "process the `<version>` window" - executes the whole window as one operation instead of one change request at a time.

The request may select a gate mode: `autonomous` runs every stage without pausing, choosing the recommended option at each decision point and reporting each decision inline - `human-in-the-loop` stops for confirmation after each change-request iteration's plan, implementation, and verification result. An unspecified mode follows the recorded default: `human-in-the-loop`.

**Intake**

- Catalogue every active change record in `docs/change/<version>/`. All of them are in scope and none may be skipped.
- Order the requests from their recorded dependencies.
- The named window request is the explicit authorization to read that window's `docs/change/` and `docs/plan/` groups.
- "Continue SDLC autonomously" or "finish the `<version>` window" names the same operation on an in-progress window whose records were written ad hoc during the session rather than as pre-planned requests.
- An unversioned proceed request - "proceed automated SDLC" and the like - resolves to the in-progress window: the `docs/change/` directory matching `package.json`. The word `automated` selects the `autonomous` gate mode.
- A record whose work is already landed is verified against the tree and closed, not re-implemented. A record that should not be implemented is discarded with its rationale recorded in the record itself. Implementation runs only on records that describe unlanded work.
- An empty window reports zero active records - the refactoring phase may still run on the current state and no bump is forced.

**Request Iteration**

For each change record in the window, in intake order:

- Perform a new implementation analysis of the current implementation and the project documentation, plus the additional research the record's domain requires - external format specifications, upstream dependency state, or measured behaviour. Each record gets its own analysis and research, never carried over.
- Findings may correct the change record itself. When analysis or research shows the record's premises are stale or wrong, amend the record in place against the verified state before planning, and refresh its summary block.
- Write the implementation plan into `docs/plan/<version>/` only when that record's analysis and research are complete. Implementation follows the plan as the next stage - one record's pipeline completes before the next record's begins, and plans are never written ahead for the whole window.
- Follow the Documentation-First Approach: the specification update is the first implementation step of each record - it runs when that record's implementation begins, never ahead of it.
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
- Record the review in `docs/review/<version>/review-<version>.md` using `docs/template/change-review-template.md`. The review reconciles recorded work against the version-control log and reports confirmed, unconfirmed, undocumented, and deviated work.
- The bump decision recorded in the review is the project owner's - never the agent's.

**Improvement**

- After the review and before the bump, the window heals itself. Gather the lessons the run's operations produced - failures, surprises, workarounds, and repeated corrections - and check which problems appeared while the window worked.
- Each lesson lands as a durable rule or record, routed per the Session Review table in this document, before the bump closes the window.
- Small adjustments, fixes, and optimizations discovered during the window apply on the fly inside the same run. Larger work is never silently absorbed - it defers to a change record under a later window per the Deferral rule.
- Any code touched by an improvement fix re-enters the verification loop before the window closes.
- The step follows the evidence-gated repair convention: a problem is healed only after its real state is verified, never on a guessed finding.

**Window Close**

- Close the window with the version bump per `VERSIONING.md` (the release gate, verification loop, `npm audit`, `npm run bump`, and the `public/CHANGELOG.md` entry). The named window request is the explicit instruction that authorizes this bump. An ad-hoc bump outside a named window runs the same gate - the missing window review is its recorded waiver.
- The cycle never commits on its own - commits stay manual under every mode.

**Run State**

- Under the `run-resume` extension, a window run records each completed stage in `docs/plan/<version>/window-run.md` as it proceeds. This file is a run-state record, not an implementation plan. Do not create `window-run.md` for ordinary window runs - it exists only for the run-resume extension when resuming is explicitly needed.
- A restarted window re-reads the record, verifies that artifacts claimed by completed stages actually exist - demoting any stage whose artifacts are missing - and continues from the first incomplete stage.
- The intake catalogue is a snapshot, not a lock. A change record that appears under the active window's `docs/change/<version>/` group after intake is not silently absorbed into the run: re-enumerate the group at review time, and treat the late record as next-window work unless the user explicitly adds it to the run.

**Audit-Driven Ring**

- An external audit produces prioritized findings and recommendations in `docs/report/<version>/`.
- Adopted recommendations are triaged into change records under one or more version windows - each audit-derived record carries its source finding or recommendation identifier in the record's `Source` field.
- Every recommendation resolves before its window completes: it becomes a change record, or it is declined with the reason recorded.
- A recommendation never bypasses the change-record gate - audit output is never implemented directly.
- Every adopted finding is re-verified against the tree before correction - audit evidence ages between report and implementation, and a claim the report marks verified can already be inaccurate. Deviations from a finding are recorded in the window review.
- The next audit re-verifies the register and seeds the following window - the window's review is the evidence of what the window delivered.

## Work Modes

The repository records a scheme of named work modes governing how a modification request enters the change lifecycle.

**Mode Selection**

A work request names its mode or the agent asks before proceeding - the selection is resolved per request and never assumed. A request that names no mode - a bare `work on dosound-tracker`, or any described change carrying no mode - presents the recorded options through the host's interactive question mechanics:

| Option                                                   | Resolves to                                        |
| -------------------------------------------------------- | -------------------------------------------------- |
| `Usage (default)`                                        | Standard Workflow                                  |
| `Development (verbose + development)`                    | Standard Workflow with `verbose` reporting         |
| `Improvement mode (verbose + development + improvement)` | Development plus the `improvement` working mode    |
| `Wait (skip for now)`                                    | Intake standby - wait for commands before any work |

A request that names its mode skips the question - mode words resolve from the request text, `verbose` arming the report mode, `improvement` the working mode on top of Development, `immediate` the confirmation loop, and `ad-hoc implementation` the deferred-record path described below. `Wait (skip for now)` follows the Intake standby convention below.

**Standard Workflow**

The default mode. Every modification request runs the full change lifecycle: a change record, a deep analysis of the current implementation, an implementation plan, implementation in documentation-first order in verifiable increments, and the verification loop.

The agent enters the lifecycle on its own - a described change is already the trigger, so the change record is created without waiting for a separate "create a change request" instruction.

Size is no exemption: the record precedes the code for every user-directed modification - a one-line label rename still files its record before the edit, and a refactoring proposal lands in `docs/refactoring/<version>/` before the first structural edit, never after. Records or proposals written after code lands exist only as review-time repair of an intake miss - they are not a routine path.

**Ad-Hoc**

A quick path that applies the change without producing change artifacts. Ad-hoc is never the default - it applies only when the request explicitly demands it through phrasing such as "ad-hoc" or "quick fix" - `immediate` resolves to the Immediate mode instead. The agent may propose the ad-hoc path when a request looks small enough for it - the user selects the mode, the proposal never selects itself. An ad-hoc change still requires a deep analysis of the current implementation before any edit - the analysis runs inside the session and is summarized in the response without producing a durable document. The recorded verification procedure still applies, and the outcome is reported in the session rather than in change artifacts.

**Ad-Hoc Implementation**

A deferred-record path that applies first and documents afterward. Each described change is implemented immediately - no change record or implementation plan precedes the edit - and the applied change joins the session's changeset stack, which records every landed change with a one-line summary. The deep analysis of the current implementation and the recorded verification procedure still apply to every change, and the outcome is reported in the session rather than in artifacts.

When the user closes the stack - "write the records", "document the applied changes", or a later window intake - each stacked change produces its change record in `docs/change/<version>/` and its implementation plan in `docs/plan/<version>/`, written against the landed state rather than as proposals. Retroactive records describe work already implemented - an SDLC intake or window review verifies them against the tree and closes them without re-implementing. The mode differs from plain Ad-Hoc only in the deferred artifacts: Ad-Hoc produces none, Ad-Hoc Implementation produces them after the fact.

**Planning**

A collection mode that analyzes requests without implementing them. Each request is analyzed quickly and held on the session's changeset - the conversation, not a durable document. The agent reports the full changeset on every addition so the user can amend or reorder it, and overlapping items that share files and intent fold into a single item. When the planning phase is declared complete - an explicit 'apply' - the changeset re-enters the Standard Workflow: applying means writing the change-request documents, grouped so that similar items share a record and the document count stays minimal. Each record then gets its implementation plan, the current implementation is re-analyzed, and the usual cycle proceeds in the recorded order.

**Improvement**

`improvement` named as a mode on a work request is a working mode, not the review operation. While running the described operation, the agent applies the corrections and optimizations it discovers on the way inside the same change set - a stale doc line refreshed as it is touched, a small repair folded into the work, reusable knowledge folded back into the owning document rather than left in the session. Improvements that alter observable behavior or exceed the request's scope still split into their own record, and the mode never triggers the Session Review on its own - the named improvement operation is recorded under Self-Routines below. The mode applies improvements during the work itself; it reviews no history that precedes the request.

**Immediate**

`immediate` named on a work request arms a confirmation loop in front of the Standard Workflow. On each described change the agent analyzes what must be done and asks through the host's interactive question mechanics with two options - `Accept` enters the Standard Workflow: a change record in `docs/change/<version>/`, extending a suitable existing record in the same group when one fits, a fresh implementation analysis, an implementation plan, and documentation-first implementation. `Decline` drops the request. A free-text reply adds details or another need to the described change, and the question repeats until the request is accepted or declined.

**Intake Standby**

A work request that names modes but describes no operation is intake standby - the agent reads the guidelines set, reports the boundary state, and waits for the described change rather than editing on assumption.

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

If no specialised file is appropriate, update `GUIDELINES.md`. Always confirm the rule has been added to the correct file.

## Stage Gates

Under the `stage-gates` extension, each change-lifecycle stage boundary is an approval checkpoint: the agent presents the stage's product and waits for approval before the next stage begins. Checkpoints are workflow checkpoints, not discretionary questions - a session-level instruction to minimize questions or continue without stopping does not waive them. The `autonomous` gate mode of a named version window is the recorded continuous-execution convention that skips per-stage checkpoints inside that window's run.

Checkpoint prompts go through the host's interactive question mechanics - when the environment provides a structured ask-the-user tool, gate confirmations and clarification requests use it rather than a prose question appended to a report.

## Specification Audit

Under the `specification-audit` extension, a plan is audited against the real codebase before implementation begins: every requirement stated in the change record maps to a plan step, ambiguous wording is resolved, and every step's files, interfaces, dependencies, and preconditions check out. Audit failures return to planning. The audit uses `template/specification-audit-template.md` and lands beside the plan in `docs/plan/<version>/` named `<change-name>-specification-audit.md`.

## Artifact Summary

Under the `artifact-summary` extension, every change record and every implementation plan opens with a summary block covering the intent, the key decisions taken, and the open questions or risks. The block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Preserve Before Reorganize

Under the `preserve-before-reorganize` extension, a documentation reorganization snapshots the existing documentation set before the first structural change - a copy of the affected directories or a version-control checkpoint - so the reorganization remains fully reversible even when individual steps are not.

## Tooling Notes

The tooling and environment notes live in `TOOLING.md` - they load when the task touches the tool, path, or environment a note covers.

## Session Review

The project records a session-review convention. When the user says "improve dosound-tracker", run the session review: collect the wounds the session produced and land each one as a durable rule or record before reporting the review done.

The documentation set heals and improves itself through this session-review loop. At the end of a development session - or on request - the agent gathers durable lessons from the session's conversation history and routes each one to its owning document.

**Trigger**

- `improve dosound-tracker` runs the session review. The trigger phrase is recorded, never implied - ordinary task requests do not invoke it.
- A request that paraphrases the review without the recorded phrase resolves to standby - the agent asks the user to invoke `improve dosound-tracker` rather than running the review on an implied trigger.
- The request may select a gate mode: `autonomous` applies the routed lessons directly - the improvements land without an acceptance step. `human-in-the-loop` proposes the improvements for acceptance first. An unspecified mode follows the recorded default `human-in-the-loop`.

**Procedure**

- Review the conversation history of the current session and gather its wounds: failures, surprises, workarounds, and repeated corrections.
- Verify the real state before recording a lesson - a guessed finding poisons the index.
- For each wound, check whether an existing rule already covers it. If no rule covers the lesson, add the rule to the owning document's body first, then index it in the lesson file.
- Owning documents are the project guidelines, workflow and process documents, and the engineering standards under `docs/standard/` - the review updates documentation, not source code.
- Record the session's findings in `docs/lesson/lessons-<date>-<theme>.md` using `docs/template/session-findings.md`. Entries use titles, never ordinal numbers.

**Gather lessons**

Mine the session for anything that cost effort, surprised, or would help the next session:

- A fix that revealed a pattern worth standardizing (for example the scroll-restore ordering rule).
- A recurring correction from the user - the same instruction given twice is a missing convention.
- Tooling and environment facts discovered on the way (a CLI flag, a port, a schema field that moved).
- A failed approach worth recording so it is not retried (the 2026-11-10 audio desync chased through six bisect commits before the environment was ruled out lives in `TOOLING.md` for this reason).

**Routing**

| Lesson kind              | Owning destination                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Engineering wound        | The relevant standard's findings, for example `standard/typescript-react-development.md` |
| Testing or tooling wound | The owning section of `TESTING.md`                                                       |
| Versioning wound         | The owning section of `VERSIONING.md`                                                    |
| Workflow wound           | A rule in this file plus a dated record in `docs/decision/` when the decision is durable |
| Machine or tooling quirk | Environment notes in `DEPLOYMENT.md` or `WORKFLOW.md`                                    |

The lesson file indexes rules that live in the owning documents - it does not hold the rules themselves. Deferred work goes to `FUTURE.md`, and durable one-off decisions become dated records in `docs/decision/`.

**Apply and verify**

- Propose each routed lesson briefly before writing - a lesson is a claim about what is durable, not a log of the session.
- Edits to owning documents follow the change-record workflow - lesson records and session reports land directly.
- A finding that advises a change to the implementation itself produces a change-request document rather than an immediate edit. Its window is decided against the pending records: check the upcoming `docs/change/<version>/` directories, place the record before any pending work it must precede and after any it depends on, and default to the next upcoming window when nothing in the pending set constrains it.
- A correction that appears in two consecutive sessions graduates: it becomes a written rule in the owning document, not another lesson entry.

**Housekeeping checklist**

Run periodically and before a version bump:

- `scripts/clean.sh --dry-run` to review residue - `--purge` only when a fresh `npm install` is acceptable.
- `scripts/release-check.sh` for record coverage, assessment completeness, and window-review presence.
- Stale-figure sweep: README/toolchain numbers, hook counts, file sizes, standard versions (`diff -w -B` against the canonical library), and path references inside `docs/template/` against the real tree.
- `git status --short` confirms only the intended change set remains.

## Self-Routines

The project's agent instructions repair, extend, and lighten themselves through three named routines. Each has its own trigger, scope, and artifact - they share one contract: an adjustment lands in its owning document in the same change set and never waits for a separate request to write it down.

| Routine           | Trigger                                       | Scope                                                   | Artifact                                          |
| ----------------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Self-improvement  | `improve dosound-tracker`, window-close step  | Session wounds become durable rules                     | `docs/lesson/` index + owning-document rules      |
| Self-healing      | A named defect in agent behavior or machinery | One defect in instructions, scripts, or gates           | Minimal patch proven by external replay           |
| Self-optimization | Window refactoring phase, improvement work    | Accumulated weight: duplication, stale or fat documents | Smaller tree and document set, identical behavior |

**Self-improvement** is the Session Review loop recorded above: gather the session's wounds, verify real state, land each durable lesson in its owning document, and index it under `docs/lesson/`. It harvests - it does not repair code.

**Self-healing** repairs a named misfire in the project's own machinery - a rule that misrouted a request, a gate that failed on a healthy tree, a script that broke, a document that contradicts the tree. The loop is evidence-gated:

- **Evaluate** - classify the failure with a structured tag (`missed-rule`, `contradiction`, `stale-document`, `gate-misfire`), not prose impressions. A defect without a concrete failure is not a healing target.
- **Patch** - produce a minimal correction in the owning document or tool. Never rewrite a document wholesale as a healing act.
- **Replay** - verify the patch against an external verifier before promoting it: re-run the failing test, the verification loop, `scripts/release-check.sh`, or the recorded failing path. Internal reflection - "the patch looks right" - is not evidence. A patch with no measurable improvement is reported inconclusive, never promoted.
- **Promote** - apply only the proven patch and record the restore path before editing. Behavior changes to shipped code route through the change-record lifecycle - healing fixes the machinery, not the product.

**Self-optimization** removes weight without changing observable behavior: the per-window refactoring cycle (`docs/refactoring/<version>/` proposal and assessment), the Documentation Distillation convention below, deduplication past the Rule of Three, and the stale-figure sweeps in the housekeeping checklist. Optimization that would alter observable behavior is not optimization - it splits into a change record.

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

## Agent Operations

**Session Reporting**

Under the `session-reporting` extension:

- A request to "print usage" writes the session usage report as markdown tables: agent identity (software name, version, and the language model when known), conversation summary (prompt requests, reply blocks, sentence and token counts, marking estimated values), context-window usage as one table whose rows are the session's operations in execution order, each carrying its fulfillment share, with remaining headroom reported alongside, fulfillment of each requested item against its delivered result, and the boundary state (uncommitted files, branch position, reserved decisions). The full report is emitted only when usage or context reporting is specifically requested - it never rides along on an unrelated response. Counters the host does not expose are omitted entirely - rows are never written with `unknown` or any other placeholder value. A descriptive context-usage note answers only a direct context question - the ordered table stays the default report shape.
- Operation timing is armed by default on every operation. The agent captures the clock before starting an operation's work and ends the response with a separate paragraph whose last sentence is `<description> operation took <m:ss>`, where `<description>` names the operation the request asked for. Naming `no timing` or `without timing` opts out for that request only. An operation longer than three minutes closes with a stage-breakdown table immediately before the timing sentence - `Stage`, `Elapsed`, `Share`, and `Note` columns, with stage times taken from command-reported values, recorded clock captures, or output timestamps and the note saying so when none exists. A backgrounded command running past about a minute reports a progress heartbeat roughly every 60 seconds - one short line with the current stage, items done of the total, and warnings seen.
- Report modes are named on the request and are request-scoped - resolved from the request text, never from environment variables. `verbose`, `diagnostic`, and `timing` arm the operations table, the compact context summary: when no usage report was specifically requested, the response closes with a single small table with no report headings placed above the timing paragraph - one row per operation the session has run, with `Operation`, `Time`, and `Context` columns. `Context` is the change in context-window fulfillment the operation caused - the best measure available, an estimate when the environment reports none - and a counter the host does not expose is omitted entirely. In verbose mode a short description of the change still accompanies the table before the timing line. `informational` adds nothing beyond the timing paragraph. The driving agent and model are named once per session - on the first mode report, or whenever a request asks for them - as a separate paragraph outside the report block.

**Context Management**

When the context window approaches its limit, the agent divides the remaining work into discrete tasks and delegates them to spawned subagents rather than continuing degraded. Each delegated task carries its own context, file scope, and verification expectations. The agent keeps orchestration - the division, the merge, and the final verification - local. Spawn freely for exploration: scouts are cheap, and a delegated survey is cheaper than a full read. Subagent titles name the task itself - never a role or agent-kind prefix such as "Scout". A delegated brief states the resolved version window explicitly when the task touches versioned directories - a scout inferring the window from `package.json` alone has reported the bump target instead of the active one.

A delegated task that cannot meet its documented target returns to the orchestrator instead of widening scope on its own. A subagent executing a plan may fix what the plan's literal wording gets wrong, but structural additions beyond the plan's named moves go back through the plan before they land.

Suite runs against the live tree wait for delegated writes to land. A `npm test` run that overlaps a subagent's in-flight writes can report a transient failure from a half-written file - re-run before treating it as a regression.

**Clean and Purge**

Under the `clean` and `purge` extensions:

- A request to "clean project" or "clean the project" runs `scripts/clean.sh`, which removes only build artifacts and temporary files that are not under version control - `dist/`, `coverage/`, `playwright-report/`, `test-results/`, and temp residue such as `*.log`, `*.tmp`, `*.bak`, and `.DS_Store` files. Each target is verified ignored and untracked before deletion, a locked file is reported and skipped rather than failing the run, and `--dry-run` lists targets without deleting.
- A request to "purge project" or "purge the project" removes everything `clean` removes plus `node_modules/` and `work/` - all restorable through `npm install` and session recreation. The script names the restore procedure when it finishes.

## Working With AI Coding Agents

When delegating implementation to an AI coding agent, provide the following context:

- `PROJECT.md` for project requirements and constraints.
- `ARCHITECTURE.md` for architecture and patterns.
- `SPECIFICATION.md` for implementation details.
- `standard/typescript-react-development.md` for TypeScript and React coding standards.
- `SPECIFICATION.md` for the audio-critical development principles.
- The specific source files being modified.

Verify agent output against the build-test-fix loop. Never accept code that breaks audio timing or violates the audio-critical principles in `SPECIFICATION.md`.

Commits carry no AI-assisted markers: neither the commit description nor a trailer records the tool used.

## Continuity

The project is a single-author project by design - no second maintainer exists and the contributor-concentration risk is accepted by the project owner.

**Continuity plan**

If the owner becomes unreachable, the escalation path is:

- **Repository** - the GitHub account of record owns `zoltraks/dosound-tracker` - recovery goes through that account's credentials and GitHub account-recovery procedures. The full history lives in every clone, so the code itself is never hostage to a single checkout.
- **Published site** - `https://dosound.alyx.pl` is served from the static `dist/` bundle - control follows the domain and hosting account of record.
- **Release-signing materials** - none exist today. Desktop binaries ship unsigned per `DEPLOYMENT.md` - if signing is procured later, the certificates and notarization credentials join this list.
- **Stale remote branches** - `origin/` carries abandoned `broken/*`, `refactoring/*`, `repair/*`, and feature branches from earlier sessions. Pruning them is an owner action, since remote deletion is irreversible - the recommendation is to remove everything except `main` when the owner next reviews the remote.

**Close the window on a clean production-ready build**

After the refactoring phase and before the bump, the last verification step is a clean production build: `scripts/clean.sh` removes build artifacts, then the full verification loop rebuilds `dist/` from scratch and the runnable-artifact slice proves the served bundle. The release gate runs against that fresh output, never against a stale `dist/`.

**Stale lockfiles block manifest edits**

Editing a dependency alias (for example `npm:` specifiers or `overrides`) leaves the old resolution recorded in `package-lock.json`, and `npm install` then fails with `ERESOLVE` that names the manifest, not the lockfile. Regenerating `node_modules` and the lockfile (`rm -rf node_modules package-lock.json && npm install`) resolves cleanly and is a legitimate migration step, not a bypass.

**Audit findings age between report and implementation**

Change records written from an audit describe the tree at audit time - consolidations and trims can relocate or remove the cited sites before the window runs. Re-verify every finding against the current tree before correcting - the record's mechanism, not its literal line list, is the requirement.
