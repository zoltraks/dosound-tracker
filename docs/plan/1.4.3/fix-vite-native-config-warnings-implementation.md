# Fix the Vite Native Config Warnings Implementation Plan

## Summary

| Field         | Value                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Intent        | Silence the `configLoader: 'native'` unsupported-feature warnings in every test run         |
| Key decisions | Extensioned `./vite.config.ts` import; `import.meta.dirname` replaces both `__dirname` uses |
| Open risks    | none - `allowImportingTsExtensions` is already enabled and the changes are mechanical       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.3/fix-vite-native-config-warnings.md`.

## Analysis

Every `npm test` and e2e run loads `vitest.config.ts`, which imports `./vite.config` without an extension, and `vite.config.ts`, which uses `__dirname` twice (line 37 service-worker path, line 78 alias path). The native config loader flags both features as unsupported. `tsconfig.node.json` already sets `allowImportingTsExtensions` and `noEmit`, so the extensioned specifier typechecks, and `import.meta.dirname` is available under `module: ESNext` with Node >= 20.11 - the toolchain floor is Node 26.

## Documentation Updates

No project documentation requires updating - the change touches build configuration internals only and no pillar document describes the config loader mechanism.

## Step by Step Implementation

**Extension the vitest config import**

Change the specifier to carry the explicit `.ts` extension.

File to modify: `vitest.config.ts`.

```typescript
import viteConfig from './vite.config.ts';
```

**Replace `__dirname` with `import.meta.dirname`**

Both uses resolve the project root; `import.meta.dirname` is the ESM-native equivalent the native loader supports.

File to modify: `vite.config.ts`.

```typescript
const swPath = resolve(import.meta.dirname, 'dist', 'sw.js');
```

```typescript
'@': resolve(import.meta.dirname, './src'),
```

## Implementation Order

1. Update `vitest.config.ts`
2. Update `vite.config.ts`
3. Run the verification loop

## Testing Strategy

No new tests - the existing suite is the verification surface. The record requires `npm run build`, `npm test`, and `npm run test:e2e` to run warning-free.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test` - confirm the native-config warnings are gone from the output
- Run `npm run test:e2e` - the config loads under Playwright as well
