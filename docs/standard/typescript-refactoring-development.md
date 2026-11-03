# TypeScript Refactoring Standard

<!-- Version: 0.1.0 | Date: 2026-11-01 -->

## Purpose

This document defines the refactoring standard for TypeScript codebases in prepared
agentic-software-engineering projects: how to recognize duplication, when shared
logic becomes a utility, how oversized components are split responsibly, which
comments survive a cleanup pass, and how every step proves behavior preservation.

It is the principles layer for refactoring work; the project's refactoring
procedure (analysis, proposal, implementation, assessment) owns execution order.

## Scope

In scope: TypeScript source in Node.js backends and browser frontends of prepared
projects - deduplication decisions, extraction and split boundaries, comment
policy, and per-step verification for behavior-preserving work.

Out of scope: behavior changes, feature work, and defect fixes - those route
through the project's change lifecycle, not through a refactoring.

A refactoring that cannot complete without a behavior change stops and produces
a change record instead.

## How To Use This Standard

Read it before proposing or executing any structural cleanup in a prepared
project.

Apply its rules inside the project's refactoring procedure - a proposal cites the
standard's taxonomy and keep-lists, and every implemented step names the rule it
follows.

### Non-Negotiable Rules

- Refactoring preserves behavior - identical inputs produce identical outputs and
  identical observable responses.
- Every extraction ends at a statement boundary and is verified before importers
  are rewired.
- Shared helpers are pushed to the lowest layer so imports flow one direction.
- A comment stays only when it carries information the code cannot: a license
  header, a public-contract annotation, a deliberate-difference compatibility
  note, or a documented load-bearing invariant.
- A step that reveals a required behavior change stops and routes it to the
  change lifecycle.

## Agent Intake Protocol

### Detection First

Before proposing, measure: count real duplication (exact, functional,
intentional), locate oversized modules against the project's file-size policy,
and inventory comment slop by class. A proposal written on an unmeasured surface
guesses at targets.

### Existing Project

Map the consumer surface of every dedup candidate - imports, dynamic access,
definition-package fields, event scripts, debug-only usage - before recommending
removal or extraction. A member with zero importers is dead code, not a dedup
target; a member with live callers may be newer than a shared copy it resembles,
so semantics are diffed before either side is deleted.

## Duplication Taxonomy

**Exact duplication** - identical or near-identical text across two or more
sites. Extract the shared body into one utility and rewire the sites.

**Functional duplication** - different text, same computation and invariants.
Extract the semantics, not the text: name the utility for the shared concept and
confirm each call site's pre- and post-conditions match the extracted contract.

**Intentional duplication** - similar text serving different evolution paths
(example: two protocol adapters that coincidentally share a shape today).
Deliberate duplication is documented, not extracted - a premature abstraction
locks unrelated paths to each other's changes.

## Extraction and Component Splitting

- A repeated logic cluster (three or more occurrences, or two occurrences of a
  named concept) becomes a shared utility; a single occurrence stays local.
- Extracted modules carry only the imports they actually reference.
- Splits follow domain seams, not line counts alone - the new module owns a
  coherent responsibility that reads without back-references.
- Oversized modules split along those seams toward the project's file-size
  policy; splitting for line count alone produces fragmentation, not clarity.
- After each structural step, scan for orphaned modules (zero importers) - an
  orphan is either dead code or an incomplete rewire and is resolved before the
  step counts as done.

## Comment Policy

Source comments justify their existence per line.

**Keep-list** - removed only when the code changes underneath them:

- License and legal headers.
- Public-contract annotations - the documented reason a response shape, wire
  format, or serialized key must not change.
- Deliberate-difference notes - where this implementation knowingly diverges
  from a referenced spec, library default, or sibling implementation, and why.
- Load-bearing invariants - comments encoding a constraint that is not derivable
  from the code and whose violation produced a recorded defect.

**Strip-list** - removed on sight:

- Narrative-redundant comments - restate what the adjacent identifier, type, or
  call already says.
- Section banners and separators duplicating the structure they decorate.
- Commented-out code, dead `#if`-style blocks, and version archaeology - history
  lives in version control.
- Change narration - `// fixed in X`, `// previously did Y`, migration diaries.

When in doubt, strip: a comment that only _might_ carry meaning is weighed
against the maintenance cost of keeping stale prose, and code is authoritative.

## Verification

Every step leaves the codebase verifiable: the project's configured gates
(lint, typecheck, format check, tests, build) run on the touched tree before the
next step starts, and the full production-ready loop runs before the refactoring
is called complete.

Behavior preservation is demonstrated, not asserted: identical responses at the
public seams, identical generated artifacts where the project emits them, and
the test surface green throughout.

## Definition of Done

### Correctness

- Observable behavior identical at every public seam.
- Generated artifacts (contracts, specs, build output) unchanged.

### Structure

- Extracted helpers at the lowest correct layer, with only the imports they use.
- No orphaned modules; no introduced cycles.

### Quality

- Each finding in the proposal resolved or explicitly deferred with a reason.
- Comment keep-list honored; stripped classes reach zero.

### Hygiene

- All configured gates green on the final tree.
- The refactoring assessment records the outcome and any residual risk.

## Project Conventions

Project-specific conventions extend the standard above for the DOSOUND Tracker codebase.

- The refactoring procedure is owned by `REFACTORING.md` - proposal shape, the
  proposal/assessment cycle per version window, and the project-specific constraints
  (audio timing, byte-identical exports, unchanged YM2149 emulation) live there, not here.
- The audio-critical patterns protected during refactoring - prop mirroring, sparse
  dependency arrays, direct `setState`, manual memoization - are owned by `GUIDELINES.md`.
