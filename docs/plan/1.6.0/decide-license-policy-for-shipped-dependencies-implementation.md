# Decide the License Policy for Shipped Dependencies Implementation Plan

**Change Request Reference:** `docs/change/1.6.0/decide-license-policy-for-shipped-dependencies.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Executable license census plus the documented verdict on PSF-2.0 |
|               | and 0BSD                                                         |
| Key decisions | The census is a guard test so the policy stays enforced          |
| Open risks    | A declined license forces a dependency swap - scope grows if     |
|               | `js-yaml` must go                                                |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: the census reads
`package-lock.json` directly; SPDX `OR` expressions pass when any
alternative is allowed.

## Documentation Updates

- `COPYRIGHTS.md` - the verdict for PSF-2.0 and 0BSD, or the dependency
  replacement is recorded.

## Type and State Updates

None.

## Step by Step Implementation

**Scripted lockfile census**

A census reads `package-lock.json` `packages`, collects each entry's
`license`, `dev`, and `optional` flags, parses `OR` alternatives, and
classifies every license as allowlist, documented MPL tooling exception,
or violation.

File to create: `test/guard/licenseAllowlist.test.ts` (or a script under
`scripts/` invoked by the test - the guard-test home keeps it enforced).

**Present the decision**

Report the census with PSF-2.0 (`argparse`, shipped via `js-yaml`) and
0BSD (`tslib`, dev) flagged; the user approves each for the allowlist or
declines.

**Apply the verdict**

Approval: extend the `COPYRIGHTS.md` allowlist and census baseline.
Decline: a follow-up change record swaps the dependency chain - the swap
is not absorbed into this record.

**Inspect shipped artifacts**

Repeat the `E12`-style check on the packaged app and confirm which
runtime packages and license files actually ship, so the policy talks
about the real graph.

## Implementation Order

1. Census test and first report.
2. User verdict on the two flagged licenses.
3. `COPYRIGHTS.md` update (or follow-up record for replacement).
4. Artifact inspection.
5. Verification loop.

## Testing Strategy

**Unit tests**

`test/guard/licenseAllowlist.test.ts` - lockfile census fails on an
unlisted license, passes on SPDX `OR` alternatives with an allowed
member, and keeps the MPL dev-only exception green.

**Integration tests**

None - the shipped-artifact inspection is a manual build check.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean, census test green.
