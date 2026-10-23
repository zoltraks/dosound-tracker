# Add a redundant persistence path or save reminder

**Type:** Feature

**Source:** AUDIT-1.2 REC-020 / FND-CQY-008

## Summary

Song and instrument data persist only to evictable `localStorage` keys.

## Description

Add a redundant path - periodic export reminders, File System Access persistence, or IndexedDB mirroring with export - so compositions survive a cleared store.

## Use Cases

- When `localStorage` is cleared, song data must remain recoverable.
- When no file save exists, the app must surface the risk unobtrusively.

## Hints

Keep the autosave UX unchanged; redundancy must not interrupt composition flow.
