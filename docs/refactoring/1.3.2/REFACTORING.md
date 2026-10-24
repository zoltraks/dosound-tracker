# Refactoring Proposal 1.3.2

## Problem

`src/utils/storageKeys.ts` exists to consolidate every localStorage key the application uses, yet eight key strings bypass it and appear as literals scattered through `src/App.tsx` and `src/stores/uiStore.ts`:

- `dosound-tracker-instrument-octaves` (twice in `App.tsx`)
- `dosound-tracker-paste-track-mode` (twice in `App.tsx`)
- `dosound-tracker-track-background-enabled` (twice in `App.tsx`)
- `dosound-tracker-command-panel-mobile` (twice in `App.tsx`)
- `dosound-tracker-debug-info-shown` (twice in `App.tsx`)
- `dosound-tracker-eq-mutes` (once in `App.tsx`, once in `uiStore.ts`)
- `dosound-tracker-ignore-inst-type-warning` (once, `src/hooks/useInstrumentWarnings.ts`)
- `dosound-tracker-theme` and `dosound-tracker-debug-mode` (twice each in the reset handler, even though `StorageKeys.THEME` and `StorageKeys.DEBUG_MODE` already exist)

The literal duplication defeats the centralised convention: renaming a key requires finding every literal, and two sites for the same key can silently diverge.

Deliberately out of scope: `useMidi.ts` keeps `STORAGE_KEY`/`OLD_STORAGE_KEY` as a local migration pair, and `dosound-tracker-backup` is the IndexedDB database name in `persistenceMirror.ts`, not a localStorage key.

## Goal

Every localStorage key flows through `StorageKeys`. `StorageKeys` gains the missing entries, and all literal read/write sites in `App.tsx`, `uiStore.ts`, and `useInstrumentWarnings.ts` reference the constants. Behaviour is identical: the literal values themselves do not change.

## Plan

**Extend the key registry**

Add the seven missing entries to `StorageKeys`, keeping the existing `dosound-tracker-` prefix convention.

File to modify: `src/utils/storageKeys.ts`.

```typescript
static readonly INSTRUMENT_OCTAVES = 'dosound-tracker-instrument-octaves' as const;
static readonly PASTE_TRACK_MODE = 'dosound-tracker-paste-track-mode' as const;
static readonly TRACK_BACKGROUND_ENABLED = 'dosound-tracker-track-background-enabled' as const;
static readonly EQ_MUTES = 'dosound-tracker-eq-mutes' as const;
static readonly COMMAND_PANEL_MOBILE = 'dosound-tracker-command-panel-mobile' as const;
static readonly DEBUG_INFO_SHOWN = 'dosound-tracker-debug-info-shown' as const;
static readonly IGNORE_INST_TYPE_WARNING = 'dosound-tracker-ignore-inst-type-warning' as const;
```

**Replace literals in App.tsx**

Swap each literal for the matching `StorageKeys` member, including the reset handler's `THEME`/`DEBUG_MODE` literals.

File to modify: `src/App.tsx`.

**Replace literals in uiStore.ts**

`dosound-tracker-eq-mutes` becomes `StorageKeys.EQ_MUTES`.

File to modify: `src/stores/uiStore.ts`.

**Replace the literal in useInstrumentWarnings.ts**

`dosound-tracker-ignore-inst-type-warning` becomes `StorageKeys.IGNORE_INST_TYPE_WARNING`.

File to modify: `src/hooks/useInstrumentWarnings.ts`.

## Risk

Purely mechanical substitution of identical strings; no storage key value changes, so persisted state is untouched. Typecheck and lint catch any missed or mistyped reference; the existing storage-related tests cover the paths. No audio-path code is touched.

## Acceptance Criteria

- `grep -rn "dosound-tracker-" src/` outside `storageKeys.ts` finds no localStorage literal (the IndexedDB name and the MIDI migration pair excepted).
- Full verification loop passes with zero errors and zero warnings.
- No behaviour change: persisted values, keys, and UX are identical.
