# Refactoring Proposal - 1.4.7

## Problem

`YM2149` and `AyumiEngine` each reimplement the same register-file mechanics:
a sixteen-entry mirror, bounds and mask checks, write deduplication, a
nesting `beginBatch`/`endBatch` counter, deferred-write collection, and the
`readRegister`/`getRegisters`/`getRegistersArray` readers. The only real
difference is the flush side effect - the internal engine recomputes derived
state and retargets Web Audio nodes, while Ayumi posts `write`/`writes`
messages to the worklet.

```text
src/synth/
  channelInstrument.ts   shared instrument-to-register logic (existing)
  registerFile.ts        new - shared register mirror + batch coalescing
  YM2149.ts              delegates to RegisterFile
  AyumiEngine.ts         delegates to RegisterFile
```

## Goal

Extract a `RegisterFile` class owning the register array, batch depth, and
pending-write collection. It takes one `onFlush(pairs)` callback; each engine
supplies its own side effect. Public engine APIs stay unchanged - consumers
never see the class.

## Plan

**Create `src/synth/registerFile.ts`**

`RegisterFile` exposes `write`, `force` (raw store for `silenceAll`-style
paths that must not dedupe or flush), `beginBatch`, `endBatch`, `read`,
`snapshot`, `toArray`, and `zero`. A batched write pushes onto `pending`;
depth-0 `endBatch` flushes the collected pairs; an unbatched write flushes
`[[register, value]]` immediately.

**Retarget YM2149**

`writeRegister`/`beginBatch`/`endBatch`/`readRegister`/`getRegisters`/
`getRegistersArray` delegate to the file. The constructor supplies
`onFlush = () => { this.updateState(); this.updateAudioNodes(); }` - the
pair list is ignored, preserving the current bool-flag flush semantics.
`silenceAll` uses `force` for its direct register writes. `reset` uses
`zero` plus the same flush path.

**Retarget AyumiEngine**

Same delegations. `onFlush` posts `{ type: 'write' }` for a single pair and
`{ type: 'writes' }` otherwise - matching the current single-write and
batched message shapes. `reset` uses `zero` plus the `reset` message.

**Verify**

Add `test/synth/registerFile.test.ts` covering dedup, masking, bounds,
nested batches, flush ordering, and `force`. Run the verification loop.

## Risk

Low-medium. This is the register-write hot path - every preview, playback
tick, and export simulation drives it - so parity must be exact: YM2149's
`pendingUpdate` bool and Ayumi's pair list both reduce to "flush once at
depth zero", and a single batched pair reaches Ayumi as `writes` with one
entry either way. Export output is untouched - the file only holds the
mirror that Dump/EQ already reads.

## Acceptance Criteria

- Engine public APIs unchanged; all existing synth, playback, and export
  tests pass unmodified.
- New `RegisterFile` unit tests cover the extracted mechanics.
- Identical export bytes for the supplied fixtures.
- Verification loop clean: zero errors, zero warnings.
