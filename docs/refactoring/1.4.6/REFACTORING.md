# Refactoring Proposal - 1.4.6

## Problem

Three pieces of dead or no-op code survived into the window.

`src/components/PlaylistLine.tsx` carries a no-op formatter.

```typescript
const formatPatternDisplay = (patternId: string): string => {
  if (patternId === '--') return '--';
  return patternId;
};
```

Both branches return the input - the function is an identity mapping used at
one call site (`{formatPatternDisplay(patternValue)}`).

`src/modals/MidiModal.tsx` carries a dead effect and two identity memos.

```typescript
useEffect(() => {
  if (!isOpen) return;
}, [isOpen]);

const effectiveInputId = useMemo(() => {
  return localConfig.inputId;
}, [localConfig.inputId]);

const effectiveOutputId = useMemo(() => {
  return localConfig.outputId;
}, [localConfig.outputId]);
```

The effect runs on every open/close toggle and does nothing. The memos return
the field they read - `localConfig.inputId` and `localConfig.outputId` read
directly are equivalent.

## Goal

Delete the three dead constructs. `PlaylistLine` renders `patternValue` at the
call site, `MidiModal` drops the empty effect and reads `localConfig.inputId`
and `localConfig.outputId` at the two memo consumption points. Observable
behaviour is identical - no render, effect, or output difference.

## Plan

**Tidy PlaylistLine**

Remove `formatPatternDisplay` and use `patternValue` in the JSX. `Formatter`
stays imported - it is still used for the line number.

**Tidy MidiModal**

Remove the dead `useEffect`, then replace `effectiveInputId` and
`effectiveOutputId` with direct `localConfig.inputId` / `localConfig.outputId`
reads and drop the now-unused `useMemo` import if no other memo remains.

**Verify**

Run the verification loop (typecheck, lint, format, build, test).

## Risk

Low. Both files are presentation-layer React; no audio path, no register
stream, no file format is touched. `MidiModal` is listed in TESTING.md as
lacking dedicated tests, so the modal's existing consumers (`useMidi`,
`ModalManager`) and the smoke suite are the regression net.

## Acceptance Criteria

- Identical render output for `PlaylistLine` and `MidiModal` on the manual
  smoke flows (open MIDI modal, playlist renders pattern ids including `--`).
- Zero diff in produced export outputs for the supplied fixtures.
- No regression against the coverage thresholds defined in `vitest.config.ts`.
- Verification loop clean: zero errors, zero warnings.
