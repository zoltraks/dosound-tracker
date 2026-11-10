# Reconcile the License Whitelist Implementation Plan

## Summary

| Field         | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Intent        | Bring the single off-whitelist production-chain license inside declared policy |
| Key decisions | `Python-2.0` passes the per-package review and joins the permitted list        |
| Open risks    | `none`                                                                         |

The summary block precedes the detailed sections and is refreshed when the record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.9/reconcile-license-whitelist.md`.

## Best Practices

- The change is documentation-only - `COPYRIGHTS.md` is a guideline file, so the verification loop does not apply per `GUIDELINES.md`.
- The license review the policy prescribes is performed and recorded before the whitelist edit, not after.

## License Review

Per the "Packages with no declared license field require a per-package review before adoption" rule, the undeclared license `Python-2.0` on `argparse@2.0.1` is reviewed here.

- `argparse@2.0.1` ships `LICENSE` containing the Python Software Foundation license text - a permissive, non-copyleft license granting use, copy, modification, distribution, and sublicensing with copyright-notice retention.
- Reach: `argparse` is a transitive dependency of `js-yaml` (`js-yaml.dependencies.argparse = ^2.0.1`), and `js-yaml` is a production dependency used to parse song and instrument YAML at runtime.
- Verdict: permissive-class, compatible with the MIT-licensed project. Whitelist extension is the correct resolution - no dependency replacement needed.

A whitelist-to-lockfile scan also surfaced `csstype@3.2.3` with a missing license field in `package-lock.json`. The installed package declares MIT and ships an MIT `LICENSE` file, so it is already inside the permitted set - a lockfile metadata gap, not a violation.

## Documentation Updates

`COPYRIGHTS.md` is itself the artifact being reconciled - the whitelist edit is the implementation.

- `COPYRIGHTS.md` - add `Python-2.0` to the permitted open-source license list.

## Step by Step Implementation

**Extend the permitted license list**

Add `Python-2.0` to the permitted-license bullet in the Dependency Licensing section.

File to modify: `docs/COPYRIGHTS.md`.

```markdown
- Permitted open-source licenses: MIT, Apache 2.0, BSD 2-Clause, BSD 3-Clause, ISC, Boost,
  BlueOak-1.0.0, CC-BY-4.0, CC0-1.0, WTFPL, MIT-0, Python-2.0.
```

## Implementation Order

1. Edit `docs/COPYRIGHTS.md`.
2. Re-run the whitelist-to-lockfile diff - zero uncovered production licenses.

## Testing Strategy

No tests - documentation-only change. Verification is the license diff below.

## Verification

- Run the whitelist-to-lockfile license scan over `package-lock.json` production-chain packages.
- Expect zero licenses outside the permitted set.
