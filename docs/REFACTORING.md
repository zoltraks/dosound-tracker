# Refactoring Process

## Definition of Refactoring

Refactoring is a behaviour-preserving change to internal structure. Externally observable behaviour must not change: the same input must produce the same output, the same UI must render, the same files must be written, and the same key bindings must fire the same actions. If a proposed change alters behaviour, it is a feature or a fix, not a refactoring, and belongs in `docs/change/<version>/`.

This rule is strict. "Slight" behaviour changes, error-message rewordings, accepted but undocumented inputs, and silent fallback removals are all behaviour changes for the purposes of refactoring. They must be split into separate change requests.

**Refactor vs Tidy vs Behaviour Change**

Three categories of edit exist; they must not be mixed in a single step.

- **Tidy**: renames, dead-code removal, import sorting, formatting nits, JSDoc additions. Safe and obvious. Allowed as preparatory steps inside a refactoring proposal, but must be committed before any structural change touches the same file.
- **Refactor**: extract, inline, move, split, merge, replace pattern with pattern. Behaviour-preserving by definition. The body of a refactoring proposal.
- **Behaviour change**: new feature, bug fix, performance optimisation that alters observable timing. Out of scope for refactoring; route through `docs/change/<version>/`.

If a step in a refactoring plan turns out to require a behaviour change, stop and split the work into a change request before continuing.

## Creating a Refactoring Proposal

Every non-trivial refactoring starts with a written proposal.

**Analyse the current implementation**

Before creating the proposal, thoroughly analyse the current implementation sources. Review all relevant files, understand existing patterns, identify dependencies, and document the current state. This analysis forms the foundation of the Problem section and ensures the proposal addresses actual issues rather than assumptions.

The analysis must be performed autonomously. Do not ask the user what to refactor. Instead, examine recent changes, the current codebase, existing guidelines and standards, and research good practices to determine the most valuable refactoring focus.

**Apply the Rule of Three**

Do not extract a shared abstraction from a single call site. Do not pre-emptively generalise a pattern that appears twice. Wait until at least three concrete duplicates exist before introducing a helper, hook, or component, and write the abstraction to match the three real call sites rather than to a hypothetical future fourth one.

**Select the refactoring direction**

Based on the analysis, preliminarily select the most needed refactoring direction before defining the main goal. Evaluate which of the focus areas listed below would provide the most value for the current implementation state. This preliminary selection guides the goal definition and ensures the refactoring addresses the most critical issues first.

**Identify the primary focus**

Before creating the proposal, determine the primary focus of the refactoring. The focus areas are tailored to this codebase.

- **App.tsx decomposition**: split the 2194-line `App.tsx` into smaller orchestrator components or extract logic into dedicated hooks. Reduce the number of hooks called directly in `App.tsx`.
- **Custom hook extraction**: move cross-component logic from `App.tsx` into named hooks under `src/hooks/`. Hooks must name what they do, not how.
- **Business logic separation**: extract business logic from `utils/` and `hooks/` into dedicated service or domain modules. Separate pure data transformation from React lifecycle concerns.
- **Store boundary cleanup**: evaluate whether the single `uiStore` should be split into domain stores (song, instrument, playback, UI). Tighten store responsibilities.
- **Audio-critical constraint preservation**: ensure all refactoring preserves the audio timing constraints documented in `GUIDELINES.md`. Never apply React "best practices" that break audio timing.
- **Export module isolation**: keep `src/exports/` modules self-contained and individually testable. Each format (asm, bin, max, vgm, wav) should be independently testable.
- **Synth module isolation**: separate pure YM2149 emulation logic from Web Audio API integration in `src/synth/`. Keep the emulator testable as plain functions.
- **Test coverage and testability**: add missing unit tests, characterisation-test untested logic before restructuring it, refactor for testability when modules can only be exercised through the UI.
- **DRY consolidation**: eliminate duplication that has crossed the Rule-of-Three threshold; extract shared utilities and lift them to the lowest common module.
- **Type and schema tightening**: replace `any`, widen-then-narrow patterns, and unchecked casts with discriminated unions and exhaustive switch coverage. Keep `src/types/` the single source of truth.
- **All of the above**: multiple focus areas that must be addressed together.

This focus guides the proposal structure and determines which sections require the most detail.

Regardless of the primary focus selected, every aspect that may be subject to refactoring should be considered during analysis. A refactoring primarily targeting code organisation should still evaluate test coverage, deduplication opportunities, and separation of concerns in the affected code. The primary focus determines prioritisation, not exclusion.

**Proposal Location and Naming**

Place proposal documents under `docs/refactoring/<version>/` with the following naming convention:

- `REFACTORING.md` for the main proposal document.

After the refactoring is complete, create the assessment document:

- `ASSESSMENT.md` for the evaluation of results.

The existing `docs/refactoring/` directory already contains versioned proposals and assessments from versions 1.0.21 through 1.2.6. These are preserved and serve as templates for structure and content.

If the current version is not specified when requesting an assessment, the AI agent must use the refactoring proposal for the current version from `docs/refactoring/<version>/REFACTORING.md`.

**Proposal Content**

Each proposal document must include the sections below. Do not include time estimates or duration predictions for individual phases; refactoring proposals are designed for automatic code generation using an AI coding agent and model. The agent executes steps based on technical requirements and verification results, not time constraints. Focus on clear technical specifications and verifiable outcomes.

**Problem**

Describe the code smell, standard violation, duplication, or architectural issue. Include file paths and line references. Quote the offending fragments when they are short. State which files the agent would touch.

**Goal**

Describe the desired end state. What does the code look like after the refactoring? What is the new shape of the modules, hooks, stores, or types involved?

**Plan**

List the steps in execution order. Each step must leave the codebase in a buildable and testable state. No step may break existing tests.

Apply the parallel-change pattern when the refactoring crosses module boundaries: introduce the new shape alongside the old, migrate call sites one at a time, and remove the old shape only after every call site has been migrated and the verification loop has been clean for at least one full step.

**Step Granularity**

Each step must be small enough that a regression introduced by the step would be obvious from the verification output of that single step. A step that touches more than roughly half a dozen files, or that mixes a rename with a behaviour-preserving extraction, is too large. Split it.

Tidy steps (renames, formatting, dead-code removal) must come first within a file and must not share a step with structural changes to that file.

**Risk**

What could go wrong? Which areas are most likely to regress? Which tests cover the affected code? Identify modules with thin coverage that must receive characterisation tests before any structural change is attempted there.

**Acceptance Criteria**

Concrete conditions that must be met for the refactoring to be considered complete. Acceptance criteria must include at minimum: identical behaviour on the manual smoke flows listed in the proposal, zero diff in produced export outputs for the supplied fixtures, and no regression against the coverage thresholds defined in `vitest.config.ts`.

## Project-Specific Constraints

These constraints apply to every refactoring in this codebase. They are non-negotiable.

**Audio Timing Must Not Break**

All refactoring must preserve the audio timing constraints documented in `GUIDELINES.md`. The following patterns are intentional and must not be "fixed":

- Prop mirroring (local state synced with props for stable timing)
- Sparse dependency arrays (minimal dependencies to prevent unnecessary re-renders)
- Direct `setState` calls (synchronous state updates for predictable timing)
- Manual memoization (carefully controlled memoization vs React's automatic optimizations)

If a refactoring step would require changing any of these patterns in audio-critical code, stop and document the conflict. Do not proceed without explicit user approval.

**Export Output Must Not Change**

Refactoring of `src/exports/` must produce byte-identical output for the same input. Use the test fixtures in `test/fixtures/` to verify zero diff in export output before and after refactoring.

**YM2149 Emulation Must Not Change**

The YM2149 register simulation, volume table, and noise generation algorithm must not change during refactoring. These are hardware-accurate implementations. Any change to the emulation logic is a behaviour change, not a refactoring.

## Version-Based Refactoring Cycle

For each version release, maintain a structured refactoring process to ensure systematic code quality improvements.

1. **After each release**: Create a refactoring proposal file `REFACTORING.md` inside `docs/refactoring/<version>/` subdirectory. Use the version number from the current `package.json` file.
2. **After refactorings are implemented**: Create an assessment file `ASSESSMENT.md` in the same directory, comparing the original proposals against what was actually accomplished.

**File Naming**

Always use `REFACTORING.md` (not `REFACTORING PROPOSAL.md`) for consistency. Use the existing `REFACTORING.md` and `ASSESSMENT.md` files as templates for structure and content.

**Assessment Document Content**

The assessment document must be created after the refactoring implementation is complete and the full verification loop passes. It must compare the proposal against the actual implementation and include the following sections:

- **Summary**: Overall result (complete, partial, or failed) with a quantitative table showing proposed vs achieved items.
- **Proposal vs Implementation**: Item-by-item comparison of each planned step against what was actually done. Mark each item as completed, partially completed, or skipped. Explain any deviations from the plan.
- **Deviations and Rationale**: For every deviation (skipped steps, modified approaches, additions not in the proposal), explain why the decision was made. Distinguish between technical infeasibility, incorrect analysis in the proposal, and scope decisions.
- **Verification Results**: Final state of typecheck, lint, build, and test suite. Include test counts before and after.
- **Remaining Gaps**: Items from the proposal that were not addressed, with a recommendation on whether they should be deferred to the next cycle or addressed immediately.
- **Lessons Learned**: Observations about the proposal quality, analysis accuracy, and process improvements for the next refactoring cycle.

**Guidelines**

- Focus on measurable improvements in type safety, testing, performance, and maintainability.
- Document both completed work and remaining gaps.
- Update version numbers and dates appropriately.
- Before making any code changes, especially linting fixes or React optimisations, consult `GUIDELINES.md` for audio-critical development principles.
