# Specification Audit - Fix the Vite Native Config Warnings

## Document Information

|            |                                                                     |
| ---------- | ------------------------------------------------------------------- |
| Change     | `docs/change/1.4.3/fix-vite-native-config-warnings.md`              |
| Plan       | `docs/plan/1.4.3/fix-vite-native-config-warnings-implementation.md` |
| Audit Date | 2026-11-09                                                          |

## Completeness

| Requirement                                            | Covering step                                  |
| ------------------------------------------------------ | ---------------------------------------------- |
| Update the import specifier                            | Extension the vitest config import             |
| Update the directory reference                         | Replace `__dirname` with `import.meta.dirname` |
| Verify `npm run build`, `npm test`, `npm run test:e2e` | Verification section                           |
| Do not set `VITE_CONFIG_NATIVE_IGNORE_WARNING`         | Not present in the plan - out of scope honored |

No requirement lacks a covering step and no step lacks a requirement.

## Ambiguity

- The record names `vite.config.ts:37` for `__dirname`; the file holds a second use at line 78 (the `@` alias). "the directory reference" covers both - the plan replaces both.

## Implementability

- `vitest.config.ts:2` holds `import viteConfig from './vite.config'` - verified.
- `vite.config.ts:37` and `:78` hold the two `__dirname` uses - verified.
- `tsconfig.node.json` sets `allowImportingTsExtensions: true` and `noEmit: true` under `moduleResolution: bundler` - the extensioned specifier typechecks.
- `import.meta.dirname` resolves under `module: ESNext` and the Node >= 26.13 toolchain floor - available.

No step fails the check.

## Fidelity

- Enumeration fidelity - both `__dirname` sites enumerated, not only the hinted line.
- Vocabulary freeze - the specifier `./vite.config.ts` is stated identically in plan and code.
- Cross-party parity - both config files load through the same native loader path.
- Constants completeness - no numeric bounds touched.
- Boundary decisions - none; the change is self-contained.

## Findings Returned to Planning

none
