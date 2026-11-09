# Specification Audit - Reconcile FORMAT.md With the Emitted Saver Schema

**Status:** Complete

**Verdict:** Ready for Implementation

## Document Information

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Change     | `docs/change/1.3.8/reconcile-format-saver-schema.md`              |
| Plan       | `docs/plan/1.3.8/reconcile-format-saver-schema-implementation.md` |
| Audit Date | 2026-11-09                                                        |

## Verdict

The plan is ready for implementation. The emitted key set is mechanically verified against `songIO.ts` and `trackClipboard.ts`, and each `ARCHITECTURE.md` claim is resolved against the tree.

## Completeness

The record requires FORMAT.md saver-key reconciliation and ARCHITECTURE.md claim correction. The plan covers both. The `persist-pattern-name` dependency landed first, so the documented `name` rule is already in place.

## Ambiguity

"Or the format carries a version marker" - resolved: the document is corrected to match emitted keys, no version marker is introduced, because the parser accepts the wider documented-alias set inbound and only emitted keys needed documenting.

## Implementability

Verified against the tree:

- `songIO.ts` emits `line`, `pattern` nodes with `number`/`name`/`step`, `instrument` nodes with `number`/`name`/`base`/`color`/`octave`/`shift`/`pitch`/`noise`/`mode`/`sustain`/`midi`.
- `trackClipboard.ts` emits root `step`.
- Note-off rows emit `note: 'OFF'`; `wait` replaces the documented `space`; `shift` replaces the documented `arpeggio`.
- `PlaylistPanel.tsx`, `ToneNoisePanel.tsx`, `EnvelopePanel.tsx` perform direct `localStorage` I/O - the presentational claim is stale.
- `useUiStore.ts` persists channel mutes through `EQ_MUTES` - that claim is accurate and stays.
- `useDataManagement.ts:73` owns `useState<Song>` - the App.tsx-local-state claim is stale.

## Fidelity

- Vocabulary freeze: emitted keys are documented once, aliases marked input-only.
- Cross-party parity: loader acceptance of `playlist`, `steps`/`lines`, `space`, `off`, `arpeggio`, `instruments`, `patterns`, `trackA/B/C` is recorded as the inbound superset.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| `none`  | `none`  | `none`           |
