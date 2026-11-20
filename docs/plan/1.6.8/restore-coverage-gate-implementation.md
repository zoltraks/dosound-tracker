# Restore the Coverage Gate to Green Implementation Plan

## Summary

| Field         | Value                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Make `npm run test:coverage` exit 0 with the configured 80% thresholds evaluating, by removing the two timing-sensitive suite failures and holding branch margin                                                      |
| Key decisions | Warm the lazy Settings chunk and raise timeout headroom in `App.test.tsx`; suite-level 30 s timeout on the git/subprocess describes in `retentionSweepCoverage.test.ts`; no test-file exclusion from the coverage run |
| Open risks    | Raised timeouts can mask real hangs - headroom stays bounded at 30 s; the real branch figure is only known after a full coverage run                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at
`docs/change/1.6.8/restore-coverage-gate.md`.

## Best Practices

Test-only change - no production code moves. Timeout headroom is applied at
the narrowest scope that covers the flake: a `beforeAll` warm import plus a
10 s `findBy` window and 20 s test timeout for the one lazy-modal test, and a
suite-level `timeout` option on the two describes that build git fixtures and
spawn node subprocesses. The gate's signal is preserved: both suites still run
under coverage and still contribute their assertions.

## Audio-Critical Requirements

None - the change touches test files and documentation only. No audio path,
sequencer timing, or render dependency is modified.

## Documentation Updates

- `docs/TESTING.md` - refreshed enumerations and the coverage-map gaps land
  under the companion record `testing-docs-coverage-refresh.md`; this plan
  updates no project pillar document.
- `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `FORMAT.md` - no
  update required; the change affects the verification gate only.

## Type and State Updates

None.

## Step by Step Implementation

**Warm the lazy Settings chunk in `App.test.tsx`**

The Settings dialog mounts through `React.lazy` in
`src/components/modal/SettingsModalGroup.tsx`. Under full-suite worker
contention the on-demand transform of the chunk can exceed the `findByRole`
wait window, which is the documented full-suite starvation flake in
`TESTING.md`. A `beforeAll` dynamic import of
`src/modals/settings/SettingsModal.tsx` resolves the same module id the lazy
factory requests, so the first open reads the module cache instead of paying
the transform inside the test.

File to modify: `test/components/shell/App.test.tsx`.

```typescript
beforeAll(async () => {
  await import('../../../src/modals/settings/SettingsModal.tsx');
});
```

**Give the Settings test bounded headroom**

Even with a warm chunk, worker contention can delay the Suspense resolution.
The `findByRole` waitFor window rises from the 1 s default to 10 s and the
test timeout to 20 s - enough for a contended lazy mount, still small enough
to catch a real hang.

File to modify: `test/components/shell/App.test.tsx` - the
`opens and closes Settings from the tracker workspace` test.

```typescript
const dialog = await screen.findByRole(
  'dialog',
  { name: 'Settings' },
  { timeout: 10000 },
);
// ...
}, 20000);
```

**Raise suite-level timeout on the retention sweep heavy describes**

`test/scripts/retentionSweepCoverage.test.ts` builds git fixtures (init plus
multiple commits) and runs the sweep in subprocesses and in-process. Each
`it` can exceed the default 5 s test timeout under coverage instrumentation.
A suite-level `{ timeout: 30000 }` option on the `subprocess` and
`in-process runs` describes gives every test in them the same headroom
without touching the fast pure-helper describe.

File to modify: `test/scripts/retentionSweepCoverage.test.ts`.

```typescript
describe('retention sweep coverage - subprocess', { timeout: 30000 }, () => {
describe('retention sweep coverage - in-process runs', { timeout: 30000 }, () => {
```

**Hold branch margin with real branch tests**

The audit's stable-subset figure (79.63% branches) excluded `App.test.tsx`
entirely, so it undercounts the run this fix restores. The companion record
`testing-docs-coverage-refresh.md` adds a direct `ayumiWorklet` suite plus
constants and script suites that cover genuine previously-uncovered branches
(`chipIndexForChannelId`, `channelIdsForChip`, the worklet's register-mapping
and pan branches). Those additions supply the margin the gate needs; this
record adds no padding tests of its own.

Files to create: `test/workers/ayumiWorklet.test.ts`,
`test/constants/song.test.ts`, `test/scripts/bumpVersion.test.ts`,
`test/scripts/afterAllArtifactBuild.test.ts` - authored under the companion
record and counted here only for gate margin.

**Run the coverage gate**

`npx vitest run --coverage` must exit 0 with the coverage table rendered and
branches at or above 80%. Any residual shortfall is closed with focused
tests against `coverage-final.json` branch gaps, never by lowering
thresholds - the 80% policy is out of scope per the record.

## Implementation Order

1. Apply the `App.test.tsx` warm import and timeout headroom.
2. Apply the `retentionSweepCoverage.test.ts` suite timeouts.
3. Land the companion record's new suites (ayumiWorklet, constants, scripts).
4. Run `npx vitest run --coverage` and confirm exit 0 with branches >= 80%.
5. Record any refinements in this plan.

## Testing Strategy

**Unit tests**

No new utility functions - the change adjusts test timeouts and adds a
warm-up import. The new suites themselves carry the unit coverage:
`test/workers/ayumiWorklet.test.ts` pins the worklet's register mapping,
message handling, output stage, and pan branches;
`test/constants/song.test.ts` pins the chip-mapping helpers;
`test/scripts/bumpVersion.test.ts` and
`test/scripts/afterAllArtifactBuild.test.ts` pin the script contracts through
their real entry points.

Test file to create or update: `test/workers/ayumiWorklet.test.ts` (and the
three sibling suites listed above).

**Integration tests**

The fixed suites are themselves the integration proof: `App.test.tsx` keeps
exercising the lazy Settings open/close path, and
`retentionSweepCoverage.test.ts` keeps exercising the sweep CLI end to end.

Test file to create or update: `test/components/shell/App.test.tsx`,
`test/scripts/retentionSweepCoverage.test.ts`.

## Verification

- Run `npx tsc -b` - the touched test files must typecheck.
- Run `npx eslint` on the touched files - zero errors and zero warnings.
- Run `npx vitest run test/components/shell/App.test.tsx
test/scripts/retentionSweepCoverage.test.ts test/workers/ayumiWorklet.test.ts
test/constants/song.test.ts test/scripts/bumpVersion.test.ts
test/scripts/afterAllArtifactBuild.test.ts` - all green.
- Run `npx vitest run --coverage` - exit 0, coverage table rendered,
  branches >= 80%.
- Audio playback verification is not applicable - no audio-path code
  changed.

## Refinements

Adjustments made during implementation, recorded per the workflow rule.

- No `vitest.config.ts` change was needed. The two existing coverage excludes
  cover source files (`src/main.tsx`, `src/types/electronApi.ts`), not test
  files, and excluding `App.test.tsx` from the coverage run would remove the
  largest single contributor to `src/App.tsx` and shell-component branch
  coverage - the opposite of restoring signal. Timeout headroom was the
  record-sanctioned alternative and fixes the same flake in plain
  `npm test` runs, which the coverage-only exclusion would not.
- The audit's 79.63% branch figure came from a stable subset that excluded
  `App.test.tsx`; the restored suite contributes far more than the ~0.4pp
  gap. The closing coverage run reports branches at 82.54% with every
  threshold green and exit 0 - the companion record's new suites supply
  margin on top of the restored contribution.
- `describe(name, { timeout }, fn)` suite options carry the headroom - one
  option per heavy describe instead of annotating each `it`.
