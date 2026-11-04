# Refactoring Proposal

**Focus:** Hex formatting consolidation

## Problem

Seventeen call sites across nine files format hexadecimal values by hand
through `value.toString(16)` chains with `toUpperCase` and `padStart`
combinations. A `Formatter.hex` utility already exists and covers every
variant. The duplication invites drift (mixed case, mixed padding) and
obscures the single formatting contract.

## Goal

Route every manual hex-format expression through `Formatter.hex` with the
option set that reproduces its current output byte-identically.

## Plan

1. Convert the padded-uppercase sites (`padStart(2, '0')` +
   `toUpperCase`) to `Formatter.hex(value)`.
2. Convert the unpadded-uppercase sites (`toString(16).toUpperCase()`) to
   `Formatter.hex(value, { padWidth: 0 })`.
3. Convert the lowercase sites (`toString(16)` in `songFormat.ts`,
   `SoundDriver.ts`) to `Formatter.hex(value, { uppercase: false })`,
   preserving lowercase output and padding semantics.
4. Add the `Formatter` import where missing.
5. Run the verification loop.

Every converted value is a non-negative byte, channel, index, register, or
clamped nibble, so `Math.abs` inside `Formatter.hex` changes nothing, and
`padWidth: 0` is an identity pad.

## Risk

Low. Output is byte-identical by construction; tests assert assembly,
YAML, and UI strings containing hex. The debug-mode sequencer log keeps
its guarded `console.log` - `isDebugMode` gating makes it an intentional
feature, excluded from scope.

## Acceptance Criteria

- Zero remaining manual `toString(16)` sites outside `Formatter` itself
  and its tests.
- Typecheck, lint, format, build, and the 544-test suite all pass.
- Export fixtures diff to zero.
