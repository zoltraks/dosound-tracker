# Harden the markdown rendering path

**Type:** Fix

**Source:** AUDIT-1.2 REC-008 / FND-SEC-001

## Summary

Two `dangerouslySetInnerHTML` sinks render custom-marked-up content with only `escapeHtml` as a control.

## Description

Restrict the sinks to first-party content and add a restrictive content security policy for the packaged app, or replace the custom renderer with a vetted sanitizer.

## Use Cases

- When markup outside the allowed grammar reaches a sink, it must not reach the DOM.
- When the policy is added, the app must keep working.

## Hints

The sinks currently render only `MESSAGES.md`; keep the source set bounded.
