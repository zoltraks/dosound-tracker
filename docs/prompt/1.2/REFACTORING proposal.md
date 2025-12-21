# Refactoring Proposal Generation Prompt

## Project Analysis Requirements

**MANDATORY DEEP ANALYSIS:**
- Read and analyze ALL source files in the project
- Examine the complete project structure and directory organization
- Study all code files to understand architecture, patterns, and dependencies
- Identify existing naming conventions for files, functions, classes, variables, and constants
- Map out module relationships and data flow
- Understand the full context before proposing any changes
- Document current naming patterns found in the codebase

**Analysis must cover:**
- Source code structure and organization
- Function and variable naming patterns currently in use
- Module dependencies and coupling
- Code duplication and unused code
- Design patterns already employed
- Data structures and their usage

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
Focus on unused or duplicated code.
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

## Naming Conventions

**Apply naming conventions consistently:**
- Use existing naming patterns found in the project (document these in the proposal)
- If current naming is inconsistent or unclear, propose better conventions
- Ensure all new names follow the established or proposed patterns
- Document any naming convention changes with clear before/after examples
- Maintain consistency across files, functions, variables, and constants
- Proposed naming improvements must enhance code readability and maintainability

**ABSOLUTE RESTRICTIONS - MUST NOT BE MODIFIED OR BROKEN:**
- All sound generation functions (YM2149 chip emulation)
- All sequencer functions and playback logic
- Any code that directly manipulates audio output or timing
- Sound chip register manipulation
- Waveform generation and audio buffer management
- Real-time audio processing loops

These components are working correctly and ANY modification risks breaking audio functionality. Mark these clearly as off-limits in the proposal.

## Testing Requirements

**MANDATORY for every refactored function:**
- Add unit tests that verify the function's behavior before and after refactoring
- Tests must cover all code paths and edge cases
- For functions that were refactored or touched in any way, existing tests must pass AND new comprehensive tests must be added
- Tests should validate input/output contracts, error handling, and boundary conditions
- Include regression tests to ensure no functionality is broken

**Test specifications must include:**
- Function signature and expected behavior
- Test cases with specific inputs and expected outputs
- Assertions that verify correctness
- Integration points that need verification

## Document Focus

Focus the document on:
- Technical specifications and executable requirements
- Code structures, function signatures, and expected outcomes
- Safety constraints (what must NOT be modified)
- Testing requirements for automated verification with specific test cases for each refactored function
- Clear phase organization without scheduling details
- Explicit marking of protected code areas (sound generation and sequencer)
