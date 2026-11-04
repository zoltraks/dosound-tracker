# Upgrade Dependencies, Routine Tier

**Type:** Chore

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Land all in-range upgrades, six safe majors, and the npm-audit fixes       |
| Key decisions | `jsdom` 30 adopted; README dev-env figures corrected to the real toolchain |
| Open risks    | Electron 45 packaging proven by `electron:build`, not a GUI launch         |

## Description

`npm outdated` reports 29 updatable packages and `npm audit` reports 28 vulnerabilities (2 high: `follow-redirects`, `joi`; 26 moderate across the `minimatch` chain in eslint/electron-builder/typescript-eslint). All vulnerabilities are devDependency issues - nothing ships to users.

This record covers the routine tier: every in-range bump, the rolldown-vite pin, and the safe majors (`@types/node` 26, `globals` 17, `wait-on` 9, `jsdom` 30, `@testing-library/jest-dom` 7, `electron` 45).

## Execution

- `npm audit fix`.
- Install in-range targets: react 19.3.1, react-dom 19.3.1, eslint 9.39.5, @eslint/js 9.39.5, typescript-eslint 8.72.1, @playwright/test 1.64.1, electron-builder 26.18.0, @vitejs/plugin-react 5.2.0, eslint-plugin-react-hooks 7.1.1, eslint-plugin-react-refresh 0.4.26, @types/react 19.3.0, @types/react-dom 19.3.0, @types/node 24.19.2, @testing-library/dom 10.4.2, @testing-library/react 16.3.3, prettier 3.9.10.
- Pin `vite` to `npm:rolldown-vite@7.3.1` in `devDependencies` and `overrides`.
- Install safe majors: `@types/node` 26.6.6, `globals` 17.14.0, `wait-on` 9.5.1, `jsdom` 30.1.3, `@testing-library/jest-dom` 7.0.1, `electron` 45.2.1.
- Correct the `README.md` Development Environment figures to the real toolchain (Node v26.13.0, npm 11.20.0).
- Run the verification loop, `npm run test:e2e`, and `npm run electron:build`.

## Out of Scope

- Evaluated majors - handled by `dependency-upgrade-majors.md`.
- Deferred majors: typescript 7, eslint 10, plugin-react 6, vite 8.

## Outcome

- All in-range bumps and six safe majors landed, including `electron` 45.2.1 and `rolldown-vite` 7.3.1.
- electron-builder 26 required two config fixes: `win.publisherName` moved to `win.signtoolOptions.publisherName`, and `scripts/afterAllArtifactBuild.cjs` reads the platform from `platformToTargets` after the `packager` field was dropped from `BuildResult`.
- `eslint-plugin-react-hooks` 7.1.1 surfaced nine `set-state-in-effect` warnings at documented prop-mirroring sites - scoped suppressions applied per the tooling convention.
- `zustand` 5 dropped the loose `UiStoreSetFn` type annotation in `useUiStore.ts` for inference.
- `npm audit` residual: 26 moderate advisories inside the devDependency `minimatch` chain - nothing ships to users; `--force` would downgrade `typescript-eslint` and is rejected.
- `README.md` development environment updated to Node v26.13.0 / npm 11.20.0.
