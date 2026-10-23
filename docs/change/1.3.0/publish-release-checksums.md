# Publish release checksums and evaluate signing

**Type:** Feature

**Source:** AUDIT-1.2 REC-013 / FND-INF-003

## Summary

Distributed artifacts are unsigned and carry no integrity evidence.

## Description

Generate SHA-256 checksums at build time and publish them beside each artifact, then evaluate code signing for the desktop targets.

## Use Cases

- When a release is published, a checksum file must verify each artifact.

## Out of Scope

Signing itself is a separate procurement decision; this change delivers verifiable integrity.
