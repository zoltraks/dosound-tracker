# Add a Playwright smoke suite for the documented flows

**Type:** Feature

**Source:** AUDIT-1.2 REC-006 / FND-CQY-002

## Summary

The configured Playwright suite is empty while `TESTING.md` names six end-to-end flows.

## Description

Implement the documented flows - launch defaults, note entry, playback, instrument editing, export, save/load, theme switching - as `e2e/` specs run by `npm run test:e2e`.

## Use Cases

- When `npm run test:e2e` runs, the six documented flows must pass.
- When audio playback is involved, the spec must handle it deterministically.

## Hints

Audio-critical paths need deterministic playback simulation rather than real audio output.
