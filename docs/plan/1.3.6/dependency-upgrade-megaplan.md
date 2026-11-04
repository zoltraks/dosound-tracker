# Dependency Upgrade Implementation Megaplan

## Change Record Reference

This plan is the umbrella over two change records in `docs/change/1.3.6/`.

It fixes their order, dependencies, wave partition, and release gates.

## Iteration Map

| Order | Change record                   | Requirements                           | Gate |
| ----- | ------------------------------- | -------------------------------------- | ---- |
| 1     | `dependency-upgrade-routine.md` | in-range bumps, safe majors, audit fix | loop |
| 2     | `dependency-upgrade-majors.md`  | five evaluated majors, keep-or-revert  | loop |

## Dependencies

Record 2 depends on record 1: the evaluated majors land on the already-updated toolchain.

## Wave Partition

**Wave 1** - record 1: `package.json`, `package-lock.json`, `node_modules`, `README.md`, `dist/`, `release/` artifacts.

**Wave 2** - record 2: same manifests, one package at a time with per-package gates.

**Wave 3** - deferral records in `FUTURE.md`.

## Documentation Updates

- `README.md` - Development Environment figures.
- `FUTURE.md` - deferred majors as candidates.
- `CHANGELOG.md` is not touched - entries are written only at version bump.

## Open-Point Routing

- vitest 5 interop with rolldown-vite 7 - closed by the suite run inside record 2.
- Any tier-3 revert - recorded in the change record with failure evidence.

## Gate Roll-Up

- **Wave 1** - loop clean, e2e 12/12, `electron:build` produces artifacts.
- **Wave 2** - each kept major passes its gate; each failure reverts alone.
- **Close** - `npm audit` residual documented; verification loop clean.

## Definition Of Done

- Manifests updated, loop clean, e2e green, Electron packaging proven.
- Deferrals recorded; no commits made.

## Verification

Full loop after each wave (`typecheck`, `lint`, `format`, `build`, `test`) plus `test:e2e` and `electron:build` after wave 1 and the final loop.

## Risks

- vitest 5 on rolldown-vite 7 - suite run is the gate, revert keeps 4.1.12.
- js-yaml 5 API drift - byte-identical export assertions are the gate.
- Electron 45 GUI launch unproven headlessly - `electron:build` is the proxy.
