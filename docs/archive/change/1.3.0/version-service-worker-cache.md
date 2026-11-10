# Version the service-worker cache per build

**Type:** Fix

**Source:** AUDIT-1.2 REC-003 / FND-INF-002

## Summary

The static `CACHE_NAME` plus cache-first strategy can serve stale assets after redeploys.

## Description

Derive the cache name from the app version or build hash and prefer network-first for versioned assets, so returning clients always receive the deployed build.

## Use Cases

- When a new build deploys, a returning client must receive only current assets.

## Out of Scope

The offline capability itself is preserved.
