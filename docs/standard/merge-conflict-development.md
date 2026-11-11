# Merge Conflict Engineering Standards

<!-- Version: 0.1.1 | Date: 2026-11-08 -->

## Purpose

This document defines the mandatory engineering standard for resolving merge conflicts in
tracked source trees.

It governs how a merge is prepared, how each conflicted file is analyzed,
how resolutions are verified, and how the resulting merge is recorded.

Conformance follows the Verification and Definition of Done sections below - a merge reported as
resolved while any gate fails is a defect, not a style preference.

## Scope

A merge is in scope when two diverged histories must join: a remote pull into a feature branch,
a feature merge-back, a back-merge of a release line, or a cherry-pick that reports conflicts.

Generated artifacts, lockfiles, changelogs, locale catalogs,
and rule documents are in scope alongside source code.

Interactive rebases and history rewrites share most rules but are out of scope where they
reorder rather than merge.

## How To Use This Standard

### Order Of Operations

1. Prepare: clean tree, fresh fetch, read the divergence counts and recent logs
2. Classify every conflicted file into a taxonomy class before resolving it
3. Resolve file by file using the per-class rules in Code Conventions
4. Regenerate generated artifacts from the merged inputs - never hand-resolve them
5. Run the repository's canonical gate and fix failures as part of the resolution
6. Record the merge per the repository's commit convention, and never push without a named request

### Precedence

When two rules conflict, apply the first matching source in this list.

| Rank | Source                                    | Example                                      |
| ---- | ----------------------------------------- | -------------------------------------------- |
| 1    | An explicit instruction from the user     | "Resolve every conflict in our favor"        |
| 2    | The project rules file                    | `AGENTS.md`, `docs/GUIDELINES.md`            |
| 3    | The existing convention in the repository | The merge-commit message the history uses    |
| 4    | This standard                             | The rules this document defines              |
| 5    | General best practice                     | Anything the four sources above do not cover |

### Non-Negotiable Rules

- **Intent before edits** - every conflicted file gets a per-side diff against the merge base before
  a resolution is chosen.
- **Regeneration over hand-editing** - a generated artifact is rebuilt from the merged inputs,
  never resolved by picking a side.
- **Gate before done** - the repository's own verification gate decides whether the merge is
  resolved, and a clean-looking auto-merge counts for nothing until the gate passes.
- A violation of any of these rules is a defect, not a style preference

## Agent Intake Protocol

### Detection First

| Signal Found In Repository                   | Inferred Decision                       | Confidence |
| -------------------------------------------- | --------------------------------------- | ---------- |
| `MERGE_HEAD` or conflict markers present     | A merge is in progress                  | High       |
| A request to merge, sync, or update a branch | Run the Order Of Operations above       | High       |
| `docs/standard/` holds `*-development.md`    | The project carries a standards library | High       |

### Existing Project

Confirm before editing: "This repository carries merge and commit conventions - I will resolve
following this standard and the project's own gates."

### New Project

| Question                        | Options                            | Default If Declined        |
| ------------------------------- | ---------------------------------- | -------------------------- |
| Verification gate for the tree  | Configured scripts, CI job list    | Lint, typecheck, tests     |
| Generated artifacts present     | Lockfiles, contracts, build output | Detected from the manifest |
| Merge-commit message convention | History style, rules file          | Match the recent merges    |

## Documentation

- [git-merge documentation](https://git-scm.com/docs/git-merge) - merge mechanics, conflict stages,
  and strategy options.
- [git-checkout documentation](https://git-scm.com/docs/git-checkout) - the `--ours` and
  `--theirs` resolution helpers.
- [git-diff documentation](https://git-scm.com/docs/git-diff) - three-dot and merge-base comparison
  forms used to read intent.

## Core Technologies

Git 2.40 or later.

The merge-base id is resolved once per merge with `git merge-base HEAD <source>` and reused for
every per-side diff.

A graphical merge tool may assist review, but the resolution is decided by the rules here,
not by the tool's suggestion order.

## Project Structure

```
<repository>/
├── .git/MERGE_HEAD            # Present while the merge is unresolved
├── .env.example               # Declared-environment template - union class
├── CHANGELOG.md               # Release notes - ordered-union class
├── openapi.yaml               # Generated contract - regenerate, never edit
└── <pkg>/package-lock.json    # Lockfile - regenerate or take the matching side
```

## Naming Conventions

| Element              | Convention                                            | Example                         |
| -------------------- | ----------------------------------------------------- | ------------------------------- |
| Merge-base variable  | Resolved once, reused                                 | `MB=$(git merge-base HEAD m)`   |
| Side names           | `ours` is the checked-out branch, `theirs` the source | `--ours`, `--theirs`            |
| Conflict stages      | Stage 1 base, stage 2 ours, stage 3 theirs            | `git ls-files -u`               |
| Merge commit message | Match the repository's recorded merge style           | `merge origin/main into feat/x` |

## Code Conventions

Every conflict is classified before it is resolved, and the class selects the rule.

- **Parallel implementation** - both sides built the same feature
  Take the more evolved design wholesale,
  then read it to confirm the other side's unique deltas were already absorbed.
- **Additive union** - locale catalogs, changelogs, dependency blocks, manifest rows
  Keep both sides' entries in the recorded order convention,
  and prefer the side that already contains the other's content restyled.
- **Deliberate upstream decision** - a removal, rename, or simplification on the incoming side
  Prove intent with `git log -S <needle>` or the commit message before keeping
  your side's older form.
- **Toolchain-era mismatch** - one side upgraded a dependency's API
  Resolve every hunk to the newer API the merged manifest pins - never mix two eras of the same
  library in one file.
- **Complementary edits** - each side changed a different region of the same construct
  Union them and confirm the merged result compiles,
  since the auto-merge already did this where the regions were far enough apart.

An auto-merge is not a resolution.

When both sides add the same declaration in slightly different positions,
the merge lands both copies with no marker,
producing a duplicate identifier the compiler or linter must catch - treat every clean merge of
same-feature areas as unresolved until the gate runs.

```
git merge-base HEAD origin/main            # once
git diff <base> HEAD -- <file>             # what our side did
git diff <base> origin/main -- <file>      # what their side did
git checkout --theirs -- <file>            # take a whole side when a superset exists
```

## Formatting and Linting

Run the project's pinned formatter on every hand-resolved file - conflict markers and manual edits
routinely violate the configured style.

Never reformat a file the merge did not touch.

## Testing

A resolved merge is verified by the repository's own canonical gate, not by ad-hoc checks:
lint with the configured warning ceiling, typecheck, the test suite, and the build,
in the order the project records them.

A gate failure inside the merged tree is a resolution defect to fix now,
and a failure clearly outside the merged scope is reported, not silently repaired.

## Build

The build runs as the last gate step, and generated deliverables are regenerated before it:
the API contract from the merged routes, the lockfile from the merged manifest,
and any generated documentation index.

## Dependencies

| Category | Library        | Purpose                                |
| -------- | -------------- | -------------------------------------- |
| Runtime  | git            | Merge machinery and history inspection |
| Test     | Project suite  | The recorded verification gate         |
| Lint     | Project linter | Duplicate and style detection          |

## Verification

| Check                        | Command Or Method                                 | Applies To      |
| ---------------------------- | ------------------------------------------------- | --------------- |
| No unresolved entries        | `git diff --name-only --diff-filter=U`            | Every merge     |
| No conflict markers left     | `grep -rn "<<<<<<<" --exclude-dir=.git .`         | Every merge     |
| Whitespace hygiene           | `git diff --check`                                | Every merge     |
| Project gate                 | The recorded lint/typecheck/test/build chain      | Every merge     |
| Feature preservation audit   | `grep -n` for the branch's own feature call-sites | Feature merges  |
| Regenerated artifact in sync | The project's generated-contract drift check      | Generated files |

## Definition of Done

### Correctness

- No conflict markers or unmerged index entries remain
- The repository's canonical gate is green on the merged tree
- The branch's own behavior is proven present by the feature-preservation audit, not assumed

### Structure

- Generated artifacts are regenerated from merged inputs, never hand-resolved
- Version and metadata fields carry the mainline values,
  and recorded post-merge duties are discharged.

### Quality

- Every conflicted file was classified and resolved by its class rule
- Deliberate upstream decisions are preserved with evidence, not overridden

### Hygiene

- The merge commit matches the repository's message convention
- Nothing is pushed without a named request

## General Principles

- Read intent before editing - the merge-base diff answers why each side moved
- A clean auto-merge proves nothing. The gate is the oracle
- Prefer the superseding design over a blended resurrection of both
- Regenerate what the project generates
- Verify the branch's own features survived, not merely that the tree compiles
- Resolve conflicts during the operation. Finishing the merge is part of it

## Fed Patterns

Patterns proven in projects that adopted this standard and evolved their own conventions.

**Per-side stat survey.** `git diff --stat <base> <side> -- <file>` on both sides sizes a conflict
before any content is read - a one-line our-side against a rewrite on their side usually resolves as
theirs plus a re-check for the unique delta.

## Sources

- https://git-scm.com/docs/git-merge - merge command reference.
- https://git-scm.com/docs/git-checkout - path-level resolution with `--ours` and `--theirs`.
- https://git-scm.com/docs/git-diff - comparing against the merge base.
- https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging - the
  underlying three-way model.
