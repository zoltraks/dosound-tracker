# Measure the Declared Performance Targets Implementation Plan

## Summary

| Field         | Value                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Intent        | Produce a committed measurement artifact for the declared quality targets      |
| Key decisions | Playwright load timing on `vite preview`, simulation proxy for zero glitches   |
| Open risks    | DOSOUND hardware fidelity stays a design claim with a stated verification path |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.4.5/measure-performance-targets.md`.

## Best Practices

- No source changes - the change produces one generated report plus throwaway
  measurement scripts under the ignored `work/` tree.
- The generated report follows `STYLE.md` - short sentences, bold section
  headers, no dividers, aligned ASCII tables, no Status or Verdict fields.

## Documentation Updates

No pillar document changes. `PROJECT.md` keeps declaring the targets. The new
report at `docs/report/1.4.5/performance-measurements.md` records the evidence
for each.

## Step by Step Implementation

**Record the host environment**

`uname -a`, `node --version`, and `sysctl` capture the measurement host once
and the report reuses the record for every target.

**Measure application load time**

`npm run build`, then `npx vite preview` on a free high port (not 8008 or
8009). A Playwright chromium script loads the page with `waitUntil: 'load'`
over five fresh contexts and the median navigation timing is reported. The
method note states this is local-serving time, not cold network deploy.

**Measure song file sizes**

`wc -c` over `src/assets/song.yaml`, `test/fixtures/*.yaml`, and
`public/repository/song/*.yaml`.

**Cite export byte-identity evidence**

`npx vitest run test/exports/` executes the existing fixture suites -
exportVgm, exportMax, exportWav, and exportAssemblyOptimized. The report cites
them rather than duplicating them.

**Run the zero-glitch simulation proxy**

A node script drives `simulateSong` over the bundled song twice and compares
the emitted register streams frame-for-frame. `test/workers/` covers sequencer
worker timing. Manual listening stays the stated verification path for real
audio output.

**Record the DOSOUND verification path**

Real Atari ST replay cannot be measured locally. The report records the design
evidence plus the exported byte stream checked against `FORMAT.md`, with
real-hardware replay named as an owner-side manual step.

## Implementation Order

1. Write this plan and the specification audit
2. Run the measurements
3. Write the report artifact
4. `npx prettier --check` on the new documents

## Testing Strategy

No new tests - the change is a generated report. The existing export and
worker suites run as evidence, not as new coverage.

## Verification

- `npx prettier --check` on the new documents, `--write` to fix
- No code changes - no test loop needed beyond the evidence runs
