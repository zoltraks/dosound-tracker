# Clean Code Engineering Standards

<!-- Version: 0.1.2 | Date: 2026-11-10 -->

## Purpose

This document defines the clean-code factor - the principles that decide whether code is
well-shaped, independent of language.

It covers SOLID, DRY, KISS, YAGNI, naming, functions, comments, error handling, and testability.

It is the yardstick for new code and the factor a refactoring measures against -
`docs/REFACTORING.md` owns the process, this document owns what "clean" means.

It is written to be executed directly by an AI coding agent and to be read without effort
by a human reviewer.

## Scope

Every code change in the repository.

Language standards add language-specific expression.

This document states the principle.

## How To Use This Standard

Read it when designing, writing, or judging the shape of code.

During a refactoring it supplies the factor the findings are classified against - a finding that
cites a principle here is actionable, a finding that cites taste is not.

### Non-Negotiable Rules

- **Principles beat preference.** A critique names the violated principle, not a personal style
- **Duplication is debt.** Two copies of a concept drift apart - the rule binds
  knowledge, not text shape.
- **Names answer for the code.** A misleading or cryptic name is a defect, not a nit
- **Smaller and simpler wins ties.** When two shapes satisfy the requirements,
  the one a tired reader parses faster is the standard.

## SOLID

- **Single responsibility** - a module, class, or function has one reason to change
  A file that announces two jobs announces a split.
- **Open/closed** - extend behaviour by adding code, not by editing the code every consumer runs
  Extension points sit behind seams like the backend dispatch pattern.
- **Liskov substitution** - a subtype honours the contract of its base - an implementation that
  narrows the contract breaks callers silently.
- **Interface segregation** - many narrow contracts over one fat one
  A consumer depends on the surface it uses.
- **Dependency inversion** - depend on the seam, not the concretion
  The `XBackends.Current` dispatch pattern is this rule in practice.

## DRY

Every piece of knowledge has a single authoritative representation.

Copy-pasted branches, repeated literal shapes,
and parallel implementations that must move together are the debt this rule names.

Intentional duplication that exists to decouple is documented as such.

## KISS And YAGNI

- Choose the simplest shape that satisfies the requirement today - indirection earns its place by a
  demonstrated need, not a predicted one.
- Build what the change record asks for - speculative generality and premature abstraction are
  refactoring anti-patterns, not foresight.
- Removing a behavior removes its setup - configuration, initialization writes, and state
  that exist only to serve that behavior leave with it. Vestigial setup outlives its
  feature and reads as an active rule to the next reader.

## Naming And Functions

- Names carry intent and scope - a public name answers "what", a parameter answers "which instance",
  a flag answers "when true".
- Functions do one thing at one level of abstraction - a body that dips from orchestration into
  bit-twiddling wants an extraction.
- Parameters are few and cohesive - a group that always travels together is a
  record asking to exist.
- Side effects are honest - a function that mutates says so in its name,
  and a reader that writes betrays its name.

## Comments

Comments explain why - the what belongs in the code itself.

A comment that narrates the line beneath it signals a name or structure that needs work.

Contract surfaces carry the doc comments the contract deserves.

## Error Handling

Failures are honest and categorised - an error carries its kind, its message,
and the remedy when the environment caused it.

Per-item failures degrade, and the batch reports the count.

Silent catch is a defect.

## Testability

Code that resists a test resists reading - seams exist where tests need them,
pure functions take their inputs as parameters,
and text parsers stay testable against recorded fixtures.
