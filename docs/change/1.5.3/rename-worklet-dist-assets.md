# Rename worklet dist assets

## Summary

- **Status**: shipped
- **Type**: Chore
- **Owner**: user
- **Scope**: `vite.config.ts`, `docs/DEPLOYMENT.md`

## Request

The deployed worklet files should ship as `ayumi.js` and `sequencer.js`
instead of `ayumiWorklet.js` and `sequencerWorklet.js`.

## Implementation

- `worker.rollupOptions.output.entryFileNames` maps the emitted bundle
  names; source filenames keep their `Worklet` suffix. `DEPLOYMENT.md`'s
  bundle list updated.

## Verification

- Clean rebuild emits `dist/js/ayumi.js` and `dist/js/sequencer.js`; e2e
  passes including the flows that load both worklets.
