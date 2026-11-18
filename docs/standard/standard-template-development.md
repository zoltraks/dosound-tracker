# Engineering Standard Template

<!-- Version: 0.2.0 | Date: 2026-11-18 -->

## Purpose

This document defines the mandatory template for all engineering standards in `<standard>/` - the
resolved standards directory, `docs/standard/` under the default mapping or `docs/standards/`
under a plural convention.

Every `*-development.md` file must conform to this structure.

The file doubles as a copyable skeleton - duplicate it,
then replace the guidance in each section with real content.

Conformance follows the Validation Rules section below - where the toolchain ships a
standards-validator script it enforces the same rules mechanically.

## Scope

A document is in scope when it is a `*-development.md` engineering standard,
whether it lives in this library or was copied into a consumer project.

- Every standard is hermetic: it never links to or names a sibling standard document
- Category documents assume the `general` document for the same identifier is applied first

Out of scope: improvement plans, templates for other document kinds, and produced project documents.

## Contents

| Section                  | Line | Read when                                                 |
| ------------------------ | ---- | --------------------------------------------------------- |
| Purpose                  | 5    | Always - what the document covers                         |
| Scope                    | 19   | Always - whether the project is in scope                  |
| How To Use This Standard | 62   | Always - agent entry, precedence, and non-negotiables     |
| Agent Intake Protocol    | 98   | Always - detect the project shape before asking           |
| Documentation            | 121  | Reference - authoritative external sources                |
| Language Version         | 130  | When confirming the language or runtime floor             |
| Project Structure        | 145  | When creating or relocating project files                 |
| Naming Conventions       | 153  | When naming files, symbols, or identifiers                |
| Code Conventions         | 161  | When writing or changing code                             |
| Formatting and Linting   | 166  | When configuring or running lint and format checks        |
| Testing                  | 174  | When writing or running tests                             |
| Build                    | 185  | When building or packaging the project                    |
| Dependencies             | 190  | When adding or updating dependencies                      |
| Verification             | 200  | Always - run every applicable check before reporting done |
| Definition of Done       | 211  | Always - check before reporting the task complete         |
| General Principles       | 233  | Always - cross-cutting principles                         |
| Fed Patterns             | 243  | Reference - conventions evolved downstream                |
| Sources                  | 257  | Reference - authoritative external sources                |
| Validation Rules         | 267  | Always - conformance checks for this document             |
| Change Procedure         | 292  | Reference - how to amend this document                    |

Read only the sections whose `Read when` entry matches the task.

The lazy-load map of the document - one row per `## ` section except `Contents` itself.
`Line` anchors to the section's heading line, and `Read when` states the trigger that loads it:
`Always -` for sections every task reads, `When ...` for task-scoped sections,
`Reference -` for lookup material. An agent reads this table with the front sections
and loads only the rows the task matches.

## How To Use This Standard

### Order Of Operations

1. Copy this file to `<standard>/<language>-<category>-development.md`.
2. Replace the H1 and the version header values
3. Replace each section's guidance text with the real rules
4. Keep every skeleton table header unchanged - the validation checklist keys on them
5. Check the file against the Validation Rules section and run `git diff --check` before delivering

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Keep this project on Java 17"               |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | Established tooling already in use           |
| 4    | This standard                             | The rules this document defines              |
| 5    | General best practice                     | Anything the four sources above do not cover |

A stacked standard adds its base standard as one extra rank above "This standard".

### Non-Negotiable Rules

- **Exact section set** - every standard carries the 18 sections below in the order shown,
  including the `Contents` lazy-load map
- **Executable verification** - every row in the Verification table is a runnable command,
  never "Review" or "Manual".
- **Hermetic content** - no links to sibling standards, so a copied file stays usable alone
- **Version floor** - the Language Version section states a minimum recommended version as a floor
  ("X or later"), never an exact pin and never a floating range like `latest`.

A violation of any of these rules is a defect, not a style preference.

## Agent Intake Protocol

### Detection First

| Signal Found In Repository                    | Inferred Decision                   | Confidence |
| --------------------------------------------- | ----------------------------------- | ---------- |
| `<standard>/` holds `*-development.md`        | This is the standards library       | High       |
| A request to add a standard                   | Copy this skeleton                  | High       |
| `standard-template-development.md` is present | This file is the governing contract | High       |

### Existing Project

Confirm before editing: "This repository already carries standards under `<standard>/` - I will
extend `<name>` following this template."

### New Project

| Question                      | Options                        | Default If Declined       |
| ----------------------------- | ------------------------------ | ------------------------- |
| Language or domain identifier | `csharp`, `python`, `openapi`  | Inferred from the request |
| Application category          | `general`, `cli`, `web`, `mcp` | `general`                 |
| Runtime floor to state        | Minimum recommended version    | Latest stable release     |

## Documentation

- [Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119)
  - the MUST/SHOULD/MAY vocabulary for normative rules
- [CommonMark Specification](https://spec.commonmark.org/) - the Markdown grammar every
  standard is written in.
- [GitHub Flavored Markdown](https://docs.github.com/en/get-started/writing-on-github) - table and
  code-fence rendering rules.

## Language Version

This section states a minimum recommended version or normative specification as a floor,
such as "Rust 1.85 or later" - never an exact pin and never a floating range such as `latest`.

A floor is recommended over a pin because a patch release carries security fixes that a project
should take automatically.

The concrete pin lives in the project's toolchain or manifest file (`rust-toolchain.toml`,
`.csproj`, `go.mod`, `package.json`), not in the standard.

The version header carries `Version` and `Date` fields only - never `Runtime` or other additions.

On runtime upgrade, re-validate all rules against release notes before writing code.

## Project Structure

```
<standard>/                                        # Resolved standards directory
├── <language>-general-development.md              # Base rules for the identifier
└── <language>-<category>-development.md           # Category rules stacked on general
```

## Naming Conventions

| Element           | Convention                                        | Example                         |
| ----------------- | ------------------------------------------------- | ------------------------------- |
| Standard filename | `<language>-<category>-development.md`, lowercase | `csharp-cli-development.md`     |
| Base standard     | `<language>-general-development.md`               | `csharp-general-development.md` |
| H1 title          | `<Language> <Category> Engineering Standards`     | `C# CLI Engineering Standards`  |

## Code Conventions

Every fenced block carries a language tag, demonstrates exactly one rule,
and contrasts correct and forbidden patterns when a prohibition matters.

## Formatting and Linting

One sentence per paragraph.

Tables are padded to source-text column width.

Prose follows the repository documentation style in the project style guide.

## Testing

A standard's Testing section names the framework, the placement convention,
and the exact commands that run the suite.

For this document itself, the check is the Validation Rules section below - every Error rule must
pass and `git diff --check` must stay clean.

When a document-quality battery is configured for the repository,
it applies to every touched standard file.

## Build

A standard's Build section names the dev, release, and packaging commands,
or states N/A for interpreted stacks.

## Dependencies

A standard's Dependencies section uses this schema:

| Category | Library          | Purpose                      |
| -------- | ---------------- | ---------------------------- |
| Runtime  | Pinned toolchain | The approved baseline        |
| Test     | Test framework   | The approved runner          |
| Lint     | Linter           | The approved static analysis |

## Verification

| Check                   | Command Or Method                                     | Applies To    |
| ----------------------- | ----------------------------------------------------- | ------------- |
| Section order listing   | `grep -n "^## " <standard>/<file>.md`                 | All standards |
| Filename pattern        | `ls <standard>/*-development.md`                      | New files     |
| Version header present  | `grep -n "^<!-- Version:" <standard>/*.md`            | Changed files |
| Forbidden check wording | `grep -rEn -e " Manual" -e " Review" <standard>/`     | Changed files |
| Diff whitespace         | `git diff --check`                                    | Every change  |
| Document battery        | Editorial Markdown battery when the host provides one | Changed files |

## Definition of Done

### Correctness

- The standard passes every Error rule in the Validation Rules section
- Every command in the Verification table runs as written

### Structure

- All 18 sections are present in the canonical order
- Required subsections and table schemas match this template

### Quality

- Rules are normative and checkable, not aspirational
- Examples are generic and anonymized

### Hygiene

- The version header was bumped and re-dated on change
- No secrets, product names, or internal identifiers appear

## General Principles

- Every standard stands alone
- Sections are a contract, not a suggestion
- Executable checks beat review notes
- State version floors, never pins and never floats
- Scrub real names, paths, and identifiers
- One purpose per document
- A violation is a defect, not a style preference

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Core Technologies alternative.** For a stack with no single language runtime, the
`Language Version` section may be named `Core Technologies` instead and lists the technology
baseline at the same position in the section order.

**Explicit version-header form.** The version header is stated as a concrete example:

```markdown
<!-- Version: X.Y.Z | Date: YYYY-MM-DD -->
```

## Sources

- https://www.rfc-editor.org/rfc/rfc2119 - requirement-level vocabulary.
- https://spec.commonmark.org/ - CommonMark specification.
- https://docs.github.com/en/get-started/writing-on-github - GitHub Flavored Markdown reference.

---

_The sections below govern the template itself and are not part of the copied skeleton._

## Validation Rules

Conformance is checked against these rules on every standard change - every Error must pass
before a standard ships.

| Rule                                                          | Severity |
| ------------------------------------------------------------- | -------- |
| All 18 required sections present                              | Error    |
| Contents table lists every `## ` section with `Line` and      | Error    |
| `Read when` columns                                           |          |
| Section order matches required order (extra domain sections   | Error    |
| may interleave)                                               |          |
| `Language Version` or `Core Technologies` holds the version-  | Error    |
| section position                                              |          |
| Version header present in `Version`/`Date` form               | Error    |
| Verification table has >= 3 rows with executable commands     | Error    |
| Sources section has >= 3 authoritative references             | Error    |
| No "Review" or "Manual" in Verification Command column        | Error    |
| Definition of Done has all four dimensions                    | Error    |
| Filename matches `*-development.md`                           | Error    |
| Non-Negotiable Rules contain "defect, not a style preference" | Error    |
| Precedence table has 3, 5, or 6 ranks                         | Error    |
| Agent Intake has Detection First + Existing + New Project     | Error    |
| Stacking reference resolves to existing file (if declared)    | Warning  |

## Change Procedure

1. Bump the patch version in the header and refresh the date
2. Update the project's changelog when one exists
3. Check the file against the Validation Rules section - every Error rule must pass - and
   run `git diff --check`.
4. Propose a one-sentence commit message

## Project Conventions

No project-specific conventions are recorded for this standard.
