# Reconcile YM2149 Initial State With deriveYmState

**Type:** Fix

## Summary

| Field         | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Intent        | Make the engine's initial `YMState` consistent with what the zero register file actually decodes |
| Key decisions | Constructor assigns `deriveYmState(registers)` instead of a hand-built literal                   |
| Open risks    | `getState()` before the first write changes: `noiseEnabled` flips to true on every channel       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The `YM2149` constructor builds its initial `YMState` as a literal with
`noiseEnabled: false` on all three channels. `deriveYmState` on an all-zero
register file yields `toneEnabled: true` and `noiseEnabled: true`, because
the YM2149 mixer bits are active-low - a zeroed register file decodes to
everything enabled, not muted.

The two representations disagree until the first register write forces
`updateState()`. Any consumer calling `getState()` before playback sees the
literal's `noiseEnabled: false`, which does not match what the hardware (or
the engine's own register decoding) reports.

The constructor should assign `this.state = deriveYmState(this.registers)`
so the initial state and every subsequent state come from the same decoder.

## Use Cases

- When the Dump or EQ panel polls `getState()` before the first register
  write, the reported state matches the register file.

## Hints

- Deferred from the 1.4.6 window's refactoring assessment - it is a
  behaviour change, not a refactoring.
- Check `test/synth/` assertions that may encode the literal's values.

## Out of Scope

- Changing what `deriveYmState` decodes - it already matches the hardware
  convention used everywhere else.
