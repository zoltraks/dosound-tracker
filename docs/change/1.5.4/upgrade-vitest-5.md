# Upgrade Vitest to 5

**Type:** Chore

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Move the test toolchain to the `vitest` 5 line across the related       |
|               | packages once the runner stabilizes on this stack                       |
| Key decisions | `vitest`, `@vitest/ui`, and `@vitest/coverage-v8` upgrade together -    |
|               | the chain shares the runner                                             |
| Open risks    | Blocked on upstream stability - the 5.1.0 attempt failed the full suite |
|               | on rolldown-vite 7 and was reverted                                     |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`vitest` 5 was evaluated at 5.1.0 and reverted: the full suite failed
under the new runner on the rolldown-vite 7 stack. The failure was
toolchain-level, not test-quality - the suite itself is healthy on 4.x.

The upgrade is deferred to a later window pending evidence the runner
works on this stack: a vitest 5.x release that runs the suite clean under
rolldown-vite, or upstream fixes addressing the observed failures. When
that evidence exists, `vitest`, `@vitest/ui`, and
`@vitest/coverage-v8` bump together inside the same window - they share
the runner core and upgrading one alone leaves version skew.

The re-evaluation starts by re-running the archived failure list from
the 1.3.6 attempt against the new version, since vitest 5 changes to the
runner, environment handling, or config schema may have since been
fixed.

## Use Cases

- When a vitest 5.x release runs `npm test` clean on this stack, the
  upgrade proceeds in the window.
- When the suite still fails the same way, the record stays blocked and
  reports the upstream state.

## Hints

- The reverted-attempt evidence is recorded in the 1.3.6 dependency
  upgrade archive - read it before re-running so the same failure modes
  get checked first.
- jsdom environment behaviour and the `// @vitest-environment node`
  pragma are the likeliest drift surfaces per the suite's conventions.
- Coverage thresholds in `vitest.config.ts` may need re-baselining under
  the new coverage provider version.

## Out of Scope

- Switching test runners - the record upgrades vitest, it does not
  replace it.
- Playwright upgrades - the e2e toolchain is independent.
