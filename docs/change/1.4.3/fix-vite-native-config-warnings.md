# Fix the Vite native-config warnings

**Type:** Chore

**Source:** 1.4.3 session verification runs

## Summary

| Field         | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Intent        | Silence the `configLoader: 'native'` unsupported-feature warnings in every test run |
| Key decisions | two flagged features: extensionless `./vite.config` import and `__dirname`          |
| Open risks    | none - both fixes are mechanical and covered by the verification loop               |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Every `npm test` and e2e run prints the Vite warning that `vitest.config.ts` imports `./vite.config` without an extension and that `vite.config.ts` uses `__dirname` instead of `import.meta.dirname`. Both features become unsupported under the planned `configLoader: 'native'` default.

Update the import specifier and the directory reference so the suite runs warning-free on the current and the future loader.

## Hints

- `vite.config.ts:37` holds the `__dirname` use; `vitest.config.ts:2` holds the extensionless import.
- Verify `npm run build`, `npm test`, and `npm run test:e2e` after the change - all three load the config.

## Out of Scope

- Setting `VITE_CONFIG_NATIVE_IGNORE_WARNING` - that suppresses the symptom, not the cause.
