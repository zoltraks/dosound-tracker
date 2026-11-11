# Stabilize E2E File Flows

**Type:** Fix

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Make the timing-dependent e2e file flows deterministic, starting with the |
|               | recorded webkit save/load flake                                           |
| Key decisions | Determinism inside the spec and helpers - the fix hardens the test, never |
|               | weakens the assertion to pass                                             |
| Open risks    | File-input and download timing differs across webkit and chromium - a fix |
|               | proven on one project must hold on both                                   |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`TESTING.md` records a known flake: the `saves and loads a song file`
webkit case can fail under parallel workers when the file-input
assertion observes a pre-upload value under load. It is timing-dependent,
not a regression - but a suite that flakes trains reruns, and
`TESTING.md` prefers making the test deterministic over accepting
repeats.

This record removes the timing dependency: the spec waits on the
observable post-upload state instead of a fixed ordering assumption.
The same hardening audit applies to the other file-touching flows in
the suite (export downloads), since they share the same
upload/download timing surface.

Acceptance is the suite passing repeatedly under parallel workers on
both projects, with the assertion still proving the real upload - not a
loosened check.

## Use Cases

- When the suite runs on webkit under parallel workers, the save/load
  spec passes without reruns.
- When a file flow is hardened, the assertion still fails if the upload
  or download genuinely breaks.

## Hints

- The recorded flake note lives in `TESTING.md` - the fix updates that
  note once the flow is deterministic, or the note stays if residual
  flakiness is proven elsewhere.
- `e2e/helpers.ts` is the shared surface - wait helpers for file state
  belong there rather than per-spec timeouts.
- Arbitrary `waitForTimeout` delays are not determinism - wait on the
  element state or the download event.

## Out of Scope

- New e2e flows - covered by the e2e expansion record.
- Application-side save/load behaviour changes - the application is
  correct; only the test timing is wrong.
