# Measure the declared performance targets

**Type:** Chore

**Source:** AUDIT-1.5 REC-011 (FND-INF-006)

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Convert design-only performance claims into measured ones                  |
| Key decisions | A committed measurement artifact covers each measurable target             |
| Open risks    | DOSOUND hardware fidelity may need device-in-loop access the project lacks |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`PROJECT.md` declares quality targets - application load under 2 seconds, zero
audio glitches during normal operation, song files under 100KB for typical
compositions, byte-identical export output, and DOSOUND hardware compatibility.
No measurement artifact backs them: the claims rest on design evidence plus the
export byte-stability and worker-timing tests.

Each declared target carries measured evidence recorded in the repository. The
artifact states the target, the method, the host environment, and the observed
result, so a future audit can confirm the claim instead of taking it on design
grounds alone.

Targets that cannot be measured locally - DOSOUND replay compatibility on real
Atari ST hardware is the candidate - get an explicit record of how they are
verified or why they stay design claims.

## Use Cases

- When the measurement artifact is read, then every declared quality target
  maps to a recorded measurement or a stated verification path.
- When a later audit checks the targets, then evidence exists in the tree.

## Hints

- Load time can be measured against `vite preview` serving the production
  `dist/` bundle - the environment and method belong in the record.
- Song file size is measurable against the committed fixtures in
  `test/fixtures/` and a representative composition.
- Zero-glitch playback is an observational claim - a structured manual
  listening record is a legitimate measurement artifact for it.
- Export byte-identity is already test-verified; the artifact cites the
  existing fixture suites rather than duplicating them.
