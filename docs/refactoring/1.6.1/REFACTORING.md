# Consolidate App Integration Test Commands

## Problem

The App integration tests repeat the same role lookup and click in the
undo, redo, confirmation, and instrument clone flows in
`test/components/shell/App.test.tsx`. Each lookup searches the whole
workspace even though these buttons belong to the Commands region.

The application changes in this window affect the Settings loading
boundary. The build and smoke results support keeping that boundary.
The verification changes are a better fit for a small test refactor
than a change to application orchestration or audio timing.

## Goal

Give App integration tests a local command action that finds a button
by accessible name within the Commands region. Keep assertions in the
individual scenarios.

## Plan

Add the test action and use it for the undo, redo, confirmation, and
instrument clone commands. Run the App suite, the full verification
loop, and the coverage gate.

## Step Granularity

One structural edit in the App test suite.

## Risk

A command outside the Commands region would fail its role lookup.
The App integration suite exercises all migrated call sites.
The change touches test code only.

## Acceptance Criteria

- The App tests exercise the same commands and assert the same outcomes.
- The Settings, edit history, confirmation, and instrument clone flows
  retain their existing behavior.
- Export fixture tests pass and fixture bytes show zero diff.
- The standard verification loop and all four coverage gates pass.
