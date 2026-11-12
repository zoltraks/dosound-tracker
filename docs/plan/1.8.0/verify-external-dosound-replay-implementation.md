# Verify DOSOUND Output Against an External Player Implementation Plan

**Change Request Reference:** `docs/change/1.8.0/verify-external-dosound-replay.md`

## Summary

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Intent        | Byte-level replay evidence for the `N-03` compatibility claim    |
| Key decisions | Reference matrix is a fixture set so runs stay reproducible      |
| Open risks    | Player availability is the unresolved blocker - hardware, an     |
|               | emulator with documented DOSOUND fidelity, or a validated player |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: the comparison
harness is deterministic - same input stream, same trace, same diff.

## Documentation Updates

- `PROJECT.md` - `N-03` resolves to verified with the matrix and player
  named, or narrows to a documented bounded claim.
- `FORMAT.md` - only if replay exposes a specification error (that
  finding routes to its own change record first).

## Type and State Updates

None.

## Step by Step Implementation

**Build the reference-song matrix**

Author a small fixture set covering the matrix axes: silence, looping,
all three channels, 50/60 Hz, both clock rates, and every assembly
export strategy; store under `test/fixtures/` or a dedicated reference
directory.

**Obtain the replay path**

Secure an original Atari DOSOUND routine or an independently validated
compatible player and document why its output counts as reference -
the evidence quality is part of the result.

**Replay and compare**

Run emitted command streams through the player, capture register and
time traces plus stop behavior, and diff byte by byte against expected
traces; every divergence is recorded with the byte and frame it appears
at.

**Resolve the claim**

Verified: `N-03` updates with the matrix and player named. Blocked or
divergent: `PROJECT.md` narrows the claim as a documented decision, and
any incompatibility found routes to its own change record.

## Implementation Order

1. Reference fixture matrix.
2. Replay path secured and documented.
3. Replay plus byte-level comparison.
4. Claim resolution in `PROJECT.md`.

## Testing Strategy

**Unit tests**

The trace-comparison harness is unit-tested against synthetic streams
with a planted divergence so the comparison itself is proven.

**Integration tests**

The replay run is the integration evidence - executed manually against
the player, results recorded in the window review.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean for any harness code added.
- Replay matrix executed; `N-03` resolved or honestly narrowed.
