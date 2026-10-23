# Scope the MIDI permission grant to the app origin

**Type:** Fix

**Source:** AUDIT-1.2 REC-009 / FND-SEC-002

## Summary

`electron/main.cjs` grants `midi` and `midiSysex` unconditionally to any origin.

## Description

Check the requesting origin in both permission handlers and drop the `midiSysex` grant the app never requests, so device access matches the app's own surface.

## Use Cases

- When a foreign origin requests `midi`, the request must be denied.
- When the app requests `midi` with `sysex: false`, the grant must succeed.
