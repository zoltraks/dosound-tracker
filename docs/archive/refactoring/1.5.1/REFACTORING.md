# Refactoring Proposal - 1.5.1

## Problem

The window ships a single one-rule stylesheet fix. A repository-wide scan
found no duplicated focus-suppression rules worth grouping: each
`:focus { outline: none }` rule sits beside its own component block,
matching the file's local-rule convention.

## Goal

No extraction - the fix already lands in the idiomatic spot.

## Plan

Assess only; run the verification loop.

## Risk

None.
