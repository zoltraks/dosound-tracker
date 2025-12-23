# Refactoring Proposal Generation Prompt

## Project Analysis Requirements

**MANDATORY DEEP SOURCE CODE ANALYSIS:**
- Read and analyze EVERY source file in the project completely
- Trace the execution flow from entry points through all code paths
- Map all function calls, including indirect calls and callbacks
- Identify all module dependencies and their coupling relationships
- Examine every function, class, variable, and constant definition
- Document the purpose and usage of each code component
- Trace data structures through their entire lifecycle
- Identify all configuration and initialization code
- Understand timing-critical sections and performance requirements
- Map out error handling and edge case management

**Analysis must thoroughly cover:**
- Complete source code structure and organization
- All function and variable naming patterns currently in use
- Every module dependency, import, and coupling point
- All instances of code duplication (exact and functional)
- All unused or dead code (functions, variables, imports)
- Design patterns, architectural choices, and their rationale
- Data structures and their usage throughout the codebase
- Performance-critical sections (especially audio generation and sequencer)
- Timing-sensitive code paths (20ms/40ms cycles)
- All callback mechanisms and event handlers

**Identify code duplication carefully:**
- Exact duplicates (copy-paste code)
- Functional duplicates (same logic, different implementation)
- Intentional duplicates (safety-critical, performance-optimized)
- Near-duplicates that could be unified
- Document WHY duplication exists before proposing removal

**Identify unused code thoroughly:**
- Truly dead code (never called, never referenced)
- Incomplete refactoring artifacts (partially removed features)
- Commented-out code that should be removed
- Imports and dependencies that are no longer used
- Functions and variables defined but never accessed
- Legacy code paths that are bypassed
- Distinguish between unused code and code used only in DEBUG mode

## General Instructions

Read project documentation and guidelines for refactoring proposals.
Make refactoring proposal for the current version.
Forget about previous refactorings.
Don't read files in docs/refactoring or docs/prompt directories.
Use guidelines from docs/ARCHITECT.md and docs/GUIDELINES.md files.
Remember about proper report file name REFACTORING.md in correct directory inside docs/refactoring followed by version number.
Remember that playback and sequencer needs to work efficiently and frequently (20 ms or 40ms for a cycle).
We don't need to support any other sound chip than YM2149.
This refactoring proposal will be used as a guide for AI assisted code generation, not for human programmers.
Create an implementation plan organized in phases, but do not break it into time frames or schedules.
When creating document, avoid using emoji in section titles.
Don't write conclusions, future considerations, implementation timelines, or files modified summaries.
Don't include implementation safety measures, git workflow strategies, or rollback plans.
Don't mention sources of recommendations (e.g., "from X proposal", "based on Y analysis").
Skip any time-based implementation references (e.g., "Week 2, Day 5", "Days 1-3").
Analyse the project deeply from scratch.
Focus on unused or duplicated code as the primary refactoring target.
Try to simplify things for increasing maintainability.
Omit sound generation procedures, it's working properly and we don't want to break it.
Proposed changes must be safe and not break anything.
Don't extend file structure too much, keep as flat as possible.
Current file structure is acceptable and maintainable.
Aim to fit the changes within a single sprint.
Remember that project has DEBUG mode for conditional debug output - distinguish between unconditional console output (to be fixed) and DEBUG mode output (to be preserved).
All debugging facilities are critical for diagnostics and must not be changed.
Debug mode console logs are intentional and expected - they must not be removed or modified.
Preserve all debug mode logging statements as they are essential for troubleshooting.

## Refactoring Focus Areas

**PRIMARY FOCUS - Unused and Duplicated Code:**
- Identify all unused code and analyze why it exists
- Determine if unused code is from incomplete previous refactorings
- Find all duplicated code and assess whether duplication is intentional
- Some code duplication may be intentional for safety or performance reasons
- Propose removal only when code is genuinely unused and safe to remove
- Propose unification only when duplication provides no benefit
- Prioritize maintainability improvements through code simplification

**Maintainability Enhancement:**
- Simplify complex functions without changing behavior
- Reduce coupling between modules where safe
- Improve code organization for better readability
- Clarify ambiguous or confusing code structures
- Standardize inconsistent patterns
- Enhance code documentation where needed

**Safety-First Approach:**
- Every proposed change must be proven safe before inclusion
- Verify that changes cannot affect audio generation or sequencer timing
- Test critical code paths remain untouched
- Ensure performance-critical sections are not impacted
- Validate that timing-sensitive code (20ms/40ms cycles) is preserved
- Double-check that no sound generation logic is affected

## Naming Conventions

**Apply naming conventions consistently:**
- Use existing naming patterns found in the project (document these in the proposal)
- If current naming is inconsistent or unclear, propose better conventions
- Ensure all new names follow the established or proposed patterns
- Document any naming convention changes with clear before/after examples
- Maintain consistency across files, functions, variables, and constants
- Proposed naming improvements must enhance code readability and maintainability

## Critical Safety Constraints

**ABSOLUTE RESTRICTIONS - MUST NOT BE MODIFIED OR BROKEN:**
- All sound generation functions (YM2149 chip emulation)
- All sequencer functions and playback logic
- Any code that directly manipulates audio output or timing
- Sound chip register manipulation
- Waveform generation and audio buffer management
- Real-time audio processing loops (20ms/40ms cycles)
- All debugging facilities and diagnostic code
- Debug mode console logs and output (these are intentional and required)
- Timing-critical sections and performance-sensitive code paths
- Audio callback mechanisms and event handlers

**These components are working correctly and ANY modification risks breaking audio functionality or diagnostics. Mark these clearly as off-limits in the proposal.**

**Before proposing ANY change near audio or sequencer code:**
- Trace all call paths to ensure no audio/sequencer functions are affected
- Verify no timing dependencies will be altered
- Confirm no performance characteristics will change
- Document why the change is safe despite proximity to critical code

**DEBUG MODE REQUIREMENTS:**
- The project has a DEBUG mode for diagnostic purposes
- Debug mode console output is INTENTIONAL and MUST be preserved
- Distinguish between:
  - Unconditional console output (may need fixing/removal)
  - DEBUG mode conditional output (MUST be preserved)
- All debug logging facilities are critical for troubleshooting and must remain intact
- Do not remove, modify, or "clean up" any debug mode logging statements
- Unused code analysis must account for code used only in DEBUG mode

## Testing Requirements

**MANDATORY for every refactored function:**
- Add unit tests that verify the function's behavior before and after refactoring
- Tests must cover all code paths and edge cases
- For functions that were refactored or touched in any way, existing tests must pass AND new comprehensive tests must be added
- Tests should validate input/output contracts, error handling, and boundary conditions
- Include regression tests to ensure no functionality is broken
- For timing-sensitive code near audio/sequencer, add performance tests

**Test specifications must include:**
- Function signature and expected behavior
- Test cases with specific inputs and expected outputs
- Assertions that verify correctness
- Integration points that need verification
- Performance validation for timing-critical sections
- Regression tests for each refactored component

**Special testing for code removal:**
- Document why removed code was unused (call graph analysis)
- Verify no indirect references exist
- Confirm no future code paths would use it
- Test that removal doesn't affect any existing functionality

## Document Focus

Focus the document on:
- Technical specifications and executable requirements
- Detailed analysis of unused and duplicated code
- Justification for each proposed change (why it's safe)
- Code structures, function signatures, and expected outcomes
- Safety constraints (what must NOT be modified)
- Testing requirements for automated verification with specific test cases for each refactored function
- Clear phase organization without scheduling details
- Explicit marking of protected code areas (sound generation, sequencer, debugging)
- Rationale for keeping or removing duplicated code
- Analysis of incomplete refactorings and their cleanup

## Proposal Quality Requirements

**Each proposed change must include:**
- What code is being changed (exact location and scope)
- Why the change is needed (unused, duplicated, or maintainability)
- Why the change is safe (analysis proving no breakage)
- How to verify the change (specific tests required)
- What must NOT be changed in proximity to the modification

**For code removal proposals:**
- Proof that code is genuinely unused (call graph, reference analysis)
- Explanation of why it exists (incomplete refactoring, legacy, etc.)
- Confirmation that DEBUG mode doesn't use it
- Verification that no future features depend on it

**For code deduplication proposals:**
- Identification of all duplicate instances
- Analysis of whether duplication is intentional
- If intentional, document why and DO NOT propose changes
- If unintentional, show how to safely unify without side effects
- Proof that unification won't affect performance or timing

---

## Comparison Task

Analyse all refactoring proposals.
These come from different models:
 - `REFACTORING-minimax.md` from MiniMax M2.1
 - `REFACTORING-devstral.md` from Devstral 2 2512
 - `REFACTORING-kat.md` from KAT-Coder-Pro V1
 - `REFACTORING-grok.md` from Grok Code Fast 1

Make comparison of all of them in `PROPOSAL COMPARISATION.md`.
Find weak and strong points and decide which one is the best.
Read them carefully and combine the proposals into a single document
`REFACTORING.md` that will be used for project maintenance.

File `REFACTORING proposal.md` contains the query that was used to generate each of the documents.
