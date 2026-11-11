# Specification Audit - Stabilize E2E File Flows

## Document Information

|            |                                                              |
| ---------- | ------------------------------------------------------------ |
| Change     | `docs/change/1.5.2/stabilize-e2e-file-flows.md`              |
| Plan       | `docs/plan/1.5.2/stabilize-e2e-file-flows-implementation.md` |
| Audit Date | 2026-11-11                                                   |

## Completeness

Every requirement in the change record maps to a plan step:

- Unambiguous file-input selection - covered by "Name the hidden file inputs"
  and the `songFileInput` / `instrumentFileInput` helpers.
- Wait on observable post-upload state - covered by `uploadSongFile`, which
  asserts the staged file value on the input before the loaded-title assertion.
- Hardening audit for other file-touching flows - the export download flow is
  rewired through `clickAndDownload`; no other spec touches files.
- Assertion strength preserved - the save/load spec still asserts the loaded
  title value, and the upload staging check adds proof rather than loosening it.
- `TESTING.md` flake note - covered by implementation-order step 6.

No requirement lacks a covering step. No step exists without a stated
requirement - the `getByLabel('Song title')` retargeting serves the same
determinism requirement.

## Ambiguity

- "Polling window sized for parallel workers" - resolved to 15 seconds on the
  loaded-title assertion only; all other assertions keep Playwright defaults.
  The spec fragment in the plan names the value.

## Implementability

- `src/components/FileInputs.tsx` exists and renders exactly the two hidden
  inputs the plan describes - verified at lines 27-64.
- `e2e/helpers.ts` exports `gotoApp` and `commandButton`; the planned helpers
  add to the same module with the same style.
- The title input carries `aria-label="Song title"` in
  `src/components/InformationPanel.tsx`, so `getByLabel` resolves.
- `Page.setInputFiles` accepts a `{ name, mimeType, buffer }` payload - matches
  the current spec's usage and the helper signature.
- `Download.path()` returns `Promise<string>` - the `as string` cast in the
  fragment covers the nullable type.

## Fidelity

- The staged-value assertion uses the uploaded filename - the vocabulary is the
  browser's own `input.value`, which holds the staged file name after
  `setInputFiles`.
- Both projects (chromium, webkit) run the same assertions - parity holds by
  construction.
- The record's out-of-scope list is honoured: no new e2e flows and no
  application behaviour change - the added `id` attributes are inert.

## Findings Returned to Planning

none

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
