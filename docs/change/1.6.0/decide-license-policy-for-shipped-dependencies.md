# Decide the license policy for shipped dependencies

**Type:** Chore

**Source:** Audit 2026-11-12 REC-04 (FND-04)

## Summary

| Field         | Value                                                    |
| ------------- | -------------------------------------------------------- |
| Intent        | Reconcile installed licenses with the declared allowlist |
| Key decisions | PSF-2.0 and 0BSD approved for the allowlist              |
| Open risks    | none - the dependency-swap path was not taken            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The declared license allowlist in `COPYRIGHTS.md` does not cover two
installed licenses: `argparse@3.0.4` (PSF-2.0, pulled in by `js-yaml`,
present in the packaged ASAR) and `tslib@2.9.1` (0BSD, dev-classified).
The twelve MPL-2.0 entries are dev-only `lightningcss` packages and
already fit the documented tooling exception.

The user decides per license: explicitly approve and document it in
`COPYRIGHTS.md` when compatible, or replace the dependency chain that
pulls it in. The decision is grounded in a complete census - a scripted
lockfile scan that understands SPDX `OR` expressions, plus inspection of
the shipped artifacts for which runtime packages and license files
actually land inside them.

## Use Cases

- When the census runs, every installed license resolves to allowlist,
  documented exception, or an explicitly named violation.
- When the user approves a license, `COPYRIGHTS.md` records it and the
  allowlist describes the shipped graph honestly.

## Hints

- `js-yaml` is the `argparse` chain; a parser replacement is the fallback
  only if the license is declined.
- Keep the MPL tooling-only boundary as documented.
- A zero-advisory `npm audit` scan is not a license clearance - this
  record exists because the two checks answer different questions.
- Sites: `docs/COPYRIGHTS.md`, `package-lock.json`, packaged ASAR and
  installer contents.

## Out of Scope

- Replacing `js-yaml` or `tslib` before the policy verdict lands.
- Legal advice - the record produces a documented project decision, not
  a legal opinion.
