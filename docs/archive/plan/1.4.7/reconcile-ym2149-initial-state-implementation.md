# Reconcile YM2149 Initial State Implementation Plan

## Summary

| Field         | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Intent        | Derive the engine's initial `YMState` from the zero register file instead of a hand-built literal |
| Key decisions | Constructor assigns `deriveYmState(this.registers)`                                               |
| Open risks    | `noiseEnabled` reports true on fresh instances - intended; volume is still zero                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.7/reconcile-ym2149-initial-state.md`.

## Documentation Updates

No documentation changes are required. No source-of-truth document records
the constructor literal; the change aligns initial state with the already
documented register decoding.

## Step by Step Implementation

**Replace the literal**

In `src/synth/YM2149.ts`, replace the constructor's hand-built `YMState`
literal with `this.state = deriveYmState(this.registers)`. `deriveYmState`
is already imported for `updateState()`.

**Add a consistency test**

Add a `test/synth/` case asserting that `getState()` on a fresh instance
equals `deriveYmState` on a zero register file - noise enabled on all
channels, tone enabled, zero periods, zero volumes, envelope disabled.

## Testing Strategy

**Unit tests**

- Fresh-instance state matches the zero-register decode.
- All existing `getState()` assertions continue to pass - every existing
  test reads state after register writes, so none encodes the literal.

**Verification**

Run the verification loop in this order.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
