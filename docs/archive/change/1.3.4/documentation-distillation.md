# Distill the Project Documentation

**Type:** Chore

AI-assisted: Devin (SWE-2)

## Summary

Distill the active documentation set per the recorded distillation convention: remove content obvious from the source code and replace it with cross-references, fix drift and divergence between the documents and the implementation, and keep every document human-friendly - readable without opening the source tree.

## Description

Apply the Documentation Distillation rules from `GUIDELINES.md` to `SPECIFICATION.md` and `GUIDELINES.md`, and to `ARCHITECTURE.md`, `WORKFLOW.md`, and `TESTING.md` only where they hold raw code duplication. The expected result is a smaller documentation set with zero divergence from the implementation.

- Remove technology-stack restatements that duplicate `package.json`, directory trees that mirror the filesystem, store-to-file mappings obvious from the store directory, raw type interfaces that duplicate `src/types/` or `src/synth/`, build configuration that duplicates config files, development script listings that duplicate `package.json` scripts, and constants tables that duplicate `src/constants/`.
- Replace each removed block with a short cross-reference naming the owning source file and one sentence describing what it holds, so a reader learns the rule without needing to know the code.
- Keep behavioural rules and semantics not obvious from interfaces, extensibility contracts, design rationales, algorithm descriptions, error-handling policies, lifecycle and startup explanations, and every cross-reference to the file where a definition lives.
- While distilling, verify every existing cross-reference and statement of fact against the implementation and repair drift: stale line counts, renamed paths, outdated counts, and claims that no longer hold.
- Verify each new cross-reference resolves to a file that exists before removing the duplicated content.
- The result stays human-friendly: short sentences, one idea per paragraph, no requirement to be aware of source-code internals to follow a rule.

## Hints

- Known drift candidates from the current set: test-coverage counts in `TESTING.md`, file-size figures for `App.tsx`, folder lists in the recorded source structure, and any path that no longer resolves.
- A removed code block is never deleted silently - a `See src/<path>` reference takes its place.

## Out of Scope

- Rewriting prose style beyond the distillation removals, or moving rules between documents.
- Changing requirements, use cases, or architectural decisions - facts are corrected to match the implementation, never reinterpreted.
- Any source-code change - this is a documentation-only change.
- `PROJECT.md`, `FORMAT.md`, `MAX.md`, `VERSIONING.md`, `DEPLOYMENT.md`, and `COPYRIGHTS.md` except where they carry raw code duplication.
