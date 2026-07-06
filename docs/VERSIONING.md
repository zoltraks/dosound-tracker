# Versioning Guidelines

This document describes the version numbering scheme and bumping rules for the DOSOUND Tracker project.

## Version Format

The version follows semantic versioning format: `MAJOR.MINOR.PATCH`.

- **MAJOR** (first number): significant changes, breaking compatibility.
- **MINOR** (second number): new features, enhancements.
- **PATCH** (third number): bug fixes, minor improvements.

## Version Bumping Rules

**Standard Increment**

Version bump is always incrementing the patch number up to 9 then minor, then major regardless of the nature of the change. Do not analyze the change type to determine which part to increment.

Increment the least significant number without checking the nature of the change.

- Increment the **PATCH** number, capping at 9:
  - `1.2.7` -> `1.2.8`.
  - `1.2.8` -> `1.2.9`.
- When PATCH reaches 9, increment **MINOR** and reset PATCH to 0:
  - `1.2.9` -> `1.3.0`.
  - `1.9.9` -> `2.0.0`.
- When MINOR reaches 9, increment **MAJOR** and reset both MINOR and PATCH to 0:
  - `1.9.9` -> `2.0.0`.
  - `9.9.9` -> `10.0.0`.

**MAJOR Number Exception**

The MAJOR number has no maximum limit and can be incremented beyond 9:

- `9.9.9` -> `10.0.0`.
- `10.9.9` -> `11.0.0`.
- `99.9.9` -> `100.0.0`.

## Files to Update

| File           | Field                |
| -------------- | -------------------- |
| `package.json` | `"version": "X.Y.Z"` |

## Automated Version Bump

The project includes an automated version bump script at `scripts/bump-version.mjs`.

This script is executed by the `npm run bump` command, which increments the patch number in `package.json` following the standard increment rules above and then builds the application.

The `npm run build` command builds the application without bumping the version. Use `npm run build` for verification loops and rebuilds. Use `npm run bump` only when a version bump is explicitly requested.

The automated script handles only the version number increment. The following steps remain manual:

- Running the security audit (`npm audit`).
- Creating the CHANGELOG entry.

## Version Bump Procedure

When bumping the version manually (outside the automated build script):

- **Ensure a clean and production-ready build first**: run the full verification loop from `TESTING.md` (`typecheck`, `lint`, `build`, `test`) and verify every step passes with zero errors and zero warnings before any version changes.
- **Run a security audit**: execute `npm audit` and review findings. If vulnerabilities are found:
  - Run `npm audit fix` to resolve fixable issues automatically.
  - If a vulnerability cannot be fixed automatically, evaluate whether it affects shipped dependencies (not devDependencies) and whether it is exploitable in the application's usage context.
  - Do not block a version bump on a devDependency vulnerability that does not affect the built application, but document it in the CHANGELOG under a "Security" item.
  - Do not force dependency updates that break the build or tests. If a fix introduces breaking changes, document the risk and proceed.
- Calculate the new version number per the bumping rules above.
- Update the version in `package.json`.
- Run `npm install` to update `package-lock.json`.
- **Create a CHANGELOG entry**: analyse all code changes since the last version bump, using `git log` if needed, and add a comprehensive entry to `CHANGELOG.md` at the repository root describing every significant change.
- Rebuild the application with `npm run build` so generated files are refreshed with the new version.

Do **not** create a new directory in `docs/change/` when bumping versions.

The AI assistant must **not** commit version changes. The user will commit manually after reviewing the changes.

## CHANGELOG Conventions

The repository has a single `CHANGELOG.md` at the root covering all changes.

**Format**

```markdown
# Changes

## Version X.Y.Z

One-sentence summary of the release scope and theme.

- **Subject**: description of the change.
- **Subject**: description of the change.
```

**Rules**

- The file title is `# Changes`. There is no other heading at the top level.
- Each release is a `## Version X.Y.Z` heading. No date, no component prefix.
- Immediately after the heading, a single plain-text summary sentence describes the overall theme of the release.
- A bullet list follows: each item starts with a **bold subject**, the affected area, class, or feature, then a colon, then a concise description.
- Items describe what changed and why it matters, not how it was implemented.
- The most recent version is at the top.
- Do not include sub-headings such as `### Added` or `### Fixed` inside a version section.
- Write in past tense.
- Inspect source code changes between versions and describe every significant change. The CHANGELOG must accurately reflect all changes that occurred, not just a high-level summary.
- **Omit refactoring details**: Do not list internal refactoring work, code restructuring, or test additions. Focus on functionalities, features, and bug fixes that affect users. If a release contains only refactoring, state it as "Internal refactoring" in the summary with no bullet items or only list non-refactoring changes such as bug fixes.
- **Check implementation plans**: When bumping from version X.Y.Z to the next version, review all implementation plan files in `docs/plan/X.Y.Z/` to ensure every implemented feature is documented in the CHANGELOG entry for the new version. Implementation plans describe work done for the upcoming version and must be recorded when that version is released.
- **Never modify CHANGELOG.md outside the version bump procedure**: Do not add, edit, or remove entries when implementing individual features, bug fixes, or refactors. All CHANGELOG changes must happen exclusively during the version bump sequence described above. Feature changes accumulate in the codebase and are documented only when the version is actually bumped.

## Examples

| Current Version | Next Version |
| --------------- | ------------ |
| `1.2.7`         | `1.2.8`      |
| `1.2.9`         | `1.3.0`      |
| `1.9.9`         | `2.0.0`      |
| `9.9.9`         | `10.0.0`     |
